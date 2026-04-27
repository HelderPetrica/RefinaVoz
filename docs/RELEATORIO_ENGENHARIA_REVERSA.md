# Relatorio Completo de Engenharia Reversa do RefinaVoz

## 1. Resumo Executivo

O **RefinaVoz** e um aplicativo desktop local-first para transformar fala em texto profissional pronto para uso. Ele nao se limita a transcrever audio: a arquitetura foi desenhada para capturar fala ou texto bruto, aplicar pre-processamento semantico, escolher um prompt especializado, chamar uma LLM e devolver uma saida reaproveitavel no aplicativo onde o usuario estava trabalhando.

Na pratica, o sistema funciona como uma camada de transformacao entre a fala do usuario e artefatos de trabalho: mensagens, anotacoes, resumos, prompts tecnicos, fichas juridicas e outros formatos guiados por modo.

O projeto e hoje um stack hibrido composto por:

- **Frontend React + TypeScript** para a interface flutuante;
- **Shell nativo Tauri + Rust** para integracao com sistema operacional;
- **Backend FastAPI + Python** para pipeline de audio, prompts, dicionario, historico e chamadas a LLM;
- **Prompts em Markdown** como camada configuravel de comportamento;
- **SQLite local** como persistencia leve para historico e dicionario.

## 2. O Que o Projeto E

### Definicao funcional

O RefinaVoz e um widget flutuante desktop, sempre visivel e com foco em baixa friccao, que permite:

- gravar audio e transcrever;
- digitar ou editar texto manualmente;
- escolher ou criar modos de refinamento;
- aplicar correcoes semanticas locais;
- refinar a entrada com LLM;
- colar automaticamente o resultado na janela em foco;
- salvar historico local;
- operar como ferramenta pessoal para juridico, desenvolvimento e comunicacao.

### Definicao tecnica

O projeto e uma arquitetura orientada a camadas:

1. **Camada de captura e UX**: React/Tauri.
2. **Camada nativa de SO**: Rust/Tauri + Win32/Enigo.
3. **Camada de processamento**: FastAPI + services Python.
4. **Camada semantica**: prompts Markdown com frontmatter e XML.
5. **Camada de persistencia**: SQLite via SQLModel.

## 3. Base do Projeto

O projeto repousa sobre alguns pilares claros:

- **Windows-first**: a ponte nativa mais madura hoje e focada em Windows, com suporte inicial para macOS apenas em comandos basicos.
- **Local-first**: o app roda localmente; backend, historico e dicionario vivem na maquina do usuario.
- **Prompt-driven**: o comportamento principal nao esta hardcoded no Python; ele mora em `prompts/*.md`.
- **Modularidade forte**: hooks no frontend, services no backend, componentes pequenos e camadas separadas.
- **Governanca agentica**: o repositrio adota `AGENTS.md`, `.agents/skills/` e o modelo GOVCAP para disciplinar evolucao e revisao.
- **Evolucao incremental**: o projeto foi construindo primeiro a base de captura/refino, depois historico, depois modos, depois camada juridica lite.

## 4. O Que Ja Foi Implementado

### Funcionalidades operacionais

| Area | Status | O que existe hoje |
| --- | --- | --- |
| Widget flutuante | Implementado | Janela transparente, sempre no topo, redimensionamento dinamico e controle por Tauri |
| Gravacao de audio | Implementado | Captura via Web Audio API e codificacao manual para WAV PCM16 no frontend |
| Transcricao de audio | Implementado | Endpoint de audio usa `google-genai` para transcrever com Gemini |
| Transcricao local navegador | Implementado | Motor alternativo via Web Speech API |
| Refinamento por LLM | Implementado | Backend chama Gemini por HTTP com rotacao de chaves e fallback de modelo |
| Dicionario semantico | Implementado | Correcao local com escopos persistidos em SQLite |
| Historico local | Implementado | Historico de geracoes em SQLite + stats/preferencia no `localStorage` |
| Injecao de texto | Implementado no Windows | Captura janela em foco e cola via clipboard + Ctrl+V usando Rust |
| Atalhos globais | Implementado | Registro via plugin global shortcut do Tauri |
| Autostart | Implementado | Controle de inicializacao com o Windows via plugin Tauri |
| Prompt Studio | Implementado | Visualizacao dos modos, detalhes do prompt e criacao de novos modos com ajuda de IA |
| Modos juridicos | Implementado | Prompts juridicos dedicados + `legal_brain_lite` |
| Painel de status | Implementado | Diagnosticos do backend, chaves, runtime, autostart e microfone |
| OCR / captura visual real | Nao implementado | Existe apenas o canal `extra_visual_context`, mas sem pipeline real de captura |
| Context Hub de Excel/Markdown | Nao implementado | Existe estrategia e plano, mas nao o modulo de indexacao/recuperacao |
| Intent router automatico | Nao implementado | Hoje o modo e predominantemente manual |

