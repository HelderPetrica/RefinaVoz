# 🏔️ Plano Arquitetural: A Fronteira da Nota 10 Absoluta

Este plano delineia as próximas etapas evolutivas para transformar o RefinaVoz, já em um nível SOTA de produtividade (Nota 9.5), em um produto comercial de altíssima segurança, portabilidade e performance isolada (Offline-First).

---

## 🎯 Objeto: Fronteiras Restantes
1. **Consolidação de Dados (SQLite)**
2. **Offline-First & Privacidade (Whisper Local)**
3. **Acesso Nativo macOS (Swift Bridge)**
4. **Publishing Comercial (Assinaturas e Instaladores)**

---

## Fase 1: Fundação de Dados Profissional (SQLite + SQLModel)
**Objetivo:** Substituir soluções paliativas em disco (como `dictionary.json`) e na memória efêmera do cliente (React LocalStorage) por um banco de dados relacional e rápido construído em Rust ou FastAPI.

*   **1.1. Migrar Histórico:** Sair do `useLocalMemory.ts` e passar a consumir `GET /history` e `POST /history` no FastAPI usando SQLite. Isso garantirá Analytics para o usuário (quais as palavras que ele mais tem dificuldade? Quantas horas o áudio foi transcrito no mês?).
*   **1.2. Transição do Dict:** Mover o CRUD do arquivo json para tabelas SQLite, permitindo paginação e índices se o dicionário crescer para 5.000+ termos.
*   **1.3. Gestão de Contexto:** Possibilidade de guardar os "Prompts Editáveis" no banco em vez de estarem amarrados como arquivos XML/estáticos.

## Fase 2: Motor Privado & Offline (Whisper.CPP)
**Objetivo:** Abandonar APIs externas (Google/Gemini) para áudio para fornecer controle granular 100% focado em privacidade, que funciona até dentro de avião sem Wi-Fi.

*   **2.1. Embed de Modelos:** Integrar `whisper.cpp` no backend. Baixar um modelo pequeno (ex.: *whisper-tiny*) especificamente sintonizado para hardware fraco/médio, ou *whisper-base* se houver VRAM.
*   **2.2. FastAPI Binding:** O backend passará a ingerir o áudio no roteamento e cuspir o texto processando em GPU/CPU da própria máquina pelo C++ enjaulado no core, zero dependência de servidor na nuvem.
*   **2.3. Rotação Custo-Zero:** Isso extingue o custo com tokens do Gemini para o processamento volumoso, passando a ser vitalício e "Free-to-Use".

## Fase 3: Paridade macOS Nível de Kernel (Swift/Accessibility)
**Objetivo:** Lidar com os pesados mecanismos de segurança da Apple (Gatekeeper & Accessibility) e portar as magias Win32 para código nativo do OS da Apple sem gambiarras.

*   **3.1. Swift na Fia:** Extender o Tauri para usar código nativo Mac via `mac_os_custom_code.rs` vinculando diretamente aos frameworks `Accessibility` e `AppKit`.
*   **3.2. Flow de Autenticação:** Ao iniciar o APP no Mac na primeira vez, mostrar aquele popup famoso e polido: *"O RefinaVoz deseja controlar o seu computador utilizando recursos de acessibilidade."* 
*   **3.3. Colar Inteligente:** Garantir que injetar o texto no *XCode*, *Safari* ou *Messages* será idêntico sem acionar proteções que forçam o crash do app.

## Fase 4: O Caminho para Publicação (Code Signing)
**Objetivo:** Fechar o ciclo transformando os códigos e scripts num executável que o vizinho possa baixar no site e instalar sem dor de cabeça no Windows Defender ou Gatekeeper.

*   **4.1. Refatoração Tauri.Conf:** Configurar todos icon sets para `ico` e `icns`, preencher corretamente IDs (ex: `com.seuapp.refinavoz`), versionamento em SemVer.
*   **4.2. Assinatura Windows (Microsoft):** Compilar usando certificados PFX para matar alertas de tela azul SmartScreen *"Aplicativo de fornecedor desconhecido"*.
*   **4.3. Instalação Silenciosa:** O Tauri exportará um belo `.msi` (Windows) e `.dmg` (Mac). Configurar atualizações automáticas (OTA Updates) direto pelo cliente, então na V2 não será preciso baixar do site de novo, o app atualizará sozinho.

---

###  ⏱️ Estimativas e Esforço

| Front | Complexidade | Dias Necessários | Dependências Principais |
| :--- | :---: | :---: | :--- |
| **Fase 1: SQLite** | Intermediário | 1 ~ 2 dias | `sqlmodel`, `pytest` |
| **Fase 2: Whisper** | Alto | 2 ~ 3 dias | `whisper.cpp`, `ffmpeg` |
| **Fase 3: Native Mac**| Alto | 2 ~ 4 dias | `macOS VM/device`, `Rust-ObjC` |
| **Fase 4: Publishing**| Burocrático | 1 ~ 2 dias | Certificados Pagos ($) |

> A ordem natural de desenvolvimento aconselhada é **Fase 1 → Fase 2 → Fase 4**, deixando a **Fase 3** apenas quando houver perspectiva de base de usuários ou demanda para ambiente Apple confirmada via testes comerciais reais.
