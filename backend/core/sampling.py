"""
Core sampling mathematics and algorithms for The Sampling Lab.
Includes temperature scaling, softmax, top-k filtering, top-p (nucleus) filtering,
entropy computation, and probability distributions.
"""

import numpy as np
from typing import Tuple, Dict, Any, List


def softmax(logits: np.ndarray) -> np.ndarray:
    """Compute numerically stable softmax over 1D or 2D array."""
    logits = np.asarray(logits, dtype=np.float64)
    # Subtract max for numerical stability
    shifted = logits - np.max(logits, axis=-1, keepdims=True)
    exp_shifted = np.exp(shifted)
    probs = exp_shifted / np.sum(exp_shifted, axis=-1, keepdims=True)
    return probs


def apply_repetition_penalty(
    logits: np.ndarray,
    token_history: List[int],
    repetition_penalty: float = 1.0
) -> np.ndarray:
    """
    Applies Keskar et al. (CTRL) repetition penalty to logits for tokens
    that have already appeared in the token history.
    - If repetition_penalty <= 1.0, returns logits unchanged.
    - For tokens in history:
        if logit > 0: logit = logit / repetition_penalty
        else: logit = logit * repetition_penalty
    """
    if repetition_penalty <= 1.0 or not token_history:
        return logits
    logits = np.array(logits, copy=True, dtype=np.float64)
    unique_tokens = set(token_history)
    vocab_size = len(logits)
    for tid in unique_tokens:
        if 0 <= tid < vocab_size:
            if logits[tid] > 0:
                logits[tid] /= float(repetition_penalty)
            else:
                logits[tid] *= float(repetition_penalty)
    return logits


def apply_no_repeat_ngram(
    logits: np.ndarray,
    token_history: List[int],
    no_repeat_ngram_size: int = 0
) -> np.ndarray:
    """
    Prevents repetition of n-grams of specified size.
    If the last (n-1) tokens match a previously generated sequence,
    the subsequent token in that sequence is penalized with -1e9.
    """
    if no_repeat_ngram_size <= 0 or len(token_history) < no_repeat_ngram_size - 1:
        return logits
    logits = np.array(logits, copy=True, dtype=np.float64)
    prefix_len = no_repeat_ngram_size - 1
    current_prefix = tuple(token_history[-prefix_len:])
    
    vocab_size = len(logits)
    banned_tokens = set()
    for i in range(len(token_history) - no_repeat_ngram_size + 1):
        if tuple(token_history[i:i + prefix_len]) == current_prefix:
            banned_token = token_history[i + prefix_len]
            banned_tokens.add(banned_token)
            
    for tid in banned_tokens:
        if 0 <= tid < vocab_size:
            logits[tid] = -1e9
    return logits


def apply_temperature(logits: np.ndarray, temperature: float) -> np.ndarray:
    """
    Apply temperature scaling to raw logits:
    z'_i = z_i / T
    
    Special cases:
    - T <= 1e-5: effectively greedy (approaches argmax / one-hot)
    - T > 0: scaled logits
    """
    logits = np.asarray(logits, dtype=np.float64)
    if temperature <= 1e-5:
        # Near zero: create one-hot or sharply peaked logits
        one_hot = np.zeros_like(logits)
        max_idx = np.argmax(logits)
        one_hot[max_idx] = 1.0
        return one_hot  # will be handled as greedy probs directly
    return logits / float(temperature)


def apply_top_k(probs: np.ndarray, top_k: int) -> Tuple[np.ndarray, np.ndarray]:
    """
    Filter probability distribution to only top-k candidates, re-normalizing.
    Returns (filtered_probs, mask_of_kept_tokens).
    If top_k <= 0 or top_k >= len(probs), returns original probs and all-True mask.
    """
    probs = np.array(probs, dtype=np.float64)
    n = len(probs)
    if top_k <= 0 or top_k >= n:
        return probs, np.ones(n, dtype=bool)

    # Find the threshold of the top_kth highest probability
    sorted_indices = np.argsort(probs)[::-1]
    kept_indices = sorted_indices[:top_k]
    
    mask = np.zeros(n, dtype=bool)
    mask[kept_indices] = True
    
    filtered_probs = np.zeros_like(probs)
    filtered_probs[mask] = probs[mask]
    
    # Re-normalize
    total = np.sum(filtered_probs)
    if total > 0:
        filtered_probs = filtered_probs / total
    else:
        # Fallback if all 0
        filtered_probs[kept_indices[0]] = 1.0

    return filtered_probs, mask


