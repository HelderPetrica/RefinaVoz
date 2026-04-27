# Plano Definitivo do RefinaVoz

## 1. Decisao Central

O RefinaVoz nao sera tratado como app de ditado. Ele sera uma **camada de transformacao profissional da fala**.

Promessa geral:

> RefinaVoz transforma fala desorganizada em artefatos profissionais prontos para uso.

Promessa juridica:

> RefinaVoz Juridico transforma a fala do advogado brasileiro em atendimento, resumo de caso, checklist, tese preliminar, mensagem para cliente e prompt para agentes juridicos.

Regra anti-Frankenstein:

> Se um recurso nao melhora a transformacao da fala em trabalho pronto, ele nao entra no nucleo.

## 2. O Que Entra e o Que Sai

### Entra no nucleo agora

- gravacao;
- transcricao;
- selecao ou deteccao de modo;
- refinamento por LLM;
- resultado copiavel;
- dicionario local simples;
- historico local;
- 3 modos juridicos fortes;
- legal brain lite com keywords, subareas, perguntas criticas e guardrails.

### Fica fora agora

- mobile;
- login;
- cobranca;
- marketplace de modos;
- pesquisa juridica autonoma completa;
- ingestao bruta de PDFs grandes;
- multiagente complexo dentro do fluxo principal;
- painel gigante de configuracoes;
- bibliotecas juridicas e dev misturadas em um prompt unico.

## 3. MVP que Deve Ser Provado

O MVP precisa provar uma unica coisa:

> Um advogado fala baguncado por 30 a 60 segundos e recebe um texto juridico util, estruturado e reaproveitavel.

### Fluxo do MVP

```text
Botao gravar
-> transcricao literal
-> modo detectado ou escolhido
-> legal_brain_lite injeta contexto minimo
-> LLM refina
-> resultado copiavel
-> historico local
```

### Os 3 modos iniciais obrigatorios

1. **WhatsApp com Cliente**
   Fala informal vira mensagem clara, educada, profissional e sem promessa de resultado.

2. **Ficha de Atendimento Juridico**
   Fala livre vira tema, relato, fatos relevantes, documentos necessarios, riscos e proximos passos.

3. **Prompt para Agente Juridico**
   Fala livre vira prompt tecnico para IA juridica, com objetivo, tarefas, restricoes, formato de saida e proibicao de inventar jurisprudencia.

Modos secundarios so entram depois que esses tres forem validados.

## 4. Separacao de Pilares

O usuario nao deve gerenciar dezenas de submodos manualmente. O sistema deve trabalhar com pilares principais e inferir subpilares.

### Pilar Juridico

Usado quando a fala envolve cliente, processo, atendimento, documento, tese, prova, direito, prazo, audiencia, marketing juridico ou pesquisa juridica.

Subpilares inferidos:

- atendimento;
- WhatsApp com cliente;
- resumo de caso;
- checklist;
- prompt juridico;
- marketing etico.

### Pilar Dev

Usado quando a fala envolve codigo, bug, commit, issue, arquitetura, prompt para agente de codigo ou documentacao tecnica.

Subpilares inferidos:

- issue;
- commit;
- prompt para agente;
- documentacao;
- explicacao de bug.

### Pilar Comunicacao

Usado para mensagens profissionais, e-mails, respostas curtas, anotacoes gerais e comunicacao nao juridica.

Subpilares inferidos:

- mensagem curta;
- e-mail profissional;
- anotacao;
- resumo.

## 5. Deteccao de Estilo em Tempo Real

O seletor manual deve existir como override, mas nao deve ser a experiencia principal no futuro.

### Router de Intencao

Criar um `intent_router` antes do prompt final.

Entrada:

- texto transcrito;
- modo manual, se houver;
- ultimos modos usados;
- sinais do dicionario;
- contexto da interface.

Saida:

