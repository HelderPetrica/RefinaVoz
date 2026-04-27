---
name: refinavoz-specialist
description: Agente especializado na arquitetura full-stack do RefinaVoz (Tauri/React + FastAPI/Python). Fornece diretrizes sobre portas, modo mock e padrões de design.
---

# 🤖 RefinaVoz Specialist Skill

Esta skill treina agentes de código sobre a topologia e as regras de arquitetura do projeto **RefinaVoz**. 
Use este contexto antes de propor alterações na base de código.

## 📌 Topologia da Arquitetura
O projeto é um **Filtro de Fala SOTA** (State of the Art) dividido em 3 camadas:
1. **Frontend (React)**: Localizado em `frontend/src`. Representa a UI.
2. **Ponte Nativa (Tauri/Rust)**: Localizado em `frontend/src-tauri`. Controla a "Janela Flutuante" sobre o OS.
3. **Backend Engine (FastAPI)**: Localizado em `backend/`. Processa áudio/texto e se comunica com LLMs.

### 🔌 Portas e Inicialização
- **Backend**: Escuta na porta `14201`. Orquestrado via `python -m uvicorn backend.main:app`.
- **Frontend (Tauri dev)**: Porta `1420`.
- **Script Mestre**: O script `abrir_filtro_de_fala.bat` resolve toda a cadeia de execução.

## 🧠 Padrões de Design SOTA
- **Floating Widget UI**: O Tauri desenha uma bolha de 64x64px, sem bordas (`decorations: false`), transparente (`transparent: true`) e sempre no topo (`alwaysOnTop: true`).
  - **Arraste (Drag)**: Elementos visuais como o botão principal TEM que ter o atributo `data-tauri-drag-region` para que o botão flutuante possa ser arrastado.
- **Micro Interações SOTA**: SVG de ícones devem possuir `pointer-events: none` no CSS para permitir arrasto limpo.
- **EventBus Backend**: O FastAPI usa um EventDriven hook mode em `core/events.py` (`pre_process`, `post_process`, `on_error`).

## 🗝️ Variáveis de Ambiente & Mock Mode
O`.env` mestre fica na raiz do projeto (não dentro de backend/ ou frontend/):
- `USE_MOCK_LLM=true|false`: Fundamental para não gastar tokens desnecessariamente durante o debug local da interface.
- `GEMINI_API_KEYS`: Suporta múltiplas chaves separadas por vírgula para rotação. O core (`core/config.py`) extrai magicamente isso usando pydantic.

## 🚀 Como Expandir ou Dar Manutenção
Se você precisa construir novas features:
1. Trabalhe as rotas FastAPI no diretório `backend/api/`.
2. Para integrações com o sistema operacional, crie Comandos Rust em `src-tauri/src/lib.rs`.
3. Os Modos de Persona de LLM (Vibe Code, Profissional, etc) estão salvos com *Frontmatter Markdown* na pasta `prompts/`. Se criar um modo novo, só adicione um `.md` lá!