### Modos semanticos disponiveis

Modos presentes em `prompts/`:

- `normal`
- `mensagem`
- `profissional`
- `programador`
- `vibe_code`
- `prompt`
- `juridico_atendimento`
- `juridico_whatsapp_cliente`
- `juridico_resumo_caso`
- `juridico_manifestacao_curta`
- `juridico_marketing_etico`
- `juridico_prompt_agente`

## 5. Como o Sistema Funciona

## 5.1 Fluxo principal de operacao

O fluxo real do app, olhando o codigo atual, e este:

```text
Usuario aciona atalho ou clica na bolha
-> frontend captura a janela alvo para futura injeção de texto
-> usuario grava audio OU usa Web Speech OU digita manualmente
-> frontend envia audio/texto ao backend
-> EventBus executa hooks de pre_process
-> dicionario aplica correcoes locais
-> prompt_engine monta prompt XML do modo
-> legal_brain_lite injeta contexto juridico, se aplicavel
-> llm_client chama Gemini
-> backend salva historico em SQLite
-> frontend recebe final_text
-> frontend injeta o texto refinado na janela capturada
-> historico e stats sao atualizados
```

## 5.2 Dois motores de entrada

Hoje o sistema oferece dois caminhos de entrada:

### A. Modo `gemini`

- o frontend usa `useAudioRecorder.ts`;
- captura microfone com `getUserMedia`;
- transforma buffers em WAV PCM16;
- envia o Blob para `POST /process/audio`;
- o backend transcreve o audio via SDK oficial do Google GenAI;
- o texto transcrito entra no pipeline de refinamento.

### B. Modo `web_speech`

- o frontend usa `useSpeechRecognition.ts`;
- o navegador faz transcricao incremental local via Web Speech API;
- o texto final vai para `POST /process/texto`;
- o backend trata esse texto como entrada principal.

## 5.3 Modo operandi do backend

O backend nao e apenas um proxy para Gemini. Ele orquestra um pipeline:

1. recebe texto ou audio;
2. gera `trace_id`;
3. dispara `pre_process` no `EventBus`;
4. aplica dicionario local por escopo;
5. carrega prompt por modo;
6. injeta placeholders e contextos auxiliares;
7. chama a LLM;
8. dispara `post_process`;
9. grava historico local;
10. devolve resposta tipada ao frontend.

## 6. Arquitetura Geral

## 6.1 Camadas da arquitetura

### Frontend

Local: `frontend/src`

Responsabilidades:

- renderizacao do widget;
- gerenciamento de estado de interface;
- captura de audio;
- fallback via Web Speech API;
- historico visual;
- controle de modo;
- tela de diagnostico;
- editor de dicionario;
- estúdio de prompts;
- comunicacao HTTP com o backend.

### Ponte nativa

Local: `frontend/src-tauri`

Responsabilidades:

- janela sempre no topo e transparente;
- system tray;
- atalhos globais;
- autostart;
- captura da janela em foco;
- restauracao de foco;
- simulacao de colar texto via atalho do SO;
- empacotamento desktop.

### Backend

Local: `backend/`

Responsabilidades:

- configuracao e ambiente;
- logger e eventos;
- processamento de audio;
- dicionario local;
- renderizacao de prompts;
- classificacao juridica lite;
- chamada a Gemini;
- historico e dicionario em banco;
- endpoints REST.

### Ativos semanticos e dados

Locais:

- `prompts/`
- `data/legal_brain_lite.json`
- `refinavoz.db`

Responsabilidades:

- definir o comportamento dos modos;
- armazenar conhecimento juridico lite;
- persistir historico e dicionario.

## 6.2 Estrutura resumida do projeto

```text
backend/
   api/
   core/
   schemas/
   services/

frontend/
   src/
      components/
      hooks/
      services/
   src-tauri/

prompts/
data/
docs/
testes/
.agents/
```

## 7. Modulos Principais

## 7.1 Backend

### `backend/main.py`

