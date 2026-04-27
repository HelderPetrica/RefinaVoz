/**
 * useAudioRecorder — Hook para gravação de áudio WAV via Web Audio API.
 *
 * O Gemini Audio oficial aceita WAV/MP3/AIFF/AAC/OGG/FLAC; por isso evitamos
 * WebM do MediaRecorder e codificamos PCM16/WAV no cliente.
 */
import { useState, useRef, useCallback } from "react";
import { logger } from "../services/logger";

const WAV_MIME_TYPE = "audio/wav";
const BUFFER_SIZE = 4096;

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  isSupported: boolean;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunks = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(44100);

  const cleanup = useCallback(async () => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

    if (audioContextRef.current?.state !== "closed") {
      await audioContextRef.current?.close();
    }

    processorRef.current = null;
    sourceRef.current = null;
    mediaStreamRef.current = null;
    audioContextRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

      audioChunks.current = [];
      sampleRateRef.current = audioContext.sampleRate;
      setError(null);

      processor.onaudioprocess = (event) => {
        audioChunks.current.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      mediaStreamRef.current = stream;
      audioContextRef.current = audioContext;
      sourceRef.current = source;
      processorRef.current = processor;
      setIsRecording(true);
      logger.info("audio.recording.started", { mimeType: WAV_MIME_TYPE, sampleRate: audioContext.sampleRate });
    } catch (unknownError) {
      logger.error("audio.recording.startFailed", unknownError);
      setError("Não foi possível acessar o microfone.");
      setIsRecording(false);
      await cleanup();
    }
  }, [cleanup, isRecording]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!audioContextRef.current) return null;

    const chunks = audioChunks.current;
    const sampleRate = sampleRateRef.current;
    audioChunks.current = [];
    setIsRecording(false);
    await cleanup();

    if (!chunks.length) return null;

    const audioBlob = encodeWav(chunks, sampleRate);
    logger.info("audio.recording.stopped", { mimeType: audioBlob.type, bytes: audioBlob.size, sampleRate });
    return audioBlob;
  }, [cleanup]);

  const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  const hasAudioContext = typeof window !== "undefined" && "AudioContext" in window;
  const isSupported = hasMediaDevices && hasAudioContext;

  return {
    isRecording,
    startRecording,
    stopRecording,
    isSupported,
    error,
  };
}

function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const samples = mergeChunks(chunks);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: WAV_MIME_TYPE });
}

function mergeChunks(chunks: Float32Array[]): Float32Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Float32Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
