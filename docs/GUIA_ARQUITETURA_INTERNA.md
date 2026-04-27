# 🧠 Guia de Arquitetura e Instruções Internas (RefinaVoz)

Este documento centraliza as definições da arquitetura atual, decisões técnicas e lacunas (gaps) identificados na auditoria de 08/Abril/2026. Este material serve tanto para **treinamento humano** quanto para ser consumido via RAG (Retrieval-Augmented Generation) para **agentes internos**.

## 1. Visão Geral do Produto
O *RefinaVoz* atua como um widget SOTA (State of the Art) para o Windows, aparecendo como um globo flutuante translúcido. Ele é um filtro de comunicação contínuo: 
- Captura o áudio (via Web Speech API / Tauri).
- Pré-processa as palavras utilizando um dicionário (ex: *páiton* -> *Python*).
- Passa o ruído filtrado por um *Motor Semântico* (Prompts `.md`).
- Comunica as requisições a uma rotação dinâmica de chaves do Google Gemini e exibe o Output Refinado.

## 2. Tecnologias Empregadas

| Domínio | Escolha | Motivação |
|---|---|---|
| **Ponte de SO (Nativa)** | Rust + Tauri | Leveza assustadora frente ao Electron. Oferece as configs de UI flutuante transparente do Windows (`alwaysOnTop` / `transparent`). |
| **Interface / Componentes** | React (com Vite) | Rapidez de componentização para a barra HUD / modal das opções. |
| **Inteligência** | FastAPI (Python) | Desacopla a camada pesada do LLM do Tauri. Usa Pydantic para roteamento rigoroso. |

## 3. Comportamentos Notáveis do Padrão "Vibe Code / SOTA"
- **Floating UI e API `data-tauri-drag-region`**: Janelas criadas perfeitamente para flutuar sem a barra superior do Windows dependem fundamentalmente do Tauri injetando a classe de arranjo nativa em divs (o `main-button`).
- **Prompt Files as Assets**: A pasta `/prompts` usa manipulação de `.md` puro onde o *Frontmatter* atua como os metadados (nome da role, descrições).
- **Hardening Limpo**: Testado 100%. A flag de ambiente `USE_MOCK_LLM` na raiz evita consumos descontrolados da API durante o refino do UI.
- **Event Bus em FastAPI**: Ao invés de *spaghetti-code* linear, o backend usa sistema de emissões `bus.emit("pre_process")` para facilitar injeção de passos soltos no ciclo do refino.

## 4. Próxima Fronteira / Treinamento Ativo
As ordens ativas para o próximo ciclo baseadas no Mapeamento de Oportunidades:
- Implementar **Whisper API / Web Speech System** de forma nativamente profunda conectando o microfone físico sem emulações.
- Suporte expansivo ao tamanho da tela Tauri **para redimensionar em "on hover"** (sai de 64x64px para HUD longo sem cortes).
- Incorporação de **SQLite local** para registrar todo histórico refinado. 

**Lembre-se:** A magia do produto não está na quantia de código, está em esconder toda a espagueteria sob o polimento de UX (Transparente, Drag Local e Autonomia de Modos).
