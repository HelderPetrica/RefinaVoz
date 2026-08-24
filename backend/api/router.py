"""
Router SOTA — Endpoints do RefinaVoz usando EventBus e Prompt Engine.
"""

from fastapi import APIRouter, HTTPException, Form, UploadFile, File
import time
import uuid

from backend.schemas.models import ProcessResponse, DictionaryEntry
from backend.services.llm_client import process_with_llm, process_audio_single_pass
from backend.services.prompt_engine import render_prompt, list_available_modes, load_prompt
from backend.services.dictionary import apply_dictionary, format_terms_for_prompt, get_dictionary, add_term, remove_term
from backend.core.logger import logger
from backend.core.events import bus
from backend.services.audio_transcriber import transcribe_audio_with_gemini
from backend.services.audio_optimizer import audio_optimizer, get_audio_optimization_diagnostics
from backend.services.audio_quality_gate import assess_transcription_quality
from sqlmodel import Session, select
from backend.core.database import engine
from backend.schemas.db_models import PromptHistory

SUPPORTED_VISUAL_MIME_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_INLINE_VISUAL_BYTES = 8 * 1024 * 1024

def save_history(trace_id: str, mode: str, raw_text: str, final_text: str, latency_ms: int):
    with Session(engine) as session:
        h = PromptHistory(
            trace_id=trace_id, mode=mode, raw_text=raw_text, 
            final_text=final_text, latency_ms=latency_ms
        )
        session.add(h)
        session.commit()

router = APIRouter()


from typing import Optional

async def read_visual_context_image(
    visual_context_image: Optional[UploadFile],
) -> tuple[Optional[bytes], Optional[str], Optional[str]]:
    if not visual_context_image:
        return None, None, None

    mime_type = (visual_context_image.content_type or "").split(";", 1)[0].strip().lower()
    if mime_type not in SUPPORTED_VISUAL_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Imagem de contexto deve ser PNG, JPEG ou WEBP.")

    image_bytes = await visual_context_image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Imagem de contexto vazia.")
    if len(image_bytes) > MAX_INLINE_VISUAL_BYTES:
        raise HTTPException(status_code=400, detail="Imagem de contexto excede 8 MB.")

    visual_description = (
        f"imagem anexada ao contexto multimodal; "
        f"arquivo={visual_context_image.filename or 'captura'}; "
        f"mime={mime_type}; bytes={len(image_bytes)}"
    )
    return image_bytes, mime_type, visual_description

@router.post("/process/texto", response_model=ProcessResponse, response_model_exclude_none=True)
async def process_text(
    raw_text: str = Form(...),
    mode: str = Form("normal"),
    extra_text_context: Optional[str] = Form(None),
    extra_visual_context: Optional[str] = Form(None),
    visual_context_image: Optional[UploadFile] = File(None),
):
    """Pipeline completo: Dicionário → Prompt XML → LLM → Resposta tipada."""
    trace_id = str(uuid.uuid4())
    logger.info(f"[{trace_id}] Pipeline iniciado | mode={mode} | len={len(raw_text)}")

    # 1. EventBus: pre_process (dicionário + sanitização)
    ctx = await bus.emit("pre_process", text=raw_text, mode=mode, trace_id=trace_id)
    cleaned_text = ctx.get("text", raw_text)
    applied_terms = ctx.get("applied_terms", [])
    image_bytes, image_mime_type, visual_description = await read_visual_context_image(visual_context_image)
    visual_context = extra_visual_context or visual_description

    # 2. Renderizar prompt XML com variáveis e contexto extra opcional
    dict_context = format_terms_for_prompt(applied_terms)
    system_prompt = render_prompt(
        mode=mode,
        raw_text=cleaned_text,
        dictionary_terms=dict_context,
        extra_text=extra_text_context,
        extra_visual=visual_context,
    )

    # 3. Chamar LLM
    try:
        final_text, metrics = await process_with_llm(
            cleaned_text,
            system_prompt,
            image_bytes=image_bytes,
            image_mime_type=image_mime_type,
        )
    except Exception as e:
        logger.error(f"[{trace_id}] Erro LLM: {str(e)}")
        # EventBus: on_error
        await bus.emit("on_error", error=str(e), trace_id=trace_id, mode=mode)
        raise HTTPException(status_code=500, detail=str(e))

    # 4. EventBus: post_process (validação, métricas)
    await bus.emit("post_process", final_text=final_text, metrics=metrics, trace_id=trace_id)

    save_history(trace_id, mode, raw_text, final_text, metrics.latency_ms)

    logger.info(f"[{trace_id}] Pipeline concluído | latency={metrics.latency_ms}ms")

    return ProcessResponse(
        raw_text=raw_text,
        final_text=final_text,
        mode_used=mode,
        applied_dictionary_terms=applied_terms,
        metrics=metrics
    )

