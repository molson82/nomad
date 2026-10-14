"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LAST_TOOL_KEY, isTool, type Tool } from "@/lib/tools";

// Static export has no server redirects; pick the last tool on the client.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let tool: Tool = "circle";
    try {
      const saved = localStorage.getItem(LAST_TOOL_KEY);
      if (isTool(saved)) tool = saved;
    } catch {
      // Storage blocked: default to the Circle.
    }
    router.replace(`/${tool}/`);
  }, [router]);

  return null;
}
