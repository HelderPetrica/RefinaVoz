---
description: Revisão de código automática do projeto RefinaVoz
---

# Workflow: Review de Código

## Quando usar
Após qualquer edição significativa em arquivos `.py` ou `.tsx`.

## Passos

1. Identifique os arquivos modificados recentemente (use `git diff --name-only` se disponível, senão analise o contexto).

2. Para cada arquivo modificado, avalie:
   - **Segurança**: API keys expostas? Inputs sem validação? Dados sensíveis logados?
   - **Performance**: Loops desnecessários? Queries N+1? Objetos criados sem necessidade?
   - **Qualidade**: Funções > 50 linhas? Nomes genéricos (`data`, `info`)? Docstrings ausentes?
   - **Tipagem**: Type hints ausentes em funções públicas? Schemas Pydantic usados corretamente?

3. Classifique cada achado por severidade:
   - 🔴 **Crítico**: Deve ser corrigido antes de qualquer commit.
   - 🟡 **Aviso**: Deveria ser corrigido nesta sessão.
   - 🟢 **Sugestão**: Considerar para melhoria futura.

4. Apresente o resultado em tabela:

| Severidade | Arquivo | Linha | Problema | Correção sugerida |
|---|---|---|---|---|

5. Se houver itens 🔴, aplique as correções automaticamente.

// turbo-all
