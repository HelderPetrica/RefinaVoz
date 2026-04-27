import pytest

from backend.core.config import settings
from backend.services import llm_client


class FakeGeminiResponse:
    status_code = 200

    def raise_for_status(self):
        return None

    def json(self):
        return {
            "candidates": [
                {
                    "content": {"parts": [{"text": "resposta com imagem"}]},
                    "finishReason": "STOP",
                }
            ],
            "usageMetadata": {
                "promptTokenCount": 12,
                "candidatesTokenCount": 4,
            },
        }


@pytest.mark.asyncio
async def test_process_with_llm_includes_visual_context_image(monkeypatch):
    original_mock_mode = settings.USE_MOCK_LLM
    captured_payload = {}

    async def fake_post_gemini(model, key, payload):
        captured_payload["payload"] = payload
        return FakeGeminiResponse()

    monkeypatch.setattr(settings, "USE_MOCK_LLM", False)
    monkeypatch.setattr(llm_client, "_pick_api_key", lambda: "TEST_KEY")
    monkeypatch.setattr(llm_client, "_post_gemini", fake_post_gemini)

    try:
        final_text, metrics = await llm_client.process_with_llm(
            "analise isso",
            "<system_instruction>use o quadro</system_instruction>",
            image_bytes=b"hello",
            image_mime_type="image/png",
        )
    finally:
        settings.USE_MOCK_LLM = original_mock_mode

    parts = captured_payload["payload"]["contents"][0]["parts"]
    assert final_text == "resposta com imagem"
    assert metrics.provider_model == settings.MODEL_DEFAULT
    assert parts[0] == {"text": "analise isso"}
    assert parts[1] == {
        "inline_data": {
            "mime_type": "image/png",
            "data": "aGVsbG8=",
        }
    }
