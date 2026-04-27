/**
 * useAutostart — Hook para controle de inicialização automática com o Windows.
 *
 * Usa tauri-plugin-autostart para registrar/desregistrar o app no autostart do OS.
 */

import { useState, useEffect, useCallback } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

interface UseAutostartReturn {
  /** Se o autostart está ativo */
  enabled: boolean;
  /** Toggle autostart on/off */
  toggle: () => Promise<void>;
  /** Se está carregando o estado */
  loading: boolean;
}

export function useAutostart(): UseAutostartReturn {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isEnabled()
      .then((v) => setEnabled(v))
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (enabled) {
        await disable();
        setEnabled(false);
      } else {
        await enable();
        setEnabled(true);
      }
    } catch (e) {
      console.error("Erro ao alterar autostart:", e);
    }
  }, [enabled]);

  return { enabled, toggle, loading };
}
