# Contribuindo com o RefinaVoz

Obrigado por considerar contribuir com o projeto.

## Antes de começar

- Prefira abrir uma issue ou discussão antes de mudanças grandes de arquitetura.
- Mantenha alterações pequenas, focadas e com documentação atualizada quando houver impacto público.
- Não versione `.env`, `.venv`, `frontend/node_modules` nem `src-tauri/target`.

## Setup local

### Opção recomendada

1. Execute `setup.bat` na raiz do repositório.
2. Revise o arquivo `.env` gerado a partir de `.env.example`.
3. Preencha `GEMINI_API_KEYS` com uma ou mais chaves válidas.
4. Se quiser trabalhar sem consumir tokens reais, use `USE_MOCK_LLM=true`.
5. Inicie o projeto com `abrir_filtro_de_fala.bat`.

### Opção manual

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Set-Location frontend
npm install
Set-Location ..
copy .env.example .env
```

## Fluxo de desenvolvimento

- Backend FastAPI: porta `14201`.
- Frontend Vite/Tauri dev: porta `1420`.
- O launcher principal do projeto é `abrir_filtro_de_fala.bat`.

## Validação mínima antes de abrir PR

### Backend

```powershell
pytest testes
```

### Frontend

```powershell
Set-Location frontend
npm run build
```

### Sanidade do ambiente

- Verifique `http://127.0.0.1:14201/api/v1/health`.
- Verifique `http://127.0.0.1:14201/api/v1/diagnostics`.
- Se a mudança tocar onboarding, atualize `README.md`, `.env.example` ou `docs/` quando necessário.

## Padrões esperados

- Preserve a filosofia local-first e zero-fat do projeto.
- Evite introduzir frameworks pesados sem justificativa técnica clara.
- Prefira correções na causa raiz em vez de contornos superficiais.
- Se alterar comportamento sensível, registre o racional em `docs/` ou `PLANOS/`.

## Pull requests

- Descreva o problema atacado.
- Resuma a solução adotada.
- Informe como validar.
- Liste riscos ou limitações restantes.
