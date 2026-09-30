#!/usr/bin/env python3
"""Validate counts, uniqueness, schemas, and split isolation of training data."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

from jsonschema import validate


ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "train": {"list_pods": 96, "get_pod": 152, "get_pod_logs": 192, "list_deployments": 80, "get_events": 160, "no_call": 120},
    "valid": {"list_pods": 12, "get_pod": 19, "get_pod_logs": 24, "list_deployments": 10, "get_events": 20, "no_call": 15},
    "test": {"list_pods": 12, "get_pod": 19, "get_pod_logs": 24, "list_deployments": 10, "get_events": 20, "no_call": 15},
}

NAMESPACE_ALIASES = {
    "production": "production",
    "운영계": "production",
    "운영 환경": "production",
    "프로덕션": "production",
    "prod": "production",
    "개발계": "dev",
    "개발 환경": "dev",
    "dev": "dev",
    "검증계": "staging",
    "스테이징": "staging",
    "staging": "staging",
    "default": "default",
    "기본 네임스페이스": "default",
    "kube-system": "kube-system",
    "monitoring": "monitoring",
    "data-platform": "data-platform",
    "payments": "payments",
    "observability": "observability",
}


def namespace_mentions(prompt: str) -> set[str]:
    """Return canonical namespaces explicitly named in a generated prompt."""
    found = set()
    for alias, canonical in NAMESPACE_ALIASES.items():
        if alias.isascii():
            # A namespace-like value inside a selector (for example
            # ``team=payments`` or ``env=prod``) is not a namespace mention.
            pattern = rf"(?<![A-Za-z0-9_=\-]){re.escape(alias)}(?![A-Za-z0-9_-])"
            mentioned = re.search(pattern, prompt, flags=re.IGNORECASE) is not None
        else:
            mentioned = alias in prompt
        if mentioned:
            found.add(canonical)
    return found


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows = []
    with path.open(encoding="utf-8") as handle:
        for number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise AssertionError(f"{path}:{number}: invalid JSON: {exc}") from exc
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=ROOT / "data")
    args = parser.parse_args()
    schema_doc = json.loads((ROOT / "schemas/kubernetes_tools.json").read_text(encoding="utf-8"))
    canonical_tools = schema_doc["tools"]
    schemas = {tool["function"]["name"]: tool["function"]["parameters"] for tool in canonical_tools}
    baseline_prompts = {row["prompt"] for row in read_jsonl(ROOT / "evaluation/baseline_cases.jsonl")}
    all_prompts: set[str] = set()
    all_ids: set[str] = set()
    total = 0

    for split, expected_counts in EXPECTED.items():
        path = args.data_dir / f"{split}.jsonl"
        rows = read_jsonl(path)
        counts = Counter(row.get("category") for row in rows)
        assert counts == Counter(expected_counts), f"{split}: distribution mismatch: {counts}"
        assert len(rows) == sum(expected_counts.values()), f"{split}: wrong row count"
        for index, row in enumerate(rows, 1):
            prefix = f"{path}:{index}"
            assert row["id"] not in all_ids, f"{prefix}: duplicate id"
            all_ids.add(row["id"])
            assert row["tools"] == canonical_tools, f"{prefix}: tools differ from canonical schema"
            messages = row["messages"]
            assert len(messages) == 2 and messages[0]["role"] == "user", f"{prefix}: invalid messages"
            prompt = messages[0]["content"]
            assert prompt and prompt not in baseline_prompts, f"{prefix}: baseline overlap"
            assert prompt not in all_prompts, f"{prefix}: duplicate prompt"
            all_prompts.add(prompt)
            assistant = messages[1]
            assert assistant["role"] == "assistant", f"{prefix}: missing assistant answer"
            if row["category"] == "no_call":
                assert "tool_calls" not in assistant, f"{prefix}: no_call emitted a tool"
                assert assistant.get("content"), f"{prefix}: no_call needs text"
            else:
                calls = assistant.get("tool_calls")
                assert isinstance(calls, list) and len(calls) == 1, f"{prefix}: expected one call"
                function = calls[0]["function"]
                assert function["name"] == row["category"], f"{prefix}: category/tool mismatch"
                assert isinstance(function["arguments"], dict), f"{prefix}: arguments must be an object"
                validate(function["arguments"], schemas[function["name"]])
                arguments = function["arguments"]
                mentioned_namespaces = namespace_mentions(prompt)
                argument_namespace = arguments.get("namespace")
                if argument_namespace is None:
                    assert not mentioned_namespaces, (
                        f"{prefix}: prompt explicitly names namespace(s) "
                        f"{mentioned_namespaces}, but arguments omit namespace"
                    )
                else:
                    assert mentioned_namespaces == {argument_namespace}, (
                        f"{prefix}: namespace meaning mismatch: prompt={mentioned_namespaces}, "
                        f"arguments={argument_namespace!r}"
                    )
                if function["name"] == "get_events":
                    has_kind = "resource_kind" in arguments
                    has_name = "resource_name" in arguments
                    assert has_kind == has_name, f"{prefix}: event resource kind/name must appear together"
                if "previous" in arguments:
                    assert arguments["previous"] is True, f"{prefix}: omit unspecified previous=false"
        total += len(rows)
        print(f"{split}: {len(rows)} {dict(sorted(counts.items()))}")

    assert total == 1000, f"total must be 1000, got {total}"
    assert len(all_prompts) == 1000
    print(f"PASS: {total} valid rows, unique prompts/ids, no baseline overlap")


if __name__ == "__main__":
    main()
