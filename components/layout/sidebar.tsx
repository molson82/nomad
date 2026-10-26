import Link from "next/link";
import { LinkDot, LinkToggle } from "@/components/key/link-toggle";
import type { Page } from "@/lib/tools";
import { NAV_ITEMS } from "./nav-items";

interface SidebarProps {
  page: Page | null;
  linked: boolean;
  showLink: boolean; // Tuning has no key to link
  onLinkedChange: (linked: boolean) => void;
}

export function Sidebar({ page, linked, showLink, onLinkedChange }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[88px] flex-shrink-0 flex-col items-center gap-5 border-r border-border bg-surface px-3 py-6 md:flex xl:w-[220px] xl:items-stretch xl:px-4">
      <div className="flex flex-col items-center gap-4 xl:flex-row xl:justify-between xl:px-2">
        <span className="font-display text-2xl font-semibold uppercase tracking-wider">
          <span className="xl:hidden">N</span>
          <span className="hidden xl:inline">Nomad</span>
        </span>
        {showLink && <LinkToggle linked={linked} onChange={onLinkedChange} />}
      </div>
      <nav aria-label="Tool sidebar" className="flex w-full flex-col gap-1">
        {NAV_ITEMS.map(({ page: itemPage, href, label, icon: Icon }) => {
          const active = itemPage === page;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm transition-colors xl:justify-start ${
                active ? "bg-accent-tint font-semibold text-accent-ink" : "font-medium text-text-secondary hover:bg-hover"
              }`}
            >
              <span className="relative flex-shrink-0">
                <Icon size={20} strokeWidth={1.9} />
                <LinkDot visible={linked && itemPage !== "tuning"} />
              </span>
              <span className="hidden xl:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
