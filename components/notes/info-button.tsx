"use client";

import { Info } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TheoryNote } from "@/lib/notes/types";
import { NoteSheet } from "./note-sheet";

interface InfoButtonProps {
  label: string; // "About …"
  note: TheoryNote;
  className?: string; // icon colour; defaults to the tool's accent
}

// The sheet is portalled to <body> only while open, so it never sits inside a heading,
// a swipeable card or a server render.
export function InfoButton({ label, note, className = "text-accent-ink" }: InfoButtonProps) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`-my-3 inline-grid h-11 w-11 shrink-0 place-items-center align-middle ${className}`}
      >
        <Info aria-hidden size={20} strokeWidth={2.2} />
      </button>
      {open &&
        createPortal(
          <NoteSheet
            note={note}
            onClose={() => {
              setOpen(false);
              button.current?.focus();
            }}
          />,
          document.body,
        )}
    </>
  );
}
