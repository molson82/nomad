"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MutableRefObject, type PointerEvent } from "react";
import { mod } from "@/lib/theory/spelling";
import { usePrefersReducedMotion } from "./use-reduced-motion";
import {
  STEP,
  angleDelta,
  angleToKeyIndex,
  isSettled,
  nearestTarget,
  pointerAngle,
  springStep,
  targetForIndex,
} from "./wheel-math";

// A release this long after the last move carries no flick.
const STALE_VELOCITY_MS = 80;

function cancelFrame(frame: MutableRefObject<number | null>) {
  if (frame.current !== null) cancelAnimationFrame(frame.current);
  frame.current = null;
}

interface Options {
  committedIndex: number;
  onCommit: (index: number) => void;
}

export function useWheelRotation({ committedIndex, onCommit }: Options) {
  const reducedMotion = usePrefersReducedMotion();
  const [theta, setTheta] = useState(() => -STEP * committedIndex);
  const thetaRef = useRef(theta);
  const targetRef = useRef(theta); // where the wheel is going (or rests)
  const velocityRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const pendingCommitRef = useRef(false); // an animation that still owes a setRoot
  const readyRef = useRef(false);
  const dragRef = useRef<{ cx: number; cy: number; angle: number; time: number } | null>(null);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  });

  const show = useCallback((x: number) => {
    thetaRef.current = x;
    setTheta(x);
  }, []);

  const animateTo = useCallback(
    (target: number, commit: boolean) => {
      targetRef.current = target;
      cancelFrame(frameRef);
      pendingCommitRef.current = commit;
      const finish = () => {
        pendingCommitRef.current = false;
        velocityRef.current = 0;
        show(target);
        if (commit) onCommitRef.current(angleToKeyIndex(target));
      };
      if (reducedMotion) {
        finish();
        return;
      }
      let state = { x: thetaRef.current, v: velocityRef.current };
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        state = springStep(state, target, dt);
        if (isSettled(state, target)) {
          frameRef.current = null;
          finish();
          return;
        }
        show(state.x);
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    },
    [reducedMotion, show],
  );

  // A key that arrives before the first frame (hydration from storage) is a
  // jump, not a spin; later changes (linked tool, another tab) animate.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      readyRef.current = true;
    });
    return () => {
      cancelAnimationFrame(id);
      cancelFrame(frameRef);
      // Leaving mid-spring (a tab tap right after a swipe) still lands the turn.
      if (pendingCommitRef.current) {
        pendingCommitRef.current = false;
        onCommitRef.current(angleToKeyIndex(targetRef.current));
      }
    };
  }, []);

  useEffect(() => {
    if (angleToKeyIndex(targetRef.current) === committedIndex) return;
    const target = targetForIndex(thetaRef.current, committedIndex);
    if (!readyRef.current) {
      targetRef.current = target;
      show(target);
      return;
    }
    animateTo(target, false);
  }, [committedIndex, animateTo, show]);

  const step = useCallback(
    (direction: 1 | -1) => {
      const index = mod(angleToKeyIndex(targetRef.current) + direction, 12);
      animateTo(targetForIndex(targetRef.current, index), true);
    },
    [animateTo],
  );

  const onPointerDown = useCallback((event: PointerEvent<SVGSVGElement>) => {
    event.stopPropagation(); // the card's swipe detector ignores wheel drags
    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    event.currentTarget.setPointerCapture(event.pointerId);
    cancelFrame(frameRef);
    velocityRef.current = 0;
    dragRef.current = { cx, cy, angle: pointerAngle(cx, cy, event.clientX, event.clientY), time: event.timeStamp };
  }, []);

  const onPointerMove = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const angle = pointerAngle(drag.cx, drag.cy, event.clientX, event.clientY);
      const delta = angleDelta(drag.angle, angle);
      const seconds = (event.timeStamp - drag.time) / 1000;
      if (seconds > 0) velocityRef.current = delta / seconds;
      dragRef.current = { ...drag, angle, time: event.timeStamp };
      show(thetaRef.current + delta);
    },
    [show],
  );

  const endDrag = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      // The release velocity both projects the flick and seeds the spring.
      if (reducedMotion || event.timeStamp - drag.time > STALE_VELOCITY_MS) velocityRef.current = 0;
      animateTo(nearestTarget(thetaRef.current, velocityRef.current), true);
    },
    [animateTo, reducedMotion],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<SVGSVGElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    },
    [step],
  );

  return {
    theta,
    displayIndex: angleToKeyIndex(theta),
    step,
    wheelHandlers: { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onKeyDown },
  };
}
