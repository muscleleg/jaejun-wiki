from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from typing import Any

from jsonschema import ValidationError, validate

from ko_k8s_fc.tools import TOOL_SCHEMAS


@dataclass(frozen=True)
class ExpectedCall:
    name: str
    arguments: dict[str, Any]


@dataclass(frozen=True)
class EvaluationCase:
    case_id: str
    category: str
    difficulty: str
    prompt: str
    expected: ExpectedCall | None


@dataclass(frozen=True)
class ActualCall:
    name: str
    arguments_json: str


@dataclass(frozen=True)
class CaseScore:
    case_id: str
    category: str
    difficulty: str
    prompt: str
    expected_tool: str | None
    expected_arguments: dict[str, Any] | None
    actual_calls: list[dict[str, Any]]
    call_decision_correct: bool
    tool_selection_correct: bool | None
    json_valid: bool | None
    schema_valid: bool | None
    arguments_exact: bool | None
    argument_true_positives: int
    argument_false_positives: int
    argument_false_negatives: int
    no_call_correct: bool | None
    full_success: bool
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def load_case(value: dict[str, Any]) -> EvaluationCase:
    expected_value = value.get("expected")
    expected = None
    if expected_value is not None:
        expected = ExpectedCall(
            name=expected_value["name"],
            arguments=expected_value.get("arguments", {}),
        )
    return EvaluationCase(
        case_id=value["id"],
        category=value["category"],
        difficulty=value["difficulty"],
        prompt=value["prompt"],
        expected=expected,
    )


def _argument_counts(
    expected: dict[str, Any], actual: dict[str, Any]
) -> tuple[int, int, int]:
    true_positives = sum(
        1 for key, value in actual.items() if key in expected and expected[key] == value
    )
    false_positives = len(actual) - true_positives
    false_negatives = sum(
        1 for key, value in expected.items() if key not in actual or actual[key] != value
    )
    return true_positives, false_positives, false_negatives


def score_case(
    case: EvaluationCase,
    actual_calls: list[ActualCall],
    *,
    error: str | None = None,
) -> CaseScore:
    expects_call = case.expected is not None
    emitted_call = bool(actual_calls)
    call_decision_correct = expects_call == emitted_call and error is None

    rendered_calls: list[dict[str, Any]] = []
    parsed_arguments: dict[str, Any] | None = None
    json_valid: bool | None = None
    schema_valid: bool | None = None

    if len(actual_calls) == 1:
        actual_call = actual_calls[0]
        try:
            parsed = json.loads(actual_call.arguments_json)
            json_valid = isinstance(parsed, dict)
            parsed_arguments = parsed if json_valid else None
        except (json.JSONDecodeError, TypeError):
            json_valid = False

        if json_valid and parsed_arguments is not None:
            schema = TOOL_SCHEMAS.get(actual_call.name)
            if schema is None:
                schema_valid = False
            else:
                try:
                    validate(instance=parsed_arguments, schema=schema)
                    schema_valid = True
                except ValidationError:
                    schema_valid = False

        rendered_calls.append(
            {
                "name": actual_call.name,
                "arguments_json": actual_call.arguments_json,
                "parsed_arguments": parsed_arguments,
            }
        )
    else:
        rendered_calls.extend(
            {
                "name": call.name,
                "arguments_json": call.arguments_json,
                "parsed_arguments": None,
            }
            for call in actual_calls
        )

    if case.expected is None:
        no_call_correct = not actual_calls and error is None
        return CaseScore(
            case_id=case.case_id,
            category=case.category,
            difficulty=case.difficulty,
            prompt=case.prompt,
            expected_tool=None,
            expected_arguments=None,
            actual_calls=rendered_calls,
            call_decision_correct=call_decision_correct,
            tool_selection_correct=None,
            json_valid=json_valid,
            schema_valid=schema_valid,
            arguments_exact=None,
            argument_true_positives=0,
            argument_false_positives=0,
            argument_false_negatives=0,
            no_call_correct=no_call_correct,
            full_success=no_call_correct,
            error=error,
        )

    tool_selection_correct = (
        len(actual_calls) == 1 and actual_calls[0].name == case.expected.name
    )
    expected_arguments = case.expected.arguments
    if parsed_arguments is None:
        arguments_exact = False
        true_positives = 0
        false_positives = 0
        false_negatives = len(expected_arguments)
    else:
        arguments_exact = parsed_arguments == expected_arguments
        true_positives, false_positives, false_negatives = _argument_counts(
            expected_arguments, parsed_arguments
        )

    full_success = bool(
        error is None
        and call_decision_correct
        and tool_selection_correct
        and json_valid
        and schema_valid
        and arguments_exact
    )
    return CaseScore(
        case_id=case.case_id,
        category=case.category,
        difficulty=case.difficulty,
        prompt=case.prompt,
        expected_tool=case.expected.name,
        expected_arguments=expected_arguments,
        actual_calls=rendered_calls,
        call_decision_correct=call_decision_correct,
        tool_selection_correct=tool_selection_correct,
        json_valid=json_valid,
        schema_valid=schema_valid,
        arguments_exact=arguments_exact,
        argument_true_positives=true_positives,
        argument_false_positives=false_positives,
        argument_false_negatives=false_negatives,
        no_call_correct=None,
        full_success=full_success,
        error=error,
    )


