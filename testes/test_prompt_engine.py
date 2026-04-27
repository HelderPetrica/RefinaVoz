"""
Testes do Prompt Engine SOTA.
Valida carregamento de frontmatter, renderização de templates e fallback seguro.
"""

import pytest
from backend.services.prompt_engine import (
    load_prompt,
    render_prompt,
    list_available_modes,
    _parse_frontmatter,
    _get_valid_modes
)


def test_parse_frontmatter_extracts_metadata():
    content = "---\nname: modo-teste\ndescription: Um teste\n---\n<body>conteúdo</body>"
    meta, body = _parse_frontmatter(content)
    assert meta["name"] == "modo-teste"
    assert meta["description"] == "Um teste"
    assert "<body>conteúdo</body>" in body


def test_parse_frontmatter_handles_no_frontmatter():
    content = "Texto puro sem frontmatter"
    meta, body = _parse_frontmatter(content)
    assert meta == {}
    assert body == content


def test_load_prompt_normal_returns_metadata():
    meta, body = load_prompt("normal")
    assert meta.get("name") == "modo-normal"
    assert "<system_instruction>" in body


def test_load_prompt_invalid_mode_fallback():
    meta, body = load_prompt("modo_inexistente")
    assert "normal" in meta.get("name", "").lower() or "fallback" in meta.get("name", "").lower()


def test_render_prompt_replaces_variables():
    rendered = render_prompt("normal", "texto de teste", "skills, react")
    assert "texto de teste" in rendered
    assert "skills, react" in rendered
    assert "{{RAW_TEXT}}" not in rendered
    assert "{{DICTIONARY_TERMS}}" not in rendered


def test_all_valid_modes_load_successfully():
    for mode in _get_valid_modes():
        meta, body = load_prompt(mode)
        assert meta.get("name"), f"Modo '{mode}' sem name no frontmatter"
        assert "<system_instruction>" in body, f"Modo '{mode}' sem <system_instruction>"


def test_list_available_modes_returns_all():
    modes = list_available_modes()
    assert len(modes) == len(_get_valid_modes())
    for mode_name, description in modes.items():
        assert description, f"Modo '{mode_name}' sem descrição"


def test_render_prompt_optional_contexts():
    # Sem contexto
    rendered_none = render_prompt("normal", "teste")
    assert "<contexto_textual>" not in rendered_none
    assert "<contexto_visual>" not in rendered_none

    # Apenas texto
    rendered_text = render_prompt("normal", "teste", extra_text="Erro linha 5")
    assert "<contexto_textual>" in rendered_text
    assert "Erro linha 5" in rendered_text
    assert "<contexto_visual>" not in rendered_text

    # Apenas visual
    rendered_visual = render_prompt("normal", "teste", extra_visual="base64string...")
    assert "<contexto_textual>" not in rendered_visual
    assert "<contexto_visual>" in rendered_visual
    assert "IMAGEM ANEXADA" in rendered_visual


def test_render_prompt_injects_legal_brain_lite_for_legal_modes():
    rendered = render_prompt(
        "juridico_resumo_caso",
        "Cliente teve beneficio do INSS indeferido apos pericia e quer revisar o auxilio por incapacidade.",
    )
    assert "<legal_brain_lite" in rendered
    assert "previdenciario" in rendered
    assert "{{LEGAL_BRAIN_CONTEXT}}" not in rendered
