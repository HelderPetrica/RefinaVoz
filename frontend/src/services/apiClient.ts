/**
 * apiClient — Serviço de comunicação tipado com o Backend RefinaVoz.
 *
 * Centraliza URLs, tipagem e chamadas HTTP.
 * Espelha os schemas Pydantic do backend (ProcessResponse, ProcessingMetrics).
 */

const API_BASE = "http://localhost:14201/api/v1";
const REQUEST_TIMEOUT_MS = 60_000;

// ─── Tipos espelhando backend/schemas/models.py ───

export interface ProcessingMetrics {
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  fallback_used: boolean;
  provider_model: string;
}

export interface ProcessResponse {
  raw_text: string;
  final_text: string;
  mode_used: string;
  applied_dictionary_terms: string[];
  metrics: ProcessingMetrics;
  audio_optimization?: {
    mode: string;
    enabled: boolean;
    audio_changed: boolean;
    original_size_bytes: number;
    optimized_size_bytes?: number | null;
    speed_factor?: number | null;
    mime_type: string;
    sensitive_mode: boolean;
    decision: string;
    reason?: string | null;
    transcription_ms?: number | null;
    total_endpoint_ms?: number | null;
    fallback_used: boolean;
  };
}

export interface PromptModeList {
  modes: Record<string, string>;
}

export interface PromptDetail {
  mode: string;
  metadata: Record<string, string>;
  content: string;
}

export interface HealthStatus {
  status: string;
  components: string[];
  hooks: Record<string, string[]>;
}

export interface DiagnosticsStatus {
  status: string;
  mock_mode: boolean;
  model_default: string;
  model_fallback: string;
  audio_model?: string;
  audio_optimization?: Record<string, unknown>;
  configured_keys: number;
  modes_loaded: Record<string, string>;
  hooks: Record<string, string[]>;
}

export interface HistoryEntry {
  id: number;
  mode: string;
  rawText: string;
  finalText: string;
  latencyMs: number;
  timestamp: string;
}

// ─── Chamadas ao Backend ───

export async function processText(
  rawText: string,
  mode: string,
  extraTextContext?: string,
  extraVisualContext?: string,
  visualContextImage?: Blob
): Promise<ProcessResponse> {
  const formData = new FormData();
  formData.append("raw_text", rawText);
  formData.append("mode", mode);

  if (extraTextContext?.trim()) {
    formData.append("extra_text_context", extraTextContext);
  }
  if (extraVisualContext?.trim()) {
    formData.append("extra_visual_context", extraVisualContext);
  }
  if (visualContextImage) {
    formData.append("visual_context_image", visualContextImage, getImageFilename(visualContextImage.type));
  }

  const response = await fetchWithTimeout(`${API_BASE}/process/texto`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`);
  }

  return response.json();
}

export async function processAudio(
  audioBlob: Blob,
  mode: string,
  extraTextContext?: string,
  visualContextImage?: Blob
): Promise<ProcessResponse> {
  const formData = new FormData();
  formData.append("audio_file", audioBlob, getAudioFilename(audioBlob.type));
  formData.append("mode", mode);

  if (extraTextContext?.trim()) {
    formData.append("extra_text_context", extraTextContext);
  }
  if (visualContextImage) {
    formData.append("visual_context_image", visualContextImage, getImageFilename(visualContextImage.type));
  }

  const response = await fetchWithTimeout(`${API_BASE}/process/audio`, {
    method: "POST",
    body: formData,
  }, REQUEST_TIMEOUT_MS);

  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`);
  }

  return response.json();
}

function getAudioFilename(mimeType: string): string {
  const extension = mimeType.includes("wav") ? "wav"
    : mimeType.includes("mpeg") || mimeType.includes("mp3") ? "mp3"
      : mimeType.includes("ogg") ? "ogg"
        : mimeType.includes("flac") ? "flac"
          : "wav";
  return `audio.${extension}`;
}

function getImageFilename(mimeType: string): string {
  const extension = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg"
    : mimeType.includes("webp") ? "webp"
      : "png";
  return `visual-context.${extension}`;
}

export async function listPromptModes(): Promise<PromptModeList> {
  const response = await fetch(`${API_BASE}/prompts`);
  if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
  return response.json();
}

export async function getPromptDetail(mode: string): Promise<PromptDetail> {
  const response = await fetch(`${API_BASE}/prompts/${mode}`);
  if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
  return response.json();
}

export async function generatePromptAssistant(description: string): Promise<{content: string}> {
  const formData = new FormData();
  formData.append("description", description);
  const response = await fetch(`${API_BASE}/prompts/generate`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
  return response.json();
}

export async function saveNewPrompt(modeId: string, name: string, description: string, content: string): Promise<{status: string, mode: string}> {
  const formData = new FormData();
  formData.append("mode_id", modeId);
  formData.append("name", name);
  formData.append("description", description);
  formData.append("content", content);
  
  const response = await fetch(`${API_BASE}/prompts`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
  return response.json();
}

export async function getHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
  return response.json();
}

export async function getDiagnostics(): Promise<DiagnosticsStatus> {
  const response = await fetch(`${API_BASE}/diagnostics`);
  if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
  return response.json();
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const response = await fetch(`${API_BASE}/history`);
  if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
  return response.json();
}

export async function clearHistory(): Promise<void> {
  const response = await fetch(`${API_BASE}/history`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Tempo limite excedido ao comunicar com o backend.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
