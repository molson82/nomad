import type { CagedShape, ShapeName } from "@/lib/theory/caged";

interface ShapeChipsProps {
  shapes: CagedShape[];
  selected: ShapeName;
  onSelect: (name: ShapeName) => void;
}

export function ShapeChips({ shapes, selected, onSelect }: ShapeChipsProps) {
  return (
    <div role="group" aria-label="CAGED shapes up the neck" className="grid grid-cols-5 gap-1 xl:gap-2">
      {shapes.map((shape) => {
        const active = shape.name === selected;
        return (
          <button
            key={shape.name}
            type="button"
            aria-pressed={active}
            aria-label={`${shape.name}-shape, frets ${shape.lowFret} to ${shape.highFret}`}
            onClick={() => onSelect(shape.name)}
            className={`flex min-h-11 flex-col items-center justify-center rounded-[10px] border-[1.5px] xl:min-h-[60px] xl:rounded-xl ${
              active ? "border-ink bg-accent text-ink" : "border-text-primary text-text-primary"
            }`}
          >
            <span className="font-display text-base font-semibold leading-none xl:text-[22px]">{shape.name}</span>
            <span className="text-[10px] font-semibold xl:text-xs">
              {shape.lowFret}–{shape.highFret}
            </span>
          </button>
        );
      })}
    </div>
  );
}
