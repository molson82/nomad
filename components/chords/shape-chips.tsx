import { PositionChips } from "@/components/fretboard/position-chips";
import type { CagedShape, ShapeName } from "@/lib/theory/caged";

interface ShapeChipsProps {
  shapes: CagedShape[];
  selected: ShapeName;
  onSelect: (name: ShapeName) => void;
}

export function ShapeChips({ shapes, selected, onSelect }: ShapeChipsProps) {
  return (
    <PositionChips
      groupLabel="CAGED shapes up the neck"
      items={shapes.map((s) => ({
        id: s.name,
        label: s.label,
        sub: `${s.lowFret}–${s.highFret}`,
        ariaLabel: `${s.label}-shape, frets ${s.lowFret} to ${s.highFret}`,
      }))}
      selected={selected}
      onSelect={(id) => onSelect(id as ShapeName)}
    />
  );
}
