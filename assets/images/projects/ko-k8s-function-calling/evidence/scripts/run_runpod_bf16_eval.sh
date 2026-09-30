#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODEL="${MODEL:-Qwen/Qwen3-1.7B}"
MODEL_ALIAS="${MODEL_ALIAS:-ko-k8s-fc-bf16}"
MODEL_REVISION="${MODEL_REVISION:-}"
RUN_LABEL="${RUN_LABEL:-baseline}"
SERVER_HOST="${SERVER_HOST:-127.0.0.1}"
SERVER_PORT="${SERVER_PORT:-8000}"
MAX_MODEL_LEN="${MAX_MODEL_LEN:-4096}"
GPU_MEMORY_UTILIZATION="${GPU_MEMORY_UTILIZATION:-0.85}"
DATASET="${DATASET:-$PROJECT_DIR/evaluation/baseline_cases.jsonl}"
EXPECTED_DATASET_SHA256="${EXPECTED_DATASET_SHA256:-03849f4221e70dba048ae163f6c6acb99e1c01a8eac147ffb22368b3fcb1df03}"
OUTPUT_DIR="${OUTPUT_DIR:-$PROJECT_DIR/output/runpod_bf16_evaluation}"
STARTUP_TIMEOUT_SECONDS="${STARTUP_TIMEOUT_SECONDS:-900}"
SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

for command_name in python curl sha256sum; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "required command is unavailable: $command_name" >&2
    exit 1
  fi
done

python - <<'PY'
import importlib.metadata
import re

try:
    import openai  # noqa: F401
    import vllm  # noqa: F401
except ImportError as exc:
    raise SystemExit(f"missing Python dependency: {exc}") from exc

version = importlib.metadata.version("vllm")
match = re.match(r"(\d+)\.(\d+)\.(\d+)", version)
if match is None or tuple(map(int, match.groups())) < (0, 9, 0):
    raise SystemExit(
        f"vLLM>=0.9.0 is required for Qwen3 non-thinking + qwen3 parser; found {version}"
    )
PY

actual_dataset_sha256="$(sha256sum "$DATASET" | awk '{print $1}')"
if [[ "$actual_dataset_sha256" != "$EXPECTED_DATASET_SHA256" ]]; then
  echo "evaluation dataset checksum mismatch; refusing an unfair comparison" >&2
  echo "expected: $EXPECTED_DATASET_SHA256" >&2
  echo "actual:   $actual_dataset_sha256" >&2
  exit 1
fi

if ! python - "$SERVER_HOST" "$SERVER_PORT" <<'PY'
import socket
import sys

host, port = sys.argv[1], int(sys.argv[2])
with socket.socket() as sock:
    if sock.connect_ex((host, port)) == 0:
        raise SystemExit(1)
PY
then
  echo "port $SERVER_PORT is already in use; choose another SERVER_PORT" >&2
  exit 1
fi

resolved_model_revision="$MODEL_REVISION"
if [[ -z "$resolved_model_revision" ]]; then
  if [[ -d "$MODEL" ]]; then
    echo "Computing a content hash for the local model directory..."
    resolved_model_revision="local-tree-sha256:$(python - "$MODEL" <<'PY'
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
digest = hashlib.sha256()
for path in sorted(candidate for candidate in root.rglob("*") if candidate.is_file()):
    digest.update(path.relative_to(root).as_posix().encode())
    digest.update(b"\0")
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
print(digest.hexdigest())
PY
)"
  else
    resolved_model_revision="$(python - "$MODEL" <<'PY'
import sys
from huggingface_hub import HfApi

print(HfApi().model_info(sys.argv[1]).sha)
PY
)"
  fi
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
safe_label="$(printf '%s' "$RUN_LABEL" | tr -cs '[:alnum:]_.-' '_')"
RUN_ID="${timestamp}_${safe_label}"
RUN_DIR="$OUTPUT_DIR/$RUN_ID"
LOG_PATH="$RUN_DIR/vllm-server.log"
METADATA_PATH="$RUN_DIR/server_metadata.json"
mkdir -p "$RUN_DIR"

