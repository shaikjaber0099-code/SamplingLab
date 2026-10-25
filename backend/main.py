"""
FastAPI Backend Application for The Sampling Lab.
Exposes REST endpoints for single runs, temperature sweeps,
probability distribution visualization, metrics computation, and report exports.
"""

import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from backend.providers import get_provider, get_providers_info, PROVIDERS
from backend.core.metrics import compute_metrics_for_group
from backend.core.observations import (
    generate_sweep_observations,
    generate_single_run_observations
)
from backend.core.export import (
    export_markdown_report,
    export_csv_dataset,
    export_json_archive
)

app = FastAPI(
    title="The Sampling Lab API",
    description="Probabilistic text generation parameter explorer backend.",
    version="1.0.0"
)

# CORS configuration for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request schemas
class GenerateRequest(BaseModel):
    prompt: str = Field(..., json_schema_extra={"example": "The future of artificial intelligence is"})
    provider: str = Field(default="local", json_schema_extra={"example": "local"})
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=1.0, ge=0.01, le=1.0)
    top_k: int = Field(default=0, ge=0, le=100)
    max_tokens: int = Field(default=80, ge=10, le=300)
    seed: Optional[int] = Field(default=None)
    n: int = Field(default=3, ge=1, le=5)
    repetition_penalty: float = Field(default=1.15, ge=1.0, le=2.0)
    no_repeat_ngram_size: int = Field(default=3, ge=0, le=6)


class SweepRequest(BaseModel):
    prompt: str = Field(..., json_schema_extra={"example": "The future of artificial intelligence is"})
    provider: str = Field(default="local")
    temperatures: List[float] = Field(default=[0.0, 0.3, 0.7, 1.0, 1.5])
    top_p: float = Field(default=1.0, ge=0.01, le=1.0)
    top_k: int = Field(default=0, ge=0, le=100)
    max_tokens: int = Field(default=80, ge=10, le=300)
    seed: Optional[int] = Field(default=42)
    n: int = Field(default=3, ge=1, le=5)
    repetition_penalty: float = Field(default=1.15, ge=1.0, le=2.0)
    no_repeat_ngram_size: int = Field(default=3, ge=0, le=6)


class DistributionRequest(BaseModel):
    prompt: str = Field(..., json_schema_extra={"example": "The future of artificial intelligence is"})
    provider: str = Field(default="local")
    temperature: float = Field(default=1.0, ge=0.0, le=2.0)
    top_p: float = Field(default=1.0, ge=0.01, le=1.0)
    top_k: int = Field(default=0, ge=0, le=100)
    top_n: int = Field(default=10, ge=5, le=25)


class ExportRequest(BaseModel):
    format: str = Field(default="markdown", json_schema_extra={"example": "markdown"}) # markdown, csv, json
    payload: Dict[str, Any]


def validate_prompt_text(prompt: str) -> str:
    """Validate that prompt text is non-empty and not just whitespace."""
    if not prompt or not prompt.strip():
        raise HTTPException(
            status_code=400,
            detail="Prompt cannot be empty or whitespace-only. Please provide text or select a preset."
        )
    return prompt.strip()


def resolve_provider(provider_id: str):
    """
    Resolve requested provider.
    If an optional cloud provider is requested but its API key is not configured,
    transparently falls back to Local GPT-2 and provides an explicit warning message.
    """
    prov = get_provider(provider_id)
    warning = None
    if provider_id.lower() != "local" and not prov.is_available():
        warning = f"Requested provider '{prov.name}' is unconfigured (missing API key in .env). Fallback to Local GPT-2."
        prov = PROVIDERS["local"]
    return prov, warning


@app.get("/api/health")
def health():
    return {
        "status": "online",
        "service": "The Sampling Lab API",
        "version": "1.0.0"
    }


@app.get("/api/providers")
def list_providers():
    return {
        "providers": get_providers_info()
    }


