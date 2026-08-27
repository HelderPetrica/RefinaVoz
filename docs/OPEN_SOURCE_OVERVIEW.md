# RefinaVoz — Open Source Overview

## O que é

RefinaVoz é um assistente de desktop de voz e escrita contextual. O fluxo principal recebe áudio, aplica regras e prompts especializados, pode usar contexto visual da janela ativa e devolve texto refinado ao aplicativo em que o usuário está trabalhando.

O projeto combina:

- **FastAPI/Python** no backend;
- **React + TypeScript** na interface;
- **Tauri/Rust** na camada desktop;
- **Gemini API** para inferência multimodal;
- **SQLite/estado local** para dicionário e memória local do aplicativo;
- prompts especializados para escrita normal, profissional, jurídica e programação.

## Estado público

O projeto está sendo publicado como **open-source beta, Windows-first**.

A arquitetura foi desenhada para ser multiplataforma, mas o estado real do código ainda não é equivalente entre sistemas operacionais:

- **Windows:** caminho principal e mais completo para captura, foco e auto-paste;
- **macOS:** suporte parcial; captura nativa da janela ativa ainda não possui paridade completa;
- **Linux:** backend/frontend são portáveis, mas o fluxo desktop completo ainda depende de implementação e homologação específica para X11/Wayland.

Nenhuma plataforma deve ser anunciada como “100% suportada” sem gate de build + teste funcional em hardware real.

## Capacidades implementadas

### Pipeline de ditado/refinamento

O backend recebe o conteúdo de áudio, aplica otimização/proteções, monta o contexto do modo selecionado e envia a requisição ao modelo configurado. O retorno é tratado antes da injeção no campo de texto.

### Modos especializados

Os templates em `prompts/` cobrem diferentes necessidades, incluindo:

- escrita normal;
- comunicação profissional;
- contexto jurídico;
- programação e Vibe Code;
- mensagens e formatos curtos.

### Proteção semântica

O dicionário local ajuda a preservar termos técnicos, nomes próprios, siglas e vocabulário específico do usuário.

### Contexto multimodal

O pipeline suporta imagem como contexto adicional. No desktop, a captura da janela ativa está implementada no caminho Windows. Como screenshots podem conter informação sensível, o uso profissional deve observar [PRIVACY.md](../PRIVACY.md).

### Live Voice

Existe um gateway WebSocket em `/api/v1/ws/live` para fluxo bidirecional. Essa camada é tratada como **experimental** porque o funcionamento real depende também do modelo/ID vigente e das condições da Gemini Live API. Testes mockados validam o gateway local, mas não substituem smoke test real contra o provedor.

## Privacidade: local-first, não local-only

O app e o backend executam localmente por padrão, mas funções que usam Gemini enviam ao provedor os dados necessários à inferência. Isso pode incluir áudio, prompts, texto contextual e screenshot quando o contexto visual é utilizado.

A chave é fornecida pelo próprio usuário via `.env`. O projeto não deve ser descrito como totalmente offline ou como se áudio/imagem nunca saíssem da máquina.

Veja [PRIVACY.md](../PRIVACY.md) e [SECURITY.md](../SECURITY.md).

## Testes e qualidade

A suite Python está em `testes/` e contém testes de configuração, endpoints, eventos, prompt engine, proteção semântica, multimodalidade, rotação/failover de chaves e gateway Live em mock mode.

A preparação pública adiciona `.github/workflows/ci.yml` com três gates:

1. `pytest` do backend em ambiente mockado;
2. `npm ci` + `npm run build` do frontend;
3. `cargo check --locked` da camada Tauri em Windows.

Resultados históricos locais não devem ser apresentados como garantia permanente. O indicador de confiança público passa a ser o CI associado ao commit/PR corrente.

## Quotas e múltiplas chaves

O cliente pode alternar entre chaves que o próprio usuário configurou quando uma delas recebe erro de cota. A finalidade é **failover operacional entre credenciais legítimas**, respeitando quotas, termos e políticas do provedor — não contornar limites.

## Custos

RefinaVoz não cobra mensalidade por ser um projeto open source, mas uso real de modelos externos pode gerar custo ou consumir cota da conta do usuário. O valor depende do modelo, volume, plano e política de preços vigentes no provedor.

Por isso o projeto não promete “custo zero” nem fixa valores de terceiros no README.

## Contribuição

Contribuições úteis incluem:

- homologação e implementação nativa para macOS/Linux;
- benchmarks de latência reproduzíveis;
- smoke tests controlados de Gemini Live;
- testes de foco, clipboard, captura e auto-paste;
- acessibilidade do HUD;
- novos modos de escrita e proteção semântica;
- documentação de instalação e troubleshooting.

Leia também `CONTRIBUTING.md`, `AGENTS.md` e os demais documentos em `docs/` antes de alterar a arquitetura central.

## Licença

MIT. Consulte `LICENSE` na raiz do repositório.