VLLM_COMMAND=(
  python -m vllm.entrypoints.openai.api_server
  --model "$MODEL"
  --served-model-name "$MODEL_ALIAS"
  --revision "$resolved_model_revision"
  --dtype bfloat16
  --host "$SERVER_HOST"
  --port "$SERVER_PORT"
  --max-model-len "$MAX_MODEL_LEN"
  --gpu-memory-utilization "$GPU_MEMORY_UTILIZATION"
  --enable-auto-tool-choice
  --tool-call-parser hermes
  --reasoning-parser qwen3
  --generation-config vllm
)

# A local merged model has no Hugging Face revision that vLLM can resolve.
if [[ -d "$MODEL" ]]; then
  command_without_revision=()
  skip_next=false
  for argument in "${VLLM_COMMAND[@]}"; do
    if $skip_next; then
      skip_next=false
      continue
    fi
    if [[ "$argument" == "--revision" ]]; then
      skip_next=true
      continue
    fi
    command_without_revision+=("$argument")
  done
  VLLM_COMMAND=("${command_without_revision[@]}")
fi

printf 'Starting vLLM:'
printf ' %q' "${VLLM_COMMAND[@]}"
printf '\n'
printf -v rendered_server_command '%q ' "${VLLM_COMMAND[@]}"
rendered_server_command="${rendered_server_command% }"
"${VLLM_COMMAND[@]}" >"$LOG_PATH" 2>&1 &
SERVER_PID=$!

health_url="http://$SERVER_HOST:$SERVER_PORT/health"
deadline=$((SECONDS + STARTUP_TIMEOUT_SECONDS))
until curl -fsS "$health_url" >/dev/null 2>&1; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "vLLM exited before becoming healthy; see $LOG_PATH" >&2
    tail -n 80 "$LOG_PATH" >&2 || true
    exit 1
  fi
  if (( SECONDS >= deadline )); then
    echo "vLLM did not become healthy in ${STARTUP_TIMEOUT_SECONDS}s; see $LOG_PATH" >&2
    exit 1
  fi
  sleep 2
done

if ! curl -fsS "http://$SERVER_HOST:$SERVER_PORT/v1/models" \
  | python -c 'import json,sys; expected=sys.argv[1]; data=json.load(sys.stdin); raise SystemExit(0 if any(model.get("id") == expected for model in data.get("data", [])) else 1)' \
    "$MODEL_ALIAS"; then
  echo "vLLM is healthy but did not advertise expected model alias: $MODEL_ALIAS" >&2
  exit 1
fi

vllm_version="$(python -c 'import importlib.metadata; print(importlib.metadata.version("vllm"))')"
python - \
  "$MODEL" "$MODEL_ALIAS" "$resolved_model_revision" "$vllm_version" \
  "$SERVER_HOST" "$SERVER_PORT" "$MAX_MODEL_LEN" "$GPU_MEMORY_UTILIZATION" \
  "$LOG_PATH" "$RUN_ID" "$rendered_server_command" >"$METADATA_PATH" <<'PY'
import json
import sys

(
    model,
    alias,
    revision,
    vllm_version,
    host,
    port,
    max_model_len,
    gpu_memory_utilization,
    log_path,
    run_id,
    server_command,
) = sys.argv[1:]
print(json.dumps({
    "run_id": run_id,
    "model_source": model,
    "served_model_name": alias,
    "model_revision": revision,
    "dtype": "bfloat16",
    "vllm_version": vllm_version,
    "host": host,
    "port": int(port),
    "max_model_len": int(max_model_len),
    "gpu_memory_utilization": float(gpu_memory_utilization),
    "auto_tool_choice": True,
    "tool_call_parser": "hermes",
    "reasoning_parser": "qwen3",
    "generation_config": "vllm",
    "server_command": server_command,
    "server_log": log_path,
}, indent=2))
PY

dataset_case_count="$(awk 'NF { count += 1 } END { print count + 0 }' "$DATASET")"
echo "Evaluating $MODEL_ALIAS as $RUN_LABEL against the locked ${dataset_case_count}-case dataset"
cd "$PROJECT_DIR"
python -m ko_k8s_fc.evaluate_runpod_bf16 \
  --dataset "$DATASET" \
  --dataset-sha256 "$EXPECTED_DATASET_SHA256" \
  --output-dir "$RUN_DIR" \
  --run-id "$RUN_ID" \
  --base-url "http://$SERVER_HOST:$SERVER_PORT/v1" \
  --api-key local \
  --model "$MODEL_ALIAS" \
  --metadata-json "$METADATA_PATH"

echo "server_log=$LOG_PATH"
echo "metadata=$METADATA_PATH"