- inicializa FastAPI;
- carrega `.env`;
- configura CORS para `localhost:1420` e `tauri.localhost`;
- cria banco e inicializa dicionario no `lifespan`;
- monta o router em `/api/v1`.

### `backend/api/router.py`

Ponto central dos endpoints. Implementa:

- `POST /process/texto`
- `POST /process/audio`
- `GET /prompts`
- `GET /prompts/{mode}`
- `POST /prompts/generate`
- `POST /prompts`
- `GET /health`
- `GET /diagnostics`
- `GET /dictionary`
- `POST /dictionary`
- `DELETE /dictionary/{scope}/{wrong}`
- `GET /history`
- `DELETE /history`

### `backend/core/config.py`

- carrega configuracoes por `pydantic-settings`;
- trata `GEMINI_API_KEYS` como lista dinamica;
- define modelo principal, fallback, modelo de audio, timeout e mock mode.

### `backend/core/events.py`

- implementa um `EventBus` simples;
- permite hooks sincronas e assincronas;
- hoje o principal uso esta em `pre_process`, com o dicionario semanticamente plugado.

### `backend/core/database.py`

- cria engine SQLite via SQLModel;
- registra tabelas em `create_all`;
- expoe sessao compartilhada.

### `backend/services/dictionary.py`

- persiste correcoes em SQLite;
- faz seed inicial com termos tecnicos comuns;
- aplica correcoes case-insensitive antes da chamada ao LLM;
- organiza termos por escopo (`global`, `programacao`, `comunicacao`).

### `backend/services/prompt_engine.py`

- carrega prompts Markdown dinamicamente do diretorio `prompts/`;
- parseia frontmatter YAML simples;
- renderiza placeholders `{{RAW_TEXT}}`, `{{DICTIONARY_TERMS}}` e `{{LEGAL_BRAIN_CONTEXT}}`;
- injeta blocos `<contexto_textual>` e `<contexto_visual>` quando necessario;
- lista modos disponiveis sem enum fixo.

### `backend/services/llm_client.py`

- chama Gemini por `httpx` via REST;
- rotaciona chaves de API com `itertools.cycle`;
- trata 429 com troca de chave;
- usa modelo fallback em caso de `SAFETY`, `RECITATION` ou erros de servidor;
- expoe metrica de latencia, tokens, fallback e modelo final;
- suporta `USE_MOCK_LLM`.

### `backend/services/audio_transcriber.py`

- usa `google-genai` oficial;
- valida MIME type e tamanho do audio;
- transcreve usando o modelo de audio definido em `settings`;
- retorna apenas a transcricao crua, que depois entra no pipeline normal.

### `backend/services/legal_brain_lite.py`

- carrega `data/legal_brain_lite.json`;
- classifica sinais juridicos da fala por dominio e subarea;
- injeta principios, guardrails, termos de busca e perguntas criticas em XML;
- atua apenas em modos juridicos.

### `backend/schemas/models.py` e `db_models.py`

- definem contratos Pydantic de resposta (`ProcessResponse`, `ProcessingMetrics`);
- definem tabelas SQLModel (`DictionaryContext`, `PromptHistory`).

## 7.2 Frontend

### `frontend/src/App.tsx`

Orquestrador principal da UI. Ele compoe hooks e componentes, sem concentrar a logica pesada de negocio.

Responsabilidades:

- alternar paineis;
- controlar motor de entrada (`gemini` ou `web_speech`);
- acionar processamento de audio/texto;
- registrar atalhos globais;
- capturar alvo para injecao;
- disparar refresh de diagnosticos;
- coordenar historico, dicionario e Prompt Studio.

### Componentes principais

- `FloatingButton.tsx`: bolha principal, estados de gravacao/processamento/sucesso, historico, status, esconder no tray e grip de arraste.
- `MiniPanel.tsx`: painel compacto com textarea, seletor de modo, engine, autostart, acesso ao dicionario e Prompt Studio.
- `PromptStudio.tsx`: galeria de modos, visualizacao do prompt, criacao manual de novos modos e geracao assistida por IA.
- `HistoryPanel.tsx`: mostra ultimas geracoes, expande item, copia resultado e limpa historico.
- `DictionaryEditor.tsx`: CRUD simples do dicionario tecnico local.
- `WidgetStatus.tsx`: painel de diagnostico do runtime.
- `LiveTranscript.tsx`: feedback visual durante gravacao.

### Hooks principais

