"""
EventBus — Sistema de hooks Event-Driven para o pipeline do RefinaVoz.

Inspirado no modelo de 25 eventos do Claude Code (claude-howto/06-hooks),
adaptado para um pipeline de refinamento semântico com decorators Python.

Uso:
    from backend.core.events import bus, hook

    @hook("pre_process")
    def apply_dictionary(text: str, mode: str, **ctx) -> str:
        ...
        return cleaned_text

    # Disparar:
    result = await bus.emit("pre_process", text=raw, mode="normal")
"""

import asyncio
import inspect
from typing import Any, Callable, Dict, List, Optional
from collections import defaultdict

from backend.core.logger import logger


class EventBus:
    """
    Barramento de eventos síncrono/assíncrono.
    Hooks são executados na ordem de registro.
    Cada hook recebe **kwargs e pode retornar um valor transformado.
    """

    def __init__(self) -> None:
        self._hooks: Dict[str, List[Callable]] = defaultdict(list)

    def register(self, event: str, fn: Callable) -> None:
        self._hooks[event].append(fn)
        logger.debug(f"Hook registrado: {event} → {fn.__name__}")

    async def emit(self, event: str, **kwargs: Any) -> Any:
        """
        Dispara um evento. Passa kwargs para cada hook registrado.
        Se um hook retornar um valor não-None, ele substitui o valor
        correspondente em kwargs para o próximo hook (pipeline chain).
        """
        handlers = self._hooks.get(event, [])
        if not handlers:
            return kwargs

        logger.info(f"Evento '{event}' disparado com {len(handlers)} hook(s)")

        for fn in handlers:
            try:
                if inspect.iscoroutinefunction(fn):
                    result = await fn(**kwargs)
                else:
                    result = fn(**kwargs)

                # Se o hook retorna algo, usa como input do próximo
                if result is not None:
                    if isinstance(result, dict):
                        kwargs.update(result)
                    else:
                        # Se retorna valor simples, assume que é o 'text'
                        kwargs["text"] = result

            except Exception as e:
                logger.error(f"Hook '{fn.__name__}' falhou no evento '{event}': {e}")
                # Hook failure não mata o pipeline — continua com o próximo

        return kwargs

    def list_hooks(self, event: Optional[str] = None) -> Dict[str, List[str]]:
        """Lista hooks registrados para debug."""
        if event:
            return {event: [fn.__name__ for fn in self._hooks.get(event, [])]}
        return {ev: [fn.__name__ for fn in fns] for ev, fns in self._hooks.items()}


# Instância global singleton
bus = EventBus()


def hook(event: str) -> Callable:
    """
    Decorator para registrar uma função como hook de um evento.

    Eventos disponíveis no pipeline RefinaVoz:
        - "pre_process"   : Antes do LLM (dicionário, sanitização)
        - "post_process"  : Depois do LLM (validação, métricas)
        - "on_error"      : Quando o LLM falha
        - "on_mode_change": Quando o usuário troca de modo
        - "on_record_start": Quando a gravação inicia
        - "on_record_stop" : Quando a gravação para
    """
    def decorator(fn: Callable) -> Callable:
        bus.register(event, fn)
        return fn
    return decorator
