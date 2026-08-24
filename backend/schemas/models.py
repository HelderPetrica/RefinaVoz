from pydantic import BaseModel, Field
from typing import List, Optional


class AudioOptimizationMetadata(BaseModel):
    mode: str = Field(default="off")
    enabled: bool = Field(default=False)
    audio_changed: bool = Field(default=False)
    original_size_bytes: int = Field(default=0)
    optimized_size_bytes: Optional[int] = Field(default=None)
    speed_factor: Optional[float] = Field(default=None)
    mime_type: str = Field(default="audio/wav")
    sensitive_mode: bool = Field(default=False)
    decision: str = Field(default="skip")
    reason: Optional[str] = Field(default=None)
    transcription_ms: Optional[int] = Field(default=None)
    total_endpoint_ms: Optional[int] = Field(default=None)
    fallback_used: bool = Field(default=False)

class ProcessingMetrics(BaseModel):
    latency_ms: int = Field(default=0, description="Tempo total do ciclo LLM")
    prompt_tokens: int = Field(default=0)
    completion_tokens: int = Field(default=0)
    fallback_used: bool = Field(default=False, description="True se a Key principal ou modelo principal deram 429/Safety")
    provider_model: str = Field(..., description="Qual modelo finalmente retornou a resposta")

class ProcessResponse(BaseModel):
    raw_text: str = Field(..., description="A fala bruta após o pre-processamento local")
    final_text: str = Field(..., description="Refinamento limpo pelo Cérebro")
    mode_used: str = Field(..., description="O modo que contextualizou o prompt")
    applied_dictionary_terms: List[str] = Field(default_factory=list, description="Palavras protegidas pelo dicionário local")
    metrics: ProcessingMetrics
    audio_optimization: Optional[AudioOptimizationMetadata] = Field(default=None)

class DictionaryEntry(BaseModel):
    spoken_form: str
    canonical_form: str
    mode_scope: str = "global"
