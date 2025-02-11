/* eslint-disable react/no-unknown-property */
import { Center, Environment, useScroll, Float } from "@react-three/drei";
import { Avatar } from "./Avatar";
import { useRef } from "react";
import { SectionTitle } from "./SectionTitle";
import { useFrame } from "@react-three/fiber";
import { config } from "../config";
import { Star } from "./Star";
import { MacBookPro } from "./MacBookPro";
import { PalmTree } from "./PalmTree";
import * as THREE from "three";

// Distance along z-axis between sections (as char walks fwd/backward)
const SECTION_DISTANCE = 10;

export const Experience = () => {
  const sceneContainer = useRef();
  const scrollData = useScroll();

  // Animate sceneContainer group to move through different sections
  useFrame(() => {
    sceneContainer.current.position.z =
      -scrollData.offset * SECTION_DISTANCE * (scrollData.pages - 1);
    // This moves groups in -z dir (towards camera) to sim camera moving backward (in +z dir)
  });

  return (
    <>
      <Environment preset="sunset" />
      <Avatar />
      {/* Group containing different website sections; must match array defined in config.js */}
      <group ref={sceneContainer}>
        {/* HOME */}
        <group>
          <Star position-z={0} position-y={2.0} scale={0.3} />
          <Float floatIntensity={2} speed={2}>
            <MacBookPro
              position-x={-1}
              position-y={0.5}
              position-z={0}
              scale={0.3}
              rotation-y={Math.PI / 4}
            />
          </Float>
          <PalmTree
            scale={0.018}
            rotation-y={THREE.MathUtils.degToRad(140)}
            position={[4, 0, -5]}
          />
          <Float
            floatIntensity={0.4}
            rotationIntensity={0.2}
            speed={2}
            floatingRange={[-0.05, 0.05]}
          >
            <Center disableY disableZ>
              <SectionTitle
                size={0.8}
                position-x={2}
                position-y={1.6}
                position-z={-3}
                bevelEnabled
                bevelThickness={0.3}
              >
                {config.home.title}
              </SectionTitle>
            </Center>
          </Float>
          <Center disableY disableZ>
            <SectionTitle
              size={1.2}
              position-x={5}
              position-z={-3}
              bevelEnabled
              bevelThickness={0.3}
              rotation-y={Math.PI / 10}
            >
              {config.home.subtitle}
            </SectionTitle>
          </Center>
        </group>
        {/* SKILLS */}
        <group position-z={SECTION_DISTANCE}>
          <SectionTitle position-x={0.4}>SKILLS</SectionTitle>
        </group>
        {/* EXPERIENCE */}
        <group position-z={SECTION_DISTANCE * 2}>
          <SectionTitle position-x={0.4}>EXPERIENCE</SectionTitle>
        </group>
        {/* PROJECTS */}
        <group position-z={SECTION_DISTANCE * 3}>
          <SectionTitle position-x={0.4}>PROJECTS</SectionTitle>
        </group>
        {/* CONTACT */}
        <group position-z={SECTION_DISTANCE * 4}>
          <SectionTitle position-x={0.4}>CONTACT</SectionTitle>
        </group>
      </group>
    </>
  );
};
