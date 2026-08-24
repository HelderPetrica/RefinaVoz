/**
 * App.tsx — Orquestrador principal do RefinaVoz.
 *
 * Responsável apenas por compor hooks e componentes.
 * Zero lógica de negócio inline. ~180 linhas.
 */

import { useState, useCallback, useEffect, type CSSProperties } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { logger } from "./services/logger";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { useFloatingWindow } from "./hooks/useFloatingWindow";
import { useTextInjection } from "./hooks/useTextInjection";
import { useLocalMemory } from "./hooks/useLocalMemory";
import { useAutostart } from "./hooks/useAutostart";
import {
  processText as apiProcessText,
  processAudio as apiProcessAudio,
  getDiagnostics,
  type DiagnosticsStatus,
} from "./services/apiClient";

import { FloatingButton } from "./components/FloatingButton";
import { LiveTranscript } from "./components/LiveTranscript";
import { MiniPanel } from "./components/MiniPanel";
import { PromptStudio } from "./components/PromptStudio";
import { HistoryPanel } from "./components/HistoryPanel";
import { DictionaryEditor } from "./components/DictionaryEditor";
import { WidgetStatus } from "./components/WidgetStatus";
import { MascotOrbLab } from "./components/MascotOrbLab";
import {
  DEFAULT_MASCOT_CONFIG,
  clampMascotScale,
  resolveCharacterSize,
  type MascotConfig,
} from "./components/MascotOrb";

import "./App.css";

interface NativeVisualCapture {
  data_url: string;
  mime_type: string;
  width: number;
  height: number;
}

interface VisualContextState {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
  capturedAt: number;
  blob: Blob;
}

const MASCOT_CONFIG_STORAGE_KEY = "refinavoz.mascot.config";

function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const base64 = dataUrl.split(",", 2)[1];
  if (!base64) {
    throw new Error("Captura visual invalida.");
  }

  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

function loadMascotConfig(): MascotConfig {
  try {
    const rawConfig = window.localStorage.getItem(MASCOT_CONFIG_STORAGE_KEY);
    if (!rawConfig) {
      return DEFAULT_MASCOT_CONFIG;
    }

    const parsedConfig = JSON.parse(rawConfig) as Partial<MascotConfig>;
    const legacyCharacter = (parsedConfig as Partial<{ kind: string }>).kind === "orb"
      ? "voice_orb"
      : (parsedConfig as Partial<{ kind: string }>).kind === "normal"
        ? "app_button"
        : undefined;
    return {
      character: parsedConfig.character === "robot_classic"
        || parsedConfig.character === "robot_modern"
        || parsedConfig.character === "robot_pseudo_3d"
        || parsedConfig.character === "living_document"
        || parsedConfig.character === "voice_orb"
        || parsedConfig.character === "app_button"
        ? parsedConfig.character
        : legacyCharacter
          ? legacyCharacter
        : DEFAULT_MASCOT_CONFIG.character,
      scale: clampMascotScale(Number(parsedConfig.scale)),
      variant: parsedConfig.variant === "feminine" || parsedConfig.variant === "masculine"
        ? parsedConfig.variant
        : DEFAULT_MASCOT_CONFIG.variant,
    };
  } catch {
    return DEFAULT_MASCOT_CONFIG;
  }
}

