# Regras de Qualidade de Código — RefinaVoz

Estas regras governam TODO código gerado neste projeto, por humanos ou por IAs.

## Nomes
- Nomes revelam intenção. `data` e `info` são proibidos.
- Funções: verbos (`processAudio`, `loadPrompt`).
- Classes: substantivos (`SemanticDictionary`, `ProcessResponse`).

## Funções
- Máximo 30 linhas. Acima disso: extrair.
- Uma responsabilidade por função.
- 0-2 argumentos (ideal). 3 máximo.
- Sem side effects ocultos.

## Arquivos
- Máximo 350 linhas por arquivo.
- Um módulo = uma responsabilidade.

## Erros
- Usar exceptions, nunca `return None` para erros.
- Mensagens de erro devem ter contexto: "Quota esgotada na chave final '...ABCD'"

## Testes
- Todo módulo novo precisa de teste em `testes/`.
- Padrão AAA (Arrange-Act-Assert).
- Nomes: `test_<funcao>_<cenario>_<resultado>`.
- Mocks para dependências externas (httpx, SQLite, APIs).

## Segurança
- API keys: `.env` apenas, nunca no código.
- Sem `print()` — usar `logger` sempre.
- Inputs de usuário: sanitizar antes de processar.
- Prompts: nunca hardcoded — sempre de `prompts/*.md`.

## Filosofia
> Código é lido 10x mais do que escrito.
> Otimize para legibilidade e manutenibilidade, não para esperteza.
