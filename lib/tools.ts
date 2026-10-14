export const TOOLS = ["circle", "chords", "scales"] as const;

export type Tool = (typeof TOOLS)[number];

export const LAST_TOOL_KEY = "nomad:last-tool";

export function isTool(value: unknown): value is Tool {
  return typeof value === "string" && (TOOLS as readonly string[]).includes(value);
}

export function toolFromPath(pathname: string): Tool | null {
  const segment = pathname.split("/")[1];
  return isTool(segment) ? segment : null;
}
