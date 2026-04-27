from pydantic import BaseModel, Field
from typing import List, Optional

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

class DictionaryEntry(BaseModel):
    spoken_form: str
    canonical_form: str
    mode_scope: str = "global"
