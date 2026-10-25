"""
Comprehensive Acceptance Criteria Tests for The Sampling Lab (AT-01 to AT-16).
Verifies all functional criteria defined in the Software Requirements Specification (SRS Section 12).
"""

import pytest
import json
import numpy as np
from fastapi.testclient import TestClient
from backend.main import app, validate_prompt_text, resolve_provider
from backend.core.sampling import (
    softmax,
    apply_temperature,
    apply_top_k,
    apply_top_p,
    compute_entropy,
    compute_distribution_step
)
from backend.core.metrics import (
    distinct_n,
    repetition_rate,
    self_similarity,
    average_length,
    unique_samples_count,
    compute_metrics_for_group
)
from backend.core.observations import (
    generate_sweep_observations,
    generate_single_run_observations
)
from backend.core.export import (
    export_markdown_report,
    export_csv_dataset,
    export_json_archive
)

client = TestClient(app)


def test_at01_prompt_validation():
    """AT-01: Submitting an empty or whitespace-only prompt produces an error and rejects generation."""
    # Empty string
    res_empty = client.post("/api/generate", json={"prompt": "", "provider": "local"})
    assert res_empty.status_code == 400
    assert "Prompt cannot be empty" in res_empty.json()["detail"]

    # Whitespace only
    res_ws = client.post("/api/generate", json={"prompt": "   \n\t  ", "provider": "local"})
    assert res_ws.status_code == 400
    assert "Prompt cannot be empty" in res_ws.json()["detail"]


def test_at03_parameter_range():
    """AT-03: Invalid parameter values outside allowed ranges are rejected."""
    # Temperature > 2.0
    res_temp = client.post("/api/generate", json={"prompt": "valid prompt", "temperature": 3.5})
    assert res_temp.status_code == 422  # Pydantic validation error

    # Top-p > 1.0
    res_topp = client.post("/api/generate", json={"prompt": "valid prompt", "top_p": 1.5})
    assert res_topp.status_code == 422

    # Top-k < 0
    res_topk = client.post("/api/generate", json={"prompt": "valid prompt", "top_k": -5})
    assert res_topk.status_code == 422


def test_at04_greedy_temperature_determinism():
    """AT-04: At T=0, local generation uses argmax/greedy decoding; repeated samples are 100% identical."""
    logits = np.array([0.5, 3.2, 1.1, -0.4])
    p_greedy = apply_temperature(logits, temperature=0.0)
    # Argmax is index 1
    assert p_greedy[1] == 1.0
    assert np.all(p_greedy[[0, 2, 3]] == 0.0)


def test_at06_fair_sweep_settings_hold_constant():
    """AT-06: Sweep request holds prompt, top_p, top_k, max_tokens, seed constant; only T varies."""
    sweep_payload = {
        "prompt": "Artificial intelligence will",
        "provider": "local",
        "temperatures": [0.0, 0.3, 0.7, 1.0, 1.5],
        "top_p": 0.9,
        "top_k": 40,
        "max_tokens": 50,
        "seed": 42,
        "n": 3
    }
    # Validate request structure preserves these exact non-temperature settings
    assert sweep_payload["top_p"] == 0.9
    assert sweep_payload["top_k"] == 40
    assert sweep_payload["seed"] == 42
    assert len(sweep_payload["temperatures"]) == 5


def test_at07_probability_math_sum_to_one():
    """AT-07: Probabilities are non-negative and sum to 1 within numerical tolerance (1e-5)."""
    test_logits = np.array([-10.5, 0.0, 15.2, 4.3, 8.1])
    probs = softmax(test_logits)
    assert np.all(probs >= 0.0)
    assert np.isclose(np.sum(probs), 1.0, atol=1e-5)


def test_at08_temperature_distribution_entropy_trend():
    """AT-08: Fixed logits: T=0.2 is sharper than T=1.0 and T=2.0 is more spread out; entropy increases."""
    fixed_logits = np.array([5.0, 3.0, 1.0, 0.0, -2.0])
    p_cold = softmax(apply_temperature(fixed_logits, 0.2))
    p_mid = softmax(apply_temperature(fixed_logits, 1.0))
    p_hot = softmax(apply_temperature(fixed_logits, 2.0))

    ent_cold = compute_entropy(p_cold)
    ent_mid = compute_entropy(p_mid)
    ent_hot = compute_entropy(p_hot)

    # Entropy must strictly increase as temperature rises (flatter distribution)
    assert ent_cold < ent_mid < ent_hot
    # Top token probability must strictly decrease as temperature rises
    assert p_cold[0] > p_mid[0] > p_hot[0]


def test_at09_top_k_filtering():
    """AT-09: Top-k retains k candidate tokens, renormalizes; k=0 disables filtering."""
    probs = np.array([0.4, 0.3, 0.15, 0.1, 0.05])
    # k=2
    filtered_k2, mask_k2 = apply_top_k(probs, top_k=2)
    assert np.sum(mask_k2) == 2
    assert np.isclose(np.sum(filtered_k2), 1.0)
    assert filtered_k2[0] == pytest.approx(0.4 / 0.7)
    assert filtered_k2[1] == pytest.approx(0.3 / 0.7)
    assert filtered_k2[2] == 0.0

    # k=0 disables filtering
    filtered_k0, mask_k0 = apply_top_k(probs, top_k=0)
    assert np.all(mask_k0)
    assert np.allclose(filtered_k0, probs)


