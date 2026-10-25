"""
Metrics computation for The Sampling Lab.
Computes Distinct-1, Distinct-2, Self-Similarity (TF-IDF Cosine & Jaccard),
Repetition Rate (n=3 trigrams), Average Length (Tokens & Words), and Unique Samples.
Adheres strictly to SRS Section 7 specifications and AT-11 acceptance criteria.
"""

import re
import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def tokenize_words(text: str) -> List[str]:
    """Tokenize text into lowercase words/tokens for n-gram analysis."""
    if not text:
        return []
    tokens = re.findall(r"\b[\w']+\b", text.lower())
    return tokens if tokens else [t for t in text.lower().split() if t]


def distinct_n(texts: List[str], n: int = 1) -> Optional[float]:
    """
    Distinct-n metric:
    Ratio of distinct n-grams to total n-grams across all texts.
    Range: [0.0, 1.0]. Higher value indicates higher lexical diversity.
    Edge case: If there are no n-grams across the texts, returns None (displays as N/A).
    """
    all_ngrams = []
    for text in texts:
        tokens = tokenize_words(text)
        if len(tokens) < n:
            continue
        for i in range(len(tokens) - n + 1):
            ngram = tuple(tokens[i : i + n])
            all_ngrams.append(ngram)

    if not all_ngrams:
        return None

    unique_ngrams = set(all_ngrams)
    return round(len(unique_ngrams) / len(all_ngrams), 4)


def repetition_rate(texts: List[str], n: int = 3) -> Optional[float]:
    """
    Measures the share of repeated n-gram occurrences within generated texts (SRS recommends n=3 trigrams).
    Formula: (total_ngrams - unique_ngrams) / total_ngrams for each sample.
    Range: [0.0, 1.0]. Lower is less repetitive.
    Edge case: If samples have fewer than n tokens, returns None (displays as N/A).
    """
    if not texts:
        return None

    rates = []
    for text in texts:
        tokens = tokenize_words(text)
        if len(tokens) < n:
            continue
        ngrams = [tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]
        if not ngrams:
            continue
        repeats = len(ngrams) - len(set(ngrams))
        rate = repeats / len(ngrams)
        rates.append(rate)

    if not rates:
        return None

    return round(float(np.mean(rates)), 4)


def self_similarity(texts: List[str]) -> Optional[float]:
    """
    Average pairwise cosine similarity between sample texts generated
    under the same setting. Uses TF-IDF representation over unordered pairs.
    Range: [0.0, 1.0].
    
    Edge cases:
    - For N < 2: returns None (SRS Section 7 & AT-11: "For N<2, display N/A").
    - If all samples are string-identical (e.g. deterministic T=0): returns 1.0.
    - If all vectors are empty / stop words: fall back to Jaccard or 1.0.
    """
    if len(texts) < 2:
        return None

    # Check if all samples are string-identical
    normalized = [t.strip() for t in texts]
    if len(set(normalized)) == 1:
        return 1.0

    non_empty = [t for t in normalized if t]
    if len(non_empty) < 2:
        return 1.0

    try:
        vectorizer = TfidfVectorizer(token_pattern=r"(?u)\b\w+\b")
        tfidf_matrix = vectorizer.fit_transform(non_empty)
        if tfidf_matrix.shape[1] == 0:
            return jaccard_self_similarity(texts)

        sim_matrix = cosine_similarity(tfidf_matrix)
        n = sim_matrix.shape[0]
        upper_tri_indices = np.triu_indices(n, k=1)
        pairwise_sims = sim_matrix[upper_tri_indices]

        if len(pairwise_sims) == 0:
            return 1.0

        return round(float(np.mean(pairwise_sims)), 4)
    except Exception:
        return jaccard_self_similarity(texts)


def jaccard_self_similarity(texts: List[str]) -> float:
    """Fallback pairwise Jaccard similarity across word sets for N >= 2."""
    if len(texts) < 2:
        return 1.0

    word_sets = [set(tokenize_words(t)) for t in texts]
    sims = []
    for i in range(len(word_sets)):
        for j in range(i + 1, len(word_sets)):
            s1, s2 = word_sets[i], word_sets[j]
            if not s1 and not s2:
                sims.append(1.0)
            else:
                inter = len(s1.intersection(s2))
                union = len(s1.union(s2))
                sims.append(inter / union if union > 0 else 1.0)

    return round(float(np.mean(sims)) if sims else 1.0, 4)


def average_length(texts: List[str], token_counts: Optional[List[int]] = None) -> Dict[str, float]:
    """Average word count, character count, and generated token count per sample."""
    if not texts:
        return {"avg_words": 0.0, "avg_chars": 0.0, "avg_tokens": 0.0}

    words = [len(tokenize_words(t)) for t in texts]
    chars = [len(t) for t in texts]
    
    if token_counts and len(token_counts) == len(texts):
        tokens = token_counts
    else:
        tokens = words

    return {
        "avg_words": round(float(np.mean(words)), 1),
        "avg_chars": round(float(np.mean(chars)), 1),
        "avg_tokens": round(float(np.mean(tokens)), 1),
    }


def unique_samples_count(texts: List[str]) -> int:
    """Number of distinct normalized sample strings among N samples at one temperature."""
    return len(set(t.strip() for t in texts))


def compute_metrics_for_group(
    texts: List[str],
    token_counts: Optional[List[int]] = None,
    perplexity: Optional[float] = None
) -> Dict[str, Any]:
    """Compute complete metric suite for a set of samples at a specific temperature."""
    lengths = average_length(texts, token_counts=token_counts)
    distinct_1_val = distinct_n(texts, n=1)
    distinct_2_val = distinct_n(texts, n=2)
    similarity_val = self_similarity(texts)
    rep_rate = repetition_rate(texts, n=3)
    unique_count = unique_samples_count(texts)
    total_samples = len(texts)

    all_identical = (unique_count == 1 and total_samples > 1)

    result = {
        "total_samples": total_samples,
        "unique_samples": unique_count,
        "is_deterministic": all_identical,
        "distinct_1": distinct_1_val,
        "distinct_2": distinct_2_val,
        "self_similarity": similarity_val,
        "repetition_rate": rep_rate,
        "avg_words": lengths["avg_words"],
        "avg_chars": lengths["avg_chars"],
        "avg_tokens": lengths["avg_tokens"]
    }
    if perplexity is not None:
        result["perplexity"] = round(float(perplexity), 2)
    else:
        result["perplexity"] = None

    return result
