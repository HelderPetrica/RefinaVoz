"""
Testes para o Live Voice WebSocket Gateway.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.core.config import settings

client = TestClient(app)


def test_live_websocket_mock_mode(monkeypatch):
    monkeypatch.setattr(settings, "USE_MOCK_LLM", True)
    
    with client.websocket_connect("/api/v1/ws/live") as websocket:
        # Recebe a mensagem inicial de ready
        data = websocket.receive_json()
        assert data["type"] == "ready"
        assert data["mode"] == "mock"
        
        # Envia ping
        websocket.send_text('{"type": "ping"}')
        pong = websocket.receive_json()
        assert pong["type"] == "pong"
        
        # Envia texto
        websocket.send_text('{"type": "text", "text": "teste de fala"}')
        resp = websocket.receive_json()
        assert resp["type"] == "text_chunk"
        assert "teste de fala" in resp["text"]
