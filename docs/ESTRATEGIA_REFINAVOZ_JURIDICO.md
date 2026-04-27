# Estrategia do RefinaVoz Juridico

## Veredito

O RefinaVoz nao deve tentar vencer como "ditado com IA generico". Esse espaco ja esta muito proximo de commodity: transcricao, remocao de vicios de fala, dicionario pessoal, estilos e escrita em qualquer aplicativo ja aparecem em concorrentes como Wispr Flow, Whisper Flow, Superwhisper e similares.

O caminho profissional e defensavel e posicionar o RefinaVoz como um **redator semantico por voz para fluxos juridicos e tecnicos no Brasil**. O produto nao compete por "ouvir melhor"; compete por transformar fala desorganizada em artefatos de trabalho juridico, comercial e operacional.

## Tese de Produto

> RefinaVoz transforma fala do advogado em texto juridico estruturado, pronto para atendimento, marketing, relatorios, peticoes, pesquisas internas e agentes de IA.

A unidade central do produto deve ser: **voz -> intencao -> estrutura profissional -> contexto recuperado -> saida reutilizavel**.

Isso evita o efeito Frankenstein porque tudo passa por uma pergunta simples: este recurso melhora a transformacao da fala em um artefato juridico util?

## Nao Fazer no MVP

- Nao virar buscador juridico completo.
- Nao prometer pesquisa juridica em tempo real sem fontes auditaveis.
- Nao misturar modo juridico, marketing, gerador de imagem, filme, planilha e programacao como se todos fossem o mesmo produto.
- Nao despejar planilhas ou pastas inteiras no prompt.
- Nao substituir sistemas de gestao processual, CRM ou editor de pecas.
- Nao gerar conclusoes juridicas sem separar fato, hipotese, fundamento e fonte.

## Publico-Alvo Inicial

O foco inicial deve ser advogado brasileiro solo ou escritorio pequeno/medio que ja usa WhatsApp, planilhas, documentos em Markdown/Word e IA generativa, mas ainda perde tempo transformando atendimento falado em texto util.

Casos ideais:

- atendimento inicial de cliente;
- resumo de caso;
- mensagem profissional para WhatsApp;
- briefing para peticao;
- registro interno de andamento;
- roteiro de reuniao ou audiencia;
- organizacao de ideias para marketing juridico etico;
- transformacao de fala em prompt para agente juridico.

## Modos que Fazem Sentido

Os modos devem ser tratados como **workflows de saida**, nao apenas tons de escrita.

### Essenciais

1. **Atendimento Juridico**
   Transforma fala em ficha: fatos narrados, datas, partes, documentos citados, duvidas, proximos passos e pendencias.

2. **WhatsApp com Cliente**
   Gera resposta clara, profissional e segura, sem juridiquês excessivo e sem prometer resultado.

3. **Resumo de Caso**
   Organiza a fala em contexto, problema juridico, fatos relevantes, documentos necessarios e tese preliminar.

4. **Manifestacao Curta**
   Transforma ideias soltas em paragrafo tecnico para peticao, despacho, e-mail ou anotacao processual.

5. **Marketing Juridico Etico**
   Converte ideias em post, roteiro curto ou texto educativo, respeitando tom informativo e evitando promessa de resultado.

6. **Prompt para Agente Juridico**
   Converte fala em prompt estruturado para outro agente analisar, pesquisar ou redigir.

### Secundarios

- Programador / Vibe Code: manter como modo tecnico do criador, mas nao como identidade publica principal.
- Pesquisador: so deve existir se conectado a fontes e citacoes.
- Ilustrador / Filme: deve ficar fora do nucleo juridico, como template opcional, para nao diluir o produto.

## Inteligencia Juridica com Limites Profissionais

O RefinaVoz pode ter inteligencia juridica, mas ela deve ser governada por camadas:

1. **Camada de redacao**
   Corrige, organiza e estrutura a fala.

