/**
 * useLocalMemory — Reconstruído na Fase SOTA 1 (Refatorado para consumir SQLite Backend).
 *
 * Busca o histórico da API (GET /history)
 * Persiste apenas as estatísticas de uso localmente (stats).
 */

import { useState, useCallback, useEffect } from "react";
import { getHistory, clearHistory as apiClearHistory, HistoryEntry } from "../services/apiClient";

const STORAGE_KEY = "refinavoz_stats";

export interface MemoryStats {
  totalProcessed: number;
  totalTokens: number;
  favoriteMode: string;
}

interface StatsState {
  preferredMode: string;
  stats: MemoryStats;
}

const DEFAULT_STATS: StatsState = {
  preferredMode: "vibe_code",
  stats: {
    totalProcessed: 0,
    totalTokens: 0,
    favoriteMode: "vibe_code",
  },
};

function loadStats(): StatsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    return JSON.parse(raw) as StatsState;
  } catch {
    return DEFAULT_STATS;
  }
}

function saveStats(state: StatsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Erro ao salvar stats locais:", e);
  }
}

interface UseLocalMemoryReturn {
  history: HistoryEntry[];
  stats: MemoryStats;
  preferredMode: string;
  addEntry: () => void;
  setPreferredMode: (mode: string) => void;
  clearHistory: () => void;
  refreshHistory: () => void;
}

export function useLocalMemory(): UseLocalMemoryReturn {
  const [statsState, setStatsState] = useState<StatsState>(loadStats);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Persistir automaticamente estatísticas a cada mudança
  useEffect(() => {
    saveStats(statsState);
  }, [statsState]);

  const refreshHistory = useCallback(async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (e) {
      console.error("Erro ao carregar histórico DB", e);
    }
  }, []);

  // Busca histórico real ao montar o hook
  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const addEntry = useCallback(
    () => {
      // O addEntry real desceu pro backend na rota /process.
      // Aqui só atualizamos stats e re-fetcheamos.
      setStatsState((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalProcessed: prev.stats.totalProcessed + 1,
        },
      }));
      // Wait a bit for backend commit to finish
      setTimeout(refreshHistory, 200);
    },
    [refreshHistory]
  );

  const setPreferredMode = useCallback((mode: string) => {
    setStatsState((prev) => ({ ...prev, preferredMode: mode }));
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await apiClearHistory();
      await refreshHistory();
    } catch (e) {
      console.error("Erro limpando DB", e);
    }
  }, [refreshHistory]);

  return {
    history,
    stats: statsState.stats,
    preferredMode: statsState.preferredMode,
    addEntry,
    setPreferredMode,
    clearHistory,
    refreshHistory
  };
}
