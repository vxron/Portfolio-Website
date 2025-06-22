// HANDLES TINKERBELL'S MOVEMENT / PARTICLE TRAIL

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Tinkerbell } from "./Tinkerbell";

export function TinkerbellController(props) {
  const groupRef = useRef();
  const { viewport } = useThree();

  // Track direction and timing
  const [direction, setDirection] = useState(1); // 1 = L→R, -1 = R→L
  const [exiting, setExiting] = useState(false);
  const pauseTime = 1.2; // seconds
  const speed = 0.4; // radians per second
  const arcRef = useRef(Math.PI); // start at middle-top
  const pauseUntil = useRef(0); // time to wait until resume
  const zOffset = useRef(0); // z movement for perspective shrink

  useFrame(({ clock }, delta) => {
    const now = clock.getElapsedTime();

    // Throttle debug logging
    if (Math.floor(now * 10) % 10 === 0) {
      console.log("arcRef.current:", arcRef.current.toFixed(3));
    }

    const t = arcRef.current;

    // Pause logic
    if (now < pauseUntil.current) return;

    // Update arc position
    arcRef.current += delta * speed * direction;

    // Bounds: 0 to PI (left to right over top arc)
    if (arcRef.current > Math.PI) {
      arcRef.current = Math.PI;
      setDirection(-1);
      pauseUntil.current = now + pauseTime;
    } else if (arcRef.current < 0) {
      arcRef.current = 0;
      setDirection(1);
      pauseUntil.current = now + pauseTime;
    }

    // Arc shape (top of screen)
    const radius = viewport.width * 0.5;
    const height = viewport.height * 0.35;
    const centerY = viewport.height * 0.7;
    const z = props.position?.[2] ?? 0;

    const theta = arcRef.current;
    const x = Math.cos(theta - Math.PI) * radius;
    const y = centerY + Math.sin(theta - Math.PI) * height;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      groupRef.current.rotation.y = direction === 1 ? 0 : Math.PI;
    }
  });

  return (
    <>
      <group ref={groupRef} {...props}>
        <Tinkerbell />
      </group>
    </>
  );
}
