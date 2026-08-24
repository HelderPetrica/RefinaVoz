/**
 * FloatingButton — O globo principal do RefinaVoz.
 *
 * Interações SOTA:
 *  - Clique esquerdo  → toggle gravação
 *  - Clique direito   → abre/fecha menu (MiniPanel)
 *  - X                → esconde no tray
 *  - i                → status rápido
 *  - Histórico        → abre histórico
 */

import React from "react";
import {
  DEFAULT_MASCOT_CONFIG,
  MascotCharacterVisual,
  resolveCharacterSize,
  type MascotConfig,
  type MascotVisualState,
} from "./MascotOrb";

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
  onOpenDictionary: () => void;
  onDuplicateAssistant: () => void | Promise<void>;
  onHideWidget: () => void;
  title?: string;
  mode?: string;
  wasSuccessful?: boolean;
  statusOpen?: boolean;
  historyOpen?: boolean;
  historyAvailable?: boolean;
  visualContextActive?: boolean;
  visualContextLoading?: boolean;
  hasError?: boolean;
  toolsOpen?: boolean;
  mascotConfig?: MascotConfig;
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
  <svg className="icon-small icon-stroke control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" />
    <path d="M18.2 8.6 19.7 7l-2.1-2.8-2 .9a7.5 7.5 0 0 0-1.7-.7L13.5 2h-3l-.4 2.4c-.6.2-1.2.4-1.7.7l-2-.9L4.3 7l1.5 1.6c-.2.5-.3 1.1-.3 1.7L3.5 11v2l2 .7c.1.6.2 1.2.5 1.7L4.5 17l2 2.8 2-.9c.5.3 1.1.5 1.7.7l.4 2.4h3l.4-2.4c.6-.2 1.2-.4 1.7-.7l2 .9 2-2.8-1.5-1.6c.2-.5.4-1.1.5-1.7l1.9-.7v-2l-1.9-.7c-.1-.6-.3-1.2-.5-1.7Z" />
  </svg>
);

const ProcessingIcon: React.FC = () => (
  <svg className="icon processing-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="processing-ring" cx="12" cy="12" r="8" />
    <path className="processing-hand" d="M12 7v5l3.2 2" />
    <circle className="processing-dot" cx="12" cy="12" r="2" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg className="icon icon-stroke" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12.5l4.4 4.4L19 7" />
  </svg>
);

const AlertIcon: React.FC = () => (
  <svg className="icon icon-stroke" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 8v5" />
    <path d="M12 17h.01" />
    <path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </svg>
);

const HistoryIcon: React.FC = () => (
  <svg className="icon-small icon-stroke control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4.5 5.5h11" />
    <path d="M4.5 10.5h8.5" />
    <path d="M4.5 15.5h5.5" />
    <path d="M17 13.5v4h3.2" />
    <path d="M21 17.6a4.4 4.4 0 1 1-1.3-3.1" />
    <path d="M21 13.8v3.2h-3.2" />
  </svg>
);

const DictionaryIcon: React.FC = () => (
  <svg className="icon-small icon-stroke control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5.5 4.5h8.2A3.8 3.8 0 0 1 17.5 8.3v11.2H8.2a2.7 2.7 0 0 1-2.7-2.7V4.5Z" />
    <path d="M8.5 8h5.4" />
    <path d="M8.5 11.3h4.2" />
    <path d="M17.5 8.5h1.2a2 2 0 0 1 2 2v9H17.5" />
    <path d="M8.7 16.2h5.8" />
  </svg>
);

const DuplicateIcon: React.FC = () => (
  <svg className="icon-small icon-stroke control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="8" y="8" width="10" height="10" rx="2.4" />
    <path d="M6 14H5.8A2.8 2.8 0 0 1 3 11.2V5.8A2.8 2.8 0 0 1 5.8 3h5.4A2.8 2.8 0 0 1 14 5.8V6" />
    <path d="M13 11.2v3.6" />
    <path d="M11.2 13h3.6" />
  </svg>
);

