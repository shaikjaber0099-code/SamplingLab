"""
Gemini API Provider for The Sampling Lab.
Uses Google Generative AI / google-genai SDK for cloud generation.
"""

import os
import time
from typing import List, Dict, Any, Optional
from backend.providers.base import BaseProvider


class GeminiProvider(BaseProvider):
    """Google Gemini API provider."""

    def __init__(self, model_id: str = "gemini-3.1-flash-lite"):
        super().__init__(name="Google Gemini (3.1 Flash-Lite)", model_id=model_id)

    @property
    def api_key(self) -> str:
        return os.getenv("GEMINI_API_KEY", "").strip() or os.getenv("GOOGLE_API_KEY", "").strip()

    def is_available(self) -> bool:
        return bool(self.api_key)

    def supported_parameters(self) -> Dict[str, bool]:
        return {
            "temperature": True,
            "top_p": True,
            "top_k": True,   # Gemini supports top_k
            "seed": True,   # Supported in current GenAI config
            "max_tokens": True,
            "logits": False,
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
        """Call Gemini API via google.genai to generate N samples."""
        if not self.is_available():
            raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY is not set in environment or .env file.")

        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)

        clamped_temp = max(0.0, min(2.0, float(temperature)))
        clamped_top_p = max(0.01, min(1.0, float(top_p)))

        config_args = {
            "temperature": clamped_temp,
            "top_p": clamped_top_p,
            "max_output_tokens": max_tokens,
        }
        if top_k > 0:
            config_args["top_k"] = top_k

        results = []
        for idx in range(n):
            start = time.time()
            current_config_args = dict(config_args)
            if seed is not None:
                # Vary seed per sample if temperature > 0 for diverse runs
                current_config_args["seed"] = seed if temperature <= 1e-5 else (seed + idx * 7)

            config = types.GenerateContentConfig(**current_config_args)

            try:
                response = client.models.generate_content(
                    model=self.model_id,
                    contents=prompt,
                    config=config
                )
                text = response.text if hasattr(response, "text") and response.text else ""
            except Exception as e:
                # If specific model fails, attempt gemini-3.1-flash-lite as fallback
                if self.model_id != "gemini-3.1-flash-lite":
                    try:
                        response = client.models.generate_content(
                            model="gemini-3.1-flash-lite",
                            contents=prompt,
                            config=config
                        )
                        text = response.text if hasattr(response, "text") and response.text else ""
                    except Exception as inner_e:
                        text = f"[API Response Error: {inner_e}]"
                else:
                    text = f"[API Response Error: {e}]"

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
