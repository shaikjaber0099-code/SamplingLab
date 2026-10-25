"""
Unit tests for backend/core/metrics.py
Tests Distinct-1, Distinct-2, Self-Similarity, Repetition Rate, Average Length, and determinism metrics.
Verifies compliance with AT-11 and SRS Section 7.
"""

import pytest
from backend.core.metrics import (
    distinct_n,
    self_similarity,
    repetition_rate,
    unique_samples_count,
    average_length,
    compute_metrics_for_group
)


def test_hand_calculated_distinct_n():
    """
    AT-11: Distinct-n matches hand-calculated small examples.
    Sentence: "cat dog cat"
    Unigrams: ["cat", "dog", "cat"] -> total 3, unique 2 {"cat", "dog"} -> 2/3 = 0.6667
    """
    text = ["cat dog cat"]
    d1 = distinct_n(text, n=1)
    assert d1 == pytest.approx(2 / 3, abs=1e-4)

    # Bigrams in "cat dog cat dog": ("cat","dog"), ("dog","cat"), ("cat","dog") -> total 3, unique 2 -> 2/3 = 0.6667
    text2 = ["cat dog cat dog"]
    d2 = distinct_n(text2, n=2)
    assert d2 == pytest.approx(2 / 3, abs=1e-4)


def test_self_similarity_n_less_than_two():
    """AT-11: N < 2 self-similarity shows N/A (None in Python)."""
    assert self_similarity([]) is None
    assert self_similarity(["Single sample text here."]) is None


def test_self_similarity_identical_samples():
    """Identical samples produce 1.0."""
    identical = [
        "The quick brown fox jumps over the lazy dog.",
        "The quick brown fox jumps over the lazy dog.",
        "The quick brown fox jumps over the lazy dog."
    ]
    sim = self_similarity(identical)
    assert sim == 1.0


def test_self_similarity_divergent_samples():
    """Divergent samples have low similarity."""
    divergent = [
        "The universe began with a cosmic expansion of spacetime.",
        "Artificial intelligence analyzes probabilistic distributions accurately.",
        "Culinary arts require fresh rosemary and olive oil."
    ]
    sim_div = self_similarity(divergent)
    assert sim_div is not None
    assert sim_div < 0.3


def test_hand_calculated_repetition_rate():
    """
    AT-11: Hand calculated repetition rate for n=3 trigrams.
    Sentence: "a b c a b c"
    Trigrams: (a,b,c), (b,c,a), (c,a,b), (a,b,c) -> total 4, unique 3.
    Repeats: 4 - 3 = 1.
    Rate: 1/4 = 0.25.
    """
    sample = ["a b c a b c"]
    rep = repetition_rate(sample, n=3)
    assert rep == pytest.approx(0.25, abs=1e-4)

    # Too few tokens (< 3) should return None (N/A)
    assert repetition_rate(["hi there"], n=3) is None


def test_unique_samples_count():
    samples = ["hello world", "hello world", "different text"]
    assert unique_samples_count(samples) == 2


def test_average_length_calculation():
    """AT-11: Average length matches hand-calculated tokens/words."""
    texts = ["one two three", "four five"]
    res = average_length(texts, token_counts=[3, 2])
    assert res["avg_words"] == 2.5
    assert res["avg_tokens"] == 2.5


def test_empty_text_edge_cases():
    """SRS Section 7: If there are no unigrams or bigrams, return None (N/A)."""
    assert distinct_n([], n=1) is None
    assert distinct_n([""], n=1) is None
    assert distinct_n(["single"], n=2) is None
    assert repetition_rate([], n=3) is None


def test_compute_metrics_for_group():
    texts = [
        "Language models predict next tokens based on probability distributions.",
        "Language models predict next tokens based on probability distributions."
    ]
    res = compute_metrics_for_group(texts, token_counts=[9, 9], perplexity=14.2)
    assert res["is_deterministic"] is True
    assert res["unique_samples"] == 1
    assert res["total_samples"] == 2
    assert res["perplexity"] == 14.2
    assert res["self_similarity"] == 1.0
    assert res["avg_tokens"] == 9.0

