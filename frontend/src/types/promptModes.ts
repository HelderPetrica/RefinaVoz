export type PromptMode =
  | "vibe_code"
  | "normal"
  | "profissional"
  | "programador"
  | "mensagem"
  | "prompt";

export const KNOWN_PROMPT_MODES: PromptMode[] = [
  "vibe_code",
  "normal",
  "profissional",
  "programador",
  "mensagem",
  "prompt",
];

export function isPromptMode(value: string): value is PromptMode {
  return KNOWN_PROMPT_MODES.includes(value as PromptMode);
}
