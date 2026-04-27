# 🛑 PLANO PENDENTE: Arquitetura Cognitiva Multi-Agente (Shadow API)

**Status:** Pausado ⏸️
**Motivo da Pausa:** Decisão arquitetural de estabilizar o MVP atual, organizar o repositório, versionar no GitHub e estruturar o deploy antes de adicionar nova complexidade sistêmica.

---

## 🎯 Objetivo da Arquitetura
Evoluir o atual `prompt_engine.py` de um script procedural para um sistema de roteamento semântico baseado em Agentes (sem utilizar frameworks pesados como LangChain). O foco é manter a filosofia "Zero-Fat" usando FastAPI e Pydantic.

## 🏗️ O que estava sendo desenhado (A "Shadow API")
A ideia da *Shadow API* é criar serviços isolados que rodam em paralelo ou em pipeline para tomar decisões antes de gerar o prompt final.

### Componentes Planejados:
1. **IntentRouterService:**
   - **Responsabilidade:** Analisar a entrada do usuário (texto + imagem) e decidir *qual* agente deve assumir a tarefa.
   - **Exemplo:** Se o usuário diz "arrume esse código", o *IntentRouter* direciona para o agente `VibeCodeAgent`. Se diz "escreva um e-mail formal", direciona para o `ProfissionalAgent`.
2. **Micro-Agentes Especializados:**
   - Classes isoladas em `backend/services/agents/` que respondem ao router.
   - Cada agente terá seu próprio `system_prompt` rigoroso e utilizará o **Gemini Lite** para tarefas rápidas operacionais e o **Gemini Flash** para processamento denso multimodal.
3. **Pipeline de Resolução (Chain of Thought local):**
   - O áudio entra -> `AudioTranscriber`
   - O texto vai para o -> `IntentRouterService` (Gemini Lite define a intenção)
   - O Agente selecionado assume e pede o Contexto Visual -> `VisionService`
   - O output é filtrado pelo -> `DictionaryService` (Proteção Semântica)
   - Retorno final para o Frontend / Injeção.

## 📝 Próximos Passos (Quando retomarmos este plano)
1. Criar a pasta `backend/services/agents/`.
2. Mover a lógica atual de "modos" (vibe_code, normal, etc) para dentro de classes de agentes isolados.
3. Implementar a tipagem forte do `IntentRouterService` usando Pydantic para forçar o Gemini a responder um JSON com a intenção exata.
4. Refatorar os testes em `test_prompt_engine.py` para usar o `Mock Mode` testando cada agente isoladamente.

---
*Este documento serve como um "Save State" da mente da engenharia. Podemos voltar a ele assim que o repositório estiver público e com a esteira de CI/CD (GitHub Actions / Tauri Build) estruturada.*