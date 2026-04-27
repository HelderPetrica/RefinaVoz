"""
Testes do Dicionário Semântico SOTA.
Valida proteção de termos canônicos por modo e escopo.
"""

import pytest
from backend.services.dictionary import (
    apply_dictionary,
    _get_scope_for_mode,
    format_terms_for_prompt
)


def test_dictionary_global_terms():
    """Termos globais devem ser aplicados em qualquer modo."""
    result = apply_dictionary("Eu quero usar esquilos de reack", mode="normal")
    assert "skills" in result["text"]
    assert "react" in result["text"]
    assert "skills" in result["applied_terms"]


def test_dictionary_programacao_scoped():
    """Termos de programação só devem carregar em modos de programação."""
    result = apply_dictionary("Eu uso páiton e githabi", mode="programador")
    assert "Python" in result["text"]
    assert "GitHub" in result["text"]


def test_dictionary_mensagem_uses_comunicacao_scope():
    scope = _get_scope_for_mode("mensagem")
    assert scope == "comunicacao"


def test_dictionary_vibe_code_uses_programacao_scope():
    scope = _get_scope_for_mode("vibe_code")
    assert scope == "programacao"


def test_dictionary_preserves_original_on_no_match():
    result = apply_dictionary("Texto sem nenhum termo do dicionário", mode="normal")
    assert result["text"] == "Texto sem nenhum termo do dicionário"
    assert result["applied_terms"] == []


def test_format_terms_empty():
    assert "Nenhum" in format_terms_for_prompt([])


def test_format_terms_with_values():
    formatted = format_terms_for_prompt(["skills", "react"])
    assert "skills" in formatted
    assert "react" in formatted
