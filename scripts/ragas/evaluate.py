import json
import os
import sys

from ragas import EvaluationDataset, evaluate
import instructor
import litellm
from ragas.llms import llm_factory
from ragas.metrics import (
    answer_relevancy,
    context_precision,
    context_recall,
    faithfulness,
)


def load_dotenv(path: str = ".env") -> None:
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def load_jsonl(path: str) -> list[dict]:
    rows = []
    with open(path, "r", encoding="utf-8") as file:
        for line in file:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def main() -> None:
    load_dotenv()
    input_path = sys.argv[1] if len(sys.argv) > 1 else "data/ragas/eval-run.jsonl"
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY missing")

    os.environ.setdefault("GEMINI_API_KEY", api_key)
    client = instructor.from_litellm(litellm.completion)
    evaluator_llm = llm_factory(
        "gemini/gemini-2.0-flash",
        provider="google",
        client=client,
        adapter="litellm",
    )

    rows = load_jsonl(input_path)
    dataset = EvaluationDataset.from_list(rows)
    result = evaluate(
        dataset,
        metrics=[
            context_precision,
            context_recall,
            faithfulness,
            answer_relevancy,
        ],
        llm=evaluator_llm,
    )
    print(result)
    result.to_pandas().to_csv("data/ragas/ragas-scores.csv", index=False)
    print("Wrote row-level scores to data/ragas/ragas-scores.csv")


if __name__ == "__main__":
    main()
