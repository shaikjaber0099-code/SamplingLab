"""
Provider registry for The Sampling Lab.
Manages local and remote model engines.
"""

from typing import Dict, Any, List
from backend.providers.base import BaseProvider
from backend.providers.local_hf import LocalHFProvider
from backend.providers.groq_provider import GroqProvider
from backend.providers.gemini_provider import GeminiProvider

# Shared singleton instances to reuse cached models
_LOCAL_PROVIDER = LocalHFProvider(model_id="distilgpt2")
_GROQ_PROVIDER = GroqProvider()
_GEMINI_PROVIDER = GeminiProvider()

PROVIDERS = {
    "local": _LOCAL_PROVIDER,
    "groq": _GROQ_PROVIDER,
    "gemini": _GEMINI_PROVIDER,
}


def get_provider(provider_id: str) -> BaseProvider:
    """Retrieve provider instance by ID. Defaults to local if unknown."""
    prov = PROVIDERS.get(provider_id.lower())
    if prov is None:
        return _LOCAL_PROVIDER
    return prov


def get_providers_info() -> List[Dict[str, Any]]:
    """Return status and capabilities of all registered providers."""
    info = []
    for key, prov in PROVIDERS.items():
        info.append({
            "id": key,
            "name": prov.name,
            "model_id": prov.model_id,
            "is_available": prov.is_available(),
            "supported_parameters": prov.supported_parameters()
        })
    return info
