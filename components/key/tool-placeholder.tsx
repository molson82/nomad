"use client";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { useToolKey } from "@/lib/key-state/hooks";
import type { Tool } from "@/lib/tools";
import { KeyPicker } from "./key-picker";

// Stand-in until each tool's own spec lands: enough to make linking real.
export function ToolPlaceholder({ tool, blurb }: { tool: Tool; blurb: string }) {
  const [root, setRoot] = useToolKey(tool);
  const { title } = NAV_ITEMS.find((item) => item.tool === tool)!;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide md:text-4xl">{title}</h1>
      <p className="mt-1 text-text-secondary">{blurb}</p>
      <section className="mt-8 rounded-card border border-border bg-surface p-5">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-medium text-text-tertiary">Root</span>
          <span className="font-display text-5xl font-semibold">{root}</span>
        </div>
        <div className="mt-5">
          <KeyPicker value={root} onChange={setRoot} />
        </div>
      </section>
    </div>
  );
}
