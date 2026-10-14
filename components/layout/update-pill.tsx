"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { registerServiceWorker } from "@/lib/sw/register";

export function UpdatePill() {
  const [apply, setApply] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Dev never registers: a cached dev bundle would shadow every edit.
    if (process.env.NODE_ENV !== "production") return;
    registerServiceWorker((applyUpdate) => setApply(() => applyUpdate));
  }, []);

  if (!apply) return null;
  return (
    <button
      type="button"
      onClick={apply}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-1/2 z-30 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-on shadow-lg md:bottom-6"
    >
      <RefreshCw aria-hidden size={16} strokeWidth={2.25} />
      Update ready · tap to refresh
    </button>
  );
}
