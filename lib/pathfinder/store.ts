import { createPersistedStore } from "@/lib/storage/persisted-store";
import { EMPTY_STATE, PATHFINDER_KEY, parsePathfinder } from "./state";

export const pathfinderStore = createPersistedStore(PATHFINDER_KEY, parsePathfinder, EMPTY_STATE);
