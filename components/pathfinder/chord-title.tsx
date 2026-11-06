import { chordNames, noteList, voicingOf, type Frets } from "@/lib/theory/chord-names";
import type { TuningOffsets } from "@/lib/theory/tuning";

export function ChordTitle({ frets, offsets }: { frets: Frets; offsets: TuningOffsets }) {
  const voicing = voicingOf(frets, offsets);
  if (!voicing) {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-display text-3xl font-semibold leading-tight">Find your sound</p>
        <p className="text-sm text-text-secondary">Tap frets to place the notes you&apos;re holding. The name appears as you go.</p>
      </div>
    );
  }
  const names = chordNames(voicing);
  const primary = names[0] ?? null;
  const notes = noteList(voicing, primary);
  const single = voicing.pitchClasses.length === 1;
  const message = single
    ? "A single note. Add more to name a chord."
    : !primary
      ? "No common chord name, but you can still build a path."
      : primary.suffix === "5"
        ? "Power chord. Build path works from here."
        : null;
  return (
    <div data-testid="chord-title" className={`flex gap-3 ${names.length > 2 ? "flex-col" : "items-end justify-between"}`}>
      <div className="flex min-w-0 flex-col gap-1">
        <p data-testid="chord-name" className={`font-display font-semibold leading-none ${primary ? "text-[52px]" : "text-[26px]"}`}>
          {primary?.text ?? notes.join(" · ")}
        </p>
        {primary && !single && <p className="text-[13px] font-semibold">{notes.join(" · ")}</p>}
        {message && <p className="text-[13px] text-text-secondary">{message}</p>}
      </div>
      {names.length > 1 && (
        <div className={`flex flex-col gap-1 ${names.length > 2 ? "items-start" : "flex-shrink-0 items-end"}`}>
          <span className="text-xs font-semibold text-text-secondary">Also called</span>
          <ul className={`flex flex-wrap gap-1.5 ${names.length > 2 ? "" : "justify-end"}`}>
            {names.slice(1).map((name) => (
              <li key={name.text} className="rounded-full bg-accent-tint px-3 py-1 font-display text-base font-semibold text-accent-ink">
                {name.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
