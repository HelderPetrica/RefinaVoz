"""
Smoke Tests SOTA (End-to-End) usando TestClient para as rotas do FastAPI.
Testa: Health, Get/Post/Delete do Dictionary.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check_sota():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "sota"
    assert "fastapi" in data["components"]

def test_dictionary_crud():
    # 1. Obter dicionário atual
    response = client.get("/api/v1/dictionary")
    assert response.status_code == 200
    
    # 2. Adicionar termo
    test_scope = "programacao"
    test_wrong = "smoketest_wrong"
    test_right = "SmokeTest Right"
    
    response = client.post(
        "/api/v1/dictionary", 
        data={"scope": test_scope, "wrong": test_wrong, "right": test_right}
    )
    assert response.status_code == 200
    
    # Verifica se salvou
    response = client.get("/api/v1/dictionary")
    data = response.json()
    assert test_scope in data
    assert data[test_scope].get(test_wrong) == test_right
    
    # 3. Remover termo
    response = client.delete(f"/api/v1/dictionary/{test_scope}/{test_wrong}")
    assert response.status_code == 200
    
    # Verifica remoção
    response = client.get("/api/v1/dictionary")
    data = response.json()
    assert test_wrong not in data.get(test_scope, {})
