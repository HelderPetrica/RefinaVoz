import React from "react";

export type MascotFrameTone = "cyan" | "mint" | "amber" | "rose";
export type MascotExpression = "idle" | "happy" | "listening" | "speaking" | "thinking" | "sad";
export type MascotEffect = "none" | "waves" | "ring" | "sparkles" | "scan";
export type MascotVisualState =
  | "idle"
  | "recording"
  | "processing"
  | "listening"
  | "capturing_context"
  | "thinking"
  | "success"
  | "warning"
  | "error"
  | "tools_open"
  | "settings_open";
export type MascotCharacter =
  | "app_button"
  | "voice_orb"
  | "robot_classic"
  | "robot_modern"
  | "robot_pseudo_3d"
  | "living_document";
export type MascotVariant = "masculine" | "feminine";

export interface MascotConfig {
  character: MascotCharacter;
  scale: number;
  variant: MascotVariant;
}

export interface MascotFrame {
  id: string;
  label: string;
  row: number;
  col: number;
  expression: MascotExpression;
  tone: MascotFrameTone;
  effect: MascotEffect;
}

export const SPRITE_COLUMNS = 4;
export const SPRITE_ROWS = 6;
export const FRAME_SIZE = 256;

export const DEFAULT_MASCOT_CONFIG: MascotConfig = {
  character: "voice_orb",
  scale: 1,
  variant: "masculine",
};

export const MASCOT_FRAMES: MascotFrame[] = [
  { id: "idle-a", label: "Neutro A", row: 0, col: 0, expression: "idle", tone: "cyan", effect: "none" },
  { id: "idle-b", label: "Neutro B", row: 0, col: 1, expression: "idle", tone: "cyan", effect: "none" },
  { id: "happy-a", label: "Feliz", row: 0, col: 2, expression: "happy", tone: "cyan", effect: "none" },
  { id: "idle-c", label: "Neutro C", row: 0, col: 3, expression: "idle", tone: "cyan", effect: "none" },
  { id: "listen-a", label: "Escuta 1", row: 1, col: 0, expression: "listening", tone: "cyan", effect: "waves" },
  { id: "listen-b", label: "Escuta 2", row: 1, col: 1, expression: "listening", tone: "cyan", effect: "waves" },
  { id: "listen-c", label: "Escuta 3", row: 1, col: 2, expression: "listening", tone: "cyan", effect: "waves" },
  { id: "listen-d", label: "Escuta 4", row: 1, col: 3, expression: "listening", tone: "cyan", effect: "waves" },
  { id: "speak-a", label: "Anel 1", row: 2, col: 0, expression: "speaking", tone: "mint", effect: "ring" },
  { id: "speak-b", label: "Anel 2", row: 2, col: 1, expression: "speaking", tone: "mint", effect: "ring" },
  { id: "speak-c", label: "Anel 3", row: 2, col: 2, expression: "speaking", tone: "mint", effect: "ring" },
  { id: "speak-d", label: "Anel 4", row: 2, col: 3, expression: "speaking", tone: "mint", effect: "ring" },
  { id: "think-a", label: "Pontos 1", row: 3, col: 0, expression: "thinking", tone: "cyan", effect: "none" },
  { id: "think-b", label: "Pontos 2", row: 3, col: 1, expression: "thinking", tone: "cyan", effect: "none" },
  { id: "think-c", label: "Pontos 3", row: 3, col: 2, expression: "thinking", tone: "cyan", effect: "none" },
  { id: "think-d", label: "Pontos 4", row: 3, col: 3, expression: "thinking", tone: "cyan", effect: "scan" },
  { id: "scan-a", label: "Scan 1", row: 4, col: 0, expression: "thinking", tone: "cyan", effect: "none" },
  { id: "scan-b", label: "Scan 2", row: 4, col: 1, expression: "thinking", tone: "cyan", effect: "scan" },
  { id: "scan-c", label: "Scan 3", row: 4, col: 2, expression: "thinking", tone: "cyan", effect: "scan" },
  { id: "scan-d", label: "Scan 4", row: 4, col: 3, expression: "thinking", tone: "cyan", effect: "scan" },
  { id: "joy-a", label: "Verde 1", row: 5, col: 0, expression: "happy", tone: "mint", effect: "sparkles" },
  { id: "joy-b", label: "Verde 2", row: 5, col: 1, expression: "happy", tone: "mint", effect: "sparkles" },
  { id: "sad-a", label: "Alerta 1", row: 5, col: 2, expression: "sad", tone: "amber", effect: "sparkles" },
  { id: "sad-b", label: "Alerta 2", row: 5, col: 3, expression: "sad", tone: "rose", effect: "sparkles" },
];

