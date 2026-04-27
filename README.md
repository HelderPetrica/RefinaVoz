# 🎙️ RefinaVoz: Assistente Cognitivo Semântico (Open-Source)

![Badge FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Badge React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Badge Tauri](https://img.shields.io/badge/Tauri-FFC131?style=for-the-badge&logo=tauri&logoColor=white)
![Badge Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

O **RefinaVoz** é um assistente de desktop invisível, projetado para capturar áudio, processar o contexto visual da sua tela e injetar texto formatado (usando o poder do Gemini Flash e Gemini Lite) nativa e diretamente onde você estiver digitando. Ele não é apenas um "Speech-to-Text", mas um **Motor Cognitivo Zero-Fat**, usando roteamento de intenção para garantir que jargões locais permaneçam intactos via dicionários SQLite locais.

---

## ⚡ Instalação Expresso (One-Click Setup)
Para quem deseja testar ou usar o app localmente sem dor de cabeça, criamos um micro-instalador guiado:

1. Clone ou baixe este repositório.
2. Dê um duplo clique no arquivo setup.bat.
   - *Ele verificará automaticamente o Python, Node.js, criará o ambiente virtual (\.venv\) e instalará as dependências do Back e Front.*
3. Abra o arquivo .env gerado e cole a sua \GEMINI_API_KEY\.
4. Para rodar o app todos os dias, dê um clique duplo em brir_filtro_de_fala.bat.

---

## 🤖 Modo Agente de IA (AI Coding Agent Formula)
Se você utiliza um Agente de IA (como GitHub Copilot, Cursor, Cline, Devin) e deseja que ele instale, leia e execute o projeto para você, cole o seguinte prompt no seu agente:

> **[PROMPT PARA AGENTES]**
> ""Contexto: Baixe o repositório do RefinaVoz. Este é um projeto empacotado via Tauri (Frontend React) + FastAPI (Backend Python). 
> 1. Execute o script local \setup.bat\ via terminal para provisionar o ambiente. 
> 2. Verifique o \.env\ e me solicite a chave do Gemini. 
> 3. Leia o arquivo \docs/OPEN_SOURCE_OVERVIEW.md\ para entender a arquitetura semântica multimodal.
> 4. Inicie a aplicação executando \brir_filtro_de_fala.bat\.""

---

## 🔧 Requisitos Manuais de Sistema
Caso queira instalar manualmente, você precisará de:
- **Python 3.11+**
- **Node.js 20+**
- **Rust e C++ Build Tools** (Necessários para compilar o Tauri Core no Windows).

## 🗂️ Arquitetura
Consulte a pasta \/docs/\ para detalhes aprofundados sobre a Shadow API e nosso RoadMap rumo à arquitetura multi-agente avançada.
