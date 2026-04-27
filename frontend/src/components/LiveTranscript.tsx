/**
 * LiveTranscript — Balão de transcrição em tempo real.
 *
 * Mostra o texto sendo falado (interim result) acima do globo principal
 * com animação de fade-in suave.
 */

import React from "react";

interface LiveTranscriptProps {
  transcript: string;
  visible: boolean;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  transcript,
  visible,
}) => {
  if (!visible || !transcript) return null;

  return <div className="live-transcript">{transcript}</div>;
};
