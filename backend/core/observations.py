"""
Observation engine for The Sampling Lab.
Generates data-grounded observations and scientific conclusions based on
empirical metrics across temperature sweeps or single-parameter experiments.
"""

from typing import List, Dict, Any


def generate_sweep_observations(sweep_data: List[Dict[str, Any]], prompt: str) -> Dict[str, Any]:
    """
    Generate structured, rule-based observations grounded in real metrics.
    
    sweep_data is a list of dictionaries with structure:
    {
        "temperature": float,
        "metrics": {
            "distinct_1": float,
            "distinct_2": float,
            "self_similarity": float,
            "repetition_rate": float,
            "avg_words": float,
            "unique_samples": int,
            "total_samples": int,
            "is_deterministic": bool,
            "perplexity": float (optional)
        },
        "samples": List[str]
    }
    """
    observations = []
    
    if not sweep_data:
        return {
            "bullet_points": ["No experimental data recorded yet."],
            "conclusion_template": "Run an experiment to generate findings."
        }

    # Sort by temperature ascending
    sorted_sweep = sorted(sweep_data, key=lambda x: x["temperature"])
    t_min = sorted_sweep[0]
    t_max = sorted_sweep[-1]

    # 1. Determinism check at T=0.0 (or lowest T)
    for entry in sorted_sweep:
        t = entry["temperature"]
        m = entry.get("metrics", {})
        total = m.get("total_samples", len(entry.get("samples", [])))
        unique = m.get("unique_samples", 1)
        sim_val = m.get("self_similarity")
        sim_str = f"{sim_val:.3f}" if sim_val is not None else "N/A"
        if t <= 0.05:
            if unique == 1 and total > 1:
                observations.append(
                    f"Deterministic Argmax at T={t:.1f}: All {total} samples were 100% identical "
                    f"(Self-Similarity: 1.000). At zero temperature, softmax collapses into a greedy argmax, "
                    f"selecting the highest logit token with probability 1.0."
                )
            else:
                observations.append(
                    f"Low Randomness at T={t:.1f}: {unique} distinct output(s) out of {total} samples "
                    f"(Self-Similarity: {sim_str})."
                )
            break

    # 2. Distinct-2 (Lexical Diversity) progression
    d2_first = t_min.get("metrics", {}).get("distinct_2")
    d2_last = t_max.get("metrics", {}).get("distinct_2")
    if len(sorted_sweep) >= 2 and d2_first is not None and d2_last is not None and d2_last > d2_first:
        diff_pct = round(((d2_last - d2_first) / max(0.01, d2_first)) * 100, 1)
        observations.append(
            f"Diversity Surge: Bigram diversity (Distinct-2) rose from {d2_first:.3f} at T={t_min['temperature']:.1f} "
            f"to {d2_last:.3f} at T={t_max['temperature']:.1f} (+{diff_pct}% change). "
            f"Flatter probability distributions at higher heat unlock tail vocabulary tokens."
        )

    # 3. Pairwise Self-Similarity Decay
    sim_first = t_min.get("metrics", {}).get("self_similarity")
    sim_last = t_max.get("metrics", {}).get("self_similarity")
    sim_first_str = f"{sim_first:.3f}" if sim_first is not None else "N/A"
    sim_last_str = f"{sim_last:.3f}" if sim_last is not None else "N/A"
    if len(sorted_sweep) >= 2 and sim_first is not None and sim_last is not None:
        observations.append(
            f"Sample Divergence: Pairwise self-similarity decayed from {sim_first_str} (T={t_min['temperature']:.1f}) "
            f"down to {sim_last_str} (T={t_max['temperature']:.1f}). Lower similarity confirms divergent sampling paths "
            f"as the model traverses distinct branches in the token probability tree."
        )

    # 4. Repetition rate check
    rep_rates = [
        (e["temperature"], e.get("metrics", {}).get("repetition_rate"))
        for e in sorted_sweep
        if e.get("metrics", {}).get("repetition_rate") is not None
    ]
    if rep_rates:
        highest_rep = max(rep_rates, key=lambda x: x[1])
        if highest_rep[1] > 0.15:
            observations.append(
                f"Repetition Dynamics: Maximum phrase repetition ({highest_rep[1] * 100:.1f}%) occurred at T={highest_rep[0]:.1f}. "
                f"Low-temperature decoding frequently risks degenerate loops when confident tokens feed back into context."
            )

    # 5. High Temperature Coherence / Perplexity note
    high_t_entries = [e for e in sorted_sweep if e["temperature"] >= 1.4]
    if high_t_entries:
        entry = high_t_entries[-1]
        t_val = entry["temperature"]
        d1 = entry.get("metrics", {}).get("distinct_1")
        d1_str = f"{d1:.3f}" if d1 is not None else "N/A"
        observations.append(
            f"Thermal Hallucination / Chaos Zone: At T={t_val:.1f}, vocabulary entropy peaks with Distinct-1 of {d1_str}. "
            f"Unlikely tokens have non-trivial odds of selection, creating creative but potentially ungrammatical continuations."
        )

    # 6. Sweet-spot balanced observation
    balanced_entries = [e for e in sorted_sweep if 0.6 <= e["temperature"] <= 0.9]
    if balanced_entries:
        b_entry = balanced_entries[0]
        b_d2 = b_entry.get("metrics", {}).get("distinct_2")
        b_d2_str = f"{b_d2:.3f}" if b_d2 is not None else "N/A"
        observations.append(
            f"Optimal Balance Window: T={b_entry['temperature']:.1f} exhibited balanced generation—sufficient variety "
            f"(Distinct-2: {b_d2_str}) while avoiding chaotic degeneration."
        )

    # Fill-in Conclusion Template
    d2_first_str = f"{d2_first:.2f}" if d2_first is not None else "N/A"
    d2_last_str = f"{d2_last:.2f}" if d2_last is not None else "N/A"
    conclusion_template = (
        f"LAB EXPERIMENT REPORT CONCLUSION:\n"
        f"Prompt evaluated: \"{prompt[:60]}...\"\n\n"
        f"1. Temperature Scaling Effect: Increasing temperature from {t_min['temperature']:.1f} to {t_max['temperature']:.1f} "
        f"transformed the model output from deterministic greedy generation (Similarity: {sim_first_str}) to stochastic exploration (Similarity: {sim_last_str}).\n"
        f"2. Lexical Breadth: Distinct bigrams expanded from {d2_first_str} to {d2_last_str}.\n"
        f"3. Practical Recommendation: For factual reasoning and code generation, maintain T <= 0.3. "
        f"For conversational assistant tasks, maintain T ~ 0.7. For creative brainstorming, use T between 1.0 and 1.2 with top-p ~ 0.9."
    )

    return {
        "bullet_points": observations,
        "conclusion_template": conclusion_template
    }


