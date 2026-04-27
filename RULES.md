# ✅ Regras de Operação Agentic (RULES.md)

Este documento dita as normas inegociáveis para qualquer sistema, agente (incluindo eu, seu assistente Code) ou automação operando sobre o repositório **RefinaVoz**. Ele é baseado no manifesto **GOVCAP (Governança de Capacidades Agentic)**. 

---

## 🛑 HARD RULES (Bloqueios Inegociáveis)

### 1. Zero Auto-Aprovação em Escopos Críticos (SOD)
- **Regra**: Quem planeja não executa o commit cego. Todo commit, PR ou mudança em core logic do RefinaVoz **exige verificação cruzada** de um "Evidence Collector" ou aprovação humana.
- **Tratamento**: Caso altere rotas do FastAPI ou lógica em `src-tauri`, rode testes antes e apresente logs. 

### 2. Memória Não É Lixeira
- **Regra**: Nunca confie cegamente no contexto inflado da sessão (Session Context).
- **Tratamento**: Baseie-se apenas em arquivos persistentes de estado (`walkthrough.md`, `task.md`) ou no `AGENTS.md`. 

### 3. Progressive Disclosure (Camadas)
- **Regra**: Se estiver criando uma nova habilidade (Skill) para o projeto em `.agents/skills`, adicione Frontmatter no padrão YAML dizendo o nome, gatilhos de uso e as ferramentas permitidas (`allowed-tools`).
- **Tratamento**: Não crie "Mega Prompts" de mil linhas em um só lugar. Segmente em módulos como o `vibe_code.md` vs `programador.md`. 

### 4. Enforcement via Hooks Determísticos
- **Regra**: Preferimos que as proteções existam em código, de forma estruturada. 
- **Exemplo Realizado**: Para rodar o Backend de forma segura evitando gastos via APIs não intencionais, aplicamos a variável `USE_MOCK_LLM=true` (Políticas de Enforcement). Use as configurações a favor da governança, não tente dar "bypass" nas lógicas de proteção. 

## 🗺️ Fluxo de Entrega Obrigatório (O Padrão Ouro do RefinaVoz)
Toda tarefa complexa que você (Agente) receber deve seguir:
1. Ler as **Skills** relevantes (`.agents/skills/`).
2. Entender o **Plano Cognitivo** e Risco da Tarefa.
3. Sugerir mudanças via _Implementation Plan_ aprovado pelo Humano (Gate).
4. Proceder com a execução apenas usando `data-tauri-drag-region` (no UI) ou integrando corretamente os endpoints (`14201`).
5. Rodar a Evidência: `$ pytest` (Pipeline Backend) + Compilar via Tauri Cargo.
6. Entregar Documentação Viva: Atualizar o arquivo de `walkthrough.md` descrevendo os artefatos modificados.

_Estas regras substituem ou se sobrepõem a estilos arbitrários do LLM. O GOVCAP determina como operamos com Governança Agentic de código._
