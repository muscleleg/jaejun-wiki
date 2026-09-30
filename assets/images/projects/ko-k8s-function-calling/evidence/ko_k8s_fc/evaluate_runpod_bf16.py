from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

from openai import OpenAI

from ko_k8s_fc.evaluate_baseline import SYSTEM_PROMPT, load_dataset
from ko_k8s_fc.scoring import ActualCall, CaseScore, score_case, summarize
from ko_k8s_fc.tools import TOOLS


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate a Qwen3 BF16 model through a vLLM OpenAI-compatible API"
    )
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--dataset-sha256", required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--api-key", default=os.getenv("OPENAI_API_KEY", "local"))
    parser.add_argument("--model", required=True)
    parser.add_argument("--metadata-json", type=Path, required=True)
    parser.add_argument("--limit", type=int)
    return parser.parse_args()


def evaluate(client: OpenAI, model: str, cases: list[Any]) -> list[CaseScore]:
    scores: list[CaseScore] = []
    for index, case in enumerate(cases, start=1):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": case.prompt},
                ],
                tools=TOOLS,
                tool_choice="auto",
                temperature=0,
                max_tokens=256,
                # Qwen3 supports thinking and non-thinking modes. Function-call
                # evaluation uses non-thinking mode so both baseline and tuned
                # models get the exact same deterministic request shape.
                extra_body={"chat_template_kwargs": {"enable_thinking": False}},
            )
            message = response.choices[0].message
            calls = [
                ActualCall(
                    name=call.function.name,
                    arguments_json=call.function.arguments,
                )
                for call in (message.tool_calls or [])
            ]
            score = score_case(case, calls)
        except Exception as exc:
            score = score_case(case, [], error=f"{type(exc).__name__}: {exc}")
        scores.append(score)
        print(
            f"[{index:03d}/{len(cases):03d}] {case.case_id}: "
            f"{'PASS' if score.full_success else 'FAIL'}",
            flush=True,
        )
    return scores


def write_results(
    *,
    output_dir: Path,
    run_id: str,
    model: str,
    dataset: Path,
    dataset_sha256: str,
    metadata: dict[str, Any],
    scores: list[CaseScore],
) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    details_path = output_dir / f"{run_id}_details.jsonl"
    summary_path = output_dir / f"{run_id}_summary.json"

    with details_path.open("w", encoding="utf-8") as stream:
        for score in scores:
            stream.write(json.dumps(score.to_dict(), ensure_ascii=False) + "\n")

    report = {
        "run_id": run_id,
        "model": model,
        "dataset": str(dataset.resolve()),
        "dataset_sha256": dataset_sha256,
        "inference": {
            "temperature": 0,
            "max_tokens": 256,
            "tool_choice": "auto",
            "enable_thinking": False,
        },
        "server": metadata,
        "metrics": summarize(scores),
    }
    summary_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return details_path, summary_path


def main() -> None:
    args = parse_args()
    cases = load_dataset(args.dataset)
    if args.limit is not None:
        cases = cases[: args.limit]
    metadata = json.loads(args.metadata_json.read_text(encoding="utf-8"))
    client = OpenAI(base_url=args.base_url, api_key=args.api_key)
    scores = evaluate(client, args.model, cases)
    details_path, summary_path = write_results(
        output_dir=args.output_dir,
        run_id=args.run_id,
        model=args.model,
        dataset=args.dataset,
        dataset_sha256=args.dataset_sha256,
        metadata=metadata,
        scores=scores,
    )
    print(json.dumps(summarize(scores), ensure_ascii=False, indent=2))
    print(f"details={details_path}")
    print(f"summary={summary_path}")


if __name__ == "__main__":
    main()
