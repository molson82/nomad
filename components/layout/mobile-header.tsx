import { LinkToggle } from "@/components/key/link-toggle";

interface MobileHeaderProps {
  title: string;
  linked: boolean;
  showLink: boolean; // Tuning has no key to link
  onLinkedChange: (linked: boolean) => void;
}

// Not a heading: each page owns its h1, this only labels the chrome.
export function MobileHeader({ title, linked, showLink, onLinkedChange }: MobileHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-border bg-bg px-4 pb-1.5 pt-[calc(env(safe-area-inset-top)+0.375rem)] md:hidden">
      <p className="font-display text-xl font-semibold uppercase tracking-wider">{title}</p>
      {showLink ? <LinkToggle linked={linked} onChange={onLinkedChange} /> : <span className="h-11 w-11" aria-hidden />}
    </header>
  );
}
