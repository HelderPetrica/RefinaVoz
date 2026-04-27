# Análise de Lógica: AutoJuris para Filtro de Fala

Este documento extrai a lógica essencial do sistema AutoJuris (D:\DOWNLOAD\autojuris--análise-processual-jurídica (1)) para servir como base na construção do aplicativo **Filtro de Fala**.

## 1. Manipulação da Gemini API Key (Segurança e Escala)

A aplicação utiliza uma abordagem robusta de **Backend-Only Keys**, garantindo que o usuário nunca tenha acesso direto à API Key.

### Achados Relevantes:
- **Arquivo Central**: `api/llm/gemini_text.py` e `api/llm/gemini_text_v3.py`.
- **Rotação de Chaves**: O sistema aceita uma lista de chaves (`GEMINI_API_KEYS`). Ele usa `itertools.cycle` para alternar entre as chaves a cada requisição, evitando estourar quotas de uma única chave.
- **Requisição REST Direta**: Em vez de usar apenas a SDK padrão, o código faz chamadas `POST` via `httpx` diretamente para `generativelanguage.googleapis.com`.
- **Isolamento**: A chave é injetada no header `x-goog-api-key` apenas no servidor Python (Backend).

## 2. Lógica de Prompts (System Instructions)

O sistema diferencia claramente o "Corpo da Mensagem" da "Instrução de Sistema".

### Como adicionar o Filtro de Regionalidade:
Com base no arquivo `api/llm/gemini_text_v3.py` (linhas 148-163), a lógica de extração de `systemInstruction` permite definir o comportamento do agente ANTES dele processar o áudio/texto.

**Exemplo de Lógica para o Filtro de Regionalidade:**
```python
# No prompt de sistema, você deve definir a 'persona' regional
prompt_regional = {
    "systemInstruction": {
        "parts": [{"text": "Você é um especialista em transcrição e análise de fala regional. Sua tarefa é identificar sotaques, gírias e regionalismos específicos (ex: Nordeste, Sul, Interior de SP) e normalizar o texto mantendo o sentido original."}]
    }
}
```

## 3. Transcrição e Processamento de Áudio

Embora o sistema seja jurídico, ele possui uma estrutura de **Ingestão Multimodal** (Áudio/Vídeo).

### Arquivos Relacionados:
- `api/settings.py`: Define o modelo de transcrição (`Transcription Model`).
- `api/tests/test_ingest_pipeline.py`: Mostra como o arquivo `.mp3` é transformado em um `transcript` JSON com timestamps (start/end).
- `api/schemas/cases.py`: Define o objeto `audio_video_transcripts` que armazena o texto processado.

## 4. Lógica de Skills e Agentes (Agent Code Skills)

O controle do agente é feito via arquivos de **Plano de Decisão** (`AGENTES/01_PLANO_DECISAO_VIBE_CODE.md`).

### Estrutura de Decisão:
1. **Ponto Único de Verdade**: O agente sempre olha para um arquivo de contexto atualizado.
2. **Estratégia Híbrida**: O sistema alterna entre modelos (Flash para tarefas rápidas/baratas e Pro para análise profunda).
3. **Fallbacks**: Se o modelo `gemini-3-pro` falha (quota ou filtro de segurança), ele automaticamente tenta o `gemini-3-flash` ou `gemini-2.5-flash` (visto em `gemini_text.py`).

## 5. Lista de Arquivos Essenciais para Copiar/Estudar

| Arquivo | Função |
| :--- | :--- |
| `api/llm/gemini_text_v3.py` | Lógica principal de chamada e manipulação da Gemini API. |
| `api/llm/gemini_text.py` | Rotação de chaves e fallbacks de modelos. |
| `api/settings.py` | Configurações de timeouts e modelos padrão. |
| `AGENTES/01_PLANO_DECISAO_VIBE_CODE.md` | Lógica de como o agente "pensa" e toma decisões. |
| `api/services/upload_validator.py` | Validação de formatos de áudio (MP3, WAV, etc). |

---
**Próximo Passo Recomendado**: Implementar a função `_pick_api_key()` no seu projeto para garantir que você possa usar múltiplas chaves Gemini sem interrupções de quota.
