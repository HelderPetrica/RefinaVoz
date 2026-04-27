/**
 * logger.ts — Telemetria leve do RefinaVoz no frontend.
 *
 * - Prefixa todos os logs com [RefinaVoz] para varredura no DevTools.
 * - Mantém um buffer circular em memória (últimos 200 eventos) consultável
 *   via `window.__refinavozLogs__` durante depuração ao vivo.
 * - Em produção, ignora `debug` se `VITE_LOG_LEVEL=info` (futuro).
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogRecord {
  ts: number;
  level: LogLevel;
  event: string;
  data?: unknown;
}

const BUFFER_LIMIT = 200;
const buffer: LogRecord[] = [];

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined) ?? "debug";
const minRank = LEVEL_RANK[envLevel] ?? LEVEL_RANK.debug;

function emit(level: LogLevel, event: string, data?: unknown) {
  const record: LogRecord = { ts: Date.now(), level, event, data };
  buffer.push(record);
  if (buffer.length > BUFFER_LIMIT) buffer.shift();

  if (LEVEL_RANK[level] < minRank) return;

  const tag = `[RefinaVoz:${level}]`;
  const fn =
    level === "error" ? console.error
      : level === "warn" ? console.warn
      : level === "info" ? console.info
      : console.debug;

  if (data !== undefined) fn(tag, event, data);
  else fn(tag, event);
}

export const logger = {
  debug: (event: string, data?: unknown) => emit("debug", event, data),
  info: (event: string, data?: unknown) => emit("info", event, data),
  warn: (event: string, data?: unknown) => emit("warn", event, data),
  error: (event: string, data?: unknown) => emit("error", event, data),
  snapshot: () => buffer.slice(),
};

if (typeof window !== "undefined") {
  (window as unknown as { __refinavozLogs__: () => LogRecord[] }).__refinavozLogs__ =
    () => buffer.slice();
}
