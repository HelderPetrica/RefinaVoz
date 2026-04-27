/**
 * useTextInjection — Hook para captura de janela Win32 e injeção de texto.
 *
 * Captura o HWND da janela em foco antes da gravação,
 * e após o processamento, restaura o foco e cola o texto (Ctrl+V).
 */

import { useRef, useCallback } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { logger } from "../services/logger";

const CLIPBOARD_RETRY_DELAYS_MS = [80, 140, 220];

async function readClipboardTextWithRetry(): Promise<string> {
  let lastValue = "";

  for (const delayMs of [0, ...CLIPBOARD_RETRY_DELAYS_MS]) {
    if (delayMs > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }

    try {
      lastValue = await navigator.clipboard.readText();
      if (lastValue.trim()) {
        return lastValue;
      }
    } catch (error) {
      logger.warn("textInjection.clipboard.read.retry.error", { delayMs, error });
    }
  }

  return lastValue;
}

interface UseTextInjectionReturn {
  /** Captura o HWND da janela atualmente em foco */
  captureTarget: () => Promise<void>;
  /** Restaura o foco do alvo, executa Ctrl+A + Ctrl+C e retorna o texto copiado */
  captureSelectedText: () => Promise<string>;
  /** Retorna o HWND externo preservado, quando existir */
  getTargetHwnd: () => number | null;
  /** Injeta texto na janela capturada via clipboard + Ctrl+V */
  injectText: (text: string) => Promise<void>;
  /** Se existe um alvo capturado */
  hasTarget: boolean;
}

export function useTextInjection(): UseTextInjectionReturn {
  const targetHwndRef = useRef<number | null>(null);

  const captureTarget = useCallback(async () => {
    if (!isTauri()) {
      logger.debug("textInjection.capture.skip.nonTauriRuntime");
      return;
    }

    try {
      const hwnd = await invoke<number>("get_foreground_window_handle");
      if (!hwnd) {
        logger.debug("textInjection.capture.skip.ownWindowOrUnsupported", {
          previousHwnd: targetHwndRef.current,
        });
        return;
      }

      targetHwndRef.current = hwnd;
      logger.debug("textInjection.capture.ok", { hwnd });
    } catch (e) {
      logger.error("textInjection.capture.error", e);
    }
  }, []);

  const captureSelectedText = useCallback(async () => {
    if (!targetHwndRef.current) {
      throw new Error("Nenhuma janela alvo foi capturada para copiar o texto.");
    }

    if (!isTauri()) {
      logger.debug("textInjection.copyAll.skip.nonTauriRuntime");
      throw new Error("A copia automatica so funciona no app desktop.");
    }

    await invoke("restore_focus_and_select_all_copy", {
      hwndVal: targetHwndRef.current,
    });

    const copiedText = await readClipboardTextWithRetry();
    if (!copiedText.trim()) {
      throw new Error("Nenhum texto foi copiado da janela alvo.");
    }

    logger.debug("textInjection.copyAll.ok", {
      hwnd: targetHwndRef.current,
      length: copiedText.length,
    });

    return copiedText;
  }, []);

  const getTargetHwnd = useCallback(() => targetHwndRef.current, []);

  const injectText = useCallback(async (text: string) => {
    if (!targetHwndRef.current || !text) return;
    if (!isTauri()) {
      logger.debug("textInjection.inject.skip.nonTauriRuntime");
      return;
    }

    // Salvar clipboard atual
    let oldClipboard = "";
    try {
      oldClipboard = await navigator.clipboard.readText();
    } catch {
      logger.warn("textInjection.clipboard.previous.read.error");
    }

    // Copiar texto refinado para o clipboard
    await navigator.clipboard.writeText(text);

    // Restaurar foco e simular Ctrl+V via Rust/Win32
    await invoke("restore_focus_and_paste", {
      hwndVal: targetHwndRef.current,
    });
    logger.debug("textInjection.inject.ok", { hwnd: targetHwndRef.current, length: text.length });

    // Restaurar clipboard original após delay
    if (oldClipboard) {
      setTimeout(async () => {
        try {
          await navigator.clipboard.writeText(oldClipboard);
        } catch {
          logger.warn("textInjection.clipboard.restore.error");
        }
      }, 1000);
    }
  }, []);

  return {
    captureTarget,
    captureSelectedText,
    getTargetHwnd,
    injectText,
    hasTarget: targetHwndRef.current !== null,
  };
}
