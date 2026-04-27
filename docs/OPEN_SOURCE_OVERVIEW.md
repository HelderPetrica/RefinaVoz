# 🎙️ RefinaVoz: Assistente Cognitivo e Semântico de Voz

## 📖 O que é o RefinaVoz?
O **RefinaVoz** nasceu como uma ferramenta de ditado de voz e evoluiu para um **sistema cognitivo semântico e multimodal**. Ele atua como um assistente de desktop invisível que escuta sua voz, compreende o contexto visual do que está na sua tela (através de capturas de tela da janela ativa) e usa IA para refinar, formatar e injetar o texto perfeitamente na sua aplicação atual.

É ideal para profissionais (advogados, médicos, programadores, escritores) que precisam produzir textos complexos de forma rápida, garantindo que jargões técnicos sejam respeitados e que a formatação seja adequada ao contexto em que estão trabalhando.

---

## ✨ Funcionalidades Principais (Implementadas)
- **Captura Multimodal (Texto + Imagem):** Diferente de ditados tradicionais, o RefinaVoz pode "ver" a sua janela ativa (Screenshot MVP) para entender o contexto antes de processar a sua fala.
- **Injeção Nativa de Texto:** Copia e injeta o texto refinado diretamente na janela em que você está trabalhando, sem precisar de Ctrl+C / Ctrl+V manual.
- **Dicionário Local e Proteção Semântica:** Mantém um banco de dados local com seus jargões, siglas e termos específicos, forçando a IA a não alucinar ou corrigir essas palavras indevidamente.
- **Roteamento Inteligente de Intent (Intent Routing):** Diferentes modos de formatação (vibe code, profissional, normal) ajustáveis de acordo com a necessidade.
- **Launcher Unificado:** Um script robusto (`abrir_filtro_de_fala.bat`) que gerencia o ciclo de vida do backend (FastAPI) e frontend (Tauri/React), incluindo resolução de ambiente virtual Python e unbinding de portas automaticamente.

---

## 💰 Vantagens e Custura (O Poder do Gemini)
O grande diferencial do RefinaVoz em relação a soluções corporativas de IA está no seu **custo de operação virtualmente zero e altíssima velocidade**.

Para alcançar isso, o sistema foi arquitetado para utilizar exclusivamente a API do Google:
- **Gemini Flash:** Utilizado para tarefas que exigem altíssima velocidade e processamento multimodal pesado (como analisar a imagem da tela junto com o áudio), com um custo de tokens ínfimo.
- **Gemini Lite:** Utilizado para tarefas rápidas de classificação, micro-roteamento cognitivo e verificação de regras.

**Vantagem:** O desenvolvedor ou usuário final paga apenas o tráfego da API do Google, o que representa uma fração de centavo por uso, entregando performance de ponta sem as mensalidades pesadas de ferramentas de produtividade SaaS.

---

## 🚀 Diferenciais do Projeto
1. **Arquitetura Zero-Fat:** Foco no essencial. Não utilizamos frameworks pesados e lentos como LangChain. Todo o roteamento cognitivo (Pydantic/FastAPI) é feito de forma crua, previsível e tipada.
2. **Híbrido Desktop (Local-First):** 
   - **Frontend:** Tauri (Rust) + React (Vite) garante consumo mínimo de RAM e CPU.
   - **Backend:** FastAPI (Python) possibilita interações rápidas com LLMs e gerenciamento de banco SQLite local.
3. **Privacidade Híbrida:** Suas customizações (Dicionário, Histórico) ficam estritamente no seu SQLite local.

---

## 🚧 Estado Atual vs. Em Desenvolvimento

### ✅ O que já está pronto (MVP Estável)
- Interface de usuário (React/Tauri) responsiva com Painel Histórico e MiniPanel (Floating Button).
- Backend FastAPI estruturado e servindo conexões na porta 14201.
- Captura multimodal (áudio do microfone + screenshot da tela ativa).
- Processamento pelo LLM (Gemini Flash/Lite) com proteção semântica usando dicionário SQLite.
- Injeção nativa do texto processado de volta para o SO.
- Sistema de inicialização seguro e autocontido (batch scripts locais).

### 🛠️ O que está em desenvolvimento (Roadmap)
- **Implementação da Nova Arquitetura Cognitiva (Shadow API):** Refatoração dos fluxos de prompt engine para micro-serviços isolados (IntentRouterService), permitindo fluxos multi-agentes mais complexos.
- **Testes Offline Total (Mock Mode):** Aprimoramento do `test_llm_mock_mode.py` para rodar pipelines de validação sem bater na API do Google (evitando custos durante o CI/CD).
- **Plugins de Contexto:** Adicionar formas do usuário selecionar ativamente partes da tela, ou plugar o RefinaVoz a IDEs (VSCode) e editores textuais via protocolo nativo.

---

## 🤝 Quer Contribuir?
Se você é desenvolvedor Python (FastAPI), Rust (Tauri) ou React moderno, o RefinaVoz é um laboratório excelente de **Agentic UI** e Integrações Multimodais "Bare-Metal". 

1. Certifique-se de ter Python 3.11+, Node.js e Rust instanciados (MSVC Build Tools no Windows).
2. Clone o repo, inicie via `abrir_filtro_de_fala.bat`.
3. Adicione sua chave `GEMINI_API_KEY` num `.env`.
4. Divirta-se refatorando!

---
*Gerado para a Comunidade Open-Source.*