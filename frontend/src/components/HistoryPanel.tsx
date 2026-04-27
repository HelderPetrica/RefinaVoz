/**
 * HistoryPanel — Painel de histórico de processamentos do RefinaVoz.
 *
 * Mostra os últimos processamentos com modo, timestamp e texto truncado.
 * Permite copiar resultados anteriores e limpar o histórico.
 */

import React from "react";
import type { MemoryStats } from "../hooks/useLocalMemory";
import type { HistoryEntry } from "../services/apiClient";

interface HistoryPanelProps {
  history: HistoryEntry[];
  stats: MemoryStats;
  visible: boolean;
  onClose: () => void;
  onClear: () => void;
}

const MODE_ICONS: Record<string, string> = {
  vibe_code: "🎯",
  normal: "✏️",
  profissional: "💼",
  programador: "🐛",
  mensagem: "💬",
  prompt: "🧠",
};

function formatTime(timestamp: string | number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  stats,
  visible,
  onClose,
  onClear,
}) => {
  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  if (!visible) return null;

  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.error("Erro ao copiar para clipboard");
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="history-panel">
      {/* Header */}
      <div className="history-header">
        <span className="history-title">📜 Histórico</span>
        <span className="history-stats">
          {stats.totalProcessed} processamentos
        </span>
      </div>

      {/* Lista de Histórico */}
      <div className="history-list">
        {history.length === 0 ? (
          <div className="history-empty">
            Nenhum processamento ainda. Use o mic! 🎙️
          </div>
        ) : (
          history.slice(0, 10).map((entry) => (
            <div
              key={entry.id}
              className={`history-entry ${expandedId === entry.id ? 'expanded' : ''}`}
              onClick={() => toggleExpand(entry.id)}
            >
              <div className="history-entry-header">
                <span className="history-mode-badge">
                  {MODE_ICONS[entry.mode] || "📄"} {entry.mode}
                </span>
                <span className="history-time">{formatTime(entry.timestamp)}</span>
              </div>
              <div className="history-entry-text">
                {expandedId === entry.id ? entry.finalText : truncate(entry.finalText, 80)}
              </div>
              <div className="history-entry-actions">
                <button 
                  className="history-copy-btn" 
                  onClick={(e) => copyToClipboard(entry.finalText, e)}
                  title="Copiar texto original gerado"
                >
                  📋 Copiar
                </button>
                {entry.latencyMs > 0 && (
                  <span className="history-entry-meta">
                    ⚡ {entry.latencyMs}ms
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="history-footer">
        {history.length > 0 && (
          <button className="history-clear-btn" onClick={onClear}>
            🗑️ Limpar
          </button>
        )}
        <button className="history-close-btn" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
};
