#!/usr/bin/env python3
"""Generate a deterministic Korean Kubernetes function-calling dataset.

The held-out baseline prompts are treated as a deny-list.  The generated files use
the Hugging Face/Qwen conversational tool-call shape while retaining compact
metadata that makes distribution audits straightforward.
"""

from __future__ import annotations

import argparse
import json
import random
from collections import defaultdict
from pathlib import Path
from typing import Any, Callable


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schemas" / "kubernetes_tools.json"
BASELINE_PATH = ROOT / "evaluation" / "baseline_cases.jsonl"
DATA_DIR = ROOT / "data"
SEED = 20260802

SPLIT_COUNTS = {
    "train": {
        "list_pods": 96,
        "get_pod": 152,
        "get_pod_logs": 192,
        "list_deployments": 80,
        "get_events": 160,
        "no_call": 120,
    },
    "valid": {
        "list_pods": 12,
        "get_pod": 19,
        "get_pod_logs": 24,
        "list_deployments": 10,
        "get_events": 20,
        "no_call": 15,
    },
    "test": {
        "list_pods": 12,
        "get_pod": 19,
        "get_pod_logs": 24,
        "list_deployments": 10,
        "get_events": 20,
        "no_call": 15,
    },
}

NAMESPACE_FORMS = [
    ("production", "production"),
    ("운영계", "production"),
    ("운영 환경", "production"),
    ("프로덕션", "production"),
    ("prod", "production"),
    ("개발계", "dev"),
    ("개발 환경", "dev"),
    ("dev", "dev"),
    ("검증계", "staging"),
    ("스테이징", "staging"),
    ("staging", "staging"),
    ("default", "default"),
    ("기본 네임스페이스", "default"),
    ("kube-system", "kube-system"),
    ("monitoring", "monitoring"),
    ("data-platform", "data-platform"),
    ("payments", "payments"),
    ("observability", "observability"),
]

APPS = [
    "payment-api", "order-api", "checkout", "catalog", "auth-service",
    "inventory", "notification", "gateway", "batch-worker", "metrics-agent",
    "search-api", "recommendation", "billing", "session-store", "report-worker",
    "user-api", "fraud-detector", "log-collector", "frontend", "scheduler",
]
LABELS = [
    "app=payment", "app=checkout", "app=gateway", "app=worker",
    "tier=backend", "tier=frontend", "component=api", "component=collector",
    "team=platform", "team=payments", "env=prod", "track=stable",
    "release=canary", "managed-by=helm", "role=consumer",
]
CONTAINERS = [
    "api", "app", "sidecar", "istio-proxy", "log-agent", "worker",
    "metrics", "nginx", "envoy", "fluent-bit",
]
TAIL_LINES = [20, 30, 50, 80, 100, 120, 150, 200, 300, 500, 800, 1000]


def pod_name(rng: random.Random, serial: int) -> str:
    app = rng.choice(APPS)
    return f"{app}-{rng.randrange(0x10000, 0xfffff):05x}-{serial % 97:02d}"


def deployment_name(rng: random.Random, serial: int) -> str:
    return f"{rng.choice(APPS)}-{serial % 31:02d}"


def ns(rng: random.Random, allow_implicit: bool = False) -> tuple[str | None, str | None]:
    if allow_implicit and rng.random() < 0.18:
        return None, None
    return rng.choice(NAMESPACE_FORMS)


def finish(rng: random.Random) -> str:
    # Templates already contain a complete request. Vary only punctuation so we
    # do not create unnatural synthetic phrases such as "보여줘 부탁해".
    return rng.choice(["", "", ".", "!", "?"])


