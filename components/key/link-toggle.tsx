import { Link2, Unlink2 } from "lucide-react";

interface LinkToggleProps {
  linked: boolean;
  onChange: (linked: boolean) => void;
}

// Both chain icons share one grid cell; globals.css animates the swap.
export function LinkToggle({ linked, onChange }: LinkToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={linked}
      aria-label="Link key across tools"
      title={linked ? "Key linked across tools" : "Each tool keeps its own key"}
      onClick={() => onChange(!linked)}
      className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-full transition-colors ${
        linked ? "bg-accent text-accent-on" : "text-text-tertiary hover:bg-hover"
      }`}
    >
      <Link2 aria-hidden data-shown={linked} className="link-icon col-start-1 row-start-1" size={22} strokeWidth={2.25} />
      <Unlink2 aria-hidden data-shown={!linked} className="link-icon col-start-1 row-start-1" size={22} strokeWidth={2.25} />
    </button>
  );
}

// Marks nav items while linked so the state is visible from any screen.
export function LinkDot({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span
      aria-hidden
      data-testid="link-dot"
      className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-surface"
    />
  );
}
