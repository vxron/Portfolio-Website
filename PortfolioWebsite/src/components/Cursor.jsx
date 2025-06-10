// THIS FILE CONTAINS TARGET GROUP WE WANT TO TRAIL

import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useRef } from "react";
import { SimpleTrail } from "./SimpleTrail";
import * as THREE from "three";

// Dummy vector to lerp the position of the target
const tmpVec = new THREE.Vector3();

export const Cursor = ({ tinkerRef }) => {
  const { color, intensity, opacity, size } = useControls("Cursor", {
    size: { value: 0.2, min: 0.1, max: 3, step: 0.01 },
    color: "#dfbcff",
    intensity: { value: 4.6, min: 1, max: 10, step: 0.1 },
    opacity: { value: 0.5, min: 0, max: 1, step: 0.01 },
  });
  // reference for animation
  const target = useRef();
  useFrame((_, delta) => {
    console.log(
      "Following world pos of:",
      tinkerRef.current.name,
      tinkerRef.current.position
    );
    if (tinkerRef.current && target.current) {
      // Get Tinkerbell's world position
      tinkerRef.current.updateMatrixWorld(true);
      tinkerRef.current.getWorldPosition(tmpVec);

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