def make_call(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    return {
        "role": "assistant",
        "content": "",
        "tool_calls": [
            {
                "type": "function",
                "function": {"name": name, "arguments": arguments},
            }
        ],
    }


def list_pods(rng: random.Random, serial: int) -> tuple[str, dict[str, Any], str]:
    shown, canonical = ns(rng, allow_implicit=True)
    use_label = rng.random() < 0.58
    label = rng.choice(LABELS) if use_label else None
    args = {"namespace": canonical} if canonical else {}
    if label:
        args["label_selector"] = label
    templates = (
        [
            "{n}에서 {l} 조건에 맞는 파드만 나열해줘",
            "{n} 네임스페이스 pod 중 라벨이 {l}인 것들을 찾아줘",
            "{l} 셀렉터로 {n} 파드 목록 조회",
            "{n}에 떠 있는 파드를 {l}로 필터링해서 보여줘",
            "{n} 쪽에서 {l} 라벨을 단 pod가 무엇인지 알려줘",
            "{n} namespace의 {l} 파드 목록만 확인할게",
            "{n} 환경, label selector {l} 기준으로 pod를 조회해줘",
        ] if label else [
            "{n}의 파드 목록을 확인해줘",
            "{n}에 현재 떠 있는 pod들을 나열해줘",
            "{n} 네임스페이스 파드 조회",
            "{n} 환경에 어떤 파드가 있는지 보여줘",
            "{n} 쪽 pod 리스트를 받을 수 있을까",
            "{n}에서 실행 중인 파드들을 조회해줘",
            "{n} namespace의 pod 목록만 읽어줘",
        ]
    )
    if shown is None:
        templates = [
            "파드 목록을 한번 조회해줘", "pod들을 나열해줘",
            "파드 리스트 보여줘", "파드들이 뭐가 있는지 궁금해",
        ] if not label else [
            "{l} 라벨을 가진 파드만 조회해줘", "pod 목록을 {l} 조건으로 걸러줘",
            "{l} 조건에 맞는 파드를 찾아줘",
        ]
    prompt = rng.choice(templates).format(n=shown, l=label) + finish(rng)
    return prompt, args, "medium" if label or canonical == "production" else "easy"


def get_pod(rng: random.Random, serial: int) -> tuple[str, dict[str, Any], str]:
    shown, canonical = ns(rng, allow_implicit=True)
    pod = pod_name(rng, serial)
    args = {"pod_name": pod}
    if canonical:
        args["namespace"] = canonical
    templates = [
        "{n}의 {p} 파드 상세 정보를 보여줘",
        "{n} 네임스페이스에 있는 {p} pod 상태를 자세히 조회해줘",
        "{p} 파드를 {n}에서 describe한 정보를 보고 싶어",
        "{n} 쪽 {p} pod의 현재 스펙과 상태를 확인해줘",
        "{n}/{p} 파드 하나를 상세 조회해줘",
        "{p}가 {n}에서 어떤 상태인지 세부 내용을 알려줘",
        "{n} 환경의 pod {p} 정보를 읽어줘",
        "{n}에 배치된 {p} 파드 상세만 확인할게",
        "{p} pod의 상세 상태 조회, namespace는 {n}",
        "{n} 기준으로 {p} 파드 정보를 가져와줘",
    ]
    if shown is None:
        templates = [
            "{p} 파드 상세를 조회해줘", "pod {p}의 현재 상태를 자세히 알려줘",
            "{p}를 describe한 정보가 필요해", "{p} 파드 하나만 확인해줘",
            "{p} 파드의 스펙과 상태를 가져와줘",
        ]
        shown = ""
    prompt = rng.choice(templates).format(n=shown, p=pod) + finish(rng)
    return prompt, args, "hard" if canonical == "production" else "medium"


def get_pod_logs(rng: random.Random, serial: int) -> tuple[str, dict[str, Any], str]:
    shown, canonical = ns(rng, allow_implicit=True)
    pod = pod_name(rng, serial)
    args: dict[str, Any] = {"pod_name": pod}
    if canonical:
        args["namespace"] = canonical
    include_tail = rng.random() < 0.72
    include_previous = rng.random() < 0.47
    include_container = rng.random() < 0.39
    tail = rng.choice(TAIL_LINES) if include_tail else None
    container = rng.choice(CONTAINERS) if include_container else None
    if tail is not None:
        args["tail_lines"] = tail
    if container:
        args["container"] = container
    if include_previous:
        args["previous"] = True

    subject = f"{shown}의 {pod}" if shown else pod
    parts = [subject + " 파드"]
    if container:
        parts.append(f"{container} 컨테이너")
    previous_phrase = rng.choice(["재시작 전", "이전 인스턴스", "직전 컨테이너", "죽기 전", "previous"])
    if include_previous:
        parts.append(previous_phrase)
    if tail:
        parts.append(f"최근 {tail}줄")
    core = " ".join(parts)
    templates = [
        "{x} 로그를 보여줘", "{x} 로그만 확인해줘", "{x} 로그를 읽어올래",
        "{x} 로그 조회 부탁해", "{x} 출력 내용을 가져와줘",
        "{x} 로그가 필요해", "{x} 로그를 확인하고 싶어",
        "{x} 로그를 tail해서 보여줘", "{x} 로그 조회",
    ]
    prompt = rng.choice(templates).format(x=core) + finish(rng)
    difficulty = "hard" if sum([include_tail, include_previous, include_container, canonical is not None]) >= 3 else "medium"
    return prompt, args, difficulty


def list_deployments(rng: random.Random, serial: int) -> tuple[str, dict[str, Any], str]:
    shown, canonical = ns(rng, allow_implicit=True)
    use_label = rng.random() < 0.55
    label = rng.choice(LABELS) if use_label else None
    args = {"namespace": canonical} if canonical else {}
    if label:
        args["label_selector"] = label
    explicit_templates = [
        "{n}의 deployment 목록을 보여줘",
        "{n}에 배포된 디플로이먼트들을 조회해줘",
        "{n} 네임스페이스 Deployment 리스트가 필요해",
        "{n} 환경에 올라간 디플로이먼트를 나열해줘",
        "{n} 쪽 deployment 목록만 읽어줘",
        "{n}에서 {l} 라벨인 deployment만 찾아줘",
        "{n} 디플로이먼트 목록을 {l}로 필터링해줘",
        "label selector {l}, namespace {n} 기준 deployment 조회",
        "{n}에 배포된 워크로드 중 {l} 디플로이먼트를 보여줘",
    ]
    implicit_templates = [
        "deployment 목록을 보여줘",
        "배포된 디플로이먼트들을 조회해줘",
        "Deployment 리스트가 필요해",
        "현재 디플로이먼트들을 나열해줘",
        "deployment 목록만 읽어줘",
        "{l} 라벨인 deployment만 찾아줘",
        "디플로이먼트 목록을 {l}로 필터링해줘",
        "label selector {l} 기준 deployment 조회",
        "배포된 워크로드 중 {l} 디플로이먼트를 보여줘",
    ]
    templates = explicit_templates if shown is not None else implicit_templates
    candidates = templates[5:] if label else templates[:5]
    prompt = rng.choice(candidates).format(n=shown, l=label) + finish(rng)
    return prompt, args, "medium" if label or canonical == "production" else "easy"


def get_events(rng: random.Random, serial: int) -> tuple[str, dict[str, Any], str]:
    shown, canonical = ns(rng, allow_implicit=True)
    scope_roll = rng.random()
    kind: str | None = None
    resource: str | None = None
    if scope_roll < 0.68:
        kind = "Pod" if rng.random() < 0.68 else "Deployment"
        resource = pod_name(rng, serial) if kind == "Pod" else deployment_name(rng, serial)
    event_type = rng.choice(["Warning", "Normal"]) if rng.random() < 0.66 else None
    args: dict[str, Any] = {}
    if canonical:
        args["namespace"] = canonical
    if kind:
        args.update(resource_kind=kind, resource_name=resource)
    if event_type:
        args["event_type"] = event_type

    type_ko = {"Warning": "경고", "Normal": "정상"}.get(event_type, "전체")
    if kind:
        kind_ko = "파드" if kind == "Pod" else "디플로이먼트"
        explicit_templates = [
            "{n}의 {r} {k}에서 발생한 {t} 이벤트를 보여줘",
            "{n}/{r} {k} 관련 {t} 이벤트를 확인해줘",
            "{n}에 있는 {k} {r}에 최근 무슨 일이 있었는지 이벤트로 조회해줘",
            "{r} {k}의 {t} Event를 {n}에서 찾아줘",
            "namespace {n}, {k} {r} 대상으로 {t} 이벤트 조회",
            "{n} 쪽 {r} {k} 이벤트 중 {t} 유형만 읽어줘",
            "{r}에 생긴 사건을 Kubernetes 이벤트로 확인해줘. 위치는 {n}, 종류는 {k}",
        ]
        implicit_templates = [
            "{r} {k}에서 발생한 {t} 이벤트를 보여줘",
            "{r} {k} 관련 {t} 이벤트를 확인해줘",
            "{k} {r}에 최근 무슨 일이 있었는지 이벤트로 조회해줘",
            "{r} {k}의 {t} Event를 찾아줘",
            "{k} {r} 대상으로 {t} 이벤트 조회",
            "{r} {k} 이벤트 중 {t} 유형만 읽어줘",
            "{r}에 생긴 사건을 Kubernetes 이벤트로 확인해줘. 리소스 종류는 {k}",
        ]
        templates = explicit_templates if shown is not None else implicit_templates
        prompt = rng.choice(templates).format(n=shown, r=resource, k=kind_ko, t=type_ko)
    else:
        explicit_templates = [
            "{n} 네임스페이스의 {t} 이벤트를 보여줘",
            "{n}에서 발생한 {t} Kubernetes Event 조회",
            "{n} 환경 이벤트 중 {t} 항목을 확인해줘",
            "{n}의 최근 {t} 이벤트 목록이 필요해",
            "{n} 쪽 {t} 이벤트만 읽어줘",
        ]
        implicit_templates = [
            "{t} 이벤트를 보여줘",
            "발생한 {t} Kubernetes Event 조회",
            "이벤트 중 {t} 항목을 확인해줘",
            "최근 {t} 이벤트 목록이 필요해",
            "{t} 이벤트만 읽어줘",
        ]
        templates = explicit_templates if shown is not None else implicit_templates
        prompt = rng.choice(templates).format(n=shown, t=type_ko)
    prompt += finish(rng)
    return prompt, args, "hard" if kind and event_type else "medium"


NO_CALL_GENERATORS: list[Callable[[random.Random, int], tuple[str, str]]] = []


def no_call(rng: random.Random, serial: int) -> tuple[str, None, str, str]:
    app = rng.choice(APPS)
    pod = pod_name(rng, serial)
    shown, _ = rng.choice(NAMESPACE_FORMS)
    families = [
        (["{n}의 {p} 파드를 삭제해줘", "{p} pod를 강제로 지워줘", "{n}에서 {p}를 종료해줘"], "지원하지 않는 변경 작업입니다."),
        (["{a} deployment replica를 {x}개로 늘려줘", "{a} 디플로이먼트를 {x}개로 스케일 다운해줘", "{a}의 replicas를 {x}로 바꿔줘"], "지원하지 않는 변경 작업입니다."),
        (["{a} 이미지를 v{v}로 교체하고 롤아웃해줘", "{a} deployment를 재시작해줘", "{a}를 이전 버전으로 롤백해줘"], "지원하지 않는 변경 작업입니다."),
        (["{n}에 {a} deployment를 새로 만들어줘", "{n} namespace를 생성해줘", "{n}에 서비스를 배포해줘"], "지원하지 않는 생성 작업입니다."),
        (["클러스터 노드 목록을 조회해줘", "노드 {x}의 상태를 확인해줘", "현재 context 목록을 보여줘"], "제공된 도구로는 해당 리소스를 조회할 수 없습니다."),
        (["{n}의 Secret 원문을 보여줘", "{n} configmap 내용을 읽어줘", "서비스 어카운트 토큰을 출력해줘"], "민감 정보 또는 지원 범위 밖의 요청입니다."),
        (["Kubernetes에서 파드가 무엇인지 설명해줘", "Deployment와 StatefulSet 차이를 알려줘", "CrashLoopBackOff가 무슨 뜻이야"], "일반적인 개념 질문에는 도구 호출이 필요하지 않습니다."),
        (["안녕, 오늘 어때?", "고마워", "간단한 자기소개를 해줘"], "도구 호출이 필요하지 않은 대화입니다."),
        (["{p} 로그를 지워줘", "{p} 컨테이너에 접속해서 명령을 실행해줘", "{p}에서 파일을 내려받아줘"], "지원하지 않는 실행 작업입니다."),
        (["전체 클러스터 장애 원인을 자동으로 고쳐줘", "문제 있는 파드를 찾아서 알아서 복구해줘", "서비스 장애를 분석하고 수정까지 해줘"], "여러 단계의 분석 및 변경 작업은 현재 지원 범위 밖입니다."),
    ]
    templates, response = rng.choice(families)
    prompt = rng.choice(templates).format(n=shown, p=pod, a=app, x=rng.randint(2, 12), v=rng.randint(2, 9)) + finish(rng)
    return prompt, None, "medium", response


GENERATORS: dict[str, Callable[..., Any]] = {
    "list_pods": list_pods,
    "get_pod": get_pod,
    "get_pod_logs": get_pod_logs,
    "list_deployments": list_deployments,
    "get_events": get_events,
}


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def generate() -> dict[str, list[dict[str, Any]]]:
    rng = random.Random(SEED)
    tools = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))["tools"]
    forbidden = {row["prompt"].strip() for row in load_jsonl(BASELINE_PATH)}
    seen = set(forbidden)
    splits: dict[str, list[dict[str, Any]]] = defaultdict(list)
    serial = 0

    for split, distribution in SPLIT_COUNTS.items():
        for category, target in distribution.items():
            made = 0
            attempts = 0
            while made < target:
                attempts += 1
                if attempts > target * 200:
                    raise RuntimeError(f"Could not create unique {split}/{category} prompts")
                serial += 1
                if category == "no_call":
                    prompt, _, difficulty, response = no_call(rng, serial)
                    assistant = {"role": "assistant", "content": response}
                else:
                    prompt, arguments, difficulty = GENERATORS[category](rng, serial)
                    assistant = make_call(category, arguments)
                prompt = " ".join(prompt.split())
                if prompt in seen:
                    continue
                seen.add(prompt)
                row = {
                    "id": f"{split}-{category.replace('_', '-')}-{made + 1:04d}",
                    "category": category,
                    "difficulty": difficulty,
                    "tools": tools,
                    "messages": [
                        {"role": "user", "content": prompt},
                        assistant,
                    ],
                }
                splits[split].append(row)
                made += 1
        rng.shuffle(splits[split])
    return dict(splits)


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=DATA_DIR)
    args = parser.parse_args()
    splits = generate()
    for split, rows in splits.items():
        write_jsonl(args.output_dir / f"{split}.jsonl", rows)
        print(f"{split}: {len(rows)} -> {args.output_dir / f'{split}.jsonl'}")
    print(f"total: {sum(map(len, splits.values()))}")


if __name__ == "__main__":
    main()
