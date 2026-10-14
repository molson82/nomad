import { NOTES, type Note } from "@/lib/theory/notes";

interface KeyPickerProps {
  value: Note;
  onChange: (note: Note) => void;
}

export function KeyPicker({ value, onChange }: KeyPickerProps) {
  return (
    <div role="group" aria-label="Root note" className="grid select-none grid-cols-6 gap-2 sm:grid-cols-12">
      {NOTES.map((note) => {
        const active = note === value;
        return (
          <button
            key={note}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(note)}
            className={`h-11 rounded-full text-base font-semibold transition-colors ${
              active ? "bg-accent text-accent-on" : "bg-bg text-text-primary hover:bg-hover"
            }`}
          >
            {note}
          </button>
        );
      })}
    </div>
  );
}
