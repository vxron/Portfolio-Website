// components/PixieDust.js
import { useThree, useFrame } from "@react-three/fiber";
import Nebula, { SpriteRenderer } from "three-nebula";
import * as THREE from "three";
import { useEffect, useRef, useState, useMemo } from "react";
import json from "../ParticleSystem.json";
import { useMobile } from "../hooks/useMobile";

export function PixieDust() {
  const { scene } = useThree();
  const nebulaRef = useRef(null);
  const debugRef = useRef();
  const { isMobile, scaleFactor } = useMobile();
  const SECTION_DISTANCE = isMobile ? 10 : 20;

  useEffect(() => {
    let isMounted = true;

    Nebula.fromJSONAsync(json, THREE).then((nebulaSystem) => {
      if (!isMounted) return;

      const spriteRenderer = new SpriteRenderer(scene, THREE);
      nebulaSystem.addRenderer(spriteRenderer);
      nebulaRef.current = nebulaSystem;
      const emitter = nebulaSystem.emitters[0];

      // Update emitter position based on mobile status
      const offset = isMobile
        ? new THREE.Vector3(37.5, 0, -4) // 3.75 * 10 (SECTION_DISTANCE)
        : new THREE.Vector3(0, 0, 80); // 4 * 20 SECTION_DISTANCE

      // 🔧 Apply manual offset
      emitter.position.copy(offset);
      //emitter.position.copy(pos);
      console.log("✅ Nebula loaded with offset:", offset);
    });

    return () => {
      isMounted = false;
    };
  }, [scene, isMobile]);

  useFrame(() => {
    if (nebulaRef.current) {
      nebulaRef.current.update();
    }
    if (debugRef.current) {
      debugRef.current.position.set(isMobile ? 37.5 : 0, 0, isMobile ? -4 : 80);
    }
  });

  return (
    <>
      {/* 🔴 Debug box: Red wireframe cube at emitter position */}
      <mesh ref={debugRef}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
    </>
  );
  //return null; // This component adds effects to the scene without rendering geometry directly
}
