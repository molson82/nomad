"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl py-16 text-center">
      <h1 className="font-display text-3xl font-semibold uppercase">Something went wrong</h1>
      <div className="mt-6 flex justify-center gap-3">
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
      </div>
    </div>
  );
}
