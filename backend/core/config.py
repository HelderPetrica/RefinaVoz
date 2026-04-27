from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # API Keys configuradas no .env, separadas por vírgula se houver múltiplas
    GEMINI_API_KEYS_RAW: str = Field(default="", validation_alias="GEMINI_API_KEYS")
    
    # Modelos e timeout
    MODEL_DEFAULT: str = "gemini-3.1-flash-lite-preview"
    MODEL_FALLBACK: str = "gemini-2.5-flash"
    MODEL_PRO_TIER: str = "gemini-3.1-pro-preview"
    AUDIO_MODEL: str = "gemini-3-flash-preview"
    
    # Flag explícita para forçar modo MOCK no desenvolvimento local sem chave
    USE_MOCK_LLM: bool = False
    
    LLM_TIMEOUT: int = 30
    
    @property
    def GEMINI_API_KEYS(self) -> List[str]:
        keys = [k.strip() for k in self.GEMINI_API_KEYS_RAW.split(",") if k.strip()]
        return keys if keys else ["TEST_KEY_REPLACE_ME"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
