/* eslint-disable react/no-unknown-property */
import { OrbitControls, useHelper } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { useRef } from "react";
import * as THREE from "three";
import { useControls } from "leva";

const Lights = () => {
  const ref = useRef();
  const helper = useHelper(ref, THREE.PointLightHelper, 0.5, "red");
  const { color, distance, decay, intensity } = useControls({
    color: "#ff0000",
    distance: 3,
    decay: 2,
    intensity: 0.5,
  });
  return (
    <pointLight
      ref={ref}
      position={[1, 1, 1]}
      intensity={intensity}
      distance={distance}
      color={color}
      decay={decay}
    />
  );
};

function App() {
  return (
    <>
      <Canvas camera={{ position: [0, 0.5, 5], fov: 42 }}>
        <OrbitControls />
        <color attach="background" args={["#f5f3ee"]} />
        <fog attach="fog" args={["#f5f3ee", 10, 50]} />
        <group position-y={-1}>
          <Lights />
          <Experience />
        </group>
      </Canvas>
    </>
  );
}

export default App;
