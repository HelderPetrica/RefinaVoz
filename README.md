# RefinaVoz

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tauri](https://img.shields.io/badge/Tauri-FFC131?style=for-the-badge&logo=tauri&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

Assistente multimodal de voz para desktop, com captura de contexto visual, proteção semântica por dicionário local e refinamento textual com Gemini Flash e Gemini Lite.

## O que é

O RefinaVoz nasceu como um filtro de fala para ditado inteligente e evoluiu para um sistema local-first de produção textual assistida por IA. A proposta não é apenas transcrever áudio, mas interpretar o contexto de uso, preservar termos críticos do domínio do usuário e devolver um texto mais útil para o ambiente em que ele está trabalhando.

Na prática, o projeto combina frontend em React, ponte nativa em Tauri/Rust e engine backend em FastAPI para capturar entrada de voz, considerar o contexto visual da janela ativa e devolver texto refinado pronto para inserção.

## Para quem serve

- Profissionais que escrevem muito e não podem perder precisão terminológica.
- Usuários de fluxos jurídicos, técnicos, clínicos ou operacionais com vocabulário próprio.
- Desenvolvedores interessados em interfaces agentic, apps desktop local-first e integração multimodal sem frameworks pesados.

## Principais capacidades

- Captura multimodal: combina fala com contexto visual da janela ativa.
- Injeção nativa de texto: devolve o resultado diretamente ao ambiente em uso.
- Dicionário local: protege jargões, siglas e termos sensíveis contra correções indevidas.
- Modos de intenção: suporta estilos de saída diferentes, como normal, profissional e vibe code.
- Arquitetura zero-fat: evita camadas pesadas e mantém o fluxo tipado e previsível.
- Inicialização guiada: usa `setup.bat` para preparar o ambiente e `abrir_filtro_de_fala.bat` para subir a aplicação.

## Como funciona

1. O usuário aciona a captura de voz pelo app desktop.
2. O backend processa a fala e, quando aplicável, usa contexto visual da janela ativa.
3. O pipeline aplica regras semânticas locais e seleciona o modo de resposta adequado.
4. O texto refinado é retornado e pode ser injetado diretamente no sistema operacional.

## Stack e arquitetura

- Frontend: React em `frontend/src`.
- Ponte nativa: Tauri/Rust em `src-tauri`.
- Backend: FastAPI em `backend/`.
- Persistência local: SQLite para histórico e dicionário.
- LLMs: Gemini Flash e Gemini Lite.
- Portas padrão de desenvolvimento: frontend em `1420`, backend em `14201`.

## Status do projeto

### Implementado

- MVP funcional com frontend, backend e launcher local.
- Captura multimodal com base em áudio e screenshot da janela ativa.
- Proteção semântica por dicionário local.
- Fluxo de inicialização automatizado para desenvolvimento local no Windows.

### Em evolução

- Modo mock e validação offline mais robusta.
- Melhorias de documentação e onboarding para terceiros.
- Evolução futura da arquitetura cognitiva, hoje mantida como plano pendente para evitar complexidade prematura.

### Ainda não formalizado

- Pipeline completo de CI/CD público.
- Política de contribuição formal.
- Arquivo de licença definitivo para distribuição ampla.

## Quick Start no Windows

O onboarding atual está otimizado para Windows.

### Pré-requisitos

- Python 3.11 ou superior.
- Node.js 20 ou superior.
- Rust toolchain.
- Microsoft C++ Build Tools / MSVC para build do Tauri.

### Instalação guiada

1. Clone o repositório.
2. Execute `setup.bat` na raiz do projeto.
3. Configure sua chave do Gemini no arquivo `.env`.
4. Execute `abrir_filtro_de_fala.bat` para subir frontend e backend.

O script `setup.bat` cria o ambiente virtual Python, instala as dependências do backend e do frontend e cria um `.env` mínimo se ele ainda não existir.

## Configuração da API do Gemini

O repositório público usa `.env.example` como modelo seguro. O arquivo `.env` local não deve ser versionado.

1. Gere sua chave em https://aistudio.google.com/app/apikey.
2. Copie `.env.example` para `.env`, se preferir começar do template público.
3. Preencha `GEMINI_API_KEY` com a sua chave.

Exemplo:

```env
GEMINI_API_KEY=coloque_sua_chave_aqui
```

## Execução manual

Se preferir não usar o instalador guiado:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Set-Location frontend
npm install
Set-Location ..
copy .env.example .env
```

Depois, inicie o projeto com:

```powershell
cmd /c "call abrir_filtro_de_fala.bat"
```

## Prompt para agentes de código

Se você usa GitHub Copilot, Cursor, Cline ou outro agente de programação, este prompt reduz a fricção de setup:

```text
Baixe o repositório RefinaVoz e prepare o ambiente local.

Requisitos:
- Projeto desktop com Tauri/React no frontend e FastAPI no backend.
- Ambiente principal otimizado para Windows.

Passos:
1. Leia README.md e docs/OPEN_SOURCE_OVERVIEW.md.
2. Execute setup.bat na raiz do repositório.
3. Se o arquivo .env não existir, crie-o a partir de .env.example.
4. Solicite ao usuário a GEMINI_API_KEY e preencha o .env.
5. Inicie a aplicação com abrir_filtro_de_fala.bat.
6. Valide se o backend está respondendo na porta 14201.
```

## Estrutura do repositório

```text
backend/        API FastAPI, serviços e schemas
frontend/       UI React
src-tauri/      Ponte nativa Tauri/Rust
docs/           Documentação técnica e visão do projeto
PLANOS/         Planos pendentes e arquitetura futura
prompts/        Modos e personas de prompt
testes/         Testes automatizados
```

## Documentação adicional

- [Visão geral do projeto](docs/OPEN_SOURCE_OVERVIEW.md)
- [Guia de arquitetura interna](docs/GUIA_ARQUITETURA_INTERNA.md)
- [Plano pendente da arquitetura multiagente](PLANOS/ARQUITETURA_MULTI_AGENTE_PENDENTE.md)

## Observações de uso

- O projeto é local-first, mas o processamento com Gemini depende de chave válida da API.
- Elementos locais como dicionário e histórico permanecem no ambiente do usuário.
- O launcher atual foi pensado para desenvolvimento e testes locais antes da etapa de empacotamento final.

## Contribuição

O repositório está em fase de organização para colaboração aberta. Issues, sugestões de arquitetura, melhorias de onboarding e testes são especialmente úteis neste estágio.
