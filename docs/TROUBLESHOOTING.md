# Troubleshooting

Este guia cobre os problemas mais prováveis no setup local do RefinaVoz.

## 1. `setup.bat` diz que Python não foi encontrado

Instale Python 3.11 ou superior e marque a opção para adicionar ao `PATH`.

Validação:

```powershell
python --version
```

## 2. `setup.bat` diz que Node.js ou NPM não foram encontrados

Instale Node.js 20 ou superior.

Validação:

```powershell
node --version
npm --version
```

## 3. O backend não responde na porta `14201`

O backend é exposto em `http://127.0.0.1:14201/api/v1/health`.

Validação:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:14201/api/v1/health
```

Se falhar:

- Reexecute `abrir_filtro_de_fala.bat`.
- Verifique se há processo antigo ocupando a porta `14201`.
- Confirme se o `.env` existe na raiz do projeto.

## 4. O frontend não abre na porta `1420`

O frontend de desenvolvimento usa a porta `1420`.

Se falhar:

- Verifique se o Node.js está instalado corretamente.
- Confirme que `frontend/node_modules` foi instalado.
- Feche processos antigos que possam ter prendido a porta.

## 5. Erro de autenticação ou quota do Gemini

O backend lê `GEMINI_API_KEYS` do arquivo `.env` da raiz.

Formato esperado:

```env
GEMINI_API_KEYS=chave_1,chave_2
USE_MOCK_LLM=false
```

Observações:

- O projeto aceita múltiplas chaves separadas por vírgula.
- O nome correto da variável é `GEMINI_API_KEYS`.
- `GEMINI_API_KEY` não é o contrato atual do backend.

## 6. Quero testar sem gastar tokens

Ative o modo mock:

```env
USE_MOCK_LLM=true
```

Depois, consulte:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:14201/api/v1/diagnostics
```

O endpoint mostra se o backend está em mock mode e quantas chaves reais foram carregadas.

## 7. Build do Tauri falha no Windows

Confirme estes itens:

- Rust toolchain instalado.
- Microsoft C++ Build Tools / MSVC instalado.
- Node.js compatível com `frontend/package.json`.

Validação:

```powershell
rustc --version
cargo --version
```

## 8. O launcher abre mas algo continua quebrado

Checklist rápido:

1. O `.env` está na raiz do projeto.
2. O `.env` usa `GEMINI_API_KEYS`.
3. O backend responde em `14201`.
4. O frontend responde em `1420`.
5. O ambiente virtual `.venv` foi criado.
6. As dependências do frontend foram instaladas.
