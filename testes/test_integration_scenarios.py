"""
Cenários de Integração do RefinaVoz com TestClient FastAPI.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)
BASE_URL = "/api/v1"


def test_health_check():
    response = client.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "sota"


def test_process_text_simple():
    data = {
        "raw_text": "Texto simples de teste",
        "mode": "normal"
    }
    response = client.post(f"{BASE_URL}/process/texto", data=data)
    assert response.status_code == 200
    res_json = response.json()
    assert "final_text" in res_json
    assert res_json["mode_used"] == "normal"


def test_process_text_with_context():
    data = {
        "raw_text": "Corrija este erro",
        "mode": "programador",
        "extra_text_context": "SyntaxError: invalid syntax"
    }
    response = client.post(f"{BASE_URL}/process/texto", data=data)
    assert response.status_code == 200
    res_json = response.json()
    assert "final_text" in res_json
    assert res_json["mode_used"] == "programador"


def test_process_text_invalid_mode():
    data = {
        "raw_text": "teste",
        "mode": "modo_inexistente"
    }
    response = client.post(f"{BASE_URL}/process/texto", data=data)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["mode_used"] == "modo_inexistente"


def test_process_text_robustness_empty_input():
    data = {
        "raw_text": "",
        "mode": "normal"
    }
    response = client.post(f"{BASE_URL}/process/texto", data=data)
    assert response.status_code in [200, 422]
