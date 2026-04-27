# 🎯 Plano Sequencial Perfeito — RefinaVoz

> Este documento é a ordem exata de execução para construir o RefinaVoz
> do zero até o primeiro uso real no desktop. Cada passo depende do
> anterior. Nenhum passo pode ser pulado. O critério de "pronto" de cada
> passo é explícito para que qualquer agente de código (humano ou IA) saiba
> quando avançar.

---

## Leitura obrigatória antes de tocar em qualquer código

| Documento | Onde está | O que ensina |
|---|---|---|
| Blueprint do RefinaVoz | `PLANOS/refinavoz_blueprint.md` | Arquitetura, modos, pipeline, dicionário, UX |
| Análise AutoJuris | `ORIGEM/analise_logica.md` | Rotação de chaves, fallback, httpx puro |
| Engenharia Reversa Prompt-Brain | `D:\DOWNLOAD\prompt-brain\docs\engenharia_reversa.md` | Meta-prompts, XML tags, Thinking Budget |
| Novos Prompts de Origem | `D:\DOWNLOAD\prompt-brain\docs\novos_prompts_origem.md` | Templates XML estritos para Gemini 3.1 |
| Auditoria Vibe Coding 2026 | `D:\DOWNLOAD\prompt-brain\docs\auditoria_prompts_vibe_coding_2026.md` | Técnicas SOTA: CoT, delimitadores, cérebro semântico |
| Gemini 3.1 Flash-Lite | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-preview | Modelo alvo, limites, thinking minimal |
| Google GenAI SDK | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/sdks/overview | SDK oficial, referência de integração |

---

## Anti-escopo (o que NÃO fazer em nenhuma fase)

- ❌ Android
- ❌ Multiusuário / Autenticação
- ❌ SaaS / Painel web externo
- ❌ Analytics pesados
- ❌ Sync com nuvem
- ❌ Function calling complexo
- ❌ Context window gigante (>8k tokens por chamada)
- ❌ Electron (Tauri é a escolha; Electron é plano C)

---

## Regras mandatórias para o agente code

1. **Máximo 350 linhas por arquivo.** Se passou, quebre.
2. **Chaves no `.env`, nunca no código.** Sem exceção.
3. **Toda função pública tem docstring e type hints.**
4. **Imports: módulos internos usam caminhos relativos ao pacote.**
5. **Todo endpoint retorna um schema Pydantic.** Nenhum `dict` solto.
6. **Logs estruturados com trace_id.** Sem `print()`.
7. **Prompts moram em `prompts/*.md`.** Nunca hardcoded.
8. **Um commit por passo.** Mensagem no formato: `feat(passo-N): descrição`.

---

## PASSO 0 — Fundação técnica do ambiente

### O que fazer
- Garantir Python 3.11+ disponível e funcional.
- Criar venv dentro de `backend/`.
- Instalar dependências: `fastapi`, `uvicorn`, `httpx`, `pydantic`, `pydantic-settings`, `python-dotenv`, `sounddevice`, `soundfile`, `numpy`, `pytest`, `pytest-asyncio`.
- Criar `.env` na raiz com `GEMINI_API_KEYS=sua-chave-aqui`.
- Garantir Node.js 18+ e npm disponível.
- Garantir Rust toolchain instalado (necessário para Tauri).

### Critério de pronto
```
python --version   → 3.11+
pip install -r backend/requirements.txt   → sem erros
node --version   → 18+
rustc --version   → instalado
```

---

## PASSO 1 — Backend esqueleto completo (sem LLM real)

