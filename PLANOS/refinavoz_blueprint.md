# 🧠 Engenharia Reversa Total: O Cérebro do **RefinaVoz**

Este documento é o blueprint técnico consolidado do **RefinaVoz**. Ele expõe a lógica de raciocínio, a arquitetura mínima necessária, a divisão entre frontend e backend, a camada de prompts editáveis, o dicionário semântico pessoal e o fluxo operacional para que um agente de código implemente o sistema com o menor desvio possível.

O projeto é **pessoal**, **Windows-first**, **modular**, **leve** e **orientado a produtividade real**. Não é SaaS, não é produto para terceiros nesta fase e não deve inflar escopo. O objetivo é resolver uma dor concreta: reduzir digitação e esforço físico no desktop, especialmente em fluxo de programação, prompts e escrita técnica.

---

## 1. Objetivo do sistema

O RefinaVoz é um **assistente pessoal de fala para texto no Windows**. Ele não é apenas um transcritor. Ele é um **refinador semântico**.

### Entrada:
* Voz do usuário

### Saída:
* Texto útil, corrigido, contextualizado e reaproveitável

### Problema que resolve:
* Dor física com teclado/mouse
* Transcrição ruim de português misturado com termos técnicos
* Retrabalho em mensagens, prompts e instruções de código
* Erros recorrentes de vocabulário pessoal

### Tese central:
* O valor principal não está em “voz para texto”.
* O valor está em **voz → texto útil**.
* O sistema precisa entender contexto, modo, termos pessoais e vocabulário abrasileirado.

---

## 2. Decisão de plataforma

A primeira versão é **Windows**, não Android.

### Motivos:
* A dor principal está no desktop.
* O MVP no Windows tem menos atrito técnico do que começar com overlay e acessibilidade no Android.
* Prompts, lógica semântica, dicionário e backend poderão ser reaproveitados depois em outras plataformas.

A interface desktop pode ser implementada com shell leve baseado em webview. O **Tauri v2** suporta customização de janela e `alwaysOnTop`, e o **WebView2** é a base oficial da Microsoft para hospedar interface web em apps Windows.

---

## 3. Princípios Não Negociáveis

1.  **Uso pessoal**: O projeto nasce para resolver a dor do próprio usuário.
2.  **Baixa gordura**: Nada de features paralelas que não impactem o uso central.
3.  **Modularidade forte**: Arquivos curtos, funções pequenas, responsabilidades claras.
4.  **Frontend e backend separados**: O shell visual não deve carregar o cérebro inteiro.
5.  **Prompts parcialmente editáveis**: O usuário pode editar alguns prompts na interface, sem quebrar o pipeline interno.
6.  **Baixa latência**: O sistema não pode inflar contexto nem carregar regras irrelevantes.
7.  **Leveza**: O app precisa ser discreto, objetivo e não consumir memória à toa.
8.  **Evolução incremental**: Primeiro funcionar. Depois aprender. Depois sofisticar.

---

## 4. Arquitetura-Base

### 4.1 Frontend (Tauri v2 + React)
* Botão flutuante.
* Mini painel contextual.
* Seleção de modo.
* Exibição do texto processado.
* Edição de prompts liberados.
* Correção rápida de palavras.
* Histórico leve.
* Comandos rápidos (copiar, reprocessar, minimizar).

### 4.2 Backend (Python + FastAPI)
* Captura/recepção de áudio.
* Transcrição bruta (STT).
* Pré-processamento semântico.
* Aplicação do dicionário pessoal.
* Carregamento do prompt por modo.
* Chamada ao modelo (Gemini).
* Pós-processamento.
* Persistência local (SQLite).
* Logs operacionais mínimos.

### 4.3 Modelo
O modelo recomendado é o **Gemini 3.1 Flash-Lite Preview**, pela sua economia e baixíssima latência em tarefas multimodais de alta frequência.

### 4.4 SDK
A integração deve usar o **Google GenAI SDK** oficial.

---

## 5. Stack Recomendada

### Frontend
* React + TypeScript.
* Tauri v2 (Shell preferencial).
* WebView2 (Runtime Windows).

### Backend
* Python + FastAPI.
* SQLite (Persistência local inicial).
* Módulos isolados por responsabilidade.

---

## 6. UX Principal: Botão Flutuante

O centro da experiência é um **botão flutuante discreto**.

*   **Comportamento**: Sempre visível (`alwaysOnTop`), compacto.
*   **Interação**: Abrir mini painel ao passar o mouse (hover de 1.5s - 2.5s).
*   **Ações**: Gravar, Parar, Copiar, Reprocessar, Trocar Modo, Corrigir, Minimizar, Sair.
*   **Visual**: Simpático e funcional, sem poluição visual.

---

## 7. Modos do Sistema

O sistema prevê múltiplos comportamentos (`Modos`):
*   **Normal**: Uso geral.
*   **Mensagem**: Comunicação rápida.
*   **Profissional**: Tom formal.
*   **Programador**: Prioriza termos técnicos e mistura de idiomas.
*   **Vibe Code**: Transforma fala solta em instruções operacionais técnicas (Objetivo, Contexto, Restrições, Saída).
*   **Prompt**: Focado na criação de prompts para outros LLMs.

---

## 8. Pipeline Operacional

Fluxo: `Acionamento` -> `Gravação` -> `Transcrição Bruta` -> `Detecção de Modo` -> `Dicionário Pessoal` -> `Prompt do Modo` -> `Chamada Gemini` -> `Texto Final`.

*   Cada etapa deve ser rastreável.
*   Sem contexto desnecessário para manter baixa latência.

---

## 9. Dicionário Semântico Pessoal

Diferencial para lidar com:
*   Palavras abrasileiradas (ex: "skills" virar "esquilos").
*   Pronúncias pessoais e abreviações.
*   **Segmentação**: O dicionário é carregado por domínio (Programação, Mensagem, Geral) para evitar ambiguidades.

---

## 10. Prompts Editáveis

Os prompts dos modos ficam em arquivos `.md` externos (ex: `prompts/programador.md`), permitindo edição via interface sem alterar o código do motor.

---

## 11. Meta-Prompts Internos

### 11.1 Arquiteto de Saída
Filtra o ruído e garante fidelidade à intenção.
### 11.2 Modo Vibe Code
Organiza a fala em blocos técnicos (Objetivo, Contexto, Restrições).
### 11.3 Corretor Técnico
Protege termos canônicos do dicionário pessoal.

---

## 12. Sequência de Implementação

1.  **Fase 1**: Shell Desktop (Tauri), Botão Flutuante, Gravação Básica.
2.  **Fase 2**: Transcrição, Chamada Gemini, Retorno de Texto, Copiar.
3.  **Fase 3**: Modos e Prompts editáveis via `.md`.
4.  **Fase 4**: Dicionário Semântico e Correção Assistida (persistência SQLite).
5.  **Fase 5**: Reprocessamento, Histórico e Polimento de UX.

---

## 13. Critério de Sucesso
Redução real de digitação e esforço físico no dia a dia, transformando fala bagunçada em texto técnico útil e pronto para uso.
