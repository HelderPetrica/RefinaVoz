# Tese de Produto: RefinaVoz

## Frase Central

**RefinaVoz nao e um app de ditado. E uma camada de transformacao profissional da fala.**

O produto transforma fala desorganizada em artefatos profissionais prontos para uso: mensagens, relatorios, fichas, prompts, documentos e anotacoes estruturadas.

Para o nicho juridico:

**RefinaVoz Juridico transforma a fala do advogado brasileiro em atendimento, resumo de caso, checklist, tese preliminar, mensagem para cliente e prompt para agentes juridicos.**

Essa e a diferenca central: nao e "fala para texto"; e **fala para trabalho pronto**.

## Tese de Valor

O usuario nao quer apenas uma transcricao bonita. Ele quer economizar o trabalho mental e operacional de transformar pensamento falado em um texto utilizavel.

O RefinaVoz deve resolver este ciclo:

```text
fala natural
-> intencao detectada
-> modo profissional adequado
-> contexto local controlado
-> saida estruturada
-> copia, historico ou injecao no app ativo
```

## Promessa do MVP

Um advogado fala de forma natural por 30 a 60 segundos e recebe um texto util, estruturado e reaproveitavel.

O MVP nao precisa provar que o RefinaVoz faz tudo. Precisa provar que ele substitui anotacoes manuais, mensagens repetitivas e prompts improvisados.

## Modos Iniciais Fortes

### 1. WhatsApp com Cliente

Transforma fala informal do advogado em mensagem clara, profissional, segura e sem promessa de resultado.

### 2. Ficha de Atendimento Juridico

Transforma fala livre em estrutura com tema, relato do cliente, fatos relevantes, documentos necessarios, riscos e proximos passos.

### 3. Prompt para Agente Juridico

Transforma fala livre em prompt tecnico para IA juridica, separando objetivo, tarefas, restricoes, formato de saida e exigencia de nao inventar jurisprudencia.

## Estrutura de Produto

```text
RefinaVoz Core
  Captura de audio
  Transcricao
  Refinamento por LLM
  Dicionario personalizado
  Historico local
  Atalho global

RefinaVoz Juridico
  WhatsApp com cliente
  Ficha de atendimento
  Resumo do caso
  Checklist de documentos
  Prompt para agente juridico
  Texto etico para marketing juridico

RefinaVoz Dev
  Commit
  Issue
  Prompt para agente de codigo
  Documentacao tecnica
  Explicacao de bug
```

## O Que Nao Fazer Agora

- Nao criar produto gigante com muitas telas.
- Nao comecar por mobile.
- Nao prometer pesquisa juridica automatica completa.
- Nao criar muitos perfis antes de validar os tres principais.
- Nao misturar bibliotecas juridicas e tecnicas em um unico prompt gigante.
- Nao transformar o RefinaVoz em copia reduzida do AutoJuris.

## Validacao Real

O teste correto e simples:

1. Pedir para 5 advogados falarem naturalmente por 30 a 60 segundos sobre um caso.
2. Gerar tres versoes: transcricao literal, texto polido generico e saida RefinaVoz Juridico estruturada.
3. Perguntar qual versao usariam, qual economizou mais tempo e em qual situacao usariam todos os dias.

O produto passa no teste se o advogado disser:

> Isso eu usaria no atendimento.

## Conclusao

RefinaVoz generico e fraco.

RefinaVoz juridico/tecnico e forte.

RefinaVoz integrado ao AutoJuris, com contexto local controlado e saidas juridicas uteis, e muito forte.

A prioridade agora e provar a transformacao profissional da fala, nao multiplicar recursos.