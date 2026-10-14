import type { useWheelRotation } from "@/lib/circle/use-wheel-rotation";
import { CIRCLE, describeKey } from "@/lib/theory/circle";
import { formatNote, mod } from "@/lib/theory/spelling";

export type WheelHandlers = ReturnType<typeof useWheelRotation>["wheelHandlers"];

// One wedge at 12 o'clock (viewBox 360, center 180): outer ring r 170→120, inner 120→75.
const MAJOR_WEDGE = "M136,15.79 A170,170 0 0 1 224,15.79 L211.06,64.09 A120,120 0 0 0 148.94,64.09 Z";
const MINOR_WEDGE = "M148.94,64.09 A120,120 0 0 1 211.06,64.09 L199.41,107.56 A75,75 0 0 0 160.59,107.56 Z";

interface MiniWheelProps {
  theta: number;
  keyIndex: number;
  handlers: WheelHandlers;
}

export function MiniWheel({ theta, keyIndex, handlers }: MiniWheelProps) {
  const key = CIRCLE[keyIndex];
  const tonic = formatNote(key.tonic);
  return (
    <svg
      viewBox="0 0 360 360"
      role="slider"
      tabIndex={0}
      aria-label="Key"
      aria-valuemin={0}
      aria-valuemax={11}
      aria-valuenow={keyIndex}
      aria-valuetext={describeKey(key)}
      className="h-[176px] w-[176px] shrink-0 cursor-grab touch-none select-none rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ink active:cursor-grabbing md:h-[270px] md:w-[270px] xl:h-[208px] xl:w-[208px]"
      {...handlers}
    >
      <g transform={`rotate(${theta} 180 180)`}>
        {CIRCLE.map((wedge) => {
          const angle = wedge.index * 30;
          const inKey = [11, 0, 1].includes(mod(wedge.index - keyIndex, 12)); // IV, I, V
          const upright = -(angle + theta); // keeps labels level as the wheel turns
          return (
            <g
              key={wedge.index}
              data-key={formatNote(wedge.tonic)}
              data-in-key={inKey}
              transform={`rotate(${angle} 180 180)`}
            >
              <path d={MAJOR_WEDGE} className={inKey ? "fill-ink" : "fill-decoder-soft"} stroke="var(--decoder-yellow)" strokeWidth={4} />
              <path d={MINOR_WEDGE} className={inKey ? "fill-decoder-ink-soft" : "fill-decoder-pale"} stroke="var(--decoder-yellow)" strokeWidth={4} />
              <g transform={`rotate(${upright} 180 37)`}>
                <text
                  x={180}
                  y={wedge.enharmonic ? 42 : 46}
                  textAnchor="middle"
                  fontSize={wedge.enharmonic ? 22 : 26}
                  className={`font-display font-semibold ${inKey ? "fill-decoder" : "fill-decoder-muted"}`}
                >
                  {formatNote(wedge.tonic)}
                </text>
                {wedge.enharmonic && (
                  <text x={180} y={57} textAnchor="middle" fontSize={12} className={`font-display font-medium ${inKey ? "fill-decoder" : "fill-decoder-muted"}`}>
                    {formatNote(wedge.enharmonic)}
                  </text>
                )}
              </g>
              <text
                x={180}
                y={91}
                textAnchor="middle"
                fontSize={19}
                transform={`rotate(${upright} 180 85)`}
                className={`font-display font-medium ${inKey ? "fill-white" : "fill-decoder-muted"}`}
              >
                {formatNote(wedge.relativeMinor)}m
              </text>
            </g>
          );
        })}
      </g>
      <circle cx={180} cy={180} r={70} className="fill-ink" />
      <text x={180} y={202} textAnchor="middle" fontSize={tonic.length > 1 ? 54 : 66} className="fill-decoder font-display font-bold">
        {tonic}
      </text>
    </svg>
  );
}
