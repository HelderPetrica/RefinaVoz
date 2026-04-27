/**
 * FloatingButton — O globo principal do RefinaVoz.
 *
 * Interações SOTA:
 *  - Clique esquerdo  → toggle gravação
 *  - Clique direito   → abre/fecha menu (MiniPanel)
 *  - X                → esconde no tray
 *  - i                → status rápido
 *  - Histórico        → abre histórico
 *  - Grip             → arrasta a janela
 */

import React, { useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface FloatingButtonProps {
  isRecording: boolean;
  loading: boolean;
  onToggle: () => void;
  onPrepareCaptureText: () => void | Promise<void>;
  onCaptureText: () => void;
  onPrepareCaptureVisualContext: () => void | Promise<void>;
  onCaptureVisualContext: () => void;
  onContextMenu: () => void;
  onOpenSettings: () => void;
  onOpenStatus: () => void;
  onOpenHistory: () => void;
  onHideWidget: () => void;
  title?: string;
  mode?: string;
  wasSuccessful?: boolean;
  statusOpen?: boolean;
  historyOpen?: boolean;
  historyAvailable?: boolean;
  visualContextActive?: boolean;
  visualContextLoading?: boolean;
}

const MicIcon: React.FC = () => (
  <svg className="icon mic-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path className="mic-signal mic-signal-left" d="M4.8 10.2c-.8 1.1-.8 2.5 0 3.6" />
    <path className="mic-signal mic-signal-right" d="M19.2 10.2c.8 1.1.8 2.5 0 3.6" />
    <path className="mic-body" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
    <path className="mic-body" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
  </svg>
);

const StopIcon: React.FC = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const SettingsIcon: React.FC = () => (
  <svg className="icon-small" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.14 12.94a7.97 7.97 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.99 7.99 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.55-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.97 7.97 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.34.6.22l2.39-.96c.49.39 1.03.7 1.62.94l.36 2.54c.06.25.27.42.5.42h3.84c.23 0 .44-.17.5-.42l.36-2.54c.59-.24 1.13-.55 1.62-.94l2.39.96c.18.12.46.02.6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
  </svg>
);

const ProcessingIcon: React.FC = () => (
  <svg className="icon processing-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="processing-ring" cx="12" cy="12" r="8" />
    <path className="processing-hand" d="M12 7v5l3.2 2" />
    <circle className="processing-dot" cx="12" cy="12" r="2" />
  </svg>
);

const HistoryIcon: React.FC = () => (
  <svg className="icon-small icon-stroke" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 5.5h16" />
    <path d="M4 12h11" />
    <path d="M4 18.5h7" />
    <path d="M17 14v4h3" />
    <path d="M21 18a4 4 0 1 1-1.17-2.83" />
  </svg>
);

const CopyIcon: React.FC = () => (
  <svg className="icon-small icon-stroke" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="9" y="9" width="10" height="10" rx="2" />
    <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
  </svg>
);

const FrameIcon: React.FC = () => (
  <svg className="icon-small icon-stroke" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 4H6a2 2 0 0 0-2 2v2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
    <path d="M4 16v2a2 2 0 0 0 2 2h2" />
    <circle cx="12" cy="12" r="2.4" />
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg className="icon-small" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11 10h2v7h-2v-7Zm0-3h2v2h-2V7Z" />
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg className="icon-small" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Z" />
    <path d="M17.6 5 19 6.4 6.4 19 5 17.6 17.6 5Z" />
  </svg>
);

const GripIcon: React.FC = () => (
  <svg className="icon-small" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 5h2v2H9V5Zm4 0h2v2h-2V5ZM9 11h2v2H9v-2Zm4 0h2v2h-2v-2ZM9 17h2v2H9v-2Zm4 0h2v2h-2v-2Z" />
  </svg>
);

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  isRecording,
  loading,
  onToggle,
  onPrepareCaptureText,
  onCaptureText,
  onPrepareCaptureVisualContext,
  onCaptureVisualContext,
  onContextMenu,
  onOpenSettings,
  onOpenStatus,
  onOpenHistory,
  onHideWidget,
  title,
  mode = "normal",
  wasSuccessful = false,
  statusOpen = false,
  historyOpen = false,
  historyAvailable = false,
  visualContextActive = false,
  visualContextLoading = false,
}) => {
  const dragTimerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const buttonClassName = [
    "main-button",
    isRecording ? "recording" : "",
    loading ? "processing" : "",
    wasSuccessful ? "success" : "",
    `mode-${mode}`,
  ]
    .filter(Boolean)
    .join(" ");

  const buttonTitle = title || (loading
    ? "Processando áudio · aguarde"
    : isRecording
      ? "Parar gravação e processar · Alt+Space"
      : "Clique para gravar · botão direito abre o menu · Alt+Space");

  const buttonLabel = loading ? "Processando áudio" : isRecording ? "Parar gravação" : "Iniciar gravação";
  const buttonIcon = loading ? <ProcessingIcon /> : isRecording ? <StopIcon /> : <MicIcon />;

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    onContextMenu();
  };

  const clearDragTimer = () => {
    if (dragTimerRef.current !== null) {
      window.clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || loading) return;
    clearDragTimer();
    suppressClickRef.current = false;
    dragTimerRef.current = window.setTimeout(() => {
      dragTimerRef.current = null;
      suppressClickRef.current = true;
      if (isTauri()) {
        void getCurrentWindow().startDragging().catch(() => {
          suppressClickRef.current = false;
        });
      }
    }, 360);
  };

  const handlePointerEnd = () => {
    clearDragTimer();
  };

  const handleToggleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
      return;
    }
    onToggle();
  };

  const handleControlClick = (event: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
    event.stopPropagation();
    action();
  };

  const handleControlPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    action: () => void | Promise<void>,
  ) => {
    event.stopPropagation();
    void action();
  };

  return (
    <div className="bubble-anchor">
      <button
        type="button"
        className={buttonClassName}
        onClick={handleToggleClick}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        title={buttonTitle}
        aria-label={buttonLabel}
        disabled={loading}
      >
        {buttonIcon}
      </button>

      <button
        type="button"
        className="bubble-control bubble-visual"
        onPointerDown={(event) => handleControlPointerDown(event, onPrepareCaptureVisualContext)}
        onClick={(event) => handleControlClick(event, onCaptureVisualContext)}
        onContextMenu={handleContextMenu}
        title={visualContextActive ? "Atualizar quadro capturado" : "Capturar quadro para contexto"}
        aria-label={visualContextActive ? "Atualizar quadro no contexto" : "Capturar quadro no contexto"}
        disabled={visualContextLoading}
      >
        <FrameIcon />
      </button>

      <button
        type="button"
        className="bubble-control bubble-close"
        onClick={(event) => handleControlClick(event, onHideWidget)}
        onContextMenu={handleContextMenu}
        title="Esconder no tray"
        aria-label="Esconder RefinaVoz no tray"
      >
        <CloseIcon />
      </button>

      <button
        type="button"
        className="bubble-control bubble-copy"
        onPointerDown={(event) => handleControlPointerDown(event, onPrepareCaptureText)}
        onClick={(event) => handleControlClick(event, onCaptureText)}
        onContextMenu={handleContextMenu}
        title="Selecionar tudo e copiar da janela ativa"
        aria-label="Selecionar tudo e copiar da janela ativa"
      >
        <CopyIcon />
      </button>

      <button
        type="button"
        className={`bubble-control bubble-info ${statusOpen ? "active" : ""}`}
        onClick={(event) => handleControlClick(event, onOpenStatus)}
        onContextMenu={handleContextMenu}
        title="Ver status"
        aria-label="Ver status do RefinaVoz"
      >
        <InfoIcon />
      </button>

      {historyAvailable && (
        <button
          type="button"
          className={`bubble-control bubble-history ${historyOpen ? "active" : ""}`}
          onClick={(event) => handleControlClick(event, onOpenHistory)}
          onContextMenu={handleContextMenu}
          title="Ver histórico"
          aria-label="Ver histórico do RefinaVoz"
        >
          <HistoryIcon />
        </button>
      )}

      <div
        className="bubble-control bubble-grip"
        data-tauri-drag-region
        title="Arrastar bolha"
        aria-label="Arrastar bolha"
        role="button"
      >
        <GripIcon />
      </div>

      <button
        type="button"
        className={`bubble-control bubble-cog ${visualContextActive ? "active" : ""}`}
        onClick={(event) => handleControlClick(event, onOpenSettings)}
        onContextMenu={handleContextMenu}
        title="Abrir menu de opções"
        aria-label="Abrir menu de opções"
      >
        <SettingsIcon />
      </button>
    </div>
  );
};