```json
{
  "pillar": "juridico",
  "workflow": "whatsapp_cliente",
  "confidence": 0.86,
  "reasons": ["cliente", "documentos", "avaliar com seguranca"],
  "context_budget": "small"
}
```

### Ordem de decisao

1. Se o usuario escolheu modo manual, respeitar.
2. Se houver alta confianca, selecionar automaticamente.
3. Se houver baixa confianca, usar modo seguro geral e sugerir troca.
4. Registrar a decisao no historico para melhorar a interface.

## 6. Bibliotecas de Estilo sem Misturar Dominios

As bibliotecas nao devem ser carregadas como prompt gigante. Devem ser pequenas, indexaveis e separadas por pilar.

Estrutura recomendada:

```text
data/style_libraries/
  juridico.json
  dev.json
  comunicacao.json

data/legal_brain_lite.json
data/dev_brain_lite.json           # futuro, se necessario
```

Cada biblioteca deve conter:

- nome do estilo;
- quando usar;
- tom;
- proibicoes;
- formato de saida;
- exemplos curtos;
- limite de contexto.

Exemplo:

```json
{
  "id": "juridico_whatsapp_cliente",
  "pillar": "juridico",
  "when_to_use": ["cliente", "documentos", "prazo", "avaliacao inicial"],
  "tone": "claro, cordial, profissional",
  "forbidden": ["prometer resultado", "inventar prazo", "excesso de juridiquês"],
  "output_shape": ["mensagem pronta", "sem metacomentarios"],
  "context_budget": "small"
}
```

## 7. Contexto Juridico Local sem Saturar Prompt

O proximo modulo deve ser um **Context Hub**, nao um upload de arquivos para o LLM.

### Regra principal

> O LLM nunca recebe pasta, planilha ou biblioteca inteira. Ele recebe um pacote pequeno, ranqueado, rastreavel e limitado por budget.

### Componentes

```text
Context Registry
  Cadastra fontes: pasta Markdown, Excel, CSV, JSON.

Context Indexer
  Roda em background, quebra arquivos em chunks pequenos e metadados.

Context Retriever
  Recebe a fala e retorna os trechos mais relevantes.

Context Pack Builder
  Compacta os trechos selecionados em XML curto para o prompt final.

Context Audit Log
  Salva quais fontes foram usadas em cada geracao.
```

### Dados minimos

```text
ContextSource
- id
- name
- kind
- path
- enabled
- last_indexed_at
- hash_or_mtime

ContextChunk
- id
- source_id
- title
- text_summary
- metadata
- keywords
- token_estimate
- updated_at
```

## 8. Subagente de Contexto

Para nao sobrecarregar o prompt principal, o RefinaVoz deve tratar pesquisa e contexto como trabalho de um subagente local especializado.

Esse subagente nao precisa ser um agente autonomo grande no MVP. Ele pode ser um **worker deterministico com opcao de LLM pequena**.

### Nome recomendado

`ContextScout`

### Responsabilidade

Encontrar o minimo contexto util para a fala atual.

### Ferramentas internas

- leitor Markdown;
- leitor Excel/CSV;
- extrator de headings;
- normalizador de keywords;
- busca lexical simples;
- ranking por score;
- compactador de contexto;
- cache por hash/mtime.

### Fluxo

```text
fala transcrita
-> intent_router define pilar/workflow
-> ContextScout recebe consulta compacta
-> busca apenas fontes habilitadas daquele pilar
-> retorna no maximo N chunks
-> ContextPackBuilder monta <context_pack>
-> prompt principal recebe somente o pacote final
```

### Contrato de saida

```xml
<context_pack budget="small" generated_by="ContextScout">
  <source id="modelo_whatsapp_cliente" type="markdown" confidence="0.82">
    <excerpt heading="Resposta inicial" tokens="120">
      Trecho resumido e relevante.
    </excerpt>
  </source>
</context_pack>
```

### Budget por workflow

