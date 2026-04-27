---
name: code-review-specialist
description: Revisão profunda de código Python/FastAPI/React com foco em segurança, performance e padrões do RefinaVoz. Usar quando houver edições em arquivos .py ou .tsx, ou quando o usuário pedir revisão, análise de qualidade ou auditoria de código.
---

# Skill: Code Review Specialist (RefinaVoz)

Especialista em revisão de código para o stack específico deste projeto:
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, httpx assíncrono, SQLite
- **Frontend**: React + TypeScript, Tauri v2
- **Infra**: Prompts XML, rotação de API keys, dicionário semântico

## Prioridades de Revisão (em ordem)

1. **Segurança**
   - API keys expostas no frontend ou em logs
   - Inputs de áudio/texto sem sanitização
   - Injeção via prompts (prompt injection)
   - Dados do dicionário pessoal sem validação

2. **Performance**
   - Chamadas síncronas onde deveria ser async
   - Carregamento de prompts .md em cada request (deveria cachear)
   - Re-criação de httpx.AsyncClient por chamada (deveria reutilizar)
   - Dicionário escaneado linearmente em textos grandes

3. **Tipagem e Schemas**
   - Funções públicas sem type hints
   - Endpoints retornando `dict` ao invés de schema Pydantic
   - Campos opcionais sem `Optional` explícito
   - Enums para modos ao invés de strings soltas

4. **Modularidade**
   - Arquivo > 350 linhas → deve ser quebrado
   - Funções > 30 linhas → deve ser extraída
   - Lógica de negócio dentro de routers → mover para services
   - Imports circulares

5. **Testes**
   - Código novo sem teste correspondente em `testes/`
   - Mocks ausentes para chamadas externas (httpx, sqlite)
   - Testes sem assertions claras

## Formato de Saída

Para cada achado:

| Campo | Conteúdo |
|---|---|
| **Severidade** | 🔴 Crítico / 🟡 Aviso / 🟢 Sugestão |
| **Categoria** | Segurança / Performance / Tipagem / Modularidade / Testes |
| **Arquivo** | Caminho relativo + número da linha |
| **Problema** | Descrição concisa |
| **Correção** | Código exemplo ou instrução |

## Regras Inegociáveis

- Nunca aprovar código que exponha `GEMINI_API_KEYS` fora do backend
- Nunca aprovar `print()` — usar `logger` sempre
- Nunca aprovar endpoint sem schema Pydantic de retorno
- Nunca aprovar prompt hardcoded — deve vir de `prompts/*.md`
