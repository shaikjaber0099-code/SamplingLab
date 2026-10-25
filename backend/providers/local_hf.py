"""
Local Hugging Face Provider for The Sampling Lab.
Uses distilgpt2 (or gpt2) via PyTorch and Transformers.
Exposes logits, token confidence, entropy, and perplexity.
"""

import time
import math
import torch
import numpy as np
from typing import List, Dict, Any, Optional
from transformers import AutoModelForCausalLM, AutoTokenizer
from backend.providers.base import BaseProvider
from backend.core.sampling import (
    compute_distribution_step,
    apply_temperature,
    apply_top_k,
    apply_top_p,
    apply_repetition_penalty,
    apply_no_repeat_ngram,
    softmax
)


class LocalHFProvider(BaseProvider):
    """Local causal LM provider with logit extraction and token probability tracking."""

    def __init__(self, model_id: str = "distilgpt2"):
        super().__init__(name="Local GPT-2", model_id=model_id)
        self._model = None
        self._tokenizer = None
        self._is_loading = False
        self._load_error = None
        self._vocab_cache = None

    def is_available(self) -> bool:
        return True

    def supported_parameters(self) -> Dict[str, bool]:
        return {
            "temperature": True,
            "top_p": True,
            "top_k": True,
            "seed": True,
            "max_tokens": True,
            "repetition_penalty": True,
            "no_repeat_ngram_size": True,
            "logits": True,
            "perplexity": True,
            "token_confidence": True
        }

    def _ensure_model_loaded(self):
        """Lazy load model and tokenizer into memory once."""
        if self._model is not None and self._tokenizer is not None:
            return

        if self._is_loading:
            while self._is_loading:
                time.sleep(0.1)
            return

        try:
            self._is_loading = True
            print(f"[LocalHFProvider] Loading model '{self.model_id}'...")
            self._tokenizer = AutoTokenizer.from_pretrained(self.model_id)
            if self._tokenizer.pad_token is None:
                self._tokenizer.pad_token = self._tokenizer.eos_token
                
            self._model = AutoModelForCausalLM.from_pretrained(self.model_id)
            self._model.eval()
            print(f"[LocalHFProvider] Loaded '{self.model_id}' successfully.")
            self._is_loading = False
        except Exception as e:
            self._is_loading = False
            self._load_error = str(e)
            print(f"[LocalHFProvider] Error loading model: {e}")
            raise RuntimeError(f"Failed to load local model '{self.model_id}': {e}")

    def _get_vocab_labels(self) -> List[str]:
        """Cache decoded string representation for each token id in vocabulary."""
        if self._vocab_cache is not None:
            return self._vocab_cache
            
        vocab_size = self._tokenizer.vocab_size
        labels = []
        for i in range(vocab_size):
            try:
                # Decode single token ID
                token_text = self._tokenizer.decode([i])
                labels.append(token_text)
            except Exception:
                labels.append(f"<{i}>")
        self._vocab_cache = labels
        return self._vocab_cache

    def get_distribution(
        self,
        prompt: str,
        temperature: float = 1.0,
        top_p: float = 1.0,
        top_k: int = 0,
        top_n: int = 10
    ) -> Dict[str, Any]:
        """
        Calculates raw logits and full probability distribution for the next token.
        Returns top-N candidate tokens with live probability, entropy, and filtering tags.
        """
        self._ensure_model_loaded()
        if not prompt or not prompt.strip():
            prompt = "The future of artificial intelligence is"

        inputs = self._tokenizer(prompt, return_tensors="pt")
        input_ids = inputs["input_ids"]

        with torch.no_grad():
            outputs = self._model(input_ids)
            # Logits for next token (last position)
            next_logits = outputs.logits[0, -1, :].cpu().numpy()

        labels = self._get_vocab_labels()
        step_data = compute_distribution_step(
            logits=next_logits,
            token_labels=labels,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
            top_n_display=top_n
        )
        step_data["supported"] = True
        step_data["prompt"] = prompt
        step_data["model"] = self.model_id
        return step_data

    def generate(
        self,
        prompt: str,
        temperature: float = 0.7,
        top_p: float = 1.0,
        top_k: int = 0,
        max_tokens: int = 80,
        seed: Optional[int] = None,
        n: int = 3,
        repetition_penalty: float = 1.15,
        no_repeat_ngram_size: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Generate N samples using autoregressive token sampling with tracked probabilities
        and configurable repetition controls (repetition_penalty and no_repeat_ngram_size).
        """
        self._ensure_model_loaded()
        
        if not prompt or not prompt.strip():
            prompt = "The future of artificial intelligence is"

        inputs = self._tokenizer(prompt, return_tensors="pt")
        base_input_ids = inputs["input_ids"]

        results = []

        for sample_idx in range(n):
            start_time = time.time()
            
            # Seed handling:
            # If seed is given, for T=0 we want all runs to be identical.
            # For T > 0, each sample in N gets a deterministic offset if seed is provided.
            if seed is not None:
                effective_seed = seed if temperature <= 1e-5 else (seed + sample_idx * 1000)
                torch.manual_seed(effective_seed)
                np.random.seed(effective_seed)

            curr_input_ids = base_input_ids.clone()
            tokens_with_probs = []
            log_likelihoods = []

            is_greedy = (temperature <= 1e-5)

            for step in range(max_tokens):
                with torch.no_grad():
                    outputs = self._model(curr_input_ids)
                    next_logits = outputs.logits[0, -1, :].cpu().numpy()

                # Apply repetition penalty and n-gram blocking to raw logits
                token_history = curr_input_ids[0].tolist()
                next_logits = apply_repetition_penalty(next_logits, token_history, repetition_penalty)
                next_logits = apply_no_repeat_ngram(next_logits, token_history, no_repeat_ngram_size)

                if is_greedy:
                    next_token_id = int(np.argmax(next_logits))
                    # Probability of top token under T=1 base
                    base_p = float(softmax(next_logits)[next_token_id])
                    prob_selected = 1.0
                    log_likelihoods.append(math.log(max(1e-12, base_p)))
                else:
                    scaled_logits = apply_temperature(next_logits, temperature)
                    scaled_probs = softmax(scaled_logits)
                    
                    filtered_k_probs, _ = apply_top_k(scaled_probs, top_k)
                    final_probs, _ = apply_top_p(filtered_k_probs, top_p)
                    
                    # Renormalize
                    p_sum = np.sum(final_probs)
                    if p_sum > 0:
                        final_probs = final_probs / p_sum
                    else:
                        final_probs[np.argmax(next_logits)] = 1.0

                    next_token_id = int(np.random.choice(len(final_probs), p=final_probs))
                    prob_selected = float(final_probs[next_token_id])
                    
                    # Base unscaled prob for perplexity calculation
                    base_p = float(softmax(next_logits)[next_token_id])
                    log_likelihoods.append(math.log(max(1e-12, base_p)))

                # Check EOS token immediately before appending
                if next_token_id == self._tokenizer.eos_token_id:
                    break

                token_text = self._tokenizer.decode([next_token_id], skip_special_tokens=True)
                tokens_with_probs.append({
                    "token_id": next_token_id,
                    "token": token_text,
                    "prob": round(prob_selected, 4),
                    # High confidence > 0.4, Medium > 0.1, Low <= 0.1
                    "confidence_tier": "high" if prob_selected >= 0.35 else ("medium" if prob_selected >= 0.1 else "low")
                })

                # Append token to sequence
                new_token_tensor = torch.tensor([[next_token_id]], dtype=torch.long)
                curr_input_ids = torch.cat([curr_input_ids, new_token_tensor], dim=1)

            # Decode full generated text without special tokens (e.g. <|endoftext|>)
            generated_tokens = curr_input_ids[0][base_input_ids.shape[1]:]
            full_generated = self._tokenizer.decode(generated_tokens, skip_special_tokens=True)
            
            # Clean up trailing excessive newlines if any
            while full_generated.endswith("\n\n\n"):
                full_generated = full_generated[:-1]
                
            gen_time = round((time.time() - start_time) * 1000, 1)

            # Compute perplexity over generated tokens
            if log_likelihoods:
                avg_neg_ll = -np.mean(log_likelihoods)
                ppl = float(np.exp(avg_neg_ll))
            else:
                ppl = 1.0

            results.append({
                "sample_index": sample_idx + 1,
                "prompt": prompt,
                "text": full_generated,
                "full_text": prompt + (" " if not prompt.endswith(" ") and not full_generated.startswith(" ") else "") + full_generated,
                "tokens_count": len(tokens_with_probs),
                "tokens_with_probs": tokens_with_probs,
                "perplexity": round(min(ppl, 9999.0), 2),
                "generation_time_ms": gen_time
            })

        return results
