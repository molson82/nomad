"use client";

import Link from "next/link";

// Last resort when stored state keeps crashing a page: forget every Nomad setting and start fresh.
function resetSavedSettings() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith("nomad:")) localStorage.removeItem(key);
    }
  } catch {
    // Storage blocked: nothing was saved, so a reload is all that's needed.
  }
  location.assign("/circle/");
}

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl py-16 text-center">
      <h1 className="font-display text-3xl font-semibold uppercase">Something went wrong</h1>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-accent-on"
        >
          Try again
        </button>
        <Link
          href="/circle/"
          className="inline-flex min-h-11 items-center rounded-full border border-border px-5 font-semibold"
        >
          Back to the Circle
        </Link>
        <button
          type="button"
          onClick={resetSavedSettings}
          className="inline-flex min-h-11 items-center rounded-full border border-border px-5 font-semibold"
        >
          Reset saved settings
        </button>
      </div>
    </div>
  );
}
