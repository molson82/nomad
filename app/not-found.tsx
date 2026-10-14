import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl py-16 text-center">
      <h1 className="font-display text-3xl font-semibold uppercase">Nothing here</h1>
      <p className="mt-2 text-text-secondary">That page isn&apos;t part of Nomad.</p>
      <Link
        href="/circle/"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-accent-on"
      >
        Back to the Circle
      </Link>
    </div>
  );
}
