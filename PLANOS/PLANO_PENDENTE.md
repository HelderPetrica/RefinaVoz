# Plano Pendente: Perguntas para Elevar o RefinaVoz

## 1. Ideia Central

Este plano registra uma frente pendente de pesquisa e arquitetura: definir as perguntas certas para elevar o RefinaVoz de um sistema de captura e refinamento para um sistema semantico cognitivo.

O objetivo nao e adicionar contexto sem limite. O objetivo e organizar pensamento, padroes de decisao, preferencias, estilo de trabalho e formas recorrentes de planejamento do usuario.

Direcao desejada:

```text
fala + texto + tela + historico + padroes pessoais
-> organizacao semantica
-> raciocinio assistido
-> artefato profissional
-> aprendizado controlado
```

## 2. Pergunta Principal

> O que o RefinaVoz faz hoje, o que ele deveria compreender melhor e quais camadas cognitivas fariam a saida ficar progressivamente mais util para o usuario?

Essa pergunta deve guiar qualquer evolucao futura. Se uma feature nao melhora compreensao, organizacao, decisao ou producao profissional, ela nao deve entrar no nucleo.

## 3. O Que o Sistema Faz Hoje

Hoje o RefinaVoz ja possui:

- captura de fala;
- transcricao de audio;
- captura de texto externo;
- captura visual inicial;
- prompts por modo;
- dicionario local;
- historico local;
- injecao no app de origem;
- modos juridicos e tecnicos;
- uma camada inicial de inteligencia juridica lite.

Em termos cognitivos, ele ainda opera principalmente como:

```text
entrada bruta -> prompt especializado -> saida refinada
```

O proximo salto e transformar esse fluxo em:

```text
entrada bruta -> compreensao de intencao -> organizacao de contexto -> raciocinio guiado -> saida refinada -> memoria util
```

## 4. Perguntas Estruturantes

### 4.1 Sobre intencao

- O usuario quer escrever, resumir, responder, planejar, argumentar, revisar ou decidir?
- O pedido e juridico, tecnico, comunicacional, estrategico ou pessoal?
- Existe urgencia, risco, conflito, duvida ou necessidade de prudencia?
- O modo escolhido pelo usuario bate com a intencao real da fala?

### 4.2 Sobre contexto

- Qual parte do contexto capturado realmente importa?
- O que deve ser ignorado para nao poluir o prompt?
- O contexto e texto, imagem, historico, documento, preferencia do usuario ou padrao recorrente?
- O contexto precisa virar evidencia, resumo, checklist ou apenas sinal auxiliar?

### 4.3 Sobre estilo do usuario

- O usuario costuma preferir respostas curtas ou analiticas?
- Ele pensa por listas, narrativas, teses, checklists ou planos sequenciais?
- Quais estruturas aparecem repetidamente no seu trabalho?
- Quais correcoes o sistema deve aprender sem se tornar invasivo?

### 4.4 Sobre qualidade da saida

- A saida ficou pronta para colar ou ainda exige retrabalho?
- A resposta preservou o tom profissional do usuario?
- Houve invencao, excesso, omissao ou falta de coragem argumentativa?
- O sistema deveria perguntar algo antes de responder?

### 4.5 Sobre aprendizado

- O que pode ser salvo como preferencia estavel?
- O que deve ficar apenas no historico temporario?
- O que deve ser descartado por seguranca, privacidade ou irrelevancia?
- Como o usuario pode auditar e editar o que o sistema aprendeu?

## 5. Camadas Extras de Processamento

### 5.1 Intent Router

Detecta pilar, workflow, risco e formato provavel de saida.

Entrada:

- fala transcrita;
- texto capturado;
- imagem capturada;
- modo manual;
- historico recente;
- sinais do dicionario.

Saida:

```json
{
  "pillar": "juridico",
  "workflow": "manifestacao_curta",
  "intent": "gerar tese preliminar",
  "risk_level": "medio",
  "confidence": 0.82,
  "context_budget": "small"
}
```

### 5.2 Context Pack Builder

Organiza contexto antes do prompt final.

