/**
 * useGlobalShortcuts — Hook para múltiplos atalhos globais via Tauri Plugin.
 *
 * Registra atalhos de teclado que funcionam mesmo quando
 * o app não está em foco (sistema operacional nível).
 */
import { useEffect, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { logger } from "../services/logger";

export function useGlobalShortcuts(
  shortcuts: Record<string, () => void>
): void {
  const callbacksRef = useRef(shortcuts);

  useEffect(() => {
    callbacksRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!isTauri()) {
      logger.debug("shortcuts.skip.nonTauriRuntime");
      return;
    }

    const setup = async () => {
      await unregisterAll().catch((err) => {
        logger.warn("shortcuts.unregisterAll.error", err);
      });

      for (const shortcut of Object.keys(shortcuts)) {
        try {
          await register(shortcut, async (event) => {
            if (event.state === "Pressed") {
              const callback = callbacksRef.current[shortcut];
              if (callback) callback();
            }
          });
        } catch (err) {
          logger.error("shortcuts.register.error", { shortcut, err });
        }
      }
    };
    setup();

    return () => {
      unregisterAll().catch((err) => {
        logger.warn("shortcuts.unregisterAll.cleanup.error", err);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(shortcuts).join(",")]); // Recalcula se as chaves mudarem
}