- `useAudioRecorder.ts`: grava audio e codifica WAV no cliente.
- `useSpeechRecognition.ts`: fallback de transcricao via Web Speech API.
- `useGlobalShortcuts.ts`: registra atalhos globais via Tauri.
- `useFloatingWindow.ts`: muda tamanho e foco da janela conforme os paineis abertos.
- `useTextInjection.ts`: captura o alvo e injeta texto apos o processamento.
- `useLocalMemory.ts`: sincroniza historico do backend e estatisticas locais.
- `useAutostart.ts`: liga e desliga o inicio automatico com o sistema.

### `frontend/src/services/apiClient.ts`

- centraliza a URL do backend;
- tipa todas as respostas;
- encapsula chamadas para processamento, prompts, diagnosticos e historico.

## 7.3 Ponte Tauri / Rust

### `src-tauri/tauri.conf.json`

- define a janela principal como transparente, `alwaysOnTop`, sem decoracao e fora da taskbar;
- usa `beforeDevCommand` para `npm run dev` e `beforeBuildCommand` para `npm run build`;
- fixa o backend em `http://localhost:14201` via CSP.

### `src-tauri/src/lib.rs`

Implementa a parte nativa mais importante do app:

- `get_foreground_window_handle()` no Windows;
- `restore_focus_and_paste()` com Win32 + Enigo;
- variante basica para macOS;
- criacao de tray icon;
- menu contextual de tray;
- comportamento close-to-tray;
- registro dos comandos invocaveis pelo frontend.

### `src-tauri/Cargo.toml`

Bibliotecas nativas principais:

- `tauri`
- `tauri-plugin-opener`
- `tauri-plugin-autostart`
- `tauri-plugin-global-shortcut`
- `enigo`
- `windows`

## 8. Camada de Prompts

## 8.1 Estrutura

Cada prompt em `prompts/*.md` combina:

- frontmatter com `name`, `description` e, em varios casos, `mode_scope`;
- corpo em XML delimitado por blocos como `<system_instruction>`, `<rules>`, `<persona>`, `<input_bruto>` e blocos auxiliares.

## 8.2 Papel da camada semantica

Essa camada e o verdadeiro motor de comportamento do RefinaVoz. O backend nao decide sozinho "como escrever"; ele delega a modo e estilo aos prompts.

Isso permite:

- mudar comportamento sem alterar Python;
- criar modos novos pela interface;
- separar juridico, programacao e comunicacao;
- tratar o sistema como plataforma de workflows de saida.

## 8.3 Camada juridica recente

Os prompts juridicos sao reforcados por `legal_brain_lite`, que injeta:

- principios cognitivos juridicos;
- guardrails;
- dominios detectados;
- subareas;
- termos de busca;
- perguntas criticas.

Importante: isso nao e um motor completo de pesquisa juridica. E uma camada lite de metodo, inspirada no AutoJuris, para orientar melhor a redacao sem transformar o app em um sistema de analise processual completa.

## 9. Banco de Dados e Persistencia

O projeto usa **SQLite** local com SQLModel.

### Tabelas atuais

- `DictionaryContext`
   - escopo
   - termo falado errado
   - termo correto

- `PromptHistory`
   - `trace_id`
   - modo
   - texto bruto
   - texto final
   - latencia
   - timestamp

### Persistencia hibrida

- **SQLite**: historico real e dicionario.
- **localStorage**: estatisticas leves e preferencia de modo.

## 10. Aspectos Tecnicos Relevantes

## 10.1 Portas e runtime

- Backend: `127.0.0.1:14201`
- Frontend dev: `http://localhost:1420`
- Tauri aponta para `tauri.localhost` em runtime.

## 10.2 Injeção de texto

O fluxo de injecao e pragmatco:

1. captura a janela atual antes de gravar;
2. salva o clipboard existente;
3. copia o texto refinado para o clipboard;
4. restaura o foco na janela anterior;
5. simula `Ctrl+V` no Windows ou `Cmd+V` no macOS;
6. tenta restaurar o clipboard anterior depois.

## 10.3 Diagnosticos

O endpoint `/diagnostics` permite ao frontend expor:

- status geral do backend;
- mock mode ligado ou desligado;
- modelo principal e fallback;
- modelo de audio;
- quantidade de chaves validas;
- modos carregados;
- hooks registrados.

## 10.4 Janela flutuante

A janela nao e estatica. `useFloatingWindow.ts` alterna entre presets:

- bolha: `112x112`
- painel: `340x540`
- studio/dicionario: `460x680`

Tambem altera dinamicamente `focusable`, para manter o widget leve quando apenas flutuando e utilizavel quando um painel esta aberto.

