import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";

export const TinkerTrail = ({ tinkerRef }) => {
  const { color, intensity, opacity, size, distance } = useControls(
    "TinkerTrail",
    {
      size: { value: 0.2, min: 0.1, max: 3, step: 0.01 },
      distance: { value: 0.3, min: 0.001, max: 5, step: 0.001 },
      color: "#dfbcff",
      intensity: { value: 4.6, min: 1, max: 10, step: 0.1 },
      opacity: { value: 0.5, min: 0, max: 1, step: 0.01 },
    }
  );

  const trailRef = useRef();

  useFrame(() => {
    if (tinkerRef.current && trailRef.current) {
      const tinkerWorldPos = new THREE.Vector3();
      tinkerRef.current.getWorldPosition(tinkerWorldPos);

      const forward = new THREE.Vector3();
      tinkerRef.current.getWorldDirection(forward);
      forward.multiplyScalar(-distance * 0.002); // remove `* direction` if unnecessary

      const trailPosition = tinkerWorldPos.clone().add(forward);

      // 👇 ADD THIS:
      console.log("Tinkerbell:", tinkerWorldPos.toArray());
      console.log("Trail:", trailPosition.toArray());

      trailRef.current.position.copy(trailPosition);
    }
  });

  return (
    <>
      <group ref={trailRef}>
        <mesh>
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
    </>
  );
};
