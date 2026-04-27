"""
Testes do EventBus — Sistema de hooks event-driven.
"""

import pytest
import asyncio
from backend.core.events import EventBus


@pytest.fixture
def fresh_bus():
    """Cria um EventBus limpo para cada teste."""
    return EventBus()


@pytest.mark.asyncio
async def test_hook_registration_and_emission(fresh_bus):
    results = []

    def my_hook(**kwargs):
        results.append(kwargs.get("text"))
        return None

    fresh_bus.register("test_event", my_hook)
    await fresh_bus.emit("test_event", text="hello")

    assert results == ["hello"]


@pytest.mark.asyncio
async def test_hook_chain_transforms_text(fresh_bus):
    """Hooks em cadeia devem transformar o texto progressivamente."""

    def hook_upper(**kwargs):
        return {"text": kwargs["text"].upper()}

    def hook_exclaim(**kwargs):
        return {"text": kwargs["text"] + "!!!"}

    fresh_bus.register("chain", hook_upper)
    fresh_bus.register("chain", hook_exclaim)

    result = await fresh_bus.emit("chain", text="hello")
    assert result["text"] == "HELLO!!!"


@pytest.mark.asyncio
async def test_hook_failure_does_not_crash_pipeline(fresh_bus):
    """Se um hook falha, o pipeline deve continuar."""

    def bad_hook(**kwargs):
        raise ValueError("Boom!")

    def good_hook(**kwargs):
        return {"text": "survived"}

    fresh_bus.register("resilience", bad_hook)
    fresh_bus.register("resilience", good_hook)

    result = await fresh_bus.emit("resilience", text="original")
    assert result["text"] == "survived"


@pytest.mark.asyncio
async def test_async_hook_works(fresh_bus):
    async def async_hook(**kwargs):
        await asyncio.sleep(0.01)
        return {"text": "async_done"}

    fresh_bus.register("async_test", async_hook)
    result = await fresh_bus.emit("async_test", text="start")
    assert result["text"] == "async_done"


def test_list_hooks(fresh_bus):
    def my_fn(**kwargs): pass
    fresh_bus.register("evt_a", my_fn)
    hooks = fresh_bus.list_hooks()
    assert "evt_a" in hooks
    assert "my_fn" in hooks["evt_a"]


@pytest.mark.asyncio
async def test_empty_event_returns_kwargs(fresh_bus):
    result = await fresh_bus.emit("nonexistent", text="untouched")
    assert result["text"] == "untouched"
