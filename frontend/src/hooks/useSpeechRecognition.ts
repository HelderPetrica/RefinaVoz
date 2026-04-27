/**
 * useSpeechRecognition — Hook customizado para Web Speech API.
 *
 * Encapsula toda a lógica de gravação de áudio, transcrição em tempo real,
 * tratamento de erros e restart automático.
 */

import { useState, useRef, useCallback, useEffect } from "react";

// Tipagem para a Web Speech API (não inclusa no TS padrão)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface UseSpeechRecognitionReturn {
  /** Se o microfone está escutando */
  isRecording: boolean;
  /** Texto final acumulado de toda a sessão */
  rawText: string;
  /** Fragmento sendo falado agora (interim) */
  transcript: string;
  /** Se o browser suporta Web Speech API */
  isSupported: boolean;
  /** Inicia a gravação, limpando o texto anterior */
  startRecording: () => void;
  /** Para a gravação */
  stopRecording: () => void;
  /** Permite editar rawText manualmente (textarea) */
  setRawText: (text: string) => void;
  /** Limpa tudo */
  reset: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [rawText, setRawText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn("Web Speech API não suportada neste ambiente.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscript += res[0].transcript;
        } else {
          interimTranscript += res[0].transcript;
        }
      }
      if (finalTranscript) {
        setRawText((prev) => (prev ? prev + " " : "") + finalTranscript);
      }
      setTranscript(interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current?._shouldRestart) {
        try {
          recognition.start();
        } catch {
          /* já rodando */
        }
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    setRawText("");
    setTranscript("");
    recognitionRef.current._shouldRestart = true;
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (e: any) {
      console.error("Erro ao iniciar microfone:", e.message);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current._shouldRestart = false;
    recognitionRef.current.stop();
    setIsRecording(false);
    setTranscript("");
  }, []);

  const reset = useCallback(() => {
    stopRecording();
    setRawText("");
    setTranscript("");
  }, [stopRecording]);

  return {
    isRecording,
    rawText,
    transcript,
    isSupported,
    startRecording,
    stopRecording,
    setRawText,
    reset,
  };
}
