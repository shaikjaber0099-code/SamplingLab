"""
Base provider abstraction for text generation in The Sampling Lab.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseProvider(ABC):
    """Abstract base class for all text generation providers."""

    def __init__(self, name: str, model_id: str):
        self.name = name
        self.model_id = model_id

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if model/API is configured and available."""
        pass

    @abstractmethod
    def supported_parameters(self) -> Dict[str, bool]:
        """Dictionary of supported features: temperature, top_p, top_k, seed, logits."""
        pass

    @abstractmethod
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
        Generate N sample completions given prompt and parameters.
        Returns a list of dictionaries with structure:
        {
            "sample_index": int,
            "text": str,
            "tokens_count": int,
            "tokens_with_probs": Optional[List[Dict[str, Any]]], # for token confidence visualization
            "perplexity": Optional[float],
            "generation_time_ms": float
        }
        """
        pass

    def get_distribution(
        self,
        prompt: str,
        temperature: float = 1.0,
        top_p: float = 1.0,
        top_k: int = 0,
        top_n: int = 10
    ) -> Dict[str, Any]:
        """
        Get next-token logits and probability distribution for visualization.
        Default implementation returns empty if provider doesn't expose logits.
        """
        return {
            "supported": False,
            "message": f"Next-token distribution visualizer requires Local Mode (GPT-2/DistilGPT-2)."
        }
