"""
Camada juridica lite do RefinaVoz.

Inspira-se no AutoJuris sem copiar o sistema inteiro: classifica sinais da fala,
seleciona heuristicas e monta um contexto pequeno, rastreavel e seguro para prompts juridicos.
"""

import json
import os
import unicodedata
from functools import lru_cache
from html import escape
from typing import Any, Dict, List


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
LEGAL_BRAIN_PATH = os.path.join(ROOT_DIR, "data", "legal_brain_lite.json")


def _normalize(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text or "")
    without_accents = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return without_accents.lower()


@lru_cache(maxsize=1)
def load_legal_brain() -> Dict[str, Any]:
    with open(LEGAL_BRAIN_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def is_legal_mode(mode: str) -> bool:
    return mode.startswith("juridico_") or mode in {"juridico", "marketing_juridico"}


def _keyword_hits(text_normalized: str, keywords: List[str]) -> List[str]:
    hits: List[str] = []
    for keyword in keywords:
        keyword_normalized = _normalize(keyword)
        if keyword_normalized and keyword_normalized in text_normalized:
            hits.append(keyword)
    return hits


def classify_legal_text(raw_text: str, max_domains: int = 3) -> List[Dict[str, Any]]:
    brain = load_legal_brain()
    text_normalized = _normalize(raw_text)
    ranked_domains: List[Dict[str, Any]] = []

    for domain in brain.get("domains", []):
        domain_hits = _keyword_hits(text_normalized, domain.get("keywords", []))
        subareas: List[Dict[str, Any]] = []

        for subarea in domain.get("subareas", []):
            subarea_hits = _keyword_hits(text_normalized, subarea.get("keywords", []))
            if subarea_hits:
                subareas.append({
                    "id": subarea.get("id"),
                    "label": subarea.get("label"),
                    "hits": subarea_hits,
                })

        score = len(domain_hits) + sum(len(item["hits"]) for item in subareas)
        if score:
            ranked_domains.append({
                "id": domain.get("id"),
                "label": domain.get("label"),
                "score": score,
                "hits": domain_hits[:8],
                "search_terms": domain.get("search_terms", [])[:6],
                "critical_questions": domain.get("critical_questions", [])[:4],
                "subareas": subareas[:3],
            })

    return sorted(ranked_domains, key=lambda item: item["score"], reverse=True)[:max_domains]


def build_legal_brain_context(raw_text: str, mode: str, max_domains: int = 2) -> str:
    if not is_legal_mode(mode):
        return ""

    brain = load_legal_brain()
    domains = classify_legal_text(raw_text, max_domains=max_domains)
    principles = brain.get("core_principles", [])[:5]
    guardrails = brain.get("global_guardrails", [])[:5]

    lines: List[str] = [
        '<legal_brain_lite source="autojuris_lite" policy="method_only_no_static_law">',
        "  <core_principles>",
    ]

    for principle in principles:
        lines.append(f"    <item>{escape(principle)}</item>")

    lines.append("  </core_principles>")
    lines.append("  <guardrails>")
    for guardrail in guardrails:
        lines.append(f"    <item>{escape(guardrail)}</item>")
    lines.append("  </guardrails>")

    if domains:
        lines.append("  <detected_domains>")
        for domain in domains:
            lines.append(
                f'    <domain id="{escape(str(domain["id"]))}" label="{escape(str(domain["label"]))}" score="{domain["score"]}">'
            )
            if domain["hits"]:
                lines.append(f"      <keyword_hits>{escape(', '.join(domain['hits']))}</keyword_hits>")
            if domain["subareas"]:
                lines.append("      <subareas>")
                for subarea in domain["subareas"]:
                    lines.append(
                        f'        <subarea id="{escape(str(subarea["id"]))}" label="{escape(str(subarea["label"]))}">{escape(", ".join(subarea["hits"]))}</subarea>'
                    )
                lines.append("      </subareas>")
            lines.append("      <search_terms>")
            for term in domain["search_terms"]:
                lines.append(f"        <term>{escape(term)}</term>")
            lines.append("      </search_terms>")
            lines.append("      <critical_questions>")
            for question in domain["critical_questions"]:
                lines.append(f"        <question>{escape(question)}</question>")
            lines.append("      </critical_questions>")
            lines.append("    </domain>")
        lines.append("  </detected_domains>")
    else:
        lines.append("  <detected_domains status=\"insufficient_signals\" />")

    lines.append("</legal_brain_lite>")
    return "\n".join(lines)