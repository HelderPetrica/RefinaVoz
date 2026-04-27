import pytest
import os
from unittest.mock import patch, MagicMock
from httpx import Response, HTTPStatusError, Request

from backend.services.llm_client import process_with_llm

# Usaremos pytest-asyncio para avaliar a execução assíncrona
@pytest.mark.asyncio
@patch("backend.services.llm_client.settings.USE_MOCK_LLM", False)
@patch("backend.services.llm_client.settings.GEMINI_API_KEYS_RAW", "KEY_UM,KEY_DOIS")
@patch("backend.services.llm_client._post_gemini")
async def test_llm_key_rotation_fallback(mock_post_gemini):
    """
    Testa se o client captura o erro 429 Quota Exhausted da chave 1
    e automaticamente envia para a chave 2 com sucesso.
    """
    # Configuramos os retornos simulados
    
    # Simulamos o retorno HTTPx: a primeira falha (429), a segunda passa (200)
    
    # Mock do Request obrigatório pelo httpx
    mock_req = Request("POST", "https://generativelanguage.googleapis.com/")
    
    # Primeira chamada: 429
    resp_429 = Response(429, request=mock_req)
    
    # Segunda chamada: 200 (Sucesso)
    resp_200 = Response(200, request=mock_req, json={
        "candidates": [{"content": {"parts": [{"text": "Processamento concluído com a Key 2."}]}}],
        "usageMetadata": {"promptTokenCount": 50, "candidatesTokenCount": 100}
    })
    
    # Instruímos o MagicMock a iterar sobre esses retornos
    mock_post_gemini.side_effect = [resp_429, resp_200]
    
    raw_text = "exemplo do áudio"
    sys_inst = "<system>teste</system>"
    
    final_text, metrics = await process_with_llm(raw_text, sys_inst)
    
    assert final_text == "Processamento concluído com a Key 2."
    assert metrics.fallback_used is False # Fallback de MODELO não ocorreu, apenas de CHAVE
    assert metrics.prompt_tokens == 50
    assert metrics.completion_tokens == 100
    
    # Confirma que fomos chamados 2 vezes
    assert mock_post_gemini.call_count == 2
