"""
Smoke test SOTA — Garante endpoints essenciais do RefinaVoz após qualquer mudança.

Roda com USE_MOCK_LLM=true para evitar chamada externa.
"""

import os
os.environ.setdefault("USE_MOCK_LLM", "true")

from fastapi.testclient import TestClient
from backend.main import app
from backend.api import router as api_router
from backend.core.config import settings

client = TestClient(app)
PREFIX = "/api/v1"


def test_health_ok():
    r = client.get(f"{PREFIX}/health")
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "sota"
    assert "fastapi" in body.get("components", [])


def test_diagnostics_exposes_environment():
    r = client.get(f"{PREFIX}/diagnostics")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "model_default" in body
    assert "audio_optimization" in body
    assert isinstance(body["modes_loaded"], dict)
    assert len(body["modes_loaded"]) >= 1
    assert isinstance(body["hooks"], dict)


def test_prompts_listing_has_modes():
    r = client.get(f"{PREFIX}/prompts")
    assert r.status_code == 200
    modes = r.json().get("modes", {})
    assert isinstance(modes, dict)
    assert len(modes) >= 1


def test_dictionary_round_trip():
    r = client.get(f"{PREFIX}/dictionary")
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


def test_process_texto_mock_pipeline():
    """USE_MOCK_LLM=true deve devolver texto sem bater na API externa."""
    r = client.post(
        f"{PREFIX}/process/texto",
        data={"raw_text": "ola mundo", "mode": "normal"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "final_text" in body
    assert isinstance(body["final_text"], str)
    assert body["final_text"].strip() != ""


def test_audio_endpoint_returns_optional_metadata(monkeypatch):
    original_enabled = settings.AUDIO_OPTIMIZATION_ENABLED
    original_mode = settings.AUDIO_OPTIMIZATION_MODE

    async def fake_transcribe_audio(audio_bytes: bytes, mime_type: str | None = None) -> str:
        return "transcricao valida para teste"

    monkeypatch.setattr(api_router, "transcribe_audio_with_gemini", fake_transcribe_audio)
    settings.AUDIO_OPTIMIZATION_ENABLED = True
    settings.AUDIO_OPTIMIZATION_MODE = "metadata_only"

    try:
        r = client.post(
            f"{PREFIX}/process/audio",
            data={"mode": "normal"},
            files={"audio_file": ("audio.wav", b"RIFF....WAVE", "audio/wav")},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["audio_optimization"]["mode"] == "metadata_only"
        assert body["audio_optimization"]["audio_changed"] is False
        assert body["audio_optimization"]["decision"] == "observe"
    finally:
        settings.AUDIO_OPTIMIZATION_ENABLED = original_enabled
        settings.AUDIO_OPTIMIZATION_MODE = original_mode
