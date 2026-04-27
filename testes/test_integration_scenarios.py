import httpx
import pytest
import time
import subprocess
import os

BASE_URL = "http://localhost:14201/api/v1"

def test_health_check():
    # Apenas para ver se o servidor responde
    try:
        response = httpx.get(f"http://localhost:14201/docs")
        assert response.status_code == 200
    except Exception as e:
        pytest.fail(f"Servidor não responde na porta 14201: {e}")

@pytest.mark.asyncio
async def test_process_text_simple():
    payload = {
        "raw_text": "Texto simples de teste",
        "mode": "normal"
    }
    async with httpx.AsyncClient() as client:
        # Usando a porta correta 14201
        files = {
            "raw_text": (None, "Texto simples de teste"),
            "mode": (None, "normal")
        }
        response = await client.post(f"{BASE_URL}/process/texto", data=files)
        assert response.status_code == 200
        data = response.json()
        assert "final_text" in data
        assert data["mode_used"] == "normal"

@pytest.mark.asyncio
async def test_process_text_with_context():
    files = {
        "raw_text": (None, "Corrija este erro"),
        "mode": (None, "programador"),
        "extra_text_context": (None, "SyntaxError: invalid syntax")
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/process/texto", data=files)
        assert response.status_code == 200
        data = response.json()
        assert "final_text" in data
        # Verificar se o mock reportou o modo programador (se estiver em mock) ou se o LLM respondeu
        assert data["mode_used"] == "programador"

@pytest.mark.asyncio
async def test_process_text_invalid_mode():
    files = {
        "raw_text": (None, "teste"),
        "mode": (None, "modo_inexistente")
    }
    async with httpx.AsyncClient() as client:
        # O backend atual usa fallback seguro ('normal') se o modo não existe
        response = await client.post(f"{BASE_URL}/process/texto", data=files)
        # Validamos que ele NÃO quebra e retorna 200 OK via fallback
        assert response.status_code == 200
        data = response.json()
        # O roteador retorna o modo solicitado originalmente, mesmo que o engine use fallback
        assert data["mode_used"] == "modo_inexistente"

@pytest.mark.asyncio
async def test_process_text_robustness_empty_input():
    files = {
        "raw_text": (None, ""),
        "mode": (None, "normal")
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/process/texto", data=files)
        # O Pydantic deveria barrar se for obrigatório, ou o LLM receber vazio
        assert response.status_code in [200, 422]
