"use client";

import { useEffect, useId, useRef } from "react";
import type { Paragraph, TheoryNote } from "@/lib/notes/types";

const SWIPE_CLOSE_PX = 60;

function Text({ paragraph }: { paragraph: Paragraph }) {
  return (
    <p className="text-[15px] leading-normal">
      {paragraph.map((segment, i) => (typeof segment === "string" ? segment : <strong key={i}>{segment.strong}</strong>))}
    </p>
  );
}

// Mounted only while open: showModal() gives focus trapping, Esc and the backdrop for free.
export function NoteSheet({ note, onClose }: { note: TheoryNote; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const swipeFrom = useRef<number | null>(null);
  const titleId = useId();
  const close = () => dialog.current?.close();

  useEffect(() => {
    const element = dialog.current!;
    if (!element.open) element.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      // A click whose target is the dialog itself landed on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[80vh] w-full max-w-full flex-col rounded-t-[22px] bg-surface p-0 text-text-primary shadow-[0_-8px_24px_rgba(0,0,0,0.18)] backdrop:bg-[rgba(22,23,24,0.45)] open:flex motion-safe:animate-[sheet-up_200ms_ease-out] md:inset-0 md:m-auto md:h-fit md:max-w-[480px] md:rounded-[22px] md:motion-safe:animate-none"
    >
      <div
        className="flex flex-col px-[18px] pt-2"
        onPointerDown={(event) => {
          swipeFrom.current = event.clientY;
        }}
        onPointerUp={(event) => {
          if (swipeFrom.current !== null && event.clientY - swipeFrom.current > SWIPE_CLOSE_PX) close();
          swipeFrom.current = null;
        }}
      >
        <span aria-hidden className="mx-auto h-[5px] w-10 rounded-full bg-border md:hidden" />
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="font-display text-[22px] font-semibold tracking-[0.02em]">
            {note.title}
          </h2>
          <button type="button" aria-label="Close" onClick={close} className="-mr-2.5 grid h-11 w-11 shrink-0 place-items-center text-xl text-text-secondary">
            ✕
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 overflow-y-auto px-[18px] pb-8 pt-1">
        {note.paragraphs.map((paragraph, i) => (
          <Text key={i} paragraph={paragraph} />
        ))}
      </div>
    </dialog>
  );
}
