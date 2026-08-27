# RefinaVoz Frontend

Camada desktop/UI do RefinaVoz, construída com **React + TypeScript + Vite + Tauri v2**.

## Desenvolvimento

Na pasta `frontend`:

```bash
npm ci
npm run dev
```

Para executar via Tauri:

```bash
npm run tauri dev
```

## Build web

```bash
npm run build
```

## Camada nativa

O código Rust está em `src-tauri/`.

```bash
cd src-tauri
cargo check --locked
```

O caminho desktop atualmente homologado é **Windows-first**. macOS possui suporte parcial e Linux ainda requer implementação/homologação específica para integração nativa de janela, captura e auto-paste.

Para visão geral, privacidade e segurança, consulte o [README principal](../README.md), [PRIVACY.md](../PRIVACY.md) e [SECURITY.md](../SECURITY.md).
