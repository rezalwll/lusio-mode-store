import "server-only";

type LogLevel = "debug" | "info" | "warn" | "error";
type SafeMetadata = Record<string, string | number | boolean | null | undefined>;

function serializeError(error: unknown) {
  if (!(error instanceof Error)) return String(error);
  return { name: error.name, message: error.message, stack: process.env.NODE_ENV === "production" ? undefined : error.stack };
}

export function logServer(level: LogLevel, event: string, message: string, metadata: SafeMetadata = {}, error?: unknown) {
  const entry = { timestamp: new Date().toISOString(), level, event, message, ...metadata, ...(error === undefined ? {} : { error: serializeError(error) }) };
  const output = JSON.stringify(entry);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.info(output);
}
