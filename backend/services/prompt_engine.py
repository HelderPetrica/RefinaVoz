"""
Prompt Engine SOTA — Carregamento de prompts com frontmatter YAML e templates XML.

Segue o padrão SKILL.md do claude-howto: cada prompt tem metadata no frontmatter
e corpo com delimitadores XML estritos.
"""

import os
import re
from typing import Dict, Optional, Tuple
from functools import lru_cache

from backend.core.logger import logger
from backend.services.legal_brain_lite import build_legal_brain_context


PROMPTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "prompts"
)

def _get_valid_modes() -> set:
    """Carrega dinamicamente os modos com base nos arquivos .md na pasta prompts."""
    if not os.path.exists(PROMPTS_DIR):
        return {"normal"}
    
    modes = set()
    for file in os.listdir(PROMPTS_DIR):
        if file.endswith(".md"):
            modes.add(file[:-3])
    return modes if modes else {"normal"}

def _parse_frontmatter(content: str) -> Tuple[Dict[str, str], str]:
    """
    Separa o YAML frontmatter do corpo do prompt.
    Retorna (metadata_dict, body_string).
    """
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(pattern, content, re.DOTALL)

    if not match:
        return {}, content

    frontmatter_raw = match.group(1)
    body = match.group(2)

    metadata: Dict[str, str] = {}
    for line in frontmatter_raw.strip().split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)
            metadata[key.strip()] = val.strip()

    return metadata, body


def load_prompt(mode: str) -> Tuple[Dict[str, str], str]:
    """
    Carrega o prompt de um modo específico.
    Retorna (metadata, corpo_xml).

    Se o modo não existe, retorna um fallback seguro.
    """
    if mode not in _get_valid_modes():
        logger.warning(f"Modo '{mode}' não reconhecido. Usando fallback 'normal'.")
        mode = "normal"

    path = os.path.join(PROMPTS_DIR, f"{mode}.md")

    if not os.path.exists(path):
        logger.warning(f"Arquivo de prompt não encontrado: {path}")
        return (
            {"name": f"modo-{mode}", "description": "Fallback genérico"},
            f"<system_instruction>\nRefine esta fala no modo '{mode}'.\n</system_instruction>\n\n<input_bruto>\n{{{{RAW_TEXT}}}}\n</input_bruto>"
        )

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    metadata, body = _parse_frontmatter(content)
    logger.debug(f"Prompt carregado: mode={mode}, name={metadata.get('name', '?')}")
    return metadata, body


def render_prompt(mode: str, raw_text: str, dictionary_terms: str = "", extra_text: Optional[str] = None, extra_visual: Optional[str] = None) -> str:
    """
    Renderiza o prompt final substituindo as variáveis de template e injetando contexto opcional.
    """
    _, body = load_prompt(mode)

    rendered = body.replace("{{RAW_TEXT}}", raw_text)
    rendered = rendered.replace("{{DICTIONARY_TERMS}}", dictionary_terms)
    legal_context = build_legal_brain_context(raw_text, mode)
    has_legal_placeholder = "{{LEGAL_BRAIN_CONTEXT}}" in body
    rendered = rendered.replace("{{LEGAL_BRAIN_CONTEXT}}", legal_context)

    # Injeção de contextos auxiliares
    aux_contexts = ""
    if extra_text and extra_text.strip():
        aux_contexts += f"\n\n<contexto_textual>\n{extra_text.strip()}\n</contexto_textual>"

    if extra_visual and extra_visual.strip():
        # TODO: Quando o suporte a payload híbrido real estiver na API, a lógica visual mudará,
        # mas por hora injetamos um bloco informativo.
        aux_contexts += f"\n\n<contexto_visual>\n[IMAGEM ANEXADA: {extra_visual[:50]}...]\n</contexto_visual>"

    if legal_context and not has_legal_placeholder:
        aux_contexts += f"\n\n{legal_context}"

    rendered += aux_contexts

    return rendered


def list_available_modes() -> Dict[str, str]:
    """Lista todos os modos disponíveis com suas descrições."""
    modes: Dict[str, str] = {}
    valid_modes = _get_valid_modes()
    for mode in valid_modes:
        path = os.path.join(PROMPTS_DIR, f"{mode}.md")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            meta, _ = _parse_frontmatter(content)
            modes[mode] = meta.get("description", "Sem descrição")
    return modes