def _rate(numerator: int, denominator: int) -> float | None:
    return round(numerator / denominator, 4) if denominator else None


def summarize(scores: list[CaseScore]) -> dict[str, Any]:
    expected_call_scores = [score for score in scores if score.expected_tool is not None]
    no_call_scores = [score for score in scores if score.expected_tool is None]
    single_call_scores = [score for score in scores if len(score.actual_calls) == 1]

    true_positives = sum(score.argument_true_positives for score in scores)
    false_positives = sum(score.argument_false_positives for score in scores)
    false_negatives = sum(score.argument_false_negatives for score in scores)
    precision = _rate(true_positives, true_positives + false_positives)
    recall = _rate(true_positives, true_positives + false_negatives)
    argument_f1 = None
    if precision is not None and recall is not None and precision + recall:
        argument_f1 = round(2 * precision * recall / (precision + recall), 4)

    by_category: dict[str, dict[str, Any]] = {}
    for category in sorted({score.category for score in scores}):
        category_scores = [score for score in scores if score.category == category]
        by_category[category] = {
            "cases": len(category_scores),
            "full_success_rate": _rate(
                sum(score.full_success for score in category_scores),
                len(category_scores),
            ),
        }

    return {
        "total_cases": len(scores),
        "expected_call_cases": len(expected_call_scores),
        "expected_no_call_cases": len(no_call_scores),
        "api_errors": sum(score.error is not None for score in scores),
        "call_decision_accuracy": _rate(
            sum(score.call_decision_correct for score in scores), len(scores)
        ),
        "tool_selection_accuracy": _rate(
            sum(bool(score.tool_selection_correct) for score in expected_call_scores),
            len(expected_call_scores),
        ),
        "json_validity_on_single_calls": _rate(
            sum(score.json_valid is True for score in single_call_scores),
            len(single_call_scores),
        ),
        "schema_validity_on_single_calls": _rate(
            sum(score.schema_valid is True for score in single_call_scores),
            len(single_call_scores),
        ),
        "arguments_exact_match": _rate(
            sum(score.arguments_exact is True for score in expected_call_scores),
            len(expected_call_scores),
        ),
        "argument_precision": precision,
        "argument_recall": recall,
        "argument_f1": argument_f1,
        "no_call_accuracy": _rate(
            sum(score.no_call_correct is True for score in no_call_scores),
            len(no_call_scores),
        ),
        "full_success_rate": _rate(
            sum(score.full_success for score in scores), len(scores)
        ),
        "by_category": by_category,
    }
