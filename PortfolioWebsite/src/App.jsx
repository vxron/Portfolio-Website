/* eslint-disable react/no-unknown-property */
import {
  OrbitControls,
  useHelper,
  ScrollControls,
  Scroll,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { useState } from "react";
import * as THREE from "three";
import { button, useControls } from "leva";
import { config } from "./config";
import { Interface } from "./components/Interface";
import { motion, MotionConfig } from "motion/react";
//import { UI } from "./components/FlipBookUI";
import { MeshNormalMaterial } from "three";
import { Menu } from "./components/Menu";

/*
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
*/

function App() {
  return (
    <>
      <Canvas camera={{ position: [0, 0.5, 5], fov: 42 }}>
        <color attach="background" args={["#f5f3ee"]} />
        <fog attach="fog" args={["#f5f3ee", 10, 50]} />
        {/* 🌤️ Global ambient light for base brightness */}
        <ambientLight intensity={0.4} />
        {/* 🔦 Strong directional light for sunlight-like shadows */}
        <directionalLight
          position={[7, 4, 5]}
          intensity={0.1}
          castShadow
          shadow-mapSize-width={1200}
          shadow-mapSize-height={1200}
        />
        {/* 🎯 Focused spotlight for extra depth on book/scene */}
        {/*<spotLight
          position={[-2, 4, 5]}
          angle={Math.PI / 6}
          intensity={0.3}
          penumbra={0.5}
          castShadow
        />*/}

        <ScrollControls
          pages={config.sections.length}
          damping={0.1}
          maxSpeed={0.2}
        >
          <MotionConfig transition={{ duration: 0.6 }}>
            <group position-y={-1}>
              <Experience />
            </group>
          </MotionConfig>
          <Scroll html>
            <MotionConfig transition={{ duration: 1 }}>
              <group position-y={-1}>
                <Interface />
              </group>
            </MotionConfig>
          </Scroll>
        </ScrollControls>
      </Canvas>
      <Menu></Menu>
    </>
  );
}

export default App;
