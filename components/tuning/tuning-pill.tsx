"use client";

import Link from "next/link";
import { isStandard, tuningName } from "@/lib/theory/tuning";
import { useTuning } from "@/lib/tuning/use-tuning";

// A reminder on the compasses that the guitar isn't in standard tuning; standard shows nothing.
export function TuningPill() {
  const [tuning] = useTuning();
  if (isStandard(tuning)) return null;
  const name = tuningName(tuning);
  return (
    <Link
      href="/tuning/"
      aria-label={`Tuning: ${name}. Change tuning`}
      className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-full border-[1.5px] border-tuning bg-tuning-tint px-3 text-[13px] font-bold text-tuning-ink"
    >
      {name} <span aria-hidden>›</span>
    </Link>
  );
}