### O que fazer
1. Criar `backend/__init__.py` (vazio).
2. Criar `backend/core/__init__.py` (vazio).
3. Criar `backend/core/config.py` — carrega `.env`, expõe `Settings` com property `GEMINI_API_KEYS`.
4. Criar `backend/core/logger.py` — logger estruturado com formato `timestamp | level | [file:line] | msg`.
5. Criar `backend/schemas/__init__.py` (vazio).
6. Criar `backend/schemas/models.py` — schemas Pydantic: `ProcessingMetrics`, `ProcessResponse`, `DictionaryEntry`, `PromptContent`.
7. Criar `backend/services/__init__.py` (vazio).
8. Criar `backend/services/prompt_engine.py` — função `load_prompt(mode: str) -> str` que lê `prompts/{mode}.md`.
9. Criar `backend/services/dictionary.py` — classe `SemanticDictionary` com método `apply(text, mode) -> (cleaned, applied_terms)`. Começa com dict estático em memória.
10. Criar `backend/services/llm_client.py` — função `process_with_llm(raw_text, system_instruction) -> (text, metrics)`. **Neste passo, retorna texto mockado.** A integração real vem no Passo 3.
11. Criar `backend/api/__init__.py` (vazio).
12. Criar `backend/api/router.py` — rotas: `GET /health`, `POST /process/texto`, `POST /dictionary`, `GET /prompts/{mode}`, `PUT /prompts/{mode}`.
13. Criar `backend/main.py` — FastAPI app com CORS, monta o router em `/api/v1`.

### Critério de pronto
```
uvicorn backend.main:app --reload
GET  http://localhost:8000/api/v1/health         → {"status": "ok"}
POST http://localhost:8000/api/v1/process/texto   → retorna ProcessResponse com texto mockado
GET  http://localhost:8000/api/v1/prompts/normal  → retorna conteúdo do prompts/normal.md
```

---

## PASSO 2 — Testes unitários do backend (TDD gate)

### O que fazer
1. Criar `testes/conftest.py` — fixtures de teste (client HTTP do FastAPI via `httpx.AsyncClient`).
2. Criar `testes/test_dictionary.py` — prova que "esquilos" → "skills", "reack" → "react", e que termos fora do modo não são aplicados.
3. Criar `testes/test_prompt_engine.py` — prova que `load_prompt("normal")` retorna conteúdo, e que modo inexistente retorna fallback seguro.
4. Criar `testes/test_endpoints.py` — testa status HTTP de cada rota, valida que o JSON retornado casa com o schema Pydantic.
5. Criar `testes/test_llm_rotation.py` — mocka `httpx.post` para simular 429 na primeira chave e sucesso na segunda. Prova que o ciclo funciona.

### Critério de pronto
```
pytest testes/ -v   → todos os testes passam, zero falhas
```

---

## PASSO 3 — Motor LLM real (Gemini 3.1 Flash-Lite via httpx)

