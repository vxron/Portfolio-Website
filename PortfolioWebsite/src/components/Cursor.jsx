// THIS FILE CONTAINS TARGET GROUP WE WANT TO TRAIL

// FIX ALL THIS LOGIC BY WATCIHNG END OF WIZARD GAME VID

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { SimpleTrail } from "./SimpleTrail";
import * as THREE from "three";

// Dummy vector to lerp the position of the target
const tmpVec = new THREE.Vector3();

export const Cursor = ({ tinkerRef }) => {
  // reference for animation
  const target = useRef();
  useFrame((_, delta) => {
    if (tinkerRef.current?.tinker && target.current) {
      const tinker = tinkerRef.current.debug;
      // Get Tinkerbell's world position
      tinker.updateMatrixWorld(true);
      tinker.getWorldPosition(tmpVec);

      //tmpVec.x += 3.5; // Try increasing/decreasing this
      //tmpVec.y += 1;
      //tmpVec.z += 3.5;

      // Lerp trail to follow smoothly
      target.current.position.lerp(tmpVec, delta * 12);
    }
  });
  return (
    <>
      <group ref={target}>
        <mesh>
          {/* acc circle we'll have trailing (target) */}
          <sphereGeometry args={[size / 2, 32, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity}
            emissive={color}
            emissiveIntensity={intensity}
          />
        </mesh>
      </group>
      {/* pass same props for now, target must be ref target */}
      <SimpleTrail
        target={target}
        color={color}
        intensity={intensity}
        opacity={opacity}
        height={size}
      ></SimpleTrail>
    </>
  );
};
