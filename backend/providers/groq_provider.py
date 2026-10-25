"""
Groq API Provider for The Sampling Lab.
Uses Groq SDK (Llama 3.1 / 3.3 models) for ultra-fast, high quality cloud generation.
"""

import os
import time
from typing import List, Dict, Any, Optional
from backend.providers.base import BaseProvider


class GroqProvider(BaseProvider):
    """Groq API provider."""

    def __init__(self, model_id: str = "qwen/qwen3.8-27b"):
        super().__init__(name="Groq Cloud (Qwen 3.8 / Llama)", model_id=model_id)

    @property
    def api_key(self) -> str:
        return os.getenv("GROQ_API_KEY", "").strip()

    def is_available(self) -> bool:
        return bool(self.api_key)

    def supported_parameters(self) -> Dict[str, bool]:
        return {
            "temperature": True,
            "top_p": True,
            "top_k": False,  # Groq API doesn't expose top_k
            "seed": True,
            "max_tokens": True,
            "logits": False, # Closed API doesn't expose raw vocab logits
            "perplexity": False,
            "token_confidence": False
        }

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
        no_repeat_ngram_size: int = 3,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Call Groq API to generate N samples."""
        if not self.is_available():
            raise ValueError("GROQ_API_KEY is not set in environment or .env file.")

        from groq import Groq, NotFoundError
        client = Groq(api_key=self.api_key)

        # Groq temperature range typically [0.0, 2.0]. T=0.0 maps to min (1e-4) or 0
        clamped_temp = max(0.0, min(2.0, float(temperature)))
        clamped_top_p = max(0.01, min(1.0, float(top_p)))

        # Determine working model
        target_model = self.model_id
        results = []
        for idx in range(n):
            start = time.time()
            effective_seed = seed if seed is not None else None

            params = {
                "model": target_model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": clamped_temp,
                "top_p": clamped_top_p,
            }
            if effective_seed is not None:
                params["seed"] = effective_seed if temperature <= 1e-5 else (effective_seed + idx * 7)

            try:
                response = client.chat.completions.create(**params)
            except NotFoundError:
                # Fallback to qwen/qwen3.8-27b if the configured model is unavailable
                target_model = "qwen/qwen3.8-27b"
                params["model"] = target_model
                response = client.chat.completions.create(**params)

            text = response.choices[0].message.content or ""
            elapsed = round((time.time() - start) * 1000, 1)

            results.append({
                "sample_index": idx + 1,
                "prompt": prompt,
                "text": text,
                "full_text": prompt + (" " if not prompt.endswith(" ") and not text.startswith(" ") else "") + text,
                "tokens_count": len(text.split()),
                "tokens_with_probs": None,
                "perplexity": None,
                "generation_time_ms": elapsed
            })

        return results
