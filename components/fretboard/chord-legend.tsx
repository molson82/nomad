export function ChordLegend({ name }: { name: string }) {
  return (
    <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold">
      <span aria-hidden className="h-3.5 w-3.5 rounded-full border-[3px] border-pathfinder" />
      Your chord: {name}
    </p>
  );
}
