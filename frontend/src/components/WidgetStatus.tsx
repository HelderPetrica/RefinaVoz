import React from "react";
import type { DiagnosticsStatus } from "../services/apiClient";

interface WidgetStatusProps {
  diagnostics: DiagnosticsStatus | null;
  error: string | null;
  updatedAt: number | null;
  engine: "web_speech" | "gemini";
  mode: string;
  autostartEnabled: boolean;
  microphoneSupported: boolean;
  isTauriRuntime: boolean;
  onRefresh: () => void;
  onClose: () => void;
}

function formatUpdatedAt(updatedAt: number | null): string {
  if (!updatedAt) return "--";
  return new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusText(value: boolean, ok = "OK", bad = "Falha"): string {
  return value ? ok : bad;
}

export const WidgetStatus: React.FC<WidgetStatusProps> = ({
  diagnostics,
  error,
  updatedAt,
  engine,
  mode,
  autostartEnabled,
  microphoneSupported,
  isTauriRuntime,
  onRefresh,
  onClose,
}) => {
  const backendOk = diagnostics?.status === "ok";

  return (
    <section className="widget-status" aria-label="Status do RefinaVoz">
      <header className="widget-status-header">
        <div>
          <div className="widget-status-title">RefinaVoz</div>
          <div className="widget-status-subtitle">Atualizado {formatUpdatedAt(updatedAt)}</div>
        </div>
        <button className="status-close-btn" type="button" onClick={onClose} aria-label="Fechar status">
          X
        </button>
      </header>

      <div className="status-grid">
        <StatusItem label="Backend" value={statusText(backendOk)} tone={backendOk ? "good" : "bad"} />
        <StatusItem label="Chaves" value={String(diagnostics?.configured_keys ?? 0)} tone={(diagnostics?.configured_keys ?? 0) > 0 ? "good" : "warn"} />
        <StatusItem label="Modo LLM" value={diagnostics?.mock_mode ? "Mock" : "Real"} tone={diagnostics?.mock_mode ? "warn" : "good"} />
        <StatusItem label="Microfone" value={statusText(microphoneSupported)} tone={microphoneSupported ? "good" : "bad"} />
        <StatusItem label="Runtime" value={isTauriRuntime ? "Tauri" : "Browser"} tone={isTauriRuntime ? "good" : "warn"} />
        <StatusItem label="Autostart" value={autostartEnabled ? "On" : "Off"} tone={autostartEnabled ? "good" : "neutral"} />
      </div>

      <div className="status-details">
        <div><span>Engine</span><strong>{engine === "gemini" ? "Gemini Audio" : "Web Speech"}</strong></div>
        <div><span>Modo</span><strong>{mode}</strong></div>
        <div><span>Texto</span><strong>{diagnostics?.model_default ?? "--"}</strong></div>
        <div><span>Audio</span><strong>{diagnostics?.audio_model ?? "--"}</strong></div>
      </div>

      {error && <div className="status-error">{error}</div>}

      <button className="status-refresh-btn" type="button" onClick={onRefresh}>
        Atualizar status
      </button>
    </section>
  );
};

interface StatusItemProps {
  label: string;
  value: string;
  tone: "good" | "warn" | "bad" | "neutral";
}

const StatusItem: React.FC<StatusItemProps> = ({ label, value, tone }) => (
  <div className={`status-item tone-${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);