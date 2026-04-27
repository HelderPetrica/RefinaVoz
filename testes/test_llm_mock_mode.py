import pytest
from backend.services.llm_client import process_with_llm
from backend.core.config import settings

@pytest.mark.asyncio
async def test_llm_mock_mode_active():
    # Desativa provisoriamente
    original_val = settings.USE_MOCK_LLM
    settings.USE_MOCK_LLM = True
    
    try:
        final_text, metrics = await process_with_llm("ola mock", "<sys>mock</sys>")
        assert "MOCK EXPLÍCITO" in final_text
        assert metrics.provider_model == "mock"
        assert metrics.latency_ms == 100
    finally:
        settings.USE_MOCK_LLM = original_val