2. **Camada de dominio**
   Reconhece termos juridicos brasileiros, areas do direito, tipos de peca, prazos, partes, documentos e estilo do escritorio.

3. **Camada de contexto local**
   Recupera informacoes de planilhas, Markdown, glossarios, modelos e notas do escritorio.

4. **Camada de pesquisa externa**
   Apenas em etapa posterior, com conectores auditaveis, citacoes, data de consulta e separacao clara entre fonte e interpretacao.

O MVP deve entregar as tres primeiras camadas. A quarta camada e poderosa, mas aumenta risco juridico, custo, latencia e responsabilidade.

## Integracao com Excel e Markdown

A integracao com arquivos deve ser feita como **Context Hub**, nao como upload bruto para o LLM.

### Fontes Suportadas no Primeiro Ciclo

- Pastas com arquivos `.md` para notas, modelos, teses, checklists e memoria do escritorio.
- Arquivos `.xlsx` ou `.csv` para clientes, processos, prazos, honorarios, contatos e catalogos internos.
- Arquivos `.json` existentes para dicionario, aliases e termos protegidos.

### Pipeline Correto

1. **Registro de fonte**
   Usuario aponta uma pasta ou arquivo. O sistema salva apenas caminho, nome, tipo e permissao de leitura.

2. **Indexacao local**
   O backend le Markdown por secoes e Excel por planilha/linhas/colunas relevantes. Cada trecho vira um bloco pequeno com metadados.

3. **Resumo e manifestos**
   Para arquivos grandes, o sistema cria um resumo local: campos disponiveis, abas, titulos, datas e palavras-chave. O prompt ve primeiro o manifesto, nao o arquivo inteiro.

4. **Recuperacao seletiva**
   Ao processar a fala, o sistema busca apenas os trechos relevantes para aquele modo e aquela intencao.

5. **Budget de contexto**
   Cada modo tem limite maximo de contexto. Exemplo: WhatsApp usa pouco; resumo de caso usa medio; pesquisa interna usa mais.

6. **Citacao interna**
   A resposta deve poder dizer de onde veio o contexto: arquivo, aba, linha, titulo ou trecho Markdown.

## Contrato de Contexto

Todo contexto externo deve entrar no LLM em um bloco padronizado:

```xml
<context_pack>
  <source id="clientes_2026" type="excel" path="..." confidence="high">
    <excerpt sheet="Atendimentos" rows="18-22">
      Conteudo resumido e relevante.
    </excerpt>
  </source>
  <source id="modelo_whatsapp" type="markdown" path="..." confidence="medium">
    <excerpt heading="Resposta inicial">
      Trecho recuperado.
    </excerpt>
  </source>
</context_pack>
```

Regra de ouro: **o modelo nunca recebe a pasta inteira; recebe um pacote pequeno, relevante e rastreavel**.

## Arquitetura Recomendada

```text
frontend/src
  components/
    FloatingButton.tsx
    MiniPanel.tsx
    PromptStudio.tsx
    ContextSourcesPanel.tsx        # novo painel futuro
    HistoryPanel.tsx

backend/
  api/
    router.py
    context_router.py              # fontes, indexacao e busca
  services/
    prompt_engine.py
    context_registry.py            # cadastra pastas/arquivos
    context_indexer.py             # extrai Markdown/Excel
    context_retriever.py           # escolhe trechos relevantes
    legal_modes.py                 # contratos dos workflows juridicos
  schemas/
    context_models.py

prompts/
  juridico_atendimento.md
  juridico_whatsapp_cliente.md
  juridico_resumo_caso.md
  juridico_manifestacao_curta.md
  juridico_marketing_etico.md
```

## Transplante Lite do AutoJuris

O AutoJuris pode alimentar o RefinaVoz, mas apenas como uma camada leve de metodo juridico. O objetivo nao e copiar o cerebro multiagentico inteiro, e sim destilar sinais semanticos que ajudam a fala a virar artefato profissional.