### O que fazer
1. Substituir o mock de `llm_client.py` por chamada real:
   - POST para `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
   - Header `x-goog-api-key` com chave rotacionada via `itertools.cycle`.
   - Payload com `contents`, `systemInstruction`, `generationConfig` (temperature=0.2).
2. Implementar cascata de fallback:
   - 429 → tenta próxima chave.
   - SAFETY/RECITATION → tenta modelo `MODEL_FALLBACK` (gemini-2.5-flash).
   - 500/502/503 → retry com backoff exponencial (0.6s base, máximo 3 tentativas).
3. Extrair `usageMetadata` da resposta e popolar `ProcessingMetrics`.
4. Logar cada chamada com trace_id, modelo usado, latência, tokens.

### Critério de pronto
```
POST /api/v1/process/texto com raw_text="Olá, quero criar um app em react usando tauri"
→ Retorna texto refinado real do Gemini
→ metrics.latency_ms < 5000
→ metrics.provider_model = "gemini-3.1-flash-lite-preview"
```

---

## PASSO 4 — Prompts XML por modo

### O que fazer
1. Reescrever `prompts/normal.md` usando delimitadores XML estritos:
   ```xml
   <system_instruction>
   Você é um refinador semântico...
   <rules>1. Preserve significado...  2. Corrija ruídos...</rules>
   </system_instruction>
   ```
2. Criar `prompts/programador.md` — prioriza termos técnicos pt-en.
3. Criar `prompts/vibe_code.md` — extrai Objetivo/Contexto/Restrições/Saída.
4. Criar `prompts/mensagem.md` — tom informal, direto.
5. Criar `prompts/profissional.md` — tom formal, corporativo.
6. Criar `prompts/prompt.md` — gera prompts para outros LLMs (meta-prompting).
7. Atualizar `prompt_engine.py` para injetar `{{RAW_TEXT}}` e `{{DICTIONARY_TERMS}}` como variáveis de template dentro do XML.

### Critério de pronto
```
Cada modo gera resposta coerente e diferente para a mesma frase de entrada.
O modo vibe_code retorna blocos estruturados (Objetivo/Contexto/Restrições/Saída).
O modo prompt retorna um system prompt pronto para uso.
```

---

## PASSO 5 — Frontend Tauri: Shell mínimo funcional

### O que fazer
1. Rodar `npm install` no `frontend/`.
2. Configurar `tauri.conf.json`:
   - `alwaysOnTop: true`, `decorations: false`, `transparent: true`.
   - Tamanho inicial: 64×64 (botão). Expandível para 320×480 (painel).
3. Criar `src/App.tsx` — componente raiz com estados: `idle`, `recording`, `processing`, `result`.
4. Criar `src/components/FloatingButton.tsx` — botão circular com gradiente, animação pulse durante gravação. Draggável via `-webkit-app-region: drag`.
5. Criar `src/components/MiniPanel.tsx` — aparece ao hover (1.5s). Contém: seletor de modo, botão copiar, botão reprocessar, botão fechar.
6. Criar `src/components/ResultDisplay.tsx` — mostra o `final_text` retornado pelo backend com botão de copiar.
7. Criar `src/services/api.ts` — wrapper TypeScript para chamar `http://localhost:8000/api/v1/process/texto` e tipar a resposta com interface espelho do Pydantic.

### Critério de pronto
```
npm run dev   → webview abre
O botão flutuante aparece sobre todas as janelas.
Clicar alterna entre idle e recording (visual).
Hover abre o painel.
Selecionar modo e clicar "Processar" chama o backend e mostra resultado.
```

---

## PASSO 6 — Gravação de áudio no frontend

### O que fazer
1. Implementar captura de áudio via Web Audio API (`MediaRecorder`) no browser/webview.
2. Gravar em formato WebM/Opus (nativo do navegador).
3. Ao parar a gravação, enviar o blob como `multipart/form-data` para novo endpoint `POST /api/v1/process/audio`.
4. No backend: receber o arquivo, salvar temporariamente, enviar como `inlineData` (base64) ao Gemini para transcrição + refinamento em uma única chamada.
5. O Gemini 3.1 Flash-Lite é multimodal: ele recebe áudio e retorna texto refinado direto.

### Critério de pronto
```
Falar "eu quero criar uns esquilos de react no tauri"
→ Backend recebe o áudio
→ Gemini transcreve + refina
→ Frontend mostra: "Eu quero criar umas skills de React no Tauri"
→ Latência total < 5 segundos
```

---

## PASSO 7 — Dicionário semântico persistente (SQLite)

### O que fazer
1. Criar `backend/services/database.py` — inicializa SQLite, cria tabelas `dictionary_entries` e `correction_events`.
2. Migrar `SemanticDictionary` de dict estático para consulta SQLite.
3. Implementar endpoint `POST /api/v1/dictionary` — adiciona termo com `spoken_form`, `canonical_form`, `mode_scope`.
4. Implementar endpoint `DELETE /api/v1/dictionary/{id}`.
5. Implementar endpoint `GET /api/v1/dictionary?mode=programador` — lista termos filtrados por modo.
6. Na UI: adicionar botão "Corrigir termo" no `ResultDisplay` que permite ao usuário informar o erro e a correção, salvando automaticamente.

### Critério de pronto
```
Adicionar termo "esquilos" → "skills" via API
Processar texto com "esquilos" → retorna "skills" aplicado
Reiniciar o backend → o termo persiste (SQLite)
```

---

## PASSO 8 — Edição de prompts pela UI

