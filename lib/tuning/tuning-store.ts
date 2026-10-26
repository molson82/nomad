import { createPersistedStore } from "@/lib/storage/persisted-store";
import { STANDARD_OFFSETS, parseTuning } from "@/lib/theory/tuning";

// One tuning for the whole guitar: both compasses read it.
export const TUNING_KEY = "nomad:tuning:v1";

export const tuningStore = createPersistedStore(TUNING_KEY, parseTuning, STANDARD_OFFSETS);
