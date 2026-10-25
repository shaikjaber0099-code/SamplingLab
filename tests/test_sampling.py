"""
Unit tests for backend/core/sampling.py
Verifies temperature scaling, softmax sum-to-1, top-k filtering, top-p filtering, entropy, and determinism.
"""

import pytest
import numpy as np
from backend.core.sampling import (
    softmax,
    apply_temperature,
    apply_top_k,
    apply_top_p,
    compute_entropy,
    sample_token,
    compute_distribution_step
)


def test_softmax_properties():
    logits = np.array([2.0, 1.0, 0.1, -1.5])
    probs = softmax(logits)
    
    # Probabilities must sum to 1.0
    assert np.isclose(np.sum(probs), 1.0)
    # All probabilities must be non-negative
    assert np.all(probs >= 0.0)
    # Highest logit has highest probability
    assert np.argmax(probs) == 0


def test_temperature_scaling_behavior():
    logits = np.array([4.0, 2.0, 1.0])
    
    # T=1.0 base
    p_base = softmax(logits)
    
    # High T (2.0) should flatten the distribution (entropy increases)
    p_hot = softmax(apply_temperature(logits, 2.0))
    # Low T (0.2) should sharpen the distribution (entropy decreases)
    p_cold = softmax(apply_temperature(logits, 0.2))
    
    ent_base = compute_entropy(p_base)
    ent_hot = compute_entropy(p_hot)
    ent_cold = compute_entropy(p_cold)
    
    assert ent_hot > ent_base
    assert ent_base > ent_cold
    
    # Cold probability of top token should be higher than hot
    assert p_cold[0] > p_base[0] > p_hot[0]


def test_zero_temperature_greedy():
    logits = np.array([1.2, 5.0, 3.1])
    # T <= 1e-5 collapses to greedy one-hot
    p_greedy = apply_temperature(logits, 0.0)
    assert np.isclose(p_greedy[1], 1.0)
    assert np.isclose(p_greedy[0], 0.0)
    assert np.isclose(p_greedy[2], 0.0)


def test_top_k_filtering():
    probs = np.array([0.5, 0.25, 0.15, 0.07, 0.03])
    # Keep top 2 tokens
    filtered, mask = apply_top_k(probs, top_k=2)
    
    assert np.sum(mask) == 2
    assert mask[0] and mask[1]
    assert not mask[2] and not mask[3] and not mask[4]
    assert np.isclose(np.sum(filtered), 1.0)
    assert filtered[0] > filtered[1]


def test_top_p_nucleus_filtering():
    probs = np.array([0.6, 0.25, 0.1, 0.05])
    # top_p = 0.7 should keep first two (0.6 + 0.25 = 0.85 >= 0.7)
    filtered, mask = apply_top_p(probs, top_p=0.7)
    
    assert mask[0] and mask[1]
    assert not mask[2] and not mask[3]
    assert np.isclose(np.sum(filtered), 1.0)


def test_compute_distribution_step():
    logits = np.array([1.0, 3.0, 0.5, -2.0, 2.5])
    tokens = ["apple", "banana", "cherry", "date", "fig"]
    
    step = compute_distribution_step(
        logits=logits,
        token_labels=tokens,
        temperature=0.7,
        top_p=0.9,
        top_k=3,
        top_n_display=5
    )
    
    assert "candidates" in step
    assert len(step["candidates"]) == 5
    assert step["temperature"] == 0.7
    assert step["temp_entropy"] >= 0
    # Top token should be "banana"
    assert step["candidates"][0]["token"] == "banana"


def test_repetition_penalty():
    from backend.core.sampling import apply_repetition_penalty
    logits = np.array([2.0, 4.0, -1.0])
    history = [1]  # Token 1 was previously generated
    
    # Repetition penalty = 1.0 (no penalty)
    penalized_1 = apply_repetition_penalty(logits, history, repetition_penalty=1.0)
    assert np.allclose(penalized_1, logits)
    
    # Repetition penalty = 2.0: token 1 (positive logit 4.0) should become 4.0 / 2.0 = 2.0
    penalized_2 = apply_repetition_penalty(logits, history, repetition_penalty=2.0)
    assert np.isclose(penalized_2[1], 2.0)
    assert np.isclose(penalized_2[0], 2.0)  # Unchanged
    
    # Negative logit penalized (token 2 in history): -1.0 * 2.0 = -2.0
    penalized_neg = apply_repetition_penalty(logits, [2], repetition_penalty=2.0)
    assert np.isclose(penalized_neg[2], -2.0)


def test_no_repeat_ngram():
    from backend.core.sampling import apply_no_repeat_ngram
    logits = np.array([1.0, 2.0, 3.0, 4.0])
    # Sequence generated so far: [0, 1, 2, 0, 1]
    # If ngram_size=3, prefix is (0, 1). Earlier, (0, 1) was followed by token 2.
    # Therefore, token 2 should be banned (-1e9).
    history = [0, 1, 2, 0, 1]
    filtered = apply_no_repeat_ngram(logits, history, no_repeat_ngram_size=3)
    
    assert filtered[2] <= -1e8
    assert filtered[0] == logits[0]
    assert filtered[1] == logits[1]
    assert filtered[3] == logits[3]