Responsabilidades:

- resumir texto capturado;
- apontar imagem anexada;
- separar fatos de pedido;
- separar contexto de instrucao;
- limitar tamanho;
- registrar fontes usadas.

### 5.3 Semantic Planner

Define a estrutura da resposta antes da geracao final.

Exemplos de estruturas:

- mensagem pronta;
- resumo executivo;
- checklist;
- tese juridica curta;
- prompt para agente;
- diagnostico tecnico;
- plano de acao;
- minuta revisavel.

### 5.4 Quality Critic

Revisa a saida antes de entregar.

Perguntas do critico:

- A resposta atende ao pedido?
- A resposta inventou algo?
- A resposta esta longa demais?
- A resposta respeita o modo e o contexto?
- Existe risco juridico, tecnico ou comunicacional?

### 5.5 Personal Semantic Memory

Memoria controlada, editavel e auditavel.

Nao deve salvar tudo. Deve salvar apenas padroes uteis:

- preferencias de formato;
- termos recorrentes;
- estruturas favoritas;
- criterios de decisao;
- correcoes frequentes;
- padroes de clientes, projetos ou areas, quando autorizado.

## 6. Manipulacao Interna da Cognicao do Sistema

O projeto deve evoluir para permitir que o usuario veja e edite como o sistema pensa.

Interfaces futuras desejadas:

- mapa de modos;
- mapa de estilos pessoais;
- memoria semantica editavel;
- painel de fontes de contexto;
- painel de decisoes do intent router;
- historico com explicacao de por que o sistema respondeu de certo modo;
- editor de criterios de qualidade;
- tela cheia para estudar, alterar e reorganizar a propria cognicao do sistema.

Essa interface nao deve ser apenas configuracao. Deve ser uma bancada cognitiva.

## 7. Replicar Logicas de Sucesso

O sistema deve observar padroes de sucesso, mas sem automatizar cegamente.

Exemplos de logicas replicaveis:

- formatos de resposta que o usuario reutiliza;
- prompts que geram melhor resultado;
- modos mais usados por contexto;
- estruturas juridicas ou tecnicas recorrentes;
- sequencias de planejamento que reduzem retrabalho;
- correcoes manuais feitas apos a resposta.

Cada logica replicada deve ter:

- origem;
- justificativa;
- escopo;
- possibilidade de edicao;
- possibilidade de desligamento.

## 8. Risco Principal

O maior risco e transformar o RefinaVoz em um acumulador de contexto.

Regra de governanca:

> Contexto so entra se melhorar a decisao, a estrutura ou a qualidade da saida.

O sistema nao deve buscar lembrar tudo. Deve aprender a organizar o que importa.

## 9. Caminho para Sistema Agentico Autonomo

O caminho saudavel nao e criar varios agentes de uma vez.

Ordem recomendada:

1. Context Pack controlado.
2. Intent Router auditavel.
3. Semantic Planner.
4. Quality Critic.
5. Memoria semantica editavel.
6. Interface de cognicao em tela cheia.
7. Agentes especializados por workflow.
8. Autonomia gradual com confirmacao humana.

Autonomia aceitavel no inicio:

- sugerir modo;
- sugerir estrutura;
- sugerir contexto relevante;
- revisar qualidade;
- perguntar antes de agir em caso de risco.

Autonomia ainda nao aceitavel:

- tomar decisoes juridicas finais;
- enviar mensagens sem confirmacao;
- alterar memoria permanente sem controle;
- usar contexto sensivel sem preview;
- executar fluxos complexos sem auditoria.

## 10. Definicao de Sucesso

Este plano sera bem-sucedido quando o RefinaVoz deixar de apenas transformar texto e passar a ajudar o usuario a pensar melhor.

Sinal pratico:

> O usuario fala de forma incompleta, captura contexto parcial, e o sistema organiza intencao, evidencias, estrutura e saida com menos retrabalho a cada ciclo.

Meta de produto:

> RefinaVoz deve se tornar uma camada semantica de pensamento, contexto e acao profissional, com memoria controlada e evolucao cognitiva auditavel.