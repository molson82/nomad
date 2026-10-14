export type ChipItem = { id: string; label: string; sub: string; ariaLabel: string };

interface PositionChipsProps {
  items: ChipItem[];
  selected: string;
  onSelect: (id: string) => void;
  groupLabel: string;
}

export function PositionChips({ items, selected, onSelect, groupLabel }: PositionChipsProps) {
  return (
    <div role="group" aria-label={groupLabel} className="grid grid-cols-5 gap-1 xl:gap-2">
      {items.map((item) => {
        const active = item.id === selected;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            aria-label={item.ariaLabel}
            onClick={() => onSelect(item.id)}
            className={`flex min-h-11 flex-col items-center justify-center rounded-[10px] border-[1.5px] xl:min-h-[60px] xl:rounded-xl ${
              active ? "border-ink bg-accent text-ink" : "border-text-primary text-text-primary"
            }`}
          >
            <span className={`font-display font-semibold leading-none ${item.label.length > 1 ? "text-sm xl:text-lg" : "text-base xl:text-[22px]"}`}>
              {item.label}
            </span>
            <span className="text-[10px] font-semibold xl:text-xs">{item.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
