import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Tinkerbell } from "./Tinkerbell";
import { useMobile } from "../hooks/useMobile";
import { useControls } from "leva";
import { SimpleTrail } from "./SimpleTrail";
import * as THREE from "three";
import { VFXEmitter } from "./VFXEmitter";
import { VFXParticles } from "./VFXParticles";
import { useTexture } from "@react-three/drei";
import { useEffect } from "react";
import { InstancedMesh, Object3D } from "three";

const dummy = new Object3D();

export const TinkerbellController = forwardRef((props, ref) => {
  const tinkerRef = useRef();
  const trailAnchorRef = useRef();
  const debugRef = useRef();
  const emitterRed = useRef();
  const alphaMap = useTexture("textures/Particles/symbol_02.png");
  const count = 50; // number of sparkles
  const instancedRef = useRef();
  useImperativeHandle(ref, () => ({
    tinker: tinkerRef.current,
    debug: debugRef.current, // ⬅️ expose debug mesh for following
  }));
  const { viewport } = useThree();
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

  // TODO: find way to make her not overlap w avatar
  useFrame(({ clock }) => {
    const zAmp = isMobile ? 2.8 : 0.8;
    const yAmp = 2.8;
    const xAmp = 5;
    const xFreq = 1; // angular frequencies (omega)
    const yFreq = 2;
    const zFreq = 2;
    const speed = 0.4; // speed factor (0.5 = half speed)
    const elapsed = clock.getElapsedTime() * speed;

    // Offset slightly so no two are perfectly in sync
    const newX = Math.sin(elapsed * xFreq + 1.2) * xAmp;
    const newY = Math.sin(elapsed * yFreq + 0.4) * yAmp;
    const newZ = Math.sin(elapsed * zFreq - 0.7) * zAmp;

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
          case "111":
            endRotation.current.set(Math.PI / 12, 0, -Math.PI / 16);
            break;
          case "1-11":
            endRotation.current.set(-Math.PI / 12, 0, -Math.PI / 20);
            break;
          case "-111":
            endRotation.current.set(Math.PI / 12, Math.PI, Math.PI / 16);
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
            endRotation.current.set(Math.PI / 20, Math.PI, -Math.PI / 20);
            break;
          case "-1-1-1":
            endRotation.current.set(-Math.PI / 20, Math.PI, -Math.PI / 16);
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
    if (!instancedRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.6;

      dummy.position.set(
        Math.cos(angle) * radius,
        // LOWER vertical offset: subtract something like 0.4
        Math.sin(angle * 2) * 0.5 - 0.4,
        Math.sin(angle) * radius
      );

      // Animate sparkle scale to flicker
      const flicker = 0.1 + 0.05 * Math.abs(Math.sin(t * 4 + i)); // 0.05-0.1 range
      dummy.scale.setScalar(flicker);

      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  {
    /*useEffect(() => {
    if (!instancedRef.current) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.1 + Math.random() * 0.7;
      dummy.position.set(
        Math.cos(angle) * radius,
        Math.random() * 1 - 0.5,
        Math.sin(angle) * radius
      );
      dummy.scale.setScalar(Math.random() * 0.02 + 0.2);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
  }, []);*/
  }

  return (
    <group ref={tinkerRef} {...props}>
      <instancedMesh ref={instancedRef} args={[null, null, count]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="yellow" emissive="yellow" />
      </instancedMesh>
      {/* DEBUG: Add a small box at tinkerRef's origin */}
      <mesh ref={debugRef}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color="hotpink" wireframe />
      </mesh>
      <group name="trailAnchor">
        {/* DEBUG: Add a small box at trailAnchor's origin */}
        <mesh>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial color="yellow" wireframe />
        </mesh>

        <Tinkerbell ref={trailAnchorRef} scale={0.002} />
      </group>
    </group>
  );
});

TinkerbellController.displayName = "TinkerbellController";
