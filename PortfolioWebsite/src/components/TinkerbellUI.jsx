import { useRef, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import { Tinkerbell } from "./Tinkerbell";
import { useMobile } from "../hooks/useMobile";
import * as THREE from "three";

export const TinkerbellController = forwardRef((props, ref) => {
  const tinkerRef = useRef();
  const trailAnchorRef = useRef();
  useImperativeHandle(ref, () => ({
    tinker: tinkerRef.current,
  }));
  const { isMobile } = useMobile();

  // Direction: 1 = moving in fwd dir, -1 = moving in negative dir
  // Keep track of all coords
  const directionX = useRef(1);
  const directionY = useRef(1);
  const directionZ = useRef(1);
  const prevX = useRef(0);
  const prevY = useRef(0);
  const prevZ = useRef(0);
  const rotating = useRef(false);
  const startRotation = useRef(new THREE.Euler());
  const endRotation = useRef(new THREE.Euler());
  const rotationDuration = 0.4; // seconds
  const animationStartTime = useRef(null); // for rotation animation

  useFrame(({ clock }) => {
    const zAmp = isMobile ? 0.6 : 0.1;
    const yAmp = isMobile ? 2.8 : 1.7;
    const xAmp = isMobile ? 7 : 1.1;
    const xFreq = isMobile ? 1 : 2; // angular frequencies (omega)
    const yFreq = isMobile ? 2 : 1;
    const zFreq = isMobile ? 2 : 0.1;
    const zOffset = 0;
    const yOffset = isMobile ? 0 : 1;
    const xOffset = isMobile ? 0 : -1.85;
    const speed = isMobile ? 0.45 : 0.5; // speed factor (0.5 = half speed)
    const elapsed = clock.getElapsedTime() * speed;

    // Offset slightly so no two are perfectly in sync
    const newX = Math.sin(elapsed * xFreq + 1.2) * xAmp + xOffset;
    const newY = Math.sin(elapsed * yFreq + 0.4) * yAmp + yOffset;
    const newZ = Math.sin(elapsed * zFreq - 0.7) * zAmp + zOffset;

    if (tinkerRef.current) {
      // Build trajectories
      tinkerRef.current.position.x = newX;
      tinkerRef.current.position.y = newY;
      tinkerRef.current.position.z = newZ;

      // Detect direction change
      const currentXDirection = newX > prevX.current ? 1 : -1;
      const currentYDirection = newY > prevY.current ? 1 : -1;
      const currentZDirection = newZ > prevZ.current ? 1 : -1;
      const xChanged = currentXDirection !== directionX.current;
      const yChanged = currentYDirection !== directionY.current;
      const zChanged = currentZDirection !== directionZ.current;
      if ((xChanged || yChanged || zChanged) && !rotating.current) {
        directionX.current = currentXDirection;
        directionY.current = currentYDirection;
        directionZ.current = currentZDirection;
        rotating.current = true;
        animationStartTime.current = elapsed;
        startRotation.current.copy(tinkerRef.current.rotation);
        // Set target rotation lerp endpoints based on current direction triplets
        const key = `${currentXDirection}${currentYDirection}${currentZDirection}`;
        switch (key) {
          // Entirely forward facing
          case "111":
            endRotation.current.set(
              Math.PI / 15, // leg tilt
              0.3 * Math.PI, // multiplier controls how close to fully facing fwd we want to allow her
              -Math.PI / 16
            );
            break;
          case "1-11":
            endRotation.current.set(-Math.PI / 12, 0, -Math.PI / 20);
            break;
          case "-111":
            endRotation.current.set(Math.PI / 12, 0.9 * Math.PI, Math.PI / 16);
            break;
          case "-1-11":
            endRotation.current.set(-Math.PI / 12, Math.PI, Math.PI / 20);
            break;
          case "11-1":
            endRotation.current.set(Math.PI / 16, 0, Math.PI / 20);
            break;
          case "1-1-1":
            endRotation.current.set(-Math.PI / 16, 0, Math.PI / 16);
            break;
          case "-11-1":
            endRotation.current.set(Math.PI / 20, 0.9 * Math.PI, -Math.PI / 20);
            break;
          case "-1-1-1":
            endRotation.current.set(
              -Math.PI / 20,
              0.9 * Math.PI,
              -Math.PI / 16
            );
            break;
          default:
            endRotation.current.set(0, 0, 0);
        }
      }

      // Animate rotation if it's in progress
      if (rotating.current) {
        const t = (elapsed - animationStartTime.current) / rotationDuration;
        if (t >= 1) {
          rotating.current = false;
          tinkerRef.current.rotation.copy(endRotation.current);
        } else {
          tinkerRef.current.rotation.x = THREE.MathUtils.lerp(
            startRotation.current.x,
            endRotation.current.x,
            t
          );
          tinkerRef.current.rotation.y = THREE.MathUtils.lerp(
            startRotation.current.y,
            endRotation.current.y,
            t
          );
          tinkerRef.current.rotation.z = THREE.MathUtils.lerp(
            startRotation.current.z,
            endRotation.current.z,
            t
          );
        }
      }
      prevX.current = newX;
      prevY.current = newY;
      prevZ.current = newZ;
    }
  });

  return (
    <group ref={tinkerRef} {...props}>
      <group name="trailAnchor">
        <Tinkerbell ref={trailAnchorRef} scale={isMobile ? 0.002 : 0.001} />
      </group>
    </group>
  );
});

TinkerbellController.displayName = "TinkerbellController";