| Workflow | Budget | Max chunks | Uso de LLM no ContextScout |
| --- | --- | ---: | --- |
| WhatsApp cliente | small | 2 | nao |
| Ficha atendimento | medium | 4 | opcional |
| Prompt juridico | medium | 4 | opcional |
| Resumo de caso | medium | 5 | opcional |
| Pesquisa juridica futura | large | 8 | sim, com fonte |

### Por que isso evita lentidao

- indexacao acontece antes, em background;
- o request principal usa chunks prontos;
- busca lexical roda rapido;
- LLM so entra se a busca for ambigua;
- cada workflow tem limite fixo de contexto;
- cache evita reler planilhas a cada chamada.

## 9. Pesquisa Juridica: Fase Futura

Pesquisa juridica externa nao entra no MVP.

Quando entrar, deve ser outro worker, separado do ContextScout:

```text
LegalResearchScout
  consulta fontes oficiais/API
  coleta trecho, data, tribunal/orgao e link
  nao redige conclusao final
  entrega evidencias para o prompt principal
```

Regra:

> Sem fonte primaria ou referencia auditavel, sem afirmacao juridica categorica.

## 10. Interface Rica sem Virar Sistema Pesado

A interface deve ensinar a ferramenta sem virar painel corporativo.

### Camadas de UI

1. **Bolha flutuante**
   Gravar, parar, estado, copiar, historico rapido.

2. **Mini painel**
   Transcricao, resultado, modo atual, copiar, reprocessar.

3. **Modo Estudio**
   Gerenciar modos, prompts, dicionario e bibliotecas de estilo.

4. **Contexto Local**
   Cadastrar fontes, ver status da indexacao e fontes usadas.

5. **Tutorial guiado**
   Exemplos prontos por pilar: Juridico, Dev e Comunicacao.

### Tutorial obrigatorio

O tutorial deve ensinar por tarefa, nao por botao:

- como gravar uma fala;
- como gerar WhatsApp para cliente;
- como gerar ficha de atendimento;
- como transformar fala em prompt juridico;
- como proteger termos no dicionario;
- como consultar historico;
- como ativar contexto local;
- como revisar fontes usadas.

## 11. Roadmap Objetivo

### Fase 1: Travar MVP juridico

- manter 3 modos principais;
- reduzir destaque dos modos secundarios;
- criar modo `juridico_prompt_agente` se ainda faltar;
- criar exemplos de validacao;
- ajustar texto de produto.

### Fase 2: Router de intencao

- criar `intent_router.py`;
- detectar pilar e workflow;
- manter override manual;
- registrar confianca e razoes.

### Fase 3: Bibliotecas de estilo

- criar `data/style_libraries/juridico.json`;
- criar `data/style_libraries/dev.json`;
- criar `data/style_libraries/comunicacao.json`;
- adaptar prompt engine para carregar apenas estilo escolhido.

### Fase 4: Context Hub local

- criar `context_registry.py`;
- criar `context_indexer.py`;
- criar `context_retriever.py`;
- criar `ContextSourcesPanel.tsx`;
- injetar `<context_pack>` com budget.

### Fase 5: Tutorial e validacao real

- criar tutorial interno;
- criar base de exemplos;
- testar com 5 advogados;
- medir utilidade, tempo economizado e uso diario.

## 12. Criterio de Sucesso

O produto so avanca se advogados reais disserem que usariam pelo menos um dos tres modos no atendimento cotidiano.

Metricas:

- tempo economizado por saida;
- taxa de copia do resultado;
- reprocessamentos por modo;
- modos usados diariamente;
- respostas consideradas prontas sem edicao pesada.

## 13. Decisao Final

O RefinaVoz deve ser simples na superficie e inteligente por camadas.

Nucleo pequeno:

```text
gravar -> transcrever -> transformar -> copiar/historico
```

Inteligencia modular:

```text
intent_router -> style_library -> legal_brain_lite -> ContextScout -> prompt final
```

Tudo que fugir disso deve esperar.
