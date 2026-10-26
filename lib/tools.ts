export const TOOLS = ["circle", "chords", "scales"] as const;

export type Tool = (typeof TOOLS)[number];

// Every tab. Tuning has no key, so it stays out of TOOLS (which the key-state store is built from).
export const PAGES = [...TOOLS, "tuning"] as const;
export type Page = (typeof PAGES)[number];

export const LAST_TOOL_KEY = "nomad:last-tool";

export function isTool(value: unknown): value is Tool {
  return typeof value === "string" && (TOOLS as readonly string[]).includes(value);
}

export function toolFromPath(pathname: string): Tool | null {
  const segment = pathname.split("/")[1];
  return isTool(segment) ? segment : null;
}

export function pageFromPath(pathname: string): Page | null {
  const segment = pathname.split("/")[1];
  return (PAGES as readonly string[]).includes(segment) ? (segment as Page) : null;
}