### O que fazer
1. Criar `src/pages/PromptEditor.tsx` — textarea com preview markdown.
2. Carregar prompt atual via `GET /api/v1/prompts/{mode}`.
3. Salvar via `PUT /api/v1/prompts/{mode}`.
4. Adicionar botão "Editar prompts" no MiniPanel.
5. Validação: não permitir salvar prompt vazio ou sem tag `<system_instruction>`.

### Critério de pronto
```
Abrir editor → mostra prompt atual do modo selecionado.
Editar e salvar → próximo processamento usa o prompt novo.
```

---

## PASSO 9 — Histórico leve e reprocessamento

### O que fazer
1. Criar tabela `processing_history` no SQLite: `id, raw_text, final_text, mode, timestamp, trace_id`.
2. Salvar cada processamento automaticamente.
3. Criar endpoint `GET /api/v1/history?limit=20`.
4. Criar `src/components/HistoryPanel.tsx` — lista os últimos processamentos.
5. Botão "Reprocessar" em cada item: reenvia o `raw_text` para `/process/texto` com um modo diferente, se desejado.

### Critério de pronto
```
Processar 3 frases → aparecem no histórico.
Clicar "Reprocessar" em modo diferente → gera novo resultado.
```

---

## PASSO 10 — Polimento final e validação E2E

### O que fazer
1. Hotkey global (ex: `Ctrl+Shift+R`) para iniciar/parar gravação sem precisar clicar.
2. Auto-copiar resultado para clipboard após processamento.
3. Notificação discreta (toast) quando o resultado está pronto.
4. Ajustar animações: transição suave entre estados do botão.
5. Rodar todos os testes: `pytest testes/ -v`.
6. Teste manual completo:
   - Abrir VS Code.
   - Acionar RefinaVoz via hotkey.
   - Falar instrução técnica misturando português e termos em inglês.
   - Verificar que o texto refinado chega ao clipboard.
   - Colar no VS Code.
   - Confirmar que o fluxo levou menos de 5 segundos do momento que parou de falar.

### Critério de pronto
```
O fluxo completo (fala → texto útil no clipboard) funciona 10x seguidas sem erro.
A janela não trava, não consome mais de 150MB de RAM, não aparece na taskbar.
```

---

## Resumo visual do pipeline

```
┌──────────────┐
│ 🎤 Microfone │
└──────┬───────┘
       ▼
┌──────────────────┐
│ MediaRecorder     │  ← Frontend (Tauri/React)
│ (WebM/Opus)       │
└──────┬───────────┘
       ▼ multipart/form-data
┌──────────────────────────────────────────────────┐
│                BACKEND (FastAPI)                  │
│                                                   │
│  1. Recebe áudio                                  │
│  2. Detecta modo ativo                            │
│  3. Carrega subconjunto do dicionário (SQLite)    │
│  4. Aplica pré-correções locais                   │
│  5. Carrega prompt XML do modo                    │
│  6. Monta payload: systemInstruction + contents   │
│  7. Envia para Gemini (httpx + rotação de chaves) │
│  8. Extrai texto + métricas da resposta           │
│  9. Retorna ProcessResponse (Pydantic)            │
│ 10. Salva no histórico (SQLite)                   │
└──────────────────────┬───────────────────────────┘
                       ▼
              ┌────────────────┐
              │  Texto final    │
              │  + métricas     │  → Clipboard
              │  + termos used  │  → UI ResultDisplay
              └────────────────┘
```

---

## Primeiro commit ideal

```
feat(passo-0): fundação do projeto

- venv ativado, dependências instaladas
- .env configurado com GEMINI_API_KEYS
- Estrutura de pastas: backend/, frontend/, prompts/, testes/
- __init__.py em todos os pacotes Python
- Tauri inicializado com React + TypeScript
```

---

> **Lembrete final**: O RefinaVoz não compete por ser um ditado universal.
> Ele ganha por ser um **refinador pessoal de fala para texto com contexto
> técnico, modos operacionais e dicionário adaptativo**. Respeite o escopo.
> Primeiro funcionar. Depois aprender. Depois sofisticar.
