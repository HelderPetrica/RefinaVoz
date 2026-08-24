import io
import math
import struct
import wave

from backend.core.config import Settings, settings
from backend.services.audio_optimizer import audio_optimizer
from backend.services.audio_quality_gate import assess_transcription_quality


def make_pcm_wav(duration_seconds: float = 1.0, sample_rate: int = 16000) -> bytes:
    frame_count = int(duration_seconds * sample_rate)
    output = io.BytesIO()
    with wave.open(output, "wb") as writer:
        writer.setnchannels(1)
        writer.setsampwidth(2)
        writer.setframerate(sample_rate)
        frames = bytearray()
        for index in range(frame_count):
            sample = int(12000 * math.sin(2 * math.pi * 440 * index / sample_rate))
            frames.extend(struct.pack("<h", sample))
        writer.writeframes(bytes(frames))
    return output.getvalue()


def test_audio_optimization_defaults_off():
    loaded_settings = Settings()

    assert loaded_settings.AUDIO_OPTIMIZATION_ENABLED is False
    assert loaded_settings.AUDIO_OPTIMIZATION_MODE == "off"
    assert loaded_settings.AUDIO_OPTIMIZATION_MAX_SPEED == 1.35


def test_metadata_only_does_not_change_audio():
    original_enabled = settings.AUDIO_OPTIMIZATION_ENABLED
    original_mode = settings.AUDIO_OPTIMIZATION_MODE

    settings.AUDIO_OPTIMIZATION_ENABLED = True
    settings.AUDIO_OPTIMIZATION_MODE = "metadata_only"

    try:
        audio_bytes = b"RIFF....WAVE"
        prepared_audio, metadata = audio_optimizer.prepare(audio_bytes, "audio/wav", "normal")

        assert prepared_audio == audio_bytes
        assert metadata is not None
        assert metadata.mode == "metadata_only"
        assert metadata.audio_changed is False
        assert metadata.decision == "observe"
    finally:
        settings.AUDIO_OPTIMIZATION_ENABLED = original_enabled
        settings.AUDIO_OPTIMIZATION_MODE = original_mode


def test_legal_mode_forces_sensitive_skip():
    original_enabled = settings.AUDIO_OPTIMIZATION_ENABLED
    original_mode = settings.AUDIO_OPTIMIZATION_MODE

    settings.AUDIO_OPTIMIZATION_ENABLED = True
    settings.AUDIO_OPTIMIZATION_MODE = "experimental_speedup"

    try:
        _, metadata = audio_optimizer.prepare(b"RIFF....WAVE", "audio/wav", "juridico_atendimento")

        assert metadata is not None
        assert metadata.sensitive_mode is True
        assert metadata.decision == "skip"
        assert metadata.reason == "legal_sensitive_mode"
    finally:
        settings.AUDIO_OPTIMIZATION_ENABLED = original_enabled
        settings.AUDIO_OPTIMIZATION_MODE = original_mode


def test_experimental_speedup_shortens_safe_wav():
    original_enabled = settings.AUDIO_OPTIMIZATION_ENABLED
    original_mode = settings.AUDIO_OPTIMIZATION_MODE
    original_speed = settings.AUDIO_OPTIMIZATION_MAX_SPEED

    settings.AUDIO_OPTIMIZATION_ENABLED = True
    settings.AUDIO_OPTIMIZATION_MODE = "experimental_speedup"
    settings.AUDIO_OPTIMIZATION_MAX_SPEED = 1.35

    try:
        audio_bytes = make_pcm_wav()
        prepared_audio, metadata = audio_optimizer.prepare(audio_bytes, "audio/wav", "normal")

        assert metadata is not None
        assert metadata.audio_changed is True
        assert metadata.decision == "optimized"
        assert metadata.reason == "experimental_speedup"
        assert metadata.speed_factor == 1.35
        assert metadata.optimized_size_bytes == len(prepared_audio)
        assert len(prepared_audio) < len(audio_bytes)
    finally:
        settings.AUDIO_OPTIMIZATION_ENABLED = original_enabled
        settings.AUDIO_OPTIMIZATION_MODE = original_mode
        settings.AUDIO_OPTIMIZATION_MAX_SPEED = original_speed


def test_quality_gate_empty_transcript():
    assessment = assess_transcription_quality("")

    assert assessment.ok is False
    assert assessment.should_retry_original is True
    assert "empty_transcript" in assessment.reasons
