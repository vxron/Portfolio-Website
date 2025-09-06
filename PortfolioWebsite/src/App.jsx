/* eslint-disable react/no-unknown-property */
import { ScrollControls, Scroll } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { useState, Suspense, useRef } from "react";
import * as THREE from "three";
import { config } from "./config";
import { Interface } from "./components/Interface";
import { MotionConfig } from "motion/react";
import { Menu } from "./components/Menu";
import { LoadingScreen } from "./components/LoadingScreen";
import { BgMusic } from "./components/Music";
import ResponsiveScale from "./components/ResponsiveScale";
// r150+: use ColorManagement.enabled and outputColorSpace
THREE.ColorManagement.enabled = true;

function App() {
  // keep track of when page has loaded
  const [ready, setReady] = useState(false);
  const contentRef = useRef();

  return (
    <>
      <LoadingScreen onFinish={() => setReady(true)}></LoadingScreen>
      {ready && <BgMusic />}
      <Canvas
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [0, 0.5, 5], fov: 50 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <color attach="background" args={["#f5f3ee"]} />
        <fog attach="fog" args={["#f5f3ee", 4, 120]} />
        {/* Global ambient light for base brightness */}
        <ambientLight intensity={0.3} />
        {/* Strong directional light for sunlight-like shadows */}
        <directionalLight position={[2, 4, 2]} intensity={0.3} />
        <ScrollControls
          pages={config.sections.length}
          damping={0.1}
          maxSpeed={0.2}
        >
          <MotionConfig transition={{ duration: 0.6 }}>
            <ResponsiveScale
              baseW={6}
              baseH={4}
              mult={0.8}
              clamp={[0.65, 1.25]}
            >
              <group ref={contentRef} position-y={-1} position-x={0.2}>
                <Suspense fallback={null}>
                  <Experience />
                </Suspense>
              </group>
            </ResponsiveScale>
          </MotionConfig>
          <Scroll html>
            <MotionConfig transition={{ duration: 1 }}>
              <div>
                <Interface />
              </div>
              {/* mobile-only “guard rail” so bottom bar doesn’t hide content */}
              <div className="mobile-bottom-spacer" aria-hidden />
            </MotionConfig>
          </Scroll>
        </ScrollControls>
      </Canvas>
      <Menu></Menu>
    </>
  );
}

export default App;