def generate_single_run_observations(
    temperature: float,
    metrics: Dict[str, Any],
    top_p: float = 1.0,
    top_k: int = 0,
    repetition_penalty: float = 1.0,
    no_repeat_ngram_size: int = 0
) -> List[str]:
    """Generate notes for a single temperature run with N samples."""
    notes = []
    samples_count = metrics.get("total_samples", 1)
    unique_count = metrics.get("unique_samples", 1)
    sim = metrics.get("self_similarity")
    sim_str = f"{sim:.3f}" if sim is not None else "N/A"
    d2 = metrics.get("distinct_2")
    d2_str = f"{d2:.3f}" if d2 is not None else "N/A"

    if temperature <= 0.05:
        notes.append(f"T={temperature:.1f} is Frozen (Deterministic). With greedy selection, {unique_count} unique sequence was produced across {samples_count} trials.")
    elif temperature < 0.5:
        notes.append(f"T={temperature:.1f} is Focused. Samples show minor variation with high coherence and self-similarity ({sim_str}).")
    elif temperature <= 1.0:
        notes.append(f"T={temperature:.1f} is Balanced. Natural linguistic cadence with Distinct-2 diversity of {d2_str}.")
    else:
        notes.append(f"T={temperature:.1f} is High Heat / Chaotic. Probability distribution is flattened, enabling low-probability token sampling.")

    if top_p < 1.0:
        notes.append(f"Top-p ({top_p}) Nucleus Filtering: Active. The dynamic token pool trims the low-probability tail, preserving grammar at higher temperatures.")
    if top_k > 0:
        notes.append(f"Top-k ({top_k}) Candidate Limit: Active. Only the {top_k} most probable candidates are permitted per generation step.")
    if repetition_penalty > 1.0:
        notes.append(f"Repetition Penalty ({repetition_penalty:.2f}x): Active. Logits for already generated tokens are scaled down to suppress phrase echoes and degenerate loops.")
    if no_repeat_ngram_size > 0:
        notes.append(f"No-Repeat N-Gram ({no_repeat_ngram_size}-gram): Active. Strictly prevents identical {no_repeat_ngram_size}-word phrases from repeating.")

    return notes