function App() {
  // ─── Hooks de domínio ───
  const speech = useSpeechRecognition();
  const audio = useAudioRecorder();
  const injection = useTextInjection();
  const memory = useLocalMemory();
  const autostart = useAutostart();

  // ─── UI State ───
  const [showPanel, setShowPanel] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDict, setShowDict] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showMascotLab, setShowMascotLab] = useState(false);
  const [mascotConfig, setMascotConfig] = useState<MascotConfig>(() => loadMascotConfig());
  const [loading, setLoading] = useState(false);
  const [wasSuccessful, setWasSuccessful] = useState(false);
  const [mode, setMode] = useState(memory.preferredMode);
  const [engine, setEngine] = useState<"web_speech" | "gemini">("gemini");
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsStatus | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [diagnosticsUpdatedAt, setDiagnosticsUpdatedAt] = useState<number | null>(null);
  const [visualContext, setVisualContext] = useState<VisualContextState | null>(null);
  const [visualContextLoading, setVisualContextLoading] = useState(false);
  const activeBubbleSize = Math.round(resolveCharacterSize(mascotConfig.character).anchor * mascotConfig.scale);
  const mascotWindowScale = (activeBubbleSize + 12) / 112;

  const closeTransientOverlays = useCallback(() => {
    setShowPanel(false);
    setShowHistory(false);
    setShowStatus(false);
    setShowStudio(false);
    setShowDict(false);
    setShowMascotLab(false);
  }, []);

  const overlayPlacement = useFloatingWindow({
    showPanel,
    showHistory,
    showStudio,
    showDict,
    showStatus,
    showMascotLab,
    mascotWindowScale,
    anchorSize: activeBubbleSize,
  });

  const refreshDiagnostics = useCallback(async () => {
    try {
      const nextDiagnostics = await getDiagnostics();
      setDiagnostics(nextDiagnostics);
      setDiagnosticsError(null);
      setDiagnosticsUpdatedAt(Date.now());
      logger.info("diagnostics.loaded", {
        mockMode: nextDiagnostics.mock_mode,
        configuredKeys: nextDiagnostics.configured_keys,
        audioModel: nextDiagnostics.audio_model,
      });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Falha ao ler diagnostics";
      setDiagnosticsError(message);
      setDiagnosticsUpdatedAt(Date.now());
      logger.warn("diagnostics.error", message);
    }
  }, []);

  useEffect(() => {
    if (showStatus) {
      refreshDiagnostics();
    }
  }, [refreshDiagnostics, showStatus]);

  useEffect(() => {
    if (!isTauri()) {
      return;
    }

    let unlisten: (() => void) | undefined;
    const bindFocusListener = async () => {
      unlisten = await getCurrentWindow().onFocusChanged(({ payload }) => {
        if (!payload) {
          closeTransientOverlays();
        }
      });
    };

    void bindFocusListener();
    return () => {
      void unlisten?.();
    };
  }, [closeTransientOverlays]);

  // ─── Tecla Esc fecha qualquer painel aberto ───
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showStudio) { setShowStudio(false); return; }
      if (showMascotLab) { setShowMascotLab(false); return; }
      if (showDict) { setShowDict(false); return; }
      if (showHistory) { setShowHistory(false); return; }
      if (showStatus) { setShowStatus(false); return; }
      if (showPanel) { setShowPanel(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPanel, showHistory, showMascotLab, showStatus, showStudio, showDict]);

  const hasFocusableOverlayOpen = showPanel || showHistory || showStudio || showDict || showStatus || showMascotLab;

  const preserveExternalTarget = useCallback(async (reason: string) => {
    await injection.captureTarget();
    logger.debug("textInjection.target.preserved", { reason });
  }, [injection]);

  // ─── Toggle explícito do painel principal (clique direito / engrenagem) ───
  const togglePanel = useCallback(async () => {
    if (!showPanel) {
      await preserveExternalTarget("open_panel");
    }

    setShowStatus(false);
    setShowMascotLab(false);
    setShowPanel(prev => {
      const next = !prev;
      logger.debug("ui.panel.toggle", { next });
      return next;
    });
  }, [preserveExternalTarget, showPanel]);

  const toggleStatus = useCallback(async () => {
    if (!showStatus) {
      await preserveExternalTarget("open_status");
    }

    setShowPanel(false);
    setShowHistory(false);
    setShowStudio(false);
    setShowDict(false);
    setShowMascotLab(false);
    setShowStatus(prev => {
      const next = !prev;
      logger.debug("ui.status.toggle", { next });
      return next;
    });
  }, [preserveExternalTarget, showStatus]);

  const toggleHistory = useCallback(async () => {
    if (!showHistory) {
      await preserveExternalTarget("open_history");
    }

    setShowPanel(false);
    setShowStatus(false);
    setShowStudio(false);
    setShowDict(false);
    setShowMascotLab(false);
    setShowHistory(prev => {
      const next = !prev;
      logger.debug("ui.history.toggle", { next });
      return next;
    });
  }, [preserveExternalTarget, showHistory]);

  const openDictionary = useCallback(async () => {
    if (!showDict) {
      await preserveExternalTarget("open_dictionary");
    }

    setShowPanel(false);
    setShowHistory(false);
    setShowStatus(false);
    setShowStudio(false);
    setShowMascotLab(false);
    setShowDict(true);
  }, [preserveExternalTarget, showDict]);

  const duplicateAssistant = useCallback(async () => {
    if (!isTauri()) {
      window.open(window.location.href, "_blank", "width=160,height=160");
      return;
    }

    try {
      const currentWindow = getCurrentWindow();
      const position = await currentWindow.outerPosition();
      const label = `assistant-${Date.now()}`;
      const duplicate = new WebviewWindow(label, {
        url: "/",
        title: "RefinaVoz",
        width: activeBubbleSize + 12,
        height: activeBubbleSize + 12,
        x: position.x + 36,
        y: position.y + 36,
        resizable: false,
        decorations: false,
        alwaysOnTop: true,
        transparent: true,
        focusable: false,
        skipTaskbar: true,
        visible: true,
      });

      duplicate.once("tauri://error", (event) => {
        logger.warn("window.duplicate.error", event.payload);
        setError("Nao foi possivel duplicar o assistente.");
      });
      logger.info("window.duplicate.requested", { label });
    } catch (unknownError) {
      logger.warn("window.duplicate.error", unknownError);
      setError("Nao foi possivel duplicar o assistente.");
    }
  }, [activeBubbleSize]);

  const hideWidget = useCallback(async () => {
    closeTransientOverlays();

    if (!isTauri()) {
      logger.info("window.hide.skip.nonTauriRuntime");
      return;
    }

    try {
      await getCurrentWindow().hide();
      logger.info("window.hiddenToTray");
    } catch (unknownError) {
      logger.warn("window.hide.error", unknownError);
      setError("Nao foi possivel esconder a janela.");
    }
  }, [closeTransientOverlays]);

  const isRecording = engine === "gemini" ? audio.isRecording : speech.isRecording;

  // ─── Toggle Gravação ───
  const toggleRecordingForMode = useCallback(async (targetMode: string) => {
    setMode(targetMode);
    
    if (isRecording) {
      if (engine === "gemini") {
        const _blob = await audio.stopRecording();
        if (_blob) handleAudioProcess(_blob, targetMode);
      } else {
        speech.stopRecording();
        if (speech.rawText.trim()) handleProcess(targetMode);
      }
    } else {
      if (hasFocusableOverlayOpen) {
        logger.debug("textInjection.capture.reuseExistingTarget", {
          showPanel,
          showHistory,
          showStudio,
          showDict,
          showStatus,
          showMascotLab,
        });
      } else {
        await preserveExternalTarget("start_recording");
      }

      setError(null);
      if (engine === "gemini") {
        audio.startRecording();
      } else {
        speech.startRecording();
      }
    }
  }, [
    isRecording,
    engine,
    audio,
    speech,
    hasFocusableOverlayOpen,
    preserveExternalTarget,
    showPanel,
    showHistory,
    showStudio,
    showDict,
    showStatus,
    showMascotLab,
  ]);

  const toggleRecording = useCallback(() => toggleRecordingForMode(mode), [toggleRecordingForMode, mode]);

  const handleCaptureExternalText = useCallback(async () => {
    setError(null);

    try {
      const capturedText = await injection.captureSelectedText();
      speech.setRawText(capturedText);
      setShowStatus(false);
      setShowHistory(false);
      setShowStudio(false);
      setShowDict(false);
      setShowMascotLab(false);
      setShowPanel(true);
      logger.info("ui.externalText.captured", { length: capturedText.length });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Falha ao copiar o texto da janela ativa.";
      setError(message);
      logger.warn("ui.externalText.capture.error", message);
    }
  }, [injection, speech]);

  const handleCaptureVisualContext = useCallback(async () => {
    setError(null);
    setVisualContextLoading(true);

    try {
      const targetHwnd = injection.getTargetHwnd();
      if (!targetHwnd) {
        throw new Error("Abra o app de destino ou clique na bolha com a janela alvo ativa antes de capturar o quadro.");
      }

      if (!isTauri()) {
        throw new Error("Captura visual so funciona no app desktop.");
      }

      const captured = await invoke<NativeVisualCapture>("capture_window_png", {
        hwndVal: targetHwnd,
      });

      const blob = dataUrlToBlob(captured.data_url, captured.mime_type);
      setVisualContext({
        dataUrl: captured.data_url,
        mimeType: captured.mime_type,
        width: captured.width,
        height: captured.height,
        capturedAt: Date.now(),
        blob,
      });

      setShowStatus(false);
      setShowHistory(false);
      setShowStudio(false);
      setShowDict(false);
      setShowMascotLab(false);
      setShowPanel(true);
      logger.info("ui.visualContext.captured", {
        width: captured.width,
        height: captured.height,
        bytes: blob.size,
      });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Falha ao capturar quadro da tela.";
      setError(message);
      logger.warn("ui.visualContext.capture.error", message);
    } finally {
      setVisualContextLoading(false);
    }
  }, [injection]);

  // ─── Processar Áudio ───
  const handleAudioProcess = async (blob: Blob, processMode: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiProcessAudio(blob, processMode, undefined, visualContext?.blob);
      memory.addEntry();
      if (data.final_text) {
        await injection.injectText(data.final_text);
        setVisualContext(null);
        setWasSuccessful(true);
        setTimeout(() => setWasSuccessful(false), 1000);
      }
      setShowPanel(false);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Falha ao conectar no backend";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Processar Texto ───
  const handleProcess = async (processMode: string = mode) => {
    if (!speech.rawText.trim()) {
      setError("Nenhum texto para processar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiProcessText(speech.rawText, processMode, undefined, undefined, visualContext?.blob);
      memory.addEntry();
      if (data.final_text) {
        await injection.injectText(data.final_text);
        setVisualContext(null);
        setWasSuccessful(true);
        setTimeout(() => setWasSuccessful(false), 1000);
      }
      setShowPanel(false);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Falha ao conectar no backend";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Modo persistente ───
  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    memory.setPreferredMode(newMode);
  };

  const handleMascotApply = (nextConfig: MascotConfig) => {
    const normalizedConfig: MascotConfig = {
      character: nextConfig.character,
      scale: clampMascotScale(nextConfig.scale),
      variant: nextConfig.variant,
    };
    setMascotConfig(normalizedConfig);
    window.localStorage.setItem(MASCOT_CONFIG_STORAGE_KEY, JSON.stringify(normalizedConfig));
    logger.info("ui.mascot.config.updated", normalizedConfig);
  };

  // ─── Atalhos Globais ───
  useGlobalShortcuts({
    "Alt+Space": toggleRecording,
    "Alt+1": () => toggleRecordingForMode("normal"),
    "Alt+2": () => toggleRecordingForMode("profissional"),
    "Alt+3": () => toggleRecordingForMode("programador"),
    "Alt+4": () => toggleRecordingForMode("mensagem"),
    "Alt+5": () => toggleRecordingForMode("vibe_code"),
    "Alt+6": () => toggleRecordingForMode("prompt"),
  });

  useEffect(() => {
    if (!isTauri()) {
      return;
    }

    let dragTimer: number | null = null;

    const clearDragTimer = () => {
      if (dragTimer !== null) {
        window.clearTimeout(dragTimer);
        dragTimer = null;
      }
    };

    const isDragSurface = (target: HTMLElement): boolean => Boolean(
      target.closest(".bubble-anchor, .mini-panel, .history-panel, .widget-status, .prompt-studio, .dict-panel, .mascot-lab"),
    );

    const isIgnoredTarget = (target: HTMLElement): boolean => Boolean(
      target.closest("button:not(.main-button), input, textarea, select, option, label, [data-no-window-drag]"),
    );

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target || !isDragSurface(target) || isIgnoredTarget(target)) {
        return;
      }

      clearDragTimer();
      dragTimer = window.setTimeout(() => {
        dragTimer = null;
        void getCurrentWindow().startDragging().catch((error) => {
          logger.warn("window.drag.start.error", error);
        });
      }, 360);
    };

    const stopDragging = () => {
      clearDragTimer();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("pointerup", stopDragging, true);
    document.addEventListener("pointercancel", stopDragging, true);

    return () => {
      clearDragTimer();
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("pointerup", stopDragging, true);
      document.removeEventListener("pointercancel", stopDragging, true);
    };
  }, []);

  return (
    <div
      className={`floating-container overlay-${overlayPlacement}`}
      style={{ "--active-bubble-size": `${activeBubbleSize}px` } as CSSProperties}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          closeTransientOverlays();
        }
      }}
    >
      <FloatingButton
        isRecording={isRecording}
        loading={loading}
        onToggle={toggleRecording}
        onPrepareCaptureText={injection.captureTarget}
        onCaptureText={handleCaptureExternalText}
        onPrepareCaptureVisualContext={injection.captureTarget}
        onCaptureVisualContext={handleCaptureVisualContext}
        onContextMenu={togglePanel}
        onOpenSettings={togglePanel}
        onOpenStatus={toggleStatus}
        onOpenHistory={toggleHistory}
        onOpenDictionary={openDictionary}
        onDuplicateAssistant={duplicateAssistant}
        onHideWidget={hideWidget}
        mode={mode}
        wasSuccessful={wasSuccessful}
        statusOpen={showStatus}
        historyOpen={showHistory}
        historyAvailable={memory.history.length > 0}
        visualContextActive={Boolean(visualContext)}
        visualContextLoading={visualContextLoading}
        hasError={Boolean(error)}
        toolsOpen={hasFocusableOverlayOpen}
        mascotConfig={mascotConfig}
      />

      {engine === "web_speech" && (
        <LiveTranscript
          transcript={speech.transcript}
          visible={speech.isRecording}
        />
      )}
      
      {engine === "gemini" && isRecording && (
        <LiveTranscript
          transcript="Capturando áudio HQ..."
          visible={true}
        />
      )}

      {loading && (
        <div className="loading-indicator">
          <div className="spinner" />
        </div>
      )}

      {error && <div className="error-toast">{error}</div>}

      {showStatus && (
        <WidgetStatus
          diagnostics={diagnostics}
          error={diagnosticsError}
          updatedAt={diagnosticsUpdatedAt}
          engine={engine}
          mode={mode}
          autostartEnabled={autostart.enabled}
          microphoneSupported={engine === "web_speech" ? speech.isSupported : audio.isSupported}
          isTauriRuntime={isTauri()}
          onRefresh={refreshDiagnostics}
          onClose={() => setShowStatus(false)}
        />
      )}

      {showPanel && (
        <MiniPanel
          rawText={speech.rawText}
          onRawTextChange={speech.setRawText}
          mode={mode}
          onModeChange={handleModeChange}
          loading={loading}
          speechSupported={engine === "web_speech" ? speech.isSupported : audio.isSupported}
          onProcess={() => handleProcess(mode)}
          onClose={() => setShowPanel(false)}
          onOpenPromptStudio={() => setShowStudio(true)}
          onOpenMascotLab={() => {
            setShowPanel(false);
            setShowMascotLab(true);
          }}
          onOpenDictionary={openDictionary}
          engine={engine}
          onEngineChange={setEngine}
          autostartEnabled={autostart.enabled}
          onAutostartToggle={autostart.toggle}
          visualContext={visualContext}
          onClearVisualContext={() => setVisualContext(null)}
        />
      )}

      <PromptStudio
        visible={showStudio}
        currentMode={mode}
        onSelectMode={handleModeChange}
        onClose={() => setShowStudio(false)}
      />

      <DictionaryEditor 
        visible={showDict}
        onClose={() => setShowDict(false)}
      />

      <MascotOrbLab
        visible={showMascotLab}
        config={mascotConfig}
        onApply={handleMascotApply}
        onClose={() => setShowMascotLab(false)}
      />

      <HistoryPanel
        history={memory.history}
        stats={memory.stats}
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        onClear={memory.clearHistory}
      />

    </div>
  );
}

export default App;
