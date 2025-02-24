/* eslint-disable react/no-unknown-property */
import {
  Center,
  Environment,
  useScroll,
  Float,
  MeshDistortMaterial,
  RoundedBox,
  Html,
} from "@react-three/drei";
import { Avatar } from "./Avatar";
import { useRef, useState } from "react";
import { SectionTitle } from "./SectionTitle";
import { useFrame } from "@react-three/fiber";
import { config } from "../config";
import { Star } from "./Star";
import { BookCase } from "./BookCase";
import { CouchSmall } from "./CouchSmall";
import { Lamp } from "./Lamp";
import { MacBookPro } from "./MacBookPro";
import { PalmTree } from "./PalmTree";
import { Monitor } from "./Monitor";
import * as THREE from "three";
import { motion } from "framer-motion-3d";
//import { motion, MotionConfig, LayoutGroup } from "motion/react";

// Distance along z-axis between sections (as char walks fwd/backward)
const SECTION_DISTANCE = 10;

// Variants for animating sections (hiding/unhiding)
const variants = {
  home: { y: 0 },
};

export const Experience = () => {
  // State machine for revealing/hiding sections (starting at home page)
  const [section, setSection] = useState(config.sections[0]);

  const sceneContainer = useRef();
  const scrollData = useScroll();

  // Animate sceneContainer group to move through different sections
  useFrame(() => {
    sceneContainer.current.position.z =
      -scrollData.offset * SECTION_DISTANCE * (scrollData.pages - 1);
    // This moves groups in -z dir (towards camera) to sim camera moving backward (in +z dir)

    // Get current section number (current state), and acquire title from config
    setSection(
      config.sections[Math.round(scrollData.offset * (scrollData.pages - 1))]
    );
  });
  console.log(section);

  return (
    <>
      <Environment preset="sunset" />
      <Avatar />
      {/* Group containing different website sections; must match array defined in config.js */}
      <motion.group ref={sceneContainer} animate={section}>
        {/* HOME */}
        <motion.group variants={variants} position-y={-5}>
          <Star
            position-x={-0.009}
            position-z={0}
            position-y={1.97}
            scale={0.3}
          />
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
        </motion.group>

        {/* SKILLS */}
        <group position-z={SECTION_DISTANCE}>
          <group position-x={-2}>
            <SectionTitle position-x={0.4}>SKILLS</SectionTitle>
            <BookCase position-z={-2} />
            <CouchSmall
              scale={0.4}
              position-z={0}
              position-x={-0.2}
              rotation-y={Math.PI / 3}
            />
            <Lamp
              position-z={0.6}
              position-x={-0.4}
              position-y={-0.8}
              rotation-y={-Math.PI}
            />
          </group>
          {/*
          <mesh position-y={2} position-z={-4} position-x={2}>
            <sphereGeometry args={[1, 64, 64]} />
            <MeshDistortMaterial
              opacity={0.8}
              transparent
              distort={1}
              speed={5}
              color="hotpink"
            />
          </mesh>
          */}
        </group>

        {/* EXPERIENCE */}
        <group position-z={SECTION_DISTANCE * 2}>
          <SectionTitle position-x={0.4}>EXPERIENCE</SectionTitle>
        </group>

        {/* PROJECTS */}
        <group position-z={SECTION_DISTANCE * 3}>
          <group position-x={1}>
            <SectionTitle
              position-x={-0.5}
              position-z={0}
              rotation-y={-Math.PI / 6}
            >
              PROJECTS
            </SectionTitle>

            <group
              position-x={0.5}
              position-z={0}
              rotation-y={-Math.PI / 6}
              scale={0.8}
            >
              <Monitor
                scale={0.02}
                position-y={1}
                rotation-y={-Math.PI / 2}
                position-z={-1}
              />
              <RoundedBox scale-x={2} position-y={0.5} position-z={-1}>
                <meshStandardMaterial color="white" />
              </RoundedBox>
            </group>
          </group>
        </group>

        {/* CONTACT */}
        <group position-z={SECTION_DISTANCE * 4}>
          <SectionTitle position-x={0.4}>CONTACT</SectionTitle>
        </group>
      </motion.group>
    </>
  );
};
