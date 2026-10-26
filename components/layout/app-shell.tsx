"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLinked } from "@/lib/key-state/hooks";
import { LAST_TOOL_KEY, isTool, pageFromPath } from "@/lib/tools";
import { MobileHeader } from "./mobile-header";
import { NAV_ITEMS } from "./nav-items";
import { Sidebar } from "./sidebar";
import { TabBar } from "./tab-bar";
import { UpdatePill } from "./update-pill";

export function AppShell({ children }: { children: React.ReactNode }) {
  const page = pageFromPath(usePathname());
  const tool = page && isTool(page) ? page : null;
  // Off a tool route ("/" redirect, 404) linking still works; it adopts the Circle's key.
  const [linked, setLinked] = useLinked(tool ?? "circle");
  const title = NAV_ITEMS.find((item) => item.page === page)?.title ?? "Nomad";

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
      data-tool={page ?? "circle"}
      className="min-h-dvh bg-bg pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      <div className="mx-auto flex min-h-dvh max-w-[1440px]">
        <Sidebar page={page} linked={linked} showLink={page !== "tuning"} onLinkedChange={setLinked} />
        <MobileHeader title={title} linked={linked} showLink={page !== "tuning"} onLinkedChange={setLinked} />
        <main className="min-w-0 flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-[calc(env(safe-area-inset-top)+4.5rem)] md:px-8 md:pb-10 md:pt-10">
          {children}
        </main>
      </div>
      <TabBar page={page} linked={linked} />
      <UpdatePill />
    </div>
  );
}
