from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # API Keys configuradas no .env, separadas por vírgula se houver múltiplas
    GEMINI_API_KEYS_RAW: str = Field(default="", validation_alias="GEMINI_API_KEYS")
    
    # Modelos e timeout da Arquitetura Alvo
    MODEL_DEFAULT: str = "gemini-3.5-flash-lite"  # Motor de escrita rápida e refinamento
    MODEL_FALLBACK: str = "gemini-2.5-flash"      # Fallback de segurança e resiliência
    MODEL_PRO_TIER: str = "gemini-3.7-flash"      # Motor SOTA para raciocínio denso (Thinking)
    AUDIO_MODEL: str = "gemini-3.5-flash-lite"    # Motor multimodal de áudio direto
    LIVE_MODEL: str = "gemini-2.5-flash-native-audio" # Motor da Multimodal Live API
    AUDIO_PIPELINE_MODE: str = "single_pass"      # 'single_pass' (direto) ou 'two_pass' (STT -> LLM)
    THINKING_BUDGET_PRO: int = 2048               # Tokens de pensamento para modo denso
    
    AUDIO_OPTIMIZATION_ENABLED: bool = False
    AUDIO_OPTIMIZATION_MODE: str = "off"
    AUDIO_OPTIMIZATION_MAX_SPEED: float = 1.35
    MAX_AUDIO_UPLOAD_BYTES: int = 20 * 1024 * 1024
    
    # Flag explícita para forçar modo MOCK no desenvolvimento local sem chave
    USE_MOCK_LLM: bool = False
    
    LLM_TIMEOUT: int = 30
    
    @property
    def GEMINI_API_KEYS(self) -> List[str]:
        keys = [k.strip() for k in self.GEMINI_API_KEYS_RAW.split(",") if k.strip()]
        return keys if keys else ["TEST_KEY_REPLACE_ME"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