@app.post("/api/generate")
def generate(req: GenerateRequest):
    """Generate N samples for single temperature setting."""
    clean_prompt = validate_prompt_text(req.prompt)
    provider, warning = resolve_provider(req.provider)

    try:
        samples = provider.generate(
            prompt=clean_prompt,
            temperature=req.temperature,
            top_p=req.top_p,
            top_k=req.top_k,
            max_tokens=req.max_tokens,
            seed=req.seed,
            n=req.n,
            repetition_penalty=req.repetition_penalty,
            no_repeat_ngram_size=req.no_repeat_ngram_size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    # Extract sample texts and token counts for metrics computation
    sample_texts = [s["text"] for s in samples]
    token_counts = [s.get("tokens_count", len(s["text"].split())) for s in samples]
    ppl_list = [s["perplexity"] for s in samples if s.get("perplexity") is not None]
    avg_perplexity = (sum(ppl_list) / len(ppl_list)) if ppl_list else None

    metrics = compute_metrics_for_group(
        sample_texts,
        token_counts=token_counts,
        perplexity=avg_perplexity
    )
    observations = generate_single_run_observations(
        temperature=req.temperature,
        metrics=metrics,
        top_p=req.top_p,
        top_k=req.top_k,
        repetition_penalty=req.repetition_penalty,
        no_repeat_ngram_size=req.no_repeat_ngram_size
    )

    return {
        "prompt": clean_prompt,
        "provider": provider.name,
        "model": provider.model_id,
        "temperature": req.temperature,
        "top_p": req.top_p,
        "top_k": req.top_k,
        "max_tokens": req.max_tokens,
        "repetition_penalty": req.repetition_penalty,
        "no_repeat_ngram_size": req.no_repeat_ngram_size,
        "seed": req.seed,
        "samples": samples,
        "metrics": metrics,
        "observations": observations,
        "warning": warning
    }


@app.post("/api/sweep")
def sweep(req: SweepRequest):
    """Run temperature sweep across multiple temperatures."""
    clean_prompt = validate_prompt_text(req.prompt)
    provider, warning = resolve_provider(req.provider)

    sorted_temperatures = sorted(req.temperatures)
    runs = []
    for temp in sorted_temperatures:
        try:
            samples = provider.generate(
                prompt=clean_prompt,
                temperature=temp,
                top_p=req.top_p,
                top_k=req.top_k,
                max_tokens=req.max_tokens,
                seed=req.seed,
                n=req.n,
                repetition_penalty=req.repetition_penalty,
                no_repeat_ngram_size=req.no_repeat_ngram_size
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Sweep generation failed at T={temp}: {str(e)}")

        sample_texts = [s["text"] for s in samples]
        token_counts = [s.get("tokens_count", len(s["text"].split())) for s in samples]
        ppl_list = [s["perplexity"] for s in samples if s.get("perplexity") is not None]
        avg_ppl = (sum(ppl_list) / len(ppl_list)) if ppl_list else None

        metrics = compute_metrics_for_group(
            sample_texts,
            token_counts=token_counts,
            perplexity=avg_ppl
        )
        runs.append({
            "temperature": temp,
            "samples": samples,
            "metrics": metrics
        })

    observations_result = generate_sweep_observations(runs, prompt=clean_prompt)

    return {
        "prompt": clean_prompt,
        "provider": provider.name,
        "model": provider.model_id,
        "top_p": req.top_p,
        "top_k": req.top_k,
        "max_tokens": req.max_tokens,
        "repetition_penalty": req.repetition_penalty,
        "no_repeat_ngram_size": req.no_repeat_ngram_size,
        "seed": req.seed,
        "runs": runs,
        "observations": observations_result,
        "warning": warning
    }


@app.post("/api/distribution")
def distribution(req: DistributionRequest):
    """Fetch next-token probability distribution for prompt."""
    clean_prompt = validate_prompt_text(req.prompt)
    provider, warning = resolve_provider(req.provider)
    
    # Check if provider supports logits; if not, use local provider for distribution
    if not provider.supported_parameters().get("logits", False):
        local_prov = PROVIDERS["local"]
        data = local_prov.get_distribution(
            prompt=clean_prompt,
            temperature=req.temperature,
            top_p=req.top_p,
            top_k=req.top_k,
            top_n=req.top_n
        )
        data["note"] = f"Distribution computed using Local GPT-2 (provider '{provider.name}' does not expose logits)."
        return data

    data = provider.get_distribution(
        prompt=clean_prompt,
        temperature=req.temperature,
        top_p=req.top_p,
        top_k=req.top_k,
        top_n=req.top_n
    )
    return data


@app.post("/api/export")
def export_report(req: ExportRequest):
    """Export lab results in Markdown, CSV, or JSON format."""
    fmt = req.format.lower()
    payload = req.payload

    if fmt == "markdown" or fmt == "md":
        content = export_markdown_report(payload)
        media_type = "text/markdown; charset=utf-8"
        filename = f"sampling_lab_report_{int(req.payload.get('seed', 42) or 0)}.md"
    elif fmt == "csv":
        content = export_csv_dataset(payload)
        media_type = "text/csv; charset=utf-8"
        filename = "sampling_lab_samples.csv"
    elif fmt == "json":
        content = export_json_archive(payload)
        media_type = "application/json; charset=utf-8"
        filename = "sampling_lab_run.json"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{fmt}'. Choose markdown, csv, or json.")

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# Serve static React frontend in unified deployment mode if built
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Do not intercept API endpoints
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