@router.post("/process/audio", response_model=ProcessResponse, response_model_exclude_none=True)
async def process_audio(
    audio_file: UploadFile = File(...),
    mode: str = Form("normal"),
    extra_text_context: Optional[str] = Form(None),
    visual_context_image: Optional[UploadFile] = File(None),
):
    """Pipeline a partir de áudio: Single-Pass Multimodal SOTA (com fallback 2-Pass)."""
    trace_id = str(uuid.uuid4())
    endpoint_started_at = time.perf_counter()
    logger.info(f"[{trace_id}] Recebendo arquivo de audio: {audio_file.filename} | mode={mode}")
    
    audio_bytes = await audio_file.read()
    mime_type = audio_file.content_type or "audio/wav"
    prepared_audio_bytes, audio_optimization = audio_optimizer.prepare(
        audio_bytes,
        mime_type,
        mode,
    )
    image_bytes, image_mime_type, visual_description = await read_visual_context_image(visual_context_image)

    from backend.core.config import settings

    # 1. Tentativa via Pipeline Single-Pass SOTA (Áudio -> Texto Refinado em 1 chamada)
    if settings.AUDIO_PIPELINE_MODE == "single_pass":
        try:
            dict_terms = get_dictionary().get("global", {})
            dict_context = format_terms_for_prompt(list(dict_terms.items()))
            system_prompt = render_prompt(
                mode=mode,
                raw_text="[DITADO EM ÁUDIO MULTIMODAL]",
                dictionary_terms=dict_context,
                extra_text=extra_text_context,
                extra_visual=visual_description,
            )
            
            final_text, metrics = await process_audio_single_pass(
                prepared_audio_bytes,
                mime_type,
                system_prompt,
                image_bytes=image_bytes,
                image_mime_type=image_mime_type,
            )
            
            await bus.emit("post_process", final_text=final_text, metrics=metrics, trace_id=trace_id)
            save_history(trace_id, mode, "[Áudio Multimodal]", final_text, metrics.latency_ms)
            
            if audio_optimization:
                audio_optimization.total_endpoint_ms = int((time.perf_counter() - endpoint_started_at) * 1000)
                
            return ProcessResponse(
                raw_text="[Áudio Multimodal]",
                final_text=final_text,
                mode_used=mode,
                applied_dictionary_terms=[],
                metrics=metrics,
                audio_optimization=audio_optimization,
            )
        except Exception as e:
            logger.warning(f"[{trace_id}] Single-Pass falhou ({e}), acionando fallback 2-Pass.")

    # 2. Pipeline Fallback 2-Pass (Transcrição isolada -> LLM Refino)
    try:
        transcription_started_at = time.perf_counter()
        raw_text = await transcribe_audio_with_gemini(prepared_audio_bytes, mime_type)
        transcription_ms = int((time.perf_counter() - transcription_started_at) * 1000)
        if audio_optimization:
            audio_optimization.transcription_ms = transcription_ms

        quality_assessment = assess_transcription_quality(raw_text)
        if quality_assessment.should_retry_original and audio_optimization and audio_optimization.audio_changed:
            raw_text = await transcribe_audio_with_gemini(audio_bytes, mime_type)
            audio_optimization.fallback_used = True
        elif quality_assessment.should_retry_original:
            logger.warning(
                f"[{trace_id}] Quality gate sinalizou risco sem retry | reasons={quality_assessment.reasons}"
            )

        logger.info(f"[{trace_id}] Áudio transcrito via 2-Pass | chars={len(raw_text)}")
    except Exception as e:
        logger.error(f"[{trace_id}] Falha na transcrição: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na transcrição de áudio: {str(e)}")

    ctx = await bus.emit("pre_process", text=raw_text, mode=mode, trace_id=trace_id)
    cleaned_text = ctx.get("text", raw_text)
    applied_terms = ctx.get("applied_terms", [])
    
    dict_context = format_terms_for_prompt(applied_terms)
    system_prompt = render_prompt(
        mode=mode,
        raw_text=cleaned_text,
        dictionary_terms=dict_context,
        extra_text=extra_text_context,
        extra_visual=visual_description,
    )

    try:
        final_text, metrics = await process_with_llm(
            cleaned_text,
            system_prompt,
            image_bytes=image_bytes,
            image_mime_type=image_mime_type,
        )
    except Exception as e:
        logger.error(f"[{trace_id}] Erro LLM: {str(e)}")
        await bus.emit("on_error", error=str(e), trace_id=trace_id, mode=mode)
        raise HTTPException(status_code=500, detail=str(e))

    await bus.emit("post_process", final_text=final_text, metrics=metrics, trace_id=trace_id)

    save_history(trace_id, mode, raw_text, final_text, metrics.latency_ms)

    if audio_optimization:
        audio_optimization.total_endpoint_ms = int((time.perf_counter() - endpoint_started_at) * 1000)

    return ProcessResponse(
        raw_text=raw_text,
        final_text=final_text,
        mode_used=mode,
        applied_dictionary_terms=applied_terms,
        metrics=metrics,
        audio_optimization=audio_optimization,
    )