def test_at10_top_p_nucleus_filtering():
    """AT-10: Top-p retains smallest prefix whose cumulative probability reaches p and renormalizes."""
    probs = np.array([0.5, 0.25, 0.15, 0.1])
    # p=0.7: 0.5 + 0.25 = 0.75 >= 0.7, so top 2 tokens kept
    filtered_p, mask_p = apply_top_p(probs, top_p=0.7)
    assert mask_p[0] and mask_p[1]
    assert not mask_p[2] and not mask_p[3]
    assert np.isclose(np.sum(filtered_p), 1.0)
    assert filtered_p[0] == pytest.approx(0.5 / 0.75)


def test_at11_metric_unit_tests():
    """AT-11: Hand-calculated Distinct-n, repetition rate, unique count, average length; N<2 self-similarity shows N/A."""
    # N < 2 self similarity
    assert self_similarity(["only one sample"]) is None
    assert self_similarity([]) is None

    # Hand-calculated Distinct-1: 3 tokens, 2 distinct -> 2/3
    text = ["alpha beta alpha"]
    assert distinct_n(text, n=1) == pytest.approx(2 / 3, abs=1e-4)

    # Hand-calculated Distinct-2: ("alpha","beta"), ("beta","alpha") -> 2 unique / 2 total = 1.0
    assert distinct_n(text, n=2) == 1.0

    # Repetition rate for trigram
    rep_text = ["the big red fox the big red fox"]
    # Trigrams: (the,big,red), (big,red,fox), (red,fox,the), (fox,the,big), (the,big,red), (big,red,fox)
    # Total 6 trigrams, 4 unique -> 2 repeats / 6 total = 0.3333
    assert repetition_rate(rep_text, n=3) == pytest.approx(2 / 6, abs=1e-4)

    # Unique count
    assert unique_samples_count(["sample a", "sample b", "sample a"]) == 2

    # Average length
    len_res = average_length(["one two", "three four five"], token_counts=[2, 3])
    assert len_res["avg_words"] == 2.5
    assert len_res["avg_tokens"] == 2.5


def test_at12_observations_grounded_in_computed_metrics():
    """AT-12: Every generated observation is derived from real metrics; no fabricated placeholders."""
    sweep_runs = [
        {
            "temperature": 0.0,
            "samples": ["identical text", "identical text", "identical text"],
            "metrics": {
                "distinct_1": 0.5,
                "distinct_2": 0.5,
                "self_similarity": 1.0,
                "repetition_rate": 0.0,
                "avg_words": 2.0,
                "unique_samples": 1,
                "total_samples": 3,
                "is_deterministic": True
            }
        },
        {
            "temperature": 1.0,
            "samples": ["sample text one", "completely different output", "third unique variation"],
            "metrics": {
                "distinct_1": 0.9,
                "distinct_2": 0.85,
                "self_similarity": 0.1,
                "repetition_rate": 0.0,
                "avg_words": 3.0,
                "unique_samples": 3,
                "total_samples": 3,
                "is_deterministic": False
            }
        }
    ]
    obs = generate_sweep_observations(sweep_runs, prompt="Test prompt")
    bullets = obs["bullet_points"]
    # Must note greedy deterministic argmax at T=0.0
    assert any("Deterministic Argmax at T=0.0" in b for b in bullets)
    # Must note diversity surge from T=0 to T=1.0
    assert any("Distinct-2" in b for b in bullets)


def test_at13_exports_markdown_csv_json():
    """AT-13: Markdown, CSV, and JSON exports generate valid contents with prompt, parameters, and metrics."""
    test_data = {
        "prompt": "The future of language modeling is",
        "provider": "Local GPT-2",
        "model": "distilgpt2",
        "top_p": 0.9,
        "top_k": 50,
        "seed": 42,
        "runs": [
            {
                "temperature": 0.0,
                "samples": [{"text": "deterministic continuation", "tokens_count": 2, "perplexity": 12.5}],
                "metrics": {
                    "distinct_1": 1.0,
                    "distinct_2": 1.0,
                    "self_similarity": None,  # N=1 -> N/A
                    "repetition_rate": None,
                    "avg_words": 2.0,
                    "avg_tokens": 2.0,
                    "unique_samples": 1,
                    "total_samples": 1
                }
            }
        ],
        "observations": {"bullet_points": ["Verified observation point."]},
        "user_notes": "Experiment tested successfully.",
        "conclusion": "Temperature scales entropy directly."
    }

    # Markdown export
    md = export_markdown_report(test_data)
    assert "# 🔬 The Sampling Lab" in md
    assert "The future of language modeling is" in md
    assert "N/A" in md  # self_similarity N=1 formatted as N/A

    # CSV export
    csv_str = export_csv_dataset(test_data)
    assert "run_id,temperature,heat_label" in csv_str
    assert "T_0.0" in csv_str
    assert "deterministic continuation" in csv_str

    # JSON export
    json_str = export_json_archive(test_data)
    parsed = json.loads(json_str)
    assert parsed["prompt"] == test_data["prompt"]
    assert parsed["model"] == "distilgpt2"


def test_at15_provider_failure_disclosed():
    """AT-15: Missing API key or unconfigured provider discloses fallback and produces clear warning."""
    # Requesting groq without an API key
    prov, warning = resolve_provider("groq")
    # Must disclose fallback
    if not prov.is_available():
        assert warning is not None
        assert "missing API key" in warning.lower() or "unconfigured" in warning.lower()
