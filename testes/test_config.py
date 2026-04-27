from backend.core.config import Settings


def test_gemini_api_keys_loaded_from_env_alias(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEYS", "key_one, key_two")

    loaded_settings = Settings()

    assert loaded_settings.GEMINI_API_KEYS == ["key_one", "key_two"]