---
description: Gerar e executar testes automaticamente para o módulo apontado
---

# Workflow: Geração e Execução de Testes

## Quando usar
Quando quiser validar um módulo, função ou endpoint do backend.

## Passos

1. Identifique o arquivo ou módulo alvo do teste.

2. Analise as funções públicas do módulo:
   - Quais inputs aceita?
   - Quais outputs retorna?
   - Quais efeitos colaterais tem?
   - Quais erros pode lançar?

3. Gere um arquivo de teste em `testes/test_<nome_do_modulo>.py` seguindo:
   - Padrão **AAA** (Arrange-Act-Assert)
   - Nomes descritivos: `test_<funcao>_<cenario>_<resultado_esperado>`
   - Fixtures do `conftest.py` quando possível
   - Mocks para dependências externas (httpx, sqlite, APIs)

4. Execute os testes:
```bash
pytest testes/ -v --tb=short
```

5. Se algum teste falhar, analise o erro e corrija o código fonte (não o teste) — a menos que o teste esteja errado.

6. Reporte:
   - ✅ Testes que passaram
   - ❌ Testes que falharam (com causa raiz)
   - 📊 Cobertura estimada do módulo

// turbo-all
