/* eslint-disable react/no-unknown-property */
import { ScrollControls, Scroll } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { useState, Suspense, useRef } from "react";
import * as THREE from "three";
import { config } from "./config";
import { Interface } from "./components/Interface";
import { motion, MotionConfig } from "motion/react";
import { Menu } from "./components/Menu";
import { LoadingScreen } from "./components/LoadingScreen";
import { BgMusic } from "./components/Music";
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
  // keep track of when page has loaded
  const [ready, setReady] = useState(false);
  const tinkerbellRef = useRef();

  // dimensions of 3d scene
  const width = 8.882429021961798;
  const height = 1.1618082784116268 * 3.5;
  const depth = 4.5;
  const aspect = width / height;
  // equation for responsive fov of camera to accomodate diff screen sizes
  const fov = 2 * Math.atan(width / aspect / (2 * depth)) * (180 / Math.PI);
  return (
    <>
      <LoadingScreen onFinish={() => setReady(true)}></LoadingScreen>
      {ready && <BgMusic />}
      <Canvas
        shadows
        gl={{ antialias: true }}
        camera={{ position: [0, 0.5, 5], fov: fov }}
      >
        <color attach="background" args={["#f5f3ee"]} />
        <fog attach="fog" args={["#f5f3ee", 10, 50]} />
        {/* Global ambient light for base brightness */}
        <ambientLight intensity={0.3} />
        {/* Strong directional light for sunlight-like shadows */}
        <directionalLight
          position={[2, 4, 2]}
          intensity={0.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        {/* Focused spotlight for extra depth on book/scene */}
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
            <group position-y={-1} position-x={0.2}>
              <Suspense fallback={null}>
                <Experience />
              </Suspense>
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
