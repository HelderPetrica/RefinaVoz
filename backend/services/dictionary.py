"""
Serviço de Dicionário Semântico — Pré-processamento local antes do LLM.

Aplica correções canônicas baseadas no modo ativo, usando Banco SQLite (SQLModel).
"""

from typing import Dict, List
import re
from sqlmodel import Session, select
from backend.core.logger import logger
from backend.core.events import hook
from backend.core.database import engine
from backend.schemas.db_models import DictionaryContext

def _seed_initial_dictionary(session: Session):
    """Popular o banco na primeira execução se estiver vazio."""
    count = session.exec(select(DictionaryContext)).all()
    if not count:
        logger.info("Migrando dicionário padrão para SQLite...")
        defaults = [
            ("global", "esquilos", "skills"),
            ("global", "reack", "react"),
            ("global", "taure", "tauri"),
            ("global", "jeminí", "Gemini"),
            ("global", "gemíni", "Gemini"),
            ("global", "fasta pi", "FastAPI"),
            ("global", "fast api", "FastAPI"),
            ("programacao", "nó jésse", "Node.js"),
            ("programacao", "node jésse", "Node.js"),
            ("programacao", "githabi", "GitHub"),
            ("programacao", "git habi", "GitHub"),
            ("programacao", "páiton", "Python"),
            ("programacao", "bscode", "VS Code"),
            ("programacao", "codel", "VS Code"),
        ]
        for scope, wrong, right in defaults:
            term = DictionaryContext(scope=scope, wrong_term=wrong, right_term=right)
            session.add(term)
        session.commit()

# Hook para rodar isso no startup
def init_db_dictionary():
    with Session(engine) as session:
        _seed_initial_dictionary(session)


def get_dictionary() -> Dict[str, Dict[str, str]]:
    """Retorna Dicionário no formato: {scope: {wrong: right}}"""
    with Session(engine) as session:
        terms = session.exec(select(DictionaryContext)).all()
        if not terms:
            _seed_initial_dictionary(session)
            terms = session.exec(select(DictionaryContext)).all()
            
        result = {}
        for term in terms:
            if term.scope not in result:
                result[term.scope] = {}
            result[term.scope][term.wrong_term] = term.right_term
        return result

def add_term(scope: str, wrong: str, right: str):
    with Session(engine) as session:
        existing = session.exec(select(DictionaryContext).where(
            DictionaryContext.scope == scope,
            DictionaryContext.wrong_term == wrong
        )).first()
        if existing:
            existing.right_term = right
            session.add(existing)
        else:
            term = DictionaryContext(scope=scope, wrong_term=wrong, right_term=right)
            session.add(term)
        session.commit()

def remove_term(scope: str, wrong: str):
    with Session(engine) as session:
        term = session.exec(select(DictionaryContext).where(
            DictionaryContext.scope == scope,
            DictionaryContext.wrong_term == wrong
        )).first()
        if term:
            session.delete(term)
            session.commit()


def apply_dictionary(text: str, mode: str = "normal", **kwargs) -> Dict:
    """Aplica o dicionário semântico por escopo."""
    scope = _get_scope_for_mode(mode)
    d = get_dictionary()
    
    active_terms: Dict[str, str] = {}
    active_terms.update(d.get("global", {}))
    active_terms.update(d.get(scope, {}))

    applied: List[str] = []
    cleaned = text

    for wrong, right in active_terms.items():
        if wrong in cleaned.lower():
            # Substituição case-insensitive
            cleaned = re.sub(re.escape(wrong), right, cleaned, flags=re.IGNORECASE)
            applied.append(right)

    if applied:
        logger.info(f"Dicionário aplicou {len(applied)} correções: {applied}")

    return {"text": cleaned, "applied_terms": applied, "mode": mode, **kwargs}


def _get_scope_for_mode(mode: str) -> str:
    """Mapeia modo → escopo do dicionário."""
    scope_map = {
        "normal": "global",
        "mensagem": "comunicacao",
        "profissional": "comunicacao",
        "programador": "programacao",
        "vibe_code": "programacao",
        "prompt": "programacao",
    }
    return scope_map.get(mode, "global")


def format_terms_for_prompt(applied_terms: List[str]) -> str:
    """Formata termos aplicados para injeção no template XML."""
    if not applied_terms:
        return "Nenhum termo do dicionário foi aplicado."
    return "Termos protegidos: " + ", ".join(applied_terms)


# Auto-registrar como hook do pipeline
@hook("pre_process")
def _dictionary_hook(**kwargs) -> Dict:
    text = kwargs.get("text", "")
    mode = kwargs.get("mode", "normal")
    return apply_dictionary(text, mode, **{k: v for k, v in kwargs.items() if k not in ("text", "mode")})