Camadas aceitas no RefinaVoz:

- principios cognitivos: cliente certo, fato relevante, contraditorio, resposta compativel e revisabilidade;
- subareas juridicas: previdenciario, trabalhista, consumidor, familia, processo e marketing juridico;
- keywords e expressoes de busca;
- perguntas criticas por dominio;
- guardrails de seguranca: nao inventar fonte, prazo, artigo ou promessa de resultado.

Camadas que ficam fora do RefinaVoz:

- orquestracao multiagente completa;
- pesquisa jurisprudencial autonoma sem fonte auditavel;
- decisao de peca processual como se fosse AutoJuris;
- ingestao bruta de grandes PDFs ou bancos juridicos.

Implementacao inicial criada:

```text
data/legal_brain_lite.json
backend/services/legal_brain_lite.py
prompts/juridico_*.md
```

Esse desenho mantem o RefinaVoz coeso: ele continua sendo entrada vocal estruturada, mas agora com um pequeno nucleo juridico para classificar a fala, sugerir perguntas e orientar a redacao.

## Estrutura de Dados Minima

```text
ContextSource
- id
- name
- kind: markdown_folder | excel_file | csv_file | json_file
- path
- enabled
- last_indexed_at
- hash_or_mtime

ContextChunk
- id
- source_id
- title
- text
- metadata: sheet, row_range, heading, tags
- token_estimate
- updated_at
```

## Como Evitar Saturar o Contexto

- Limite duro por modo.
- Resumo de arquivo antes de trecho completo.
- Busca por relevancia antes de chamada ao LLM.
- Compressao dos trechos recuperados.
- Cache por hash/mtime.
- Exclusao automatica de colunas irrelevantes em Excel.
- Opcao "usar contexto local" ligada/desligada por modo.
- Log de quais fontes foram usadas em cada resposta.

## Roadmap Coeso

### Fase 1: Produto Juridico Enxuto

- Criar 5 prompts juridicos essenciais.
- Melhorar o historico para virar memoria de atendimento.
- Criar dicionario juridico com termos protegidos.
- Separar modos publicos juridicos dos modos tecnicos internos.

### Fase 2: Contexto Local

- Painel para registrar pastas Markdown e planilhas.
- Indexador local de `.md`, `.xlsx` e `.csv`.
- Recuperador simples por palavras-chave e score.
- Injecao de `<context_pack>` no `prompt_engine`.

### Fase 3: Produto Profissional

- Templates por area do direito.
- Exportacao de atendimento para Markdown.
- Relatorio de fontes usadas.
- Perfis de escritorio: tom, termos, modelos e restricoes.

### Fase 4: Pesquisa Juridica Assistida

- Conectores externos com fonte, data, URL e trecho.
- Separacao entre pesquisa, sintese e redacao.
- Alertas de verificacao humana obrigatoria.

## Posicionamento de Marketing

Nao vender como:

> Um concorrente de Whisper/Wispr Flow.

Vender como:

> RefinaVoz e o copiloto vocal do advogado brasileiro: transforma fala em atendimento estruturado, mensagem profissional, resumo de caso e contexto pronto para redacao juridica.

Promessa curta:

> Pare de transcrever. Comece a transformar fala em trabalho juridico pronto.

## Criterio para Aceitar Novos Recursos

Um recurso so entra se responder "sim" para pelo menos duas perguntas:

1. Ajuda o advogado a transformar fala em artefato de trabalho?
2. Reduz retrabalho de atendimento, escrita ou organizacao?
3. Aproveita contexto local sem comprometer privacidade ou performance?
4. Gera uma saida reutilizavel em processo, cliente, marketing ou agente?
5. Mantem rastreabilidade de fonte e responsabilidade profissional?

Se a resposta for nao, o recurso fica fora do nucleo.
