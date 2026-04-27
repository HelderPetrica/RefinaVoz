import itertools
import time
import json
import base64
import httpx
from typing import Tuple, Dict, Any, Optional

from backend.core.config import settings
from backend.core.logger import logger
from backend.schemas.models import ProcessingMetrics

# Ciclo infinito sobre as chaves disponíveis no .env
_KEY_CYCLE = itertools.cycle(settings.GEMINI_API_KEYS)

def _pick_api_key() -> str:
    return next(_KEY_CYCLE)

async def _post_gemini(model: str, key: str, payload: dict) -> httpx.Response:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {"x-goog-api-key": key, "content-type": "application/json"}
    
    async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT) as client:
        return await client.post(url, headers=headers, json=payload)

def _extract_text(data: dict) -> str:
    try:
        parts = data["candidates"][0]["content"]["parts"]
        texts = [p.get("text", "") for p in parts if isinstance(p, dict)]
        return "\n".join([t for t in texts if t]).strip()
    except (KeyError, IndexError, TypeError):
        return ""

def _extract_usage(data: dict) -> Tuple[int, int]:
    usage = data.get("usageMetadata", {})
    p_tokens = usage.get("promptTokenCount", 0)
    c_tokens = usage.get("candidatesTokenCount", 0)
    return p_tokens, c_tokens

async def process_with_llm(
    raw_text: str,
    system_instruction: str,
    image_bytes: Optional[bytes] = None,
    image_mime_type: Optional[str] = None,
) -> Tuple[str, ProcessingMetrics]:
    start_time = int(time.time() * 1000)
    has_image = bool(image_bytes and image_mime_type)
    
    if settings.USE_MOCK_LLM:
        logger.info("Modo MOCK ativado. Pulando chamada real ao Gemini.")
        latency = 100
        metrics = ProcessingMetrics(
            latency_ms=latency,
            prompt_tokens=10,
            completion_tokens=5,
            fallback_used=False,
            provider_model="mock"
        )
        visual_note = "\n[IMAGEM ANEXADA AO CONTEXTO]" if has_image else ""
        final_text = f"[MOCK EXPLÍCITO] Recebi este prompt:\n{system_instruction[:250]}...{visual_note}"
        return final_text, metrics

    parts = [{"text": raw_text}]
    if has_image:
        encoded_image = base64.b64encode(image_bytes).decode("ascii")
        parts.append({
            "inline_data": {
                "mime_type": image_mime_type,
                "data": encoded_image,
            }
        })
    
    # Montagem do Prompt com Thinking Level MINIMAL via REST payload
    payload = {
        "contents": [{"parts": parts}],
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "generationConfig": {
            "temperature": 0.2, # Previsibilidade para transcrição técnica
            # Em v1beta the thinkingConfig may not be fully GA yet, mas injetamos o padrao de intencao minima
        }
    }
    
    attempted_keys = 0
    max_keys = len(settings.GEMINI_API_KEYS)
    
    model = settings.MODEL_DEFAULT
    fallback_used = False
    
    while attempted_keys < max_keys:
        key = _pick_api_key()
        attempted_keys += 1
        
        try:
            logger.info(f"Chamando Gemini ({model}) via httpx. Tentativa de chave... ({attempted_keys}/{max_keys})")
            resp = await _post_gemini(model, key, payload)
            
            # Se for 429 Quota Exhausted, tenta próxima chave
            if resp.status_code == 429:
                logger.warning(f"Quota exhausted (429) na chave de final '{key[-4:]}'. Tentando próxima...")
                continue
                
            resp.raise_for_status()
            data = resp.json()
            
            # Verificação de bloqueio SAFETY ou RECITATION
            candidates = data.get("candidates", [])
            finish_reason = candidates[0].get("finishReason") if candidates else None
            if finish_reason in {"SAFETY", "RECITATION"}:
                logger.warning(f"Filtro '{finish_reason}' bloqueou a resposta. Testando Fallback model.")
                fallback_used = True
                model = settings.MODEL_FALLBACK
                resp = await _post_gemini(model, key, payload)
                resp.raise_for_status()
                data = resp.json()
            
            p_tokens, c_tokens = _extract_usage(data)
            final_text = _extract_text(data)
            latency = int(time.time() * 1000) - start_time
            
            metrics = ProcessingMetrics(
                latency_ms=latency,
                prompt_tokens=p_tokens,
                completion_tokens=c_tokens,
                fallback_used=fallback_used,
                provider_model=model
            )
            
            logger.info(f"LLM Sucesso: Latência={latency}ms | Model={model} | Input={p_tokens} | Output={c_tokens}")
            return final_text, metrics
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Erro HTTP do Gemini: {e.response.status_code} - {e.response.text}")
            if e.response.status_code in {500, 502, 503}:
                # Problema na GCP, vamos usar fallback noutra chave
                fallback_used = True
                model = settings.MODEL_FALLBACK
                continue
            raise
        except Exception as e:
            logger.error(f"Erro inesperado no LLM: {str(e)}")
            raise

    # Se esgotou todas as chaves e falhou
    raise RuntimeError("Todas as GEMINI_API_KEYS esgotaram a quota (429) ou falharam.")
