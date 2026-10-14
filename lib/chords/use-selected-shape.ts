"use client";

import { useSyncExternalStore } from "react";
import type { ShapeName } from "@/lib/theory/caged";
import { shapeStore } from "./shape-store";

export function useSelectedShape(): [ShapeName, (name: ShapeName) => void] {
  const shape = useSyncExternalStore(shapeStore.subscribe, shapeStore.get, shapeStore.getServer);
  return [shape, shapeStore.set];
}
