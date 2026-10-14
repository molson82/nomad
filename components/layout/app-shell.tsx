"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLinked } from "@/lib/key-state/hooks";
import { LAST_TOOL_KEY, toolFromPath } from "@/lib/tools";
import { MobileHeader } from "./mobile-header";
import { NAV_ITEMS } from "./nav-items";
import { Sidebar } from "./sidebar";
import { TabBar } from "./tab-bar";
import { UpdatePill } from "./update-pill";

export function AppShell({ children }: { children: React.ReactNode }) {
  const tool = toolFromPath(usePathname());
  // Off a tool route ("/" redirect, 404) linking still works; it adopts the Circle's key.
  const [linked, setLinked] = useLinked(tool ?? "circle");
  const title = NAV_ITEMS.find((item) => item.tool === tool)?.title ?? "Nomad";

  useEffect(() => {
    if (!tool) return;
    try {
      localStorage.setItem(LAST_TOOL_KEY, tool);
    } catch {
      // Storage blocked: "/" just opens the Circle.
    }
  }, [tool]);

  return (
    <div
      data-tool={tool ?? "circle"}
      className="min-h-dvh bg-bg pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      <div className="mx-auto flex min-h-dvh max-w-[1440px]">
        <Sidebar tool={tool} linked={linked} onLinkedChange={setLinked} />
        <MobileHeader title={title} linked={linked} onLinkedChange={setLinked} />
        <main className="min-w-0 flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-[calc(env(safe-area-inset-top)+4.5rem)] md:px-8 md:pb-10 md:pt-10">
          {children}
        </main>
      </div>
      <TabBar tool={tool} linked={linked} />
      <UpdatePill />
    </div>
  );
}
