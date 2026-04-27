# 🤖 Governança Agentic do RefinaVoz (AGENTS.md)

Este repositório adota o modelo **GOVCAP (Governed Capabilities for Agentic Programming)**. 
Abaixo estão as regras fundamentais de orquestração para qualquer Agente de IA iterando neste projeto.

## 1. Princípios de Governança GOVCAP
- **Artefatos > Conversa**: Utilize e crie Skills (em `.agents/skills/`) e Workflows (em `.agents/workflows/`) estruturados. Não conte com a "memória da conversa" para fluxos complexos.
- **Enforce > Instruir**: Sempre utilize hooks determinísticos, testes automatizados e compilações (`pytest`, `cargo run`, `npm test`) para aprovar edições (Gates obrigatórios).
- **Evidência > Confiança**: Requeremos logs, run pass/fail e diffs como evidência antes de iterar ou dar a tarefa como fechada.
- **Segregação de Funções (SOD)**: O agente que propõe uma mudança arquitetural severa deve apresentar um Plano de Implementação (Implementation Plan) aprovado pelo humano. Um fluxo nunca deve ser ideado, executado e auto-aprovado pela IA isoladamente sem gate.
- **Progressive Disclosure**: As Skills usarão o recurso de metadados via `frontmatter` para declarar gatilhos e `allowed-tools`.

## 2. Estrutura Agent-Native do Repositório
Qualquer agente observando o projeto RefinaVoz deve reconhecer o seguinte esqueleto de governança:

```text
c:\1.1. FILTRO DE FALA\
├── .agents/
│   ├── skills/          # Unidades de engenharia operacional (ex: code-review-specialist)
│   ├── workflows/       # Controle de fluxo declarativo (.md/yaml)
├── docs/                # Knowledge base e arquitetura interna (RAG e Humano)
├── RULES.md             # Regras hard limits para o Agente e LLMs
├── AGENTS.md            # Este arquivo de manifesto
```

## 3. Comportamento Esperado (Você, o Agente)
1. **Intake**: Quando acionado, classifique a intenção do usuário contra as SKILLS disponíveis na pasta `.agents/skills/`. Se existir uma Skill específica (`refinavoz-specialist`, `code-review`), assuma aquela postura antes de atuar.
2. **Execute com Limites (Least Privilege)**: Tente não alterar arquivos cruciais de core se não foram expressamente solicitados. Rode `pytest` ou `tauri dev` como gate final antes de avisar sucesso.
3. **Curadoria de Memória**: Salve o estado do projeto em sumários concisos usando `walkthrough.md` caso altere comportamentos vitais do sistema.

> *Qualquer agente atuando nesta base de código deve ler e absorver as prerrogativas do manifesto GovCap antes de invocar sua primeira tool de edição.*