const CopyIcon: React.FC = () => (
  <svg className="icon-small icon-stroke control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="9" y="8.5" width="10.5" height="10.5" rx="2.2" />
    <path d="M6.5 15.5H6a2 2 0 0 1-2-2V6.2a2 2 0 0 1 2-2h7.3a2 2 0 0 1 2 2v.5" />
    <path d="M12 12h4.4" />
    <path d="M12 15.4h3" />
  </svg>
);

const FrameIcon: React.FC = () => (
  <svg className="icon-small icon-stroke control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="13.5" rx="2.6" />
    <path d="M7.5 8.5h3.2" />
    <path d="M16.3 8.5h.2" />
    <path d="m5.7 16 3.5-3.4 2.7 2.4 2-1.9 4.4 3.9" />
    <circle cx="15.7" cy="10.4" r="1.45" />
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg className="icon-small icon-stroke control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg className="icon-small icon-stroke control-icon control-icon-danger" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.4" />
    <path d="m8.5 8.5 7 7" />
    <path d="m15.5 8.5-7 7" />
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
  onOpenDictionary,
  onDuplicateAssistant,
  onHideWidget,
  title,
  mode = "normal",
  wasSuccessful = false,
  statusOpen = false,
  historyOpen = false,
  historyAvailable = false,
  visualContextActive = false,
  visualContextLoading = false,
  hasError = false,
  toolsOpen = false,
  mascotConfig = DEFAULT_MASCOT_CONFIG,
}) => {
  const buttonClassName = [
    "main-button",
    isRecording ? "recording" : "",
    loading ? "processing" : "",
    wasSuccessful ? "success" : "",
    hasError ? "error" : "",
    mascotConfig.character !== "app_button" ? "mascot-orb-button" : "",
    `mode-${mode}`,
  ]
    .filter(Boolean)
    .join(" ");
  const anchorClassName = [
    "bubble-anchor",
    mascotConfig.character !== "app_button" ? "mascot-anchor" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const buttonTitle = title || (loading
    ? "Processando áudio · aguarde"
    : isRecording
      ? "Parar gravação e processar · Alt+Space"
      : "Clique para gravar · botão direito abre o menu · Alt+Space");

  const buttonLabel = loading ? "Processando áudio" : isRecording ? "Parar gravação" : "Iniciar gravação";
  const visualState: MascotVisualState = hasError
    ? "error"
    : visualContextLoading
      ? "capturing_context"
      : loading
        ? "thinking"
        : wasSuccessful
          ? "success"
          : isRecording
            ? "listening"
            : toolsOpen
              ? "tools_open"
              : "idle";
  const buttonIcon = mascotConfig.character === "app_button"
    ? hasError ? <AlertIcon /> : loading ? <ProcessingIcon /> : wasSuccessful ? <CheckIcon /> : isRecording ? <StopIcon /> : <MicIcon />
    : <MascotCharacterVisual character={mascotConfig.character} state={visualState} variant={mascotConfig.variant} />;
  const size = resolveCharacterSize(mascotConfig.character);
  const bubbleStyle = {
    "--mascot-scale": mascotConfig.scale,
    "--main-button-size": `${Math.round(size.button * mascotConfig.scale)}px`,
    "--bubble-anchor-size": `${Math.round(size.anchor * mascotConfig.scale)}px`,
  } as React.CSSProperties;

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    onContextMenu();
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
    <div className={anchorClassName} style={bubbleStyle}>
      <button
        type="button"
        className={buttonClassName}
        onClick={onToggle}
        onContextMenu={handleContextMenu}
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
        className="bubble-control bubble-duplicate"
        onClick={(event) => handleControlClick(event, () => { void onDuplicateAssistant(); })}
        onContextMenu={handleContextMenu}
        title="Duplicar assistente em outra bolha"
        aria-label="Duplicar assistente"
      >
        <DuplicateIcon />
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
        className="bubble-control bubble-dict"
        onClick={(event) => handleControlClick(event, onOpenDictionary)}
        onContextMenu={handleContextMenu}
        title="Adicionar palavras ao dicionário"
        aria-label="Adicionar palavras ao dicionário"
      >
        <DictionaryIcon />
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
