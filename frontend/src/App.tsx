/**
 * App.tsx — Orquestrador principal do RefinaVoz.
 *
 * Responsável apenas por compor hooks e componentes.
 * Zero lógica de negócio inline. ~180 linhas.
 */

import { useState, useCallback, useEffect } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
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

  useFloatingWindow({ showPanel, showHistory, showStudio, showDict, showStatus });

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

  // ─── Tecla Esc fecha qualquer painel aberto ───
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showStudio) { setShowStudio(false); return; }
      if (showDict) { setShowDict(false); return; }
      if (showHistory) { setShowHistory(false); return; }
      if (showStatus) { setShowStatus(false); return; }
      if (showPanel) { setShowPanel(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPanel, showHistory, showStatus, showStudio, showDict]);

  const hasFocusableOverlayOpen = showPanel || showHistory || showStudio || showDict || showStatus;

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
    setShowHistory(prev => {
      const next = !prev;
      logger.debug("ui.history.toggle", { next });
      return next;
    });
  }, [preserveExternalTarget, showHistory]);

  const hideWidget = useCallback(async () => {
    setShowPanel(false);
    setShowHistory(false);
    setShowStudio(false);
    setShowDict(false);
    setShowStatus(false);

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
  }, []);

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
    } catch (err: any) {
      setError(err.message || "Falha ao conectar no backend");
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
    } catch (err: any) {
      setError(err.message || "Falha ao conectar no backend");
    } finally {
      setLoading(false);
    }
  };

  // ─── Modo persistente ───
  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    memory.setPreferredMode(newMode);
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

  return (
    <div className="floating-container">
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
        onHideWidget={hideWidget}
        mode={mode}
        wasSuccessful={wasSuccessful}
        statusOpen={showStatus}
        historyOpen={showHistory}
        historyAvailable={memory.history.length > 0}
        visualContextActive={Boolean(visualContext)}
        visualContextLoading={visualContextLoading}
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
          onOpenDictionary={() => setShowDict(true)}
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
