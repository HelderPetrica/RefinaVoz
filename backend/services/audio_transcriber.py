from google import genai
from google.genai import types

from backend.core.config import settings
from backend.core.logger import logger
from backend.services.llm_client import _pick_api_key

SUPPORTED_AUDIO_MIME_TYPES = {
    "audio/wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/aiff",
    "audio/aac",
    "audio/ogg",
    "audio/flac",
}
MAX_INLINE_AUDIO_BYTES = 20 * 1024 * 1024


def _normalize_audio_mime_type(mime_type: str | None) -> str:
    normalized = (mime_type or "audio/wav").split(";", 1)[0].strip().lower()
    if normalized == "audio/x-wav":
        return "audio/wav"
    return normalized


async def transcribe_audio_with_gemini(audio_bytes: bytes, mime_type: str | None = "audio/wav") -> str:
    """
    Transcreve áudio usando o Google GenAI SDK oficial.
    """
    if not audio_bytes:
        raise ValueError("Arquivo de áudio vazio.")

    resolved_mime_type = _normalize_audio_mime_type(mime_type)
    if resolved_mime_type not in SUPPORTED_AUDIO_MIME_TYPES:
        raise ValueError(
            "Formato de áudio não suportado pelo Gemini. "
            "Use WAV, MP3, AIFF, AAC, OGG ou FLAC."
        )

    if len(audio_bytes) > MAX_INLINE_AUDIO_BYTES:
        raise ValueError("Áudio excede 20 MB; reduza a gravação antes de transcrever.")

    api_key = _pick_api_key()
    prompt = "Transcreva o áudio em português brasileiro com alta precisão. Retorne apenas a transcrição."
    contents = [
        prompt,
        types.Part.from_bytes(data=audio_bytes, mime_type=resolved_mime_type),
    ]

    try:
        async with genai.Client(api_key=api_key).aio as client:
            response = await client.models.generate_content(
                model=settings.AUDIO_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(temperature=0),
            )
        transcript = (response.text or "").strip()
        if not transcript:
            raise RuntimeError("Gemini não retornou transcrição para o áudio enviado.")
        logger.info(
            f"Transcrição Gemini concluída | model={settings.AUDIO_MODEL} | "
            f"mime={resolved_mime_type} | bytes={len(audio_bytes)}"
        )
        return transcript
    except Exception as exc:
        logger.error(f"Erro na transcrição de áudio via Gemini GenAI SDK: {exc}")
        raise