## 10.5 Limites atuais

Do ponto de vista de codigo e arquitetura, os principais limites atuais sao:

- ainda nao existe `Context Hub` para Excel/Markdown;
- ainda nao existe `intent_router` automatico;
- o dicionario juridico dedicado ainda nao foi separado dos escopos atuais;
- o suporte macOS e superficial comparado ao Windows;
- ainda nao ha pipeline real de contexto visual/OCR;
- o `llm_client` ainda cria um `httpx.AsyncClient` por chamada, o que e simples, mas nao otimizado.

## 11. Bibliotecas Utilizadas

## 11.1 Backend Python

- `fastapi`: camada HTTP e roteamento.
- `uvicorn`: servidor ASGI.
- `httpx`: cliente HTTP assíncrono para Gemini.
- `pydantic`: contratos de entrada/saida.
- `pydantic-settings`: configuracao por `.env`.
- `python-dotenv`: carregamento de variaveis locais.
- `python-multipart`: formularios e upload de audio.
- `google-genai`: SDK oficial para transcricao de audio.
- `sqlmodel`: ORM leve sobre SQLite.
- `pytest` e `pytest-asyncio`: testes.

## 11.2 Frontend

- `react` e `react-dom`: composicao da interface.
- `typescript`: tipagem.
- `vite`: bundling e dev server.
- `@tauri-apps/api`: comunicacao com a shell nativa.
- `@tauri-apps/plugin-autostart`: iniciar com o sistema.
- `@tauri-apps/plugin-global-shortcut`: atalhos globais.
- `@tauri-apps/plugin-opener`: abrir recursos do sistema.

## 11.3 Ponte nativa / Rust

- `tauri`: shell desktop.
- `tauri-build`: build do app.
- `serde` e `serde_json`: serializacao.
- `enigo`: simulacao de teclado.
- `windows`: acesso a Win32.

## 11.4 APIs e recursos do navegador

- `navigator.mediaDevices.getUserMedia`
- `AudioContext`
- `ScriptProcessorNode`
- `SpeechRecognition/webkitSpeechRecognition`
- `navigator.clipboard`

## 12. Suite de Testes

O diretorio `testes/` mostra que o projeto ja possui cobertura direcionada para partes centrais:

- `test_audio_transcriber.py`
- `test_config.py`
- `test_e2e_smoke.py`
- `test_eventbus.py`
- `test_integration_scenarios.py`
- `test_llm_mock_mode.py`
- `test_llm_rotation.py`
- `test_prompt_engine.py`
- `test_semantic_protection.py`
- `test_smoke_endpoints.py`

Os testes focam principalmente em:

- configuracao;
- rotacao de chaves;
- modo mock;
- prompts;
- EventBus;
- protecao semantica;
- smoke tests da API.

## 13. Base Conceitual e Direcao do Produto

O codigo atual mostra claramente duas fases coexistindo:

### Base original

- foco em produtividade geral;
- modos `normal`, `mensagem`, `profissional`, `programador`, `vibe_code` e `prompt`;
- widget desktop leve com injecao de texto.

### Base evoluida

- reposicionamento como camada de transformacao profissional da fala;
- incorporacao de modos juridicos;
- uso de `legal_brain_lite` para metodo juridico;
- estrategia de evoluir para `Context Hub` e roteamento inteligente.

Portanto, a base do projeto hoje e **hibrida**, mas coesa:

- um **core de fala -> refinamento -> injecao**;
- uma **camada de modos especializados**;
- uma **expansao juridica controlada**;
- uma **ponte nativa orientada a fluxo de trabalho real no desktop**.

## 14. Conclusao da Engenharia Reversa

O RefinaVoz ja nao e um prototipo vazio. Ele possui uma base funcional relativamente solida, com:

- frontend operacional;
- backend tipado;
- transcricao de audio real;
- refinamento por Gemini;
- persistencia local;
- injecao no aplicativo de origem;
- modos configuraveis;
- camada juridica lite;
- testes focados nas partes sensiveis.

O que o projeto ainda nao e:

- um sistema completo de pesquisa juridica;
- um RAG local de planilhas e Markdown;
- um roteador automatico de intencao;
- um produto multi-plataforma maduro.

O que ele ja e, olhando o codigo atual:

> uma plataforma desktop local de transformacao profissional da fala, baseada em prompts, com integracao nativa ao sistema operacional e caminho claro de especializacao juridica e tecnica.