export function clampMascotScale(scale: number): number {
  if (!Number.isFinite(scale)) {
    return DEFAULT_MASCOT_CONFIG.scale;
  }
  return Math.min(1.75, Math.max(0.75, scale));
}

export function resolveMascotFrame(state: MascotVisualState): MascotFrame {
  const frameIdByState: Record<MascotVisualState, string> = {
    idle: "idle-a",
    recording: "listen-c",
    listening: "listen-c",
    processing: "scan-c",
    capturing_context: "speak-c",
    thinking: "scan-c",
    success: "joy-a",
    warning: "sad-a",
    error: "sad-b",
    tools_open: "idle-b",
    settings_open: "think-b",
  };
  return MASCOT_FRAMES.find((frame) => frame.id === frameIdByState[state]) ?? MASCOT_FRAMES[0];
}

export function getMascotFrameStyle(frame: MascotFrame): React.CSSProperties {
  return {
    "--orb-tone": `var(--mascot-${frame.tone})`,
    "--orb-tone-soft": `var(--mascot-${frame.tone}-soft)`,
  } as React.CSSProperties;
}

export function MascotOrb({
  frame,
  compact = false,
  className = "",
  variant = "masculine",
}: {
  frame: MascotFrame;
  compact?: boolean;
  className?: string;
  variant?: MascotVariant;
}) {
  return (
    <div
      className={[
        "mascot-preview",
        compact ? "mascot-preview-compact" : "",
        `variant-${variant}`,
        className,
        `mascot-expression-${frame.expression}`,
        `mascot-effect-${frame.effect}`,
      ].filter(Boolean).join(" ")}
      style={getMascotFrameStyle(frame)}
      aria-hidden="true"
    >
      <div className="mascot-waves" />
      <div className="mascot-shell">
        <div className="mascot-highlight" />
        <div className="mascot-ear mascot-ear-left" />
        <div className="mascot-ear mascot-ear-right" />
        <div className="mascot-face">
          <div className="mascot-eye mascot-eye-left" />
          <div className="mascot-eye mascot-eye-right" />
          <div className="mascot-mouth" />
          <div className="mascot-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="mascot-scanlines">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="mascot-ring" />
      </div>
      <div className="mascot-sparkles">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function resolveCharacterSize(character: MascotCharacter): { anchor: number; button: number } {
  if (character === "voice_orb") {
    return { anchor: 132, button: 72 };
  }

  if (character === "app_button") {
    return { anchor: 104, button: 48 };
  }

  if (character === "living_document") {
    return { anchor: 136, button: 86 };
  }

  if (character === "robot_pseudo_3d") {
    return { anchor: 142, button: 96 };
  }

  return { anchor: 132, button: 84 };
}

function isListeningState(state: MascotVisualState): boolean {
  return state === "recording" || state === "listening";
}

function isProcessingState(state: MascotVisualState): boolean {
  return state === "processing" || state === "thinking" || state === "capturing_context";
}

function isProblemState(state: MascotVisualState): boolean {
  return state === "warning" || state === "error";
}

function AppButtonVisual({ state, variant }: { state: MascotVisualState; variant: MascotVariant }) {
  return (
    <div className={`assistant-button-visual state-${state} variant-${variant}`} aria-hidden="true">
      {isListeningState(state) && <i className="assistant-button-stop" />}
      {isProcessingState(state) && <i className="assistant-button-loader" />}
      {state === "success" && <i className="assistant-button-check" />}
      {isProblemState(state) && <i className="assistant-button-alert" />}
      {!isListeningState(state) && !isProcessingState(state) && state !== "success" && !isProblemState(state) && <span />}
    </div>
  );
}

function RobotClassicVisual({ state, variant }: { state: MascotVisualState; variant: MascotVariant }) {
  return (
    <div className={`assistant-robot assistant-robot-classic state-${state} variant-${variant}`} aria-hidden="true">
      <div className="assistant-robot-shadow" />
      <div className="assistant-robot-head">
        <div className="assistant-robot-screen">
          <div className="assistant-robot-eyes">
            <span />
            <span />
          </div>
          {isProcessingState(state) && <div className="assistant-robot-scanline" />}
          {isProblemState(state) && <div className="assistant-robot-alert">!</div>}
        </div>
      </div>
      <div className="assistant-robot-neck" />
      <div className="assistant-robot-body">
        <div className="assistant-robot-grid">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="assistant-robot-bar" />
      </div>
    </div>
  );
}

function RobotModernVisual({ state, variant }: { state: MascotVisualState; variant: MascotVariant }) {
  return (
    <div className={`assistant-robot assistant-robot-modern state-${state} variant-${variant}`} aria-hidden="true">
      <div className="assistant-robot-shadow" />
      <div className="assistant-modern-shell">
        <div className="assistant-modern-halo" />
        <div className="assistant-modern-face">
          <div className="assistant-modern-eyes">
            <span />
            <span />
          </div>
          {state === "success" && <div className="assistant-modern-smile" />}
          {isProblemState(state) && <div className="assistant-modern-alert">!</div>}
          {isProcessingState(state) && (
            <div className="assistant-modern-dots">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RobotPseudo3DVisual({ state, variant }: { state: MascotVisualState; variant: MascotVariant }) {
  const isListening = isListeningState(state);
  const isProcessing = isProcessingState(state);
  const isError = isProblemState(state);
  const isSuccess = state === "success";
  const idPrefix = React.useId().replace(/:/g, "");
  const bodyGrad = `${idPrefix}-bodyGrad`;
  const bodyRim = `${idPrefix}-bodyRim`;
  const visorGrad = `${idPrefix}-visorGrad`;
  const thrusterGrad = `${idPrefix}-thrusterGrad`;
  const glassReflect = `${idPrefix}-glassReflect`;
  const antennaGrad = `${idPrefix}-antennaGrad`;
  const glow = `${idPrefix}-cyanGlow`;
  const smallGlow = `${idPrefix}-smallGlow`;
  const dropShadow = `${idPrefix}-dropShadow`;
  const visorShadow = `${idPrefix}-visorShadow`;
  const mainGlowColor = isError ? "#ef4444" : isSuccess ? "#22c55e" : variant === "feminine" ? "#ff8fd8" : "#0ee1ff";
  const feminineAccent = "#ffd6f2";

  return (
    <div className={`assistant-refinavoz-robot state-${state} variant-${variant}`} aria-hidden="true">
      <svg viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="assistant-refinavoz-svg">
        <defs>
          <radialGradient id={bodyGrad} cx="0.5" cy="0.3" r="0.7" fx="0.4" fy="0.2">
            <stop offset="0%" stopColor="#4a5360" />
            <stop offset="40%" stopColor="#22262d" />
            <stop offset="100%" stopColor="#0c1015" />
          </radialGradient>
          <linearGradient id={bodyRim} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5d6b7b" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#5d6b7b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.8" />
          </linearGradient>
          <radialGradient id={visorGrad} cx="0.5" cy="0.4" r="0.8" fx="0.5" fy="0.5">
            <stop offset="0%" stopColor="#1e242d" />
            <stop offset="50%" stopColor="#0a0c0f" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          <linearGradient id={thrusterGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06080a" />
            <stop offset="100%" stopColor="#2c333f" />
          </linearGradient>
          <linearGradient id={glassReflect} x1="0.1" y1="0.1" x2="0.6" y2="0.9">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={antennaGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e242d" />
            <stop offset="50%" stopColor="#6e7885" />
            <stop offset="100%" stopColor="#1e242d" />
          </linearGradient>
          <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={smallGlow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={dropShadow} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#000" floodOpacity="0.7" />
          </filter>
          <filter id={visorShadow} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0c1015" floodOpacity="0.9" />
          </filter>
        </defs>

        <g className="assistant-refinavoz-float">
          <circle cx="200" cy="240" r="150" fill={mainGlowColor} opacity="0.03" />
          <ellipse cx="200" cy="460" rx="110" ry="25" fill={mainGlowColor} opacity="0.15" />
          <ellipse cx="200" cy="460" rx="60" ry="10" fill={mainGlowColor} opacity="0.3" />

          <g transform="translate(18, 110)">
            <rect x="0" y="0" width="35" height="90" rx="17.5" fill="#000" />
            <rect x="5" y="5" width="25" height="80" rx="12.5" fill={`url(#${bodyGrad})`} />
            <rect x="10" y="25" width="4" height="40" rx="2" fill={mainGlowColor} opacity="0.8" filter={`url(#${smallGlow})`} />
          </g>
          <g transform="translate(347, 110)">
            <rect x="0" y="0" width="35" height="90" rx="17.5" fill="#000" />
            <rect x="5" y="5" width="25" height="80" rx="12.5" fill={`url(#${bodyGrad})`} />
            <rect x="21" y="25" width="4" height="40" rx="2" fill={mainGlowColor} opacity="0.8" filter={`url(#${smallGlow})`} />
          </g>
          {variant === "feminine" && (
            <g opacity="0.95">
              <ellipse cx="42" cy="170" rx="28" ry="35" fill={feminineAccent} opacity="0.42" filter={`url(#${smallGlow})`} />
              <ellipse cx="358" cy="170" rx="28" ry="35" fill={feminineAccent} opacity="0.42" filter={`url(#${smallGlow})`} />
              <path d="M 46 140 C 20 158 18 190 43 205" stroke={feminineAccent} strokeWidth="7" strokeLinecap="round" opacity="0.82" />
              <path d="M 354 140 C 380 158 382 190 357 205" stroke={feminineAccent} strokeWidth="7" strokeLinecap="round" opacity="0.82" />
            </g>
          )}

          <rect x="165" y="250" width="70" height="40" rx="15" fill="#0c1015" />
          <rect x="175" y="255" width="50" height="20" rx="8" fill="#1c2027" />
          <path d="M190 60 L210 60 L205 75 L195 75 Z" fill="#1d2229" />
          <rect x="197" y="28" width="6" height="34" rx="3" fill={`url(#${antennaGrad})`} />
          <circle cx="200" cy="25" r="7" fill={mainGlowColor} filter={`url(#${glow})`} className="assistant-refinavoz-pulse" />
          <circle cx="200" cy="25" r="4" fill="#fff" opacity="0.8" />

          <g transform="translate(100, 260)" filter={`url(#${dropShadow})`}>
            <ellipse cx="100" cy="80" rx="95" ry="85" fill={`url(#${bodyGrad})`} />
            <ellipse cx="100" cy="80" rx="93" ry="83" fill={`url(#${bodyRim})`} opacity="0.6" />
            <g transform="translate(86, 80)">
              {isListening ? (
                <>
                  <rect x="0" y="-8" width="4" height="16" rx="2" fill={mainGlowColor} filter={`url(#${smallGlow})`} className="assistant-eq-bar one" />
                  <rect x="12" y="-14" width="4" height="28" rx="2" fill={mainGlowColor} filter={`url(#${smallGlow})`} className="assistant-eq-bar two" />
                  <rect x="24" y="-10" width="4" height="20" rx="2" fill={mainGlowColor} filter={`url(#${smallGlow})`} className="assistant-eq-bar three" />
                </>
              ) : (
                <>
                  <rect x="4" y="-8" width="4" height="16" rx="2" fill={mainGlowColor} opacity="0.8" filter={`url(#${smallGlow})`} />
                  <rect x="16" y="-14" width="4" height="28" rx="2" fill={mainGlowColor} opacity="0.8" filter={`url(#${smallGlow})`} />
                  <rect x="28" y="-10" width="4" height="20" rx="2" fill={mainGlowColor} opacity="0.8" filter={`url(#${smallGlow})`} />
                </>
              )}
            </g>
          </g>

          <g transform="translate(140, 420)">
            <path d="M 10 0 C 10 15, 110 15, 110 0 C 110 10, 10 10, 10 0" fill="#000" />
            <ellipse cx="60" cy="5" rx="55" ry="12" fill={`url(#${thrusterGrad})`} />
            <ellipse cx="60" cy="8" rx="45" ry="8" fill="#000" />
            <ellipse cx="60" cy="9" rx="35" ry="6" fill={mainGlowColor} filter={`url(#${glow})`} />
            <ellipse cx="60" cy="9" rx="20" ry="3" fill="#ffffff" opacity="0.9" />
          </g>

          <g transform="translate(65, 290) rotate(25)" filter={`url(#${dropShadow})`}>
            <rect x="-15" y="-15" width="35" height="90" rx="17.5" fill="#0a0c0f" />
            <rect x="-12" y="-12" width="29" height="84" rx="14.5" fill={`url(#${bodyGrad})`} />
            <circle cx="2" cy="0" r="10" fill="#1c2027" />
          </g>
          <g transform="translate(335, 290) rotate(-25)" filter={`url(#${dropShadow})`}>
            <rect x="-20" y="-15" width="35" height="90" rx="17.5" fill="#0a0c0f" />
            <rect x="-17" y="-12" width="29" height="84" rx="14.5" fill={`url(#${bodyGrad})`} />
            <circle cx="-2" cy="0" r="10" fill="#1c2027" />
          </g>

          <g transform="translate(45, 65)" filter={`url(#${dropShadow})`}>
            <rect x="0" y="0" width="310" height="210" rx="90" fill="#000" />
            <rect x="3" y="3" width="304" height="204" rx="87" fill={`url(#${bodyRim})`} opacity="0.8" />
            <rect x="5" y="5" width="300" height="200" rx="85" fill={`url(#${bodyGrad})`} />
            <path d="M 40 200 Q 155 215 270 200 L 250 190 Q 155 200 60 190 Z" fill="#080a0d" opacity="0.7" />
          </g>

          <g transform="translate(65, 85)" filter={`url(#${visorShadow})`}>
            <rect x="0" y="0" width="270" height="160" rx="70" fill={`url(#${visorGrad})`} stroke="#11151c" strokeWidth="3" />
            <path d="M 20 70 Q 20 20 70 20 L 150 20 Q 80 40 50 120 Z" fill={`url(#${glassReflect})`} />
            <rect x="60" y="6" width="150" height="2" rx="1" fill="#fff" opacity="0.1" />

            {(isProcessing || isError) && (
              <g className="assistant-refinavoz-scanline">
                <rect x="10" y="0" width="250" height="4" rx="2" fill={mainGlowColor} opacity={isError ? "0.4" : "0.6"} />
              </g>
            )}

            <g transform="translate(55, 45)">
              {!isListening && !isSuccess && (
                <g opacity={isProcessing || isError ? "0.8" : "1"}>
                  <g className="assistant-refinavoz-eyes">
                    <rect x="40" y="10" width="30" height="45" rx="15" fill={mainGlowColor} filter={`url(#${glow})`} />
                    <rect x="40" y="10" width="30" height="45" rx="15" fill="#fff" opacity="0.7" />
                    <rect x="90" y="10" width="30" height="45" rx="15" fill={mainGlowColor} filter={`url(#${glow})`} />
                    <rect x="90" y="10" width="30" height="45" rx="15" fill="#fff" opacity="0.7" />
                  </g>
                  <g transform="translate(68, 65)">
                    <path d={isError ? "M 0 5 Q 12 -5 24 5" : "M 0 0 Q 12 10 24 0"} fill="none" stroke={mainGlowColor} strokeWidth="8" strokeLinecap="round" filter={`url(#${smallGlow})`} opacity="0.9" />
                    <path d={isError ? "M 0 5 Q 12 -5 24 5" : "M 0 0 Q 12 10 24 0"} fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
                  </g>
                </g>
              )}

              {isListening && (
                <g transform="translate(40, 8)">
                  <rect x="0" y="20" width="8" height="15" rx="4" fill={mainGlowColor} filter={`url(#${smallGlow})`} className="assistant-face-bar one" />
                  <rect x="18" y="10" width="8" height="35" rx="4" fill={mainGlowColor} filter={`url(#${smallGlow})`} className="assistant-face-bar two" />
                  <rect x="36" y="0" width="8" height="55" rx="4" fill={mainGlowColor} filter={`url(#${glow})`} className="assistant-face-bar three" />
                  <rect x="54" y="10" width="8" height="35" rx="4" fill={mainGlowColor} filter={`url(#${smallGlow})`} className="assistant-face-bar four" />
                  <rect x="72" y="20" width="8" height="15" rx="4" fill={mainGlowColor} filter={`url(#${smallGlow})`} className="assistant-face-bar five" />
                </g>
              )}

              {isSuccess && (
                <g transform="translate(40, 15)">
                  <path d="M 0 20 Q 15 -5 30 20" fill="none" stroke={mainGlowColor} strokeWidth="12" strokeLinecap="round" filter={`url(#${smallGlow})`} />
                  <path d="M 0 20 Q 15 -5 30 20" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
                  <path d="M 50 20 Q 65 -5 80 20" fill="none" stroke={mainGlowColor} strokeWidth="12" strokeLinecap="round" filter={`url(#${smallGlow})`} />
                  <path d="M 50 20 Q 65 -5 80 20" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
                  <g transform="translate(28, 45)">
                    <path d="M 0 0 Q 12 12 24 0" fill="none" stroke={mainGlowColor} strokeWidth="8" strokeLinecap="round" filter={`url(#${smallGlow})`} />
                    <path d="M 0 0 Q 12 12 24 0" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                  </g>
                  <path d="M 120 -10 L 125 -25 L 130 -10 L 145 -5 L 130 0 L 125 15 L 120 0 L 105 -5 Z" fill="#fff" opacity="0.9" className="assistant-refinavoz-pulse" />
                  <path d="M 110 -30 L 112 -38 L 114 -30 L 122 -28 L 114 -26 L 112 -18 L 110 -26 L 102 -28 Z" fill="#fff" opacity="0.7" className="assistant-refinavoz-pulse delayed" />
                </g>
              )}
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

function LivingDocumentVisual({ state, variant }: { state: MascotVisualState; variant: MascotVariant }) {
  const isListening = isListeningState(state);
  const isProcessing = isProcessingState(state);
  const isProblem = isProblemState(state);

  return (
    <div className={`assistant-document state-${state} variant-${variant}`} aria-hidden="true">
      <div className="assistant-document-shadow" />
      <div className="assistant-document-page">
        <div className="assistant-document-fold top" />
        <div className="assistant-document-fold bottom" />
        <div className="assistant-document-accent" />
        <div className="assistant-document-face">
          {state === "success" ? (
            <div className="assistant-document-happy"><span /><span /></div>
          ) : isProcessing ? (
            <div className="assistant-document-dots"><span /><span /><span /></div>
          ) : isProblem ? (
            <div className="assistant-document-worried"><span /><span /></div>
          ) : (
            <div className="assistant-document-eyes"><span /><span /></div>
          )}
        </div>
        <div className="assistant-document-lines">
          <span /><span /><span /><span />
        </div>
        {isListening && <div className="assistant-document-streams"><span /><span /><span /></div>}
        {isProblem && <div className="assistant-document-badge">!</div>}
      </div>
      {state === "success" && <div className="assistant-document-sparkles"><span /><span /><span /></div>}
    </div>
  );
}

export function MascotCharacterVisual({
  character,
  state,
  compact = false,
  variant = "masculine",
}: {
  character: MascotCharacter;
  state: MascotVisualState;
  compact?: boolean;
  variant?: MascotVariant;
}) {
  if (character === "app_button") {
    return compact ? <div className="assistant-compact-wrap"><AppButtonVisual state={state} variant={variant} /></div> : <AppButtonVisual state={state} variant={variant} />;
  }

  if (character === "robot_classic") {
    return compact ? <div className="assistant-compact-wrap"><RobotClassicVisual state={state} variant={variant} /></div> : <RobotClassicVisual state={state} variant={variant} />;
  }

  if (character === "robot_modern") {
    return compact ? <div className="assistant-compact-wrap"><RobotModernVisual state={state} variant={variant} /></div> : <RobotModernVisual state={state} variant={variant} />;
  }

  if (character === "robot_pseudo_3d") {
    return compact ? <div className="assistant-compact-wrap"><RobotPseudo3DVisual state={state} variant={variant} /></div> : <RobotPseudo3DVisual state={state} variant={variant} />;
  }

  if (character === "living_document") {
    return compact ? <div className="assistant-compact-wrap"><LivingDocumentVisual state={state} variant={variant} /></div> : <LivingDocumentVisual state={state} variant={variant} />;
  }

  return <MascotOrb frame={resolveMascotFrame(state)} compact={compact} variant={variant} />;
}