@router.get("/prompts/{mode}")
async def get_prompt(mode: str):
    """Retorna o conteúdo do prompt de um modo para edição."""
    metadata, body = load_prompt(mode)
    return {"mode": mode, "metadata": metadata, "content": body}


@router.post("/prompts/generate")
async def generate_prompt(description: str = Form(...)):
    """Gera um prompt de forma automatizada usando LLM baseando-se na explicação."""
    sys_prompt = """Você é um Engenheiro de Prompts especialista.
Crie um system prompt estruturado para o RefinaVoz baseado no desejo do usuário.
Retorne APENAS o XML puro, sem formatação markdown (sem ```xml).

Estrutura obrigatória:
<system_instruction>
Breve instrução primária.
</system_instruction>

<persona>
- Tom, estilo e área de expertise.
</persona>

<rules>
1. Regra mais importante.
2. Saída no idioma atual (ou solicitado).
3. Não inclua saudações, nem avisos. Entregue somente a saída purificada.
</rules>

<input_bruto>
{{RAW_TEXT}}
</input_bruto>"""
    try:
        final_text, _ = await process_with_llm(description, sys_prompt)
        # Limpar crases caso o LLM ainda teime em colocar
        final_text = final_text.replace("```xml", "").replace("```", "").strip()
        return {"content": final_text}
    except Exception as e:
        logger.error(f"Erro ao gerar prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prompts")
async def save_new_prompt(
    mode_id: str = Form(...),
    name: str = Form(...),
    description: str = Form(...),
    content: str = Form(...)
):
    import os
    from backend.services.prompt_engine import PROMPTS_DIR

    # Sanitização básica de segurança
    safe_mode = "".join(c for c in mode_id.lower() if c.isalnum() or c == "_")
    if not safe_mode:
        raise HTTPException(status_code=400, detail="Identificador de modo inválido")

    path = os.path.join(PROMPTS_DIR, f"{safe_mode}.md")

    full_content = f"---\nname: {name}\ndescription: {description}\n---\n\n{content}"

    with open(path, "w", encoding="utf-8") as f:
        f.write(full_content)

    return {"status": "ok", "mode": safe_mode}


@router.get("/prompts")
async def list_prompts():
    """Lista todos os modos disponíveis com descrições."""
    return {"modes": list_available_modes()}


@router.get("/health")
def health():
    return {
        "status": "sota",
        "components": ["fastapi", "eventbus", "httpx_cycler", "prompt_engine"],
        "hooks": bus.list_hooks()
    }


@router.get("/diagnostics")
def diagnostics():
    """Varredura única para o frontend validar ambiente sem expor segredos."""
    from backend.core.config import settings
    keys = settings.GEMINI_API_KEYS
    real_keys = [k for k in keys if k and k != "TEST_KEY_REPLACE_ME"]
    return {
        "status": "ok",
        "mock_mode": settings.USE_MOCK_LLM,
        "model_default": settings.MODEL_DEFAULT,
        "model_fallback": settings.MODEL_FALLBACK,
        "model_pro_tier": settings.MODEL_PRO_TIER,
        "audio_model": settings.AUDIO_MODEL,
        "live_model": settings.LIVE_MODEL,
        "pipeline_mode": settings.AUDIO_PIPELINE_MODE,
        "audio_optimization": get_audio_optimization_diagnostics(),
        "configured_keys": len(real_keys),
        "modes_loaded": list_available_modes(),
        "hooks": bus.list_hooks(),
    }

@router.get("/dictionary")
async def api_get_dict():
    return get_dictionary()

@router.post("/dictionary")
async def api_add_term(scope: str = Form(...), wrong: str = Form(...), right: str = Form(...)):
    add_term(scope, wrong, right)
    return {"status": "ok", "message": "Termo adicionado"}

@router.delete("/dictionary/{scope}/{wrong}")
async def api_del_term(scope: str, wrong: str):
    remove_term(scope, wrong)
    return {"status": "ok", "message": "Termo removido"}

@router.get("/history")
async def api_get_history():
    with Session(engine) as session:
        # Pega os últimos 50
        history = session.exec(select(PromptHistory).order_by(PromptHistory.created_at.desc()).limit(50)).all()
        return [{"id": h.id, "mode": h.mode, "rawText": h.raw_text, "finalText": h.final_text, "latencyMs": h.latency_ms, "timestamp": h.created_at.isoformat()} for h in history]

@router.delete("/history")
async def api_clear_history():
    with Session(engine) as session:
        session.exec(select(PromptHistory)).all() # Carrega todos para deletar (solução temporária, ideal deletar via statement mas SQLModel permite session.delete)
        # Mais rápido:
        from sqlmodel import delete
        session.exec(delete(PromptHistory))
        session.commit()
    return {"status": "ok", "message": "Histórico limpo"}
