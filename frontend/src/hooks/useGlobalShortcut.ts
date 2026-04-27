/**
 * useGlobalShortcut — Hook para atalhos globais via Tauri Plugin.
 *
 * Registra atalhos de teclado que funcionam mesmo quando
 * o app não está em foco (sistema operacional nível).
 */

import { useEffect, useRef } from "react";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";

/**
 * Registra um atalho global e executa o callback quando pressionado.
 * Limpa automaticamente no unmount do componente.
 *
 * @param shortcut - Combinação de teclas (ex: "Alt+Space")
 * @param callback - Função executada ao pressionar o atalho
 */
export function useGlobalShortcut(
  shortcut: string,
  callback: () => void
): void {
  const callbackRef = useRef(callback);

  // Manter ref atualizada para evitar stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const setup = async () => {
      await unregisterAll();
      try {
        await register(shortcut, async (event) => {
          if (event.state === "Pressed") {
            callbackRef.current();
          }
        });
      } catch (err) {
        console.error(`Erro ao registrar atalho global '${shortcut}':`, err);
      }
    };
    setup();

    return () => {
      unregisterAll();
    };
  }, [shortcut]);
}
