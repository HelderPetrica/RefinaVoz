import io
import wave

from backend.core.config import settings
from backend.core.logger import logger
from backend.schemas.models import AudioOptimizationMetadata

VALID_AUDIO_OPTIMIZATION_MODES = {"off", "metadata_only", "experimental_speedup"}
SENSITIVE_AUDIO_MODES = {
    "juridico_atendimento",
    "juridico_resumo_caso",
    "juridico_manifestacao_curta",
    "juridico_prompt_agente",
    "juridico_whatsapp_cliente",
    "juridico_marketing_etico",
}


def normalize_audio_optimization_mode(raw_mode: str | None) -> str:
    normalized = (raw_mode or "off").strip().lower()
    if normalized not in VALID_AUDIO_OPTIMIZATION_MODES:
        return "off"
    return normalized


def is_sensitive_audio_mode(mode: str | None) -> bool:
    return (mode or "").strip().lower() in SENSITIVE_AUDIO_MODES


class AudioOptimizer:
    def prepare(
        self,
        audio_bytes: bytes,
        mime_type: str | None,
        mode: str | None,
    ) -> tuple[bytes, AudioOptimizationMetadata | None]:
        configured_mode = normalize_audio_optimization_mode(settings.AUDIO_OPTIMIZATION_MODE)
        if not settings.AUDIO_OPTIMIZATION_ENABLED or configured_mode == "off":
            return audio_bytes, None

        resolved_mime_type = (mime_type or "audio/wav").split(";", 1)[0].strip().lower()
        if resolved_mime_type == "audio/x-wav":
            resolved_mime_type = "audio/wav"

        sensitive_mode = is_sensitive_audio_mode(mode)
        if sensitive_mode:
            decision = "skip"
            reason = "legal_sensitive_mode"
        elif configured_mode == "metadata_only":
            decision = "observe"
            reason = "metadata_only"
        elif resolved_mime_type != "audio/wav":
            decision = "skip"
            reason = "unsupported_mime_for_speedup"
        else:
            prepared_audio, speed_factor, reason = speed_up_pcm_wav(
                audio_bytes,
                settings.AUDIO_OPTIMIZATION_MAX_SPEED,
            )
            audio_changed = prepared_audio != audio_bytes
            metadata = AudioOptimizationMetadata(
                mode=configured_mode,
                enabled=True,
                audio_changed=audio_changed,
                original_size_bytes=len(audio_bytes),
                optimized_size_bytes=len(prepared_audio) if audio_changed else None,
                speed_factor=speed_factor if audio_changed else None,
                mime_type=resolved_mime_type or "audio/wav",
                sensitive_mode=sensitive_mode,
                decision="optimized" if audio_changed else "skip",
                reason=reason,
            )
            logger.info(
                "audio.optimization.prepare | mode=%s | decision=%s | sensitive=%s | bytes=%s->%s | speed=%s",
                configured_mode,
                metadata.decision,
                sensitive_mode,
                len(audio_bytes),
                len(prepared_audio),
                metadata.speed_factor,
            )
            return prepared_audio, metadata

        metadata = AudioOptimizationMetadata(
            mode=configured_mode,
            enabled=True,
            audio_changed=False,
            original_size_bytes=len(audio_bytes),
            mime_type=resolved_mime_type or "audio/wav",
            sensitive_mode=sensitive_mode,
            decision=decision,
            reason=reason,
        )
        logger.info(
            "audio.optimization.prepare | mode=%s | decision=%s | sensitive=%s | bytes=%s",
            configured_mode,
            decision,
            sensitive_mode,
            len(audio_bytes),
        )
        return audio_bytes, metadata


def get_audio_optimization_diagnostics() -> dict[str, object]:
    configured_mode = normalize_audio_optimization_mode(settings.AUDIO_OPTIMIZATION_MODE)
    return {
        "mode": configured_mode,
        "enabled": settings.AUDIO_OPTIMIZATION_ENABLED and configured_mode != "off",
        "max_speed": settings.AUDIO_OPTIMIZATION_MAX_SPEED,
        "ffmpeg_required": False,
        "experimental_speedup_available": True,
    }


audio_optimizer = AudioOptimizer()


def speed_up_pcm_wav(audio_bytes: bytes, max_speed: float) -> tuple[bytes, float | None, str]:
    speed_factor = min(1.6, max(1.0, float(max_speed or 1.0)))
    if speed_factor <= 1.01:
        return audio_bytes, None, "speed_factor_disabled"

    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as reader:
            params = reader.getparams()
            sample_width = reader.getsampwidth()
            channels = reader.getnchannels()
            frame_rate = reader.getframerate()
            frame_count = reader.getnframes()
            frames = reader.readframes(frame_count)
    except (wave.Error, EOFError, ValueError):
        return audio_bytes, None, "invalid_wav"

    if sample_width != 2:
        return audio_bytes, None, "unsupported_sample_width"

    if channels < 1 or frame_rate <= 0 or frame_count <= 0:
        return audio_bytes, None, "invalid_wav_params"

    duration_seconds = frame_count / frame_rate
    if duration_seconds < 0.45:
        return audio_bytes, None, "audio_too_short_for_speedup"

    frame_size = sample_width * channels
    source_frames = [
        frames[index : index + frame_size]
        for index in range(0, len(frames), frame_size)
        if len(frames[index : index + frame_size]) == frame_size
    ]
    target_count = max(1, int(len(source_frames) / speed_factor))
    sped_frames = bytearray(target_count * frame_size)

    for target_index in range(target_count):
        source_index = min(int(target_index * speed_factor), len(source_frames) - 1)
        start = target_index * frame_size
        sped_frames[start : start + frame_size] = source_frames[source_index]

    output = io.BytesIO()
    with wave.open(output, "wb") as writer:
        writer.setnchannels(channels)
        writer.setsampwidth(sample_width)
        writer.setframerate(frame_rate)
        writer.writeframes(bytes(sped_frames))

    optimized = output.getvalue()
    if len(optimized) >= len(audio_bytes):
        return audio_bytes, None, "no_size_gain"
    return optimized, speed_factor, "experimental_speedup"
