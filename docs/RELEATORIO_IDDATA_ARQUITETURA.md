# 🧠 Relatório IDDATA: Engenharia Reversa e Arquitetura SOTA **RefinaVoz**

Este documento detalha exaustivamente a lógica, os esquemas, os endpoints e a estrutura do **RefinaVoz**, servindo como base técnica para estudo e evolução seguindo padrões de produtividade "Vibe Code".

---

## 1. Arquitetura de Alto Nível (HDC - High Definition Control)

O RefinaVoz utiliza uma arquitetura **Event-Driven Modular**. O fluxo de informação não é linear, mas sim um pipeline de transformações controladas por eventos.

```mermaid
graph TD
    A[Voz/Microfone] -->|Web Audio API| B[Frontend Tauri]
    B -->|POST /process/texto| C[FastAPI Backend]
    
    subgraph Pipeline Backend (EventBus)
        C --> D{Bus: pre_process}
        D -->|Hook: apply_dictionary| E[Dictionary Service]
        E -->|Texto Sanitizado| F[Prompt Engine]
        F -->|Bus: query_llm| G[LLM Client]
        G -->|Rotation & Fallback| H[Gemini API]
        H -->|Resposta Bruta| I{Bus: post_process}
        I -->|Hook: metrics_logger| J[Logger/Métricas]
    end
    
    J -->|JSON Tipado| K[Frontend: UI Update]
    K -->|Clipboard| L[Auto-Copy]
```

### 1.1 Hierarquia de Entradas e Contexto Opcional
Sob a reestruturação final, o pipeline suporta até 3 blocos por envio, mas manteve a fala como soberana:
1. **Entrada Principal (`raw_text`)**: A fala do usuário, que dita a intenção primária.
2. **Entrada Auxiliar 1 (`extra_text_context`)**: Texto manual colado pela UI (ex: trecho de código, erro de console).
3. **Entrada Auxiliar 2 (`extra_visual_context`)**: Contexto visual (Janela ativa/Recorte) opcional, suportado condicionalmente na API.

*Regra de Ouro (Anti-Escopo)*: A interface não deve monitorar clipboard eternamente ou tirar screenshots sem comando; tudo é focado na ação manual isolada e temporária.

---

## 2. O "Cérebro" Cognitivo (Prompt Engine SOTA)

Diferente de sistemas simplistas, o RefinaVoz trata prompts como **Skills** do sistema. Cada modo (Vibe Code, Programador, etc.) é um arquivo `.md` com **YAML Frontmatter**.

### Lógica de Carregamento
- **Frente 1 (Metadata)**: O motor extrai o nome e descrição do modo para a UI.
- **Frente 2 (Template)**: O sistema injeta o texto bruto e termos do dicionário em delimitadores XML (`<system_instruction>`, `<input_bruto>`).
- **Frente 3 (XML Isolation)**: O LLM opera dentro de tags XML para garantir que as instruções do sistema não se misturem com o input do usuário.

**Localização**: `backend/services/prompt_engine.py` e `prompts/*.md`.

---

## 3. Lógica de Rotação de Chaves (AutoJuris Inspired)

Para garantir resiliência e custo zero (usando o tier gratuito do Gemini), implementamos um **Round-Robin com Fallback**.

- **Resiliência**: Se uma chave retornar `429` (Quota Exceeded), o sistema captura a exceção e gira para a próxima chave instantaneamente.
- **Thread-Safety**: Uso de `itertools.cycle` garantido por um singleton para evitar conflitos de concorrência.
- **REST Nativo**: Bypass total de SDKs pesados. Chamadas via `httpx.AsyncClient` para latência mínima.

**Localização**: `backend/services/llm_client.py`.

---

## 4. Dicionário Semântico (Escopo & Proteção)

O dicionário é a primeira linha de defesa contra erros fonéticos comuns. Ele é segmentado por **escopos**:
- `global`: Termos como "esquilos" -> "skills".
- `programacao`: Proteção para frameworks e ferramentas (React, FastAPI, Tauri).
- `comunicacao`: Formatação de saudações e tons de fala.

**Mecanismo**: Injetado como um `hook` no `pre_process`. O texto chega ao Gemini já pré-corrigido, economizando tokens e raciocínio do modelo.

---

## 5. Esquemas e Tipagem (Pydantic v2)

Toda comunicação entre Frontend e Backend é estritamente validada via Pydantic. Não há "dicts" soltos circulando no sistema principal.

### Schema de Resposta (`ProcessResponse`)
```python
class ProcessResponse(BaseModel):
    raw_text: str               # O que veio do microfone
    final_text: str             # O que o GPT/Gemini refinou
    mode_used: str              # Qual modo estava ativo
    applied_dictionary_terms: List[str] # O que o dicionário pegou
    metrics: LLMMetrics         # Tempo, tokens, etc.
```

---

## 6. Endpoints do API

O backend expõe uma interface limpa e documentada pelo Swagger (`/docs`):

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/process/texto` | Endpoint principal de refinamento. Aceita `raw_text` e `mode`. |
| `GET` | `/prompts` | Lista todos os modos disponíveis e suas descrições. |
| `GET` | `/prompts/{mode}` | Retorna o conteúdo XML de um prompt para edição na UI. |
| `GET` | `/health` | Status do sistema e lista de hooks registrados no EventBus. |

---

## 7. Estrutura de Diretórios (Modularidade Total)

```
C:\1.1. FILTRO DE FALA\
├── .agents/                    # Orquestração de Agentes (Antigravity/Vibe Code)
│   ├── skills/                 # Skills locais (ex: code-review)
│   └── workflows/              # Fluxos automáticos (/review, /test)
├── backend/                    # Core (FastAPI)
│   ├── api/                    # Routers e Endpoints
│   ├── core/                   # Logger, Config, EventBus
│   ├── schemas/                # Modelos Pydantic v2
│   └── services/               # Lógica de negócio (LLM, Prompts, Dicionário)
├── frontend/                   # UI (Tauri v2 + React)
│   ├── src/                    # Componentes e Lógica App
│   └── src-tauri/              # Configuração Windows (Rust)
├── prompts/                    # "Skills" Semânticas (Arquivos .md)
├── testes/                     # TDD Suite (Pytest)
└── PLANOS/                     # Documentação de Design e Estratégia
```

---

## 8. Pendências e Próximos Passos (Roadmap)

1. **Persistência (Fase 4)**: Trocar dicionário estático por SQLite para permitir que o usuário salve novos termos via UI.
2. **Integração Áudio (Fase 3)**: Conectar o microfone do Frontend diretamente ao stream do backend.
3. **Hotkeys Globais**: Implementar atalho de teclado para disparar gravação mesmo com o app em segundo plano.
4. **Histórico Local**: Salvar os últimos 50 processamentos em banco local.

---

> [!TIP]
> Esta arquitetura foi desenhada para ser **sem medo**. A cobertura de testes (`testes/`) permite refatorar o motor de eventos ou trocar o modelo de LLM sem quebrar o processamento semântico.