def apply_top_p(probs: np.ndarray, top_p: float) -> Tuple[np.ndarray, np.ndarray]:
    """
    Filter probability distribution using nucleus (top-p) sampling:
    Keep the smallest set of tokens whose cumulative probability exceeds top_p.
    Returns (filtered_probs, mask_of_kept_tokens).
    """
    probs = np.array(probs, dtype=np.float64)
    n = len(probs)
    if top_p >= 1.0 or top_p <= 0.0:
        return probs, np.ones(n, dtype=bool)

    # Sort probabilities descending
    sorted_indices = np.argsort(probs)[::-1]
    sorted_probs = probs[sorted_indices]
    
    cumulative_probs = np.cumsum(sorted_probs)
    
    # Keep tokens where cumulative probability <= top_p, plus at least one token
    kept_sorted_mask = cumulative_probs <= top_p
    # Ensure at least the top 1 token is kept
    kept_sorted_mask[0] = True
    
    # Also include the first token that crossed top_p threshold
    if not np.all(kept_sorted_mask):
        first_false_idx = np.where(~kept_sorted_mask)[0]
        if len(first_false_idx) > 0:
            kept_sorted_mask[first_false_idx[0]] = True

    mask = np.zeros(n, dtype=bool)
    mask[sorted_indices[kept_sorted_mask]] = True
    
    filtered_probs = np.zeros_like(probs)
    filtered_probs[mask] = probs[mask]
    
    total = np.sum(filtered_probs)
    if total > 0:
        filtered_probs = filtered_probs / total
    else:
        filtered_probs[sorted_indices[0]] = 1.0

    return filtered_probs, mask


def compute_entropy(probs: np.ndarray) -> float:
    """
    Calculate Shannon entropy in nats or bits:
    H(P) = - Σ p_i * log2(p_i)
    Returns entropy in bits (log base 2).
    """
    probs = np.asarray(probs, dtype=np.float64)
    # Filter out 0 or negative
    p = probs[probs > 1e-12]
    if len(p) == 0:
        return 0.0
    entropy = -np.sum(p * np.log2(p))
    return float(max(0.0, entropy))


def sample_token(probs: np.ndarray, rng: np.random.Generator = None) -> int:
    """Sample an index from categorical distribution given probabilities."""
    if rng is None:
        rng = np.random.default_rng()
    # Ensure sum is strictly 1.0
    p = np.asarray(probs, dtype=np.float64)
    p = p / np.sum(p)
    return int(rng.choice(len(p), p=p))


def compute_distribution_step(
    logits: np.ndarray,
    token_labels: List[str],
    temperature: float = 1.0,
    top_p: float = 1.0,
    top_k: int = 0,
    top_n_display: int = 10
) -> Dict[str, Any]:
    """
    Computes before-and-after probabilities for top candidate tokens:
    1. Base probabilities (T=1.0, softmax of raw logits)
    2. Temperature-scaled probabilities
    3. Filtering (top-k and top-p)
    4. Entropy
    
    Returns structured data for visualization charts.
    """
    raw_logits = np.asarray(logits, dtype=np.float64)
    vocab_size = len(raw_logits)
    
    # 1. Base probabilities (T=1.0)
    base_probs = softmax(raw_logits)
    base_entropy = compute_entropy(base_probs)
    
    # 2. Temperature scaling
    if temperature <= 1e-5:
        # Greedy deterministic
        scaled_probs = np.zeros(vocab_size, dtype=np.float64)
        scaled_probs[np.argmax(raw_logits)] = 1.0
    else:
        scaled_logits = raw_logits / float(temperature)
        scaled_probs = softmax(scaled_logits)
        
    temp_entropy = compute_entropy(scaled_probs)
    
    # 3. Filtering
    k_filtered_probs, k_mask = apply_top_k(scaled_probs, top_k)
    final_probs, p_mask = apply_top_p(k_filtered_probs, top_p)
    final_entropy = compute_entropy(final_probs)
    
    combined_mask = k_mask & p_mask
    
    # Pick top N tokens based on base or scaled probs
    top_indices = np.argsort(base_probs)[::-1][:top_n_display]
    
    candidates = []
    for rank, idx in enumerate(top_indices):
        token_str = token_labels[idx] if idx < len(token_labels) else f"token_{idx}"
        is_kept = bool(combined_mask[idx])
        filtered_by = []
        if top_k > 0 and not k_mask[idx]:
            filtered_by.append("top-k")
        if top_p < 1.0 and not p_mask[idx]:
            filtered_by.append("top-p")
            
        candidates.append({
            "rank": rank + 1,
            "token_id": int(idx),
            "token": token_str,
            "raw_logit": float(round(raw_logits[idx], 4)),
            "base_prob": float(round(base_probs[idx], 6)),
            "temp_prob": float(round(scaled_probs[idx], 6)),
            "final_prob": float(round(final_probs[idx], 6)),
            "is_kept": is_kept,
            "filtered_by": ", ".join(filtered_by) if filtered_by else None
        })
        
    return {
        "temperature": temperature,
        "top_p": top_p,
        "top_k": top_k,
        "base_entropy": round(base_entropy, 3),
        "temp_entropy": round(temp_entropy, 3),
        "final_entropy": round(final_entropy, 3),
        "max_entropy": round(float(np.log2(vocab_size)), 3),
        "candidates": candidates
    }
