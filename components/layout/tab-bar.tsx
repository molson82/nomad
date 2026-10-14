import Link from "next/link";
import { LinkDot } from "@/components/key/link-toggle";
import type { Tool } from "@/lib/tools";
import { NAV_ITEMS } from "./nav-items";

export function TabBar({ tool, linked }: { tool: Tool | null; linked: boolean }) {
  return (
    <nav
      aria-label="Tool tabs"
      className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-surface px-2 pb-[calc(env(safe-area-inset-bottom)+0.375rem)] pt-1.5 md:hidden"
    >
      {NAV_ITEMS.map(({ tool: itemTool, href, label, icon: Icon }) => {
        const active = itemTool === tool;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 min-w-16 flex-col items-center justify-center gap-0.5 ${
              active ? "text-accent-ink" : "text-text-tertiary"
            }`}
          >
            <span className="relative">
              <Icon size={22} strokeWidth={1.9} />
              <LinkDot visible={linked} />
            </span>
            <span className={`text-[11px] ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
