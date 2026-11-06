import type { ReactNode } from "react";
import type { KeyDetails, KeyFit } from "@/lib/pathfinder/paths";
import { circleKeyFor } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";
import { regionLine } from "./path-preview";

export const keyTitle = (key: Note) => `${formatNote(circleKeyFor(key).tonic)} major`;

const listed = (notes: string[]) => notes.join(" and ");

function fitLine(fit: KeyFit, details: KeyDetails): string {
  if (fit.fit === "near") {
    return `Your ${listed(fit.outside)} ${fit.outside.length === 1 ? "falls" : "fall"} outside this key`;
  }
  return details.missing.length === 0 ? "Has all your notes" : `Misses your ${listed(details.missing)}`;
}

interface KeyCardProps {
  fit: KeyFit;
  details: KeyDetails;
  selected: boolean;
  onSelect: () => void;
  rowSpan: number;
  children?: ReactNode; // the selected key's details
}

// One DOM for both layouts: details sit under the card on phones and in the next grid column on large screens.
export function KeyCard({ fit, details, selected, onSelect, rowSpan, children }: KeyCardProps) {
  return (
    <div className={`rounded-[20px] bg-surface lg:contents ${selected ? "border-2 border-accent" : "border border-border"}`}>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`flex w-full flex-col gap-2 rounded-[20px] bg-surface px-3.5 py-3 text-left lg:col-start-1 lg:gap-1 ${
          selected ? "lg:border-2 lg:border-accent" : "lg:border lg:border-border"
        }`}
      >
        <span className="flex w-full items-center justify-between">
          <span className="flex flex-col">
            <span className="font-display text-[22px] font-semibold leading-tight">{keyTitle(fit.key)}</span>
            <span className="text-[13px] font-semibold text-relative">Relative minor: {formatNote(circleKeyFor(fit.key).relativeMinor)}</span>
          </span>
          {fit.role && (
            <span
              className={`grid h-11 min-w-11 place-items-center rounded-full border-[1.5px] border-text-primary px-1 font-display text-xl font-semibold ${
                selected ? "bg-text-primary text-bg" : ""
              }`}
            >
              {fit.role}
            </span>
          )}
        </span>
        <span className="text-[13px] font-semibold leading-snug">
          {regionLine(details.solo)}
          <br />
          <span className={`font-medium ${selected ? "text-accent-ink" : "text-text-secondary"}`}>{fitLine(fit, details)}</span>
        </span>
      </button>
      {selected && (
        <div
          style={{ gridRow: `1 / span ${rowSpan}` }}
          className="px-3.5 pb-3.5 lg:col-start-2 lg:rounded-[20px] lg:border-2 lg:border-accent lg:bg-surface lg:p-[18px]"
        >
          {children}
        </div>
      )}
    </div>
  );
}
