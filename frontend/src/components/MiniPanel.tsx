/**
 * MiniPanel — Painel de configuração rápida do RefinaVoz.
 *
 * Contém: textarea de input, seletor de modo, botão de processamento,
 * e botão de fechar. Estilos migrados de inline para classes CSS.
 */

import React from "react";

interface MiniPanelProps {
  rawText: string;
  onRawTextChange: (text: string) => void;
  mode: string;
  onModeChange: (mode: string) => void;
  loading: boolean;
  speechSupported: boolean;
  onProcess: () => void;
  onClose: () => void;
  onOpenPromptStudio: () => void;
  engine: "web_speech" | "gemini";
  onEngineChange: (e: "web_speech" | "gemini") => void;
  autostartEnabled: boolean;
  onAutostartToggle: () => void;
  onOpenDictionary: () => void;
  visualContext?: {
    dataUrl: string;
    width: number;
    height: number;
    capturedAt: number;
  } | null;
  onClearVisualContext: () => void;
}

export const MiniPanel: React.FC<MiniPanelProps> = ({
  rawText,
  onRawTextChange,
  mode,
  onModeChange,
  loading,
  speechSupported,
  onProcess,
  onClose,
  onOpenPromptStudio,
  engine,
  onEngineChange,
  autostartEnabled,
  onAutostartToggle,
  onOpenDictionary,
  visualContext,
  onClearVisualContext,
}) => {
  return (
    <div className="mini-panel">
      {/* Input de Texto */}
      <div className="panel-section">
        <div className="panel-label">
          {speechSupported ? "🎙️ FALA CAPTURADA" : "⌨️ TEXTO MANUAL"}
        </div>
        <textarea
          className="panel-textarea"
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          rows={3}
          placeholder="Fale algo ou digite..."
        />
      </div>

      {visualContext && (
        <div className="panel-section visual-context-card">
          <img
            className="visual-context-thumb"
            src={visualContext.dataUrl}
            alt="Quadro capturado"
          />
          <div className="visual-context-meta">
            <strong>Quadro anexado</strong>
            <span>{visualContext.width}x{visualContext.height}px</span>
          </div>
          <button
            type="button"
            className="visual-context-clear"
            onClick={onClearVisualContext}
            title="Remover quadro do contexto"
            aria-label="Remover quadro do contexto"
          >
            ×
          </button>
        </div>
      )}

      {/* Seletor de Modo */}
      <div className="panel-section">
        <div className="panel-label-row">
          <span className="panel-label">MODO</span>
          <div className="panel-button-row">
            <button
              className="panel-studio-btn"
              onClick={onOpenDictionary}
              title="Editar dicionário de correções"
            >
              📖 Dict
            </button>
            <button
              className="panel-studio-btn"
              onClick={onOpenPromptStudio}
              title="Ver detalhes de todos os modos"
            >
              ✨ Studio
            </button>
          </div>
        </div>
        <select
          className="panel-select"
          value={mode}
          onChange={(e) => onModeChange(e.target.value)}
          aria-label="Selecionar modo de processamento"
          title="Modo de processamento"
        >
          <option value="vibe_code">Vibe Code Blueprint</option>
          <option value="normal">Correção Normal</option>
          <option value="profissional">Profissional / E-mail</option>
          <option value="programador">Issue Tracker & Triage</option>
          <option value="mensagem">Mensagem Curta</option>
          <option value="prompt">Meta-Prompt Builder</option>
          <option value="juridico_atendimento">Jurídico — Atendimento</option>
          <option value="juridico_whatsapp_cliente">Jurídico — WhatsApp Cliente</option>
          <option value="juridico_prompt_agente">Jurídico — Prompt para Agente</option>
          <option value="juridico_resumo_caso">Jurídico — Resumo de Caso</option>
          <option value="juridico_manifestacao_curta">Jurídico — Manifestação Curta</option>
          <option value="juridico_marketing_etico">Jurídico — Marketing Ético</option>
        </select>
      </div>

      {/* Opções SOTA */}
      <div className="panel-section panel-sota-options">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={engine === "gemini"}
            onChange={(e) => onEngineChange(e.target.checked ? "gemini" : "web_speech")}
          />
          <span>🎯 Áudio Preciso (Gemini)</span>
        </label>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={autostartEnabled}
            onChange={onAutostartToggle}
          />
          <span>🚀 Iniciar c/ Windows</span>
        </label>
      </div>

      {/* Botão de Ação */}
      <button
        className={`panel-action-btn ${loading ? "loading" : ""} ${!rawText.trim() ? "disabled" : ""}`}
        onClick={onProcess}
        disabled={loading || !rawText.trim()}
      >
        {loading ? "⏳ Processando e Injetando..." : "🚀 Refinar e Colar na Janela"}
      </button>

      {/* Fechar */}
      <button className="panel-close-btn" onClick={onClose}>
        Fechar
      </button>
    </div>
  );
};
