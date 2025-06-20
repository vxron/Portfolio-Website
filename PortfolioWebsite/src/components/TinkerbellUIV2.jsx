import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Tinkerbell } from "./Tinkerbell";
import { useMobile } from "../hooks/useMobile";

export const TinkerbellController = forwardRef((props, ref) => {
  const groupRef = useRef();
  useImperativeHandle(ref, () => groupRef.current);
  const { viewport } = useThree();
  const { isMobile } = useMobile();

  // Direction: 1 = left to right, -1 = right to left
  const [direction, setDirection] = useState(1);
  const [phase, setPhase] = useState("flying"); // flying, exiting, returning
  const lastPhase = useRef(phase);
  const tRef = useRef(0); // Time progression along wave
  const zRef = useRef(props.position?.[2] ?? -12);

  const waveFrequency = isMobile ? 2.75 : 3.5;
  const waveAmplitude = isMobile
    ? viewport.height * 0.2
    : viewport.height * 0.45;

  const leftX = viewport.width * 0.5;
  const rightX = viewport.width * 6.5;
  const zStart = props.position?.[2] ?? -12;
  const zExit = -30;

  const xTravelDistance = rightX - leftX;
  const travelDuration = isMobile
    ? xTravelDistance * 0.28
    : xTravelDistance * 0.25; // ~0.25 seconds per viewport unit
  const exitDuration = 0.5;

  useFrame((_, delta) => {
    if (lastPhase.current !== phase) {
      console.log(`🔄 Phase changed: ${lastPhase.current} → ${phase}`);
      lastPhase.current = phase;
    }
    if (!groupRef.current) return;

    // Only visible when in flying state
    groupRef.current.visible = phase === "flying";

    // PHASE: flying
    if (phase === "flying") {
      // Dynamic speed: slower for left-to-right in early entry
      if (direction === 1) {
        const easedDelta = delta * (0.3 + 0.7 * Math.min(tRef.current * 2, 1));
        tRef.current += easedDelta / travelDuration;
      } else {
        tRef.current += delta / travelDuration;
      }
      const progress = tRef.current;

      // Interpolate X
      const x =
        direction === 1
          ? leftX + (rightX - leftX) * progress
          : rightX - (rightX - leftX) * progress;

      // Y = wave motion
      // Fade-in "swoop" modifier: stronger wave at beginning
      const swoopStrength = 5; // multiplier for the initial dip
      const swoopFalloff = 8; // how quickly it fades (higher = faster)

      const swoopFactor = Math.exp(-progress * swoopFalloff); // starts at 1, fades to 0
      const boostedAmplitude =
        waveAmplitude * (1 + swoopFactor * (swoopStrength - 1));

      const offsetY = isMobile ? 0.95 : 0.5;
      const y =
        viewport.height * offsetY +
        Math.sin(progress * Math.PI * waveFrequency) * waveAmplitude;

      // Constant Z
      groupRef.current.position.set(x, y, zRef.current);
      groupRef.current.rotation.y = direction === 1 ? 0 : (7 * Math.PI) / 6;
      groupRef.current.rotation.z = direction === 1 ? 0 : -Math.PI / 12;
      groupRef.current.rotation.x =
        direction === 1 ? Math.PI / 10 : -Math.PI / 12;

      // Position-based exit trigger
      const edgeX =
        direction === 1 ? viewport.width * 7 : -viewport.width * 0.6;

      const offscreen = direction === 1 ? x > edgeX : x < edgeX;

      if (offscreen) {
        setPhase("exiting");
        tRef.current = 0;
      }
    }

    // PHASE: exiting (move away in Z)
    else if (phase === "exiting") {
      tRef.current += delta / exitDuration;
      const progress = tRef.current;
      zRef.current = zStart + (zExit - zStart) * progress;

      // Maintain X/Y at edge
      const x = direction === 1 ? rightX : leftX;
      const y = viewport.height * 0.7;

      groupRef.current.position.set(x, y, zRef.current);

      if (progress >= 1) {
        // Flip and begin return
        setDirection((d) => -d);
        setPhase("returning");
        tRef.current = 0;
      }
    }

    // PHASE: returning (come back in Z)
    else if (phase === "returning") {
      tRef.current += delta / exitDuration;
      const progress = tRef.current;
      zRef.current = zExit + (zStart - zExit) * progress;

      // Keep at entry X/Y
      const x = direction === 1 ? leftX : rightX;
      const y = viewport.height * 0.7;

      groupRef.current.position.set(x, y, zRef.current);

      if (progress >= 1) {
        setPhase("flying");
        tRef.current = 0;
      }
    }
  });

  return (
    <group ref={groupRef} {...props}>
      <Tinkerbell />
    </group>
  );
});

TinkerbellController.displayName = "TinkerbellController";
