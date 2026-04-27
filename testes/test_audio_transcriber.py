from types import SimpleNamespace

import pytest

from backend.core.config import settings
from backend.services import audio_transcriber


class FakeAsyncModels:
    def __init__(self, capture: dict):
        self.capture = capture

    async def generate_content(self, **kwargs):
        self.capture.update(kwargs)
        return SimpleNamespace(text=" transcrição limpa ")


class FakeAsyncClient:
    def __init__(self, capture: dict):
        self.models = FakeAsyncModels(capture)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return False


def test_audio_mime_normalization_accepts_wav_alias():
    assert audio_transcriber._normalize_audio_mime_type("audio/x-wav; charset=binary") == "audio/wav"


@pytest.mark.asyncio
async def test_transcribe_audio_uses_google_genai_sdk(monkeypatch):
    capture: dict = {}

    class FakeClient:
        def __init__(self, api_key: str):
            capture["api_key"] = api_key

        @property
        def aio(self):
            return FakeAsyncClient(capture)

    monkeypatch.setattr(audio_transcriber, "_pick_api_key", lambda: "TEST_KEY")
    monkeypatch.setattr(audio_transcriber.genai, "Client", FakeClient)
    monkeypatch.setattr(settings, "AUDIO_MODEL", "gemini-3-flash-preview")

    transcript = await audio_transcriber.transcribe_audio_with_gemini(b"RIFF....WAVE", "audio/wav")

    assert transcript == "transcrição limpa"
    assert capture["api_key"] == "TEST_KEY"
    assert capture["model"] == "gemini-3-flash-preview"
    assert len(capture["contents"]) == 2


@pytest.mark.asyncio
async def test_transcribe_audio_rejects_webm_before_external_call():
    with pytest.raises(ValueError, match="Formato de áudio não suportado"):
        await audio_transcriber.transcribe_audio_with_gemini(b"webm bytes", "audio/webm")