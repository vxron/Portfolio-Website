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
//#import { motion } from "framer-motion-3d";
import { MonitorScreen } from "./MonitorScreen";
import { motion, MotionConfig, LayoutGroup } from "motion/react";
//import { useSectionState } from "../States";
//import { SectionContext } from "../States";
import { FlipBook } from "./FlipBook";

// Distance along z-axis between sections (as char walks fwd/backward)
const SECTION_DISTANCE = 10;
// Transition speed between sections (higher = slower fade)
const FADE_SPEED = 0.05;

export const Experience = ({ setSection_prop }) => {
  // State machine for revealing/hiding sections (starting at home page)
  const [section, setSection] = useState(config.sections[0]);

  const sceneContainer = useRef();
  const scrollData = useScroll();

  //const setGlobalSection = useSectionState((state) => state.setSection);

  // Continuously store opacity for each section group in a map array (basically a dict)
  // by default, opacity state gets set to 1 when the section_name from config.js matches current section, 0 for others
  // use useRef instead of useState to avoid setting states in useFrame thereby avoid triggering re-renders
  const sectionOpacity = useRef(
    Object.fromEntries(
      config.sections.map((section_name) => [
        section_name,
        section_name == section ? 1 : 0,
      ])
    )
  );

  // Animate sceneContainer group to move through different sections
  useFrame(() => {
    sceneContainer.current.position.z =
      -scrollData.offset * SECTION_DISTANCE * (scrollData.pages - 1);
    // This moves groups in -z dir (towards camera) to sim camera moving backward (in +z dir)

    // Get current section number (current state), and acquire title from config
    setSection(
      config.sections[Math.round(scrollData.offset * (scrollData.pages - 1))]
    );
    //setGlobalSection(section);

    // Update all section opacities directly without triggering re-renders

    // Set opacity TARGET to be 1 for current section and 0 for others
    sectionOpacity.current = Object.fromEntries(
      config.sections.map((section_name) => [
        section_name,
        section_name === section ? 1 : 0,
      ])
    );

    /* Make sure scene is loaded, then traverse all children of sceneContainer (basically everything),
    and apply correct opacities based on above */
    /* Linear Interpolation logic:
    --> start is current material opacity, 
    --> target is invisible (0) if leaving section, otherwise (1) if it's current section based on above,
    --> transition is fade_speed */
    var parent_section = "home";
    if (sceneContainer.current) {
      sceneContainer.current.traverse((child) => {
        // each time we're iterating through new section recursively, change the current section name to reflect current section
        if (child.parent == sceneContainer.current) {
          parent_section = child.name;
        }
        if (child.isMesh && child.material) {
          // Apply opacity transition for each section's elements
          // if not 0, target is 1
          const targetOpacity = sectionOpacity.current[parent_section] || 0;
          // Smoothly interpolate the opacity
          child.material.opacity = THREE.MathUtils.lerp(
            child.material.opacity,
            targetOpacity,
            FADE_SPEED
          );
          child.material.transparent = true; // Ensure transparency is applied
        }
      });
    }
  });

  return (
    <>
      <Environment preset="sunset" />
      <Avatar />
      {/* Group containing different website sections; must match array defined in config.js */}
      <group ref={sceneContainer} animate={section}>
        {/* HOME */}
        <group name="home">
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
        </group>

        {/* SKILLS */}
        <group position-z={SECTION_DISTANCE} name="skills">
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
        </group>

        {/* EXPERIENCE */}
        <group position-z={SECTION_DISTANCE * 2} name="experience">
          <SectionTitle position-x={0.4}>EXPERIENCE</SectionTitle>
          <FlipBook />
        </group>

        {/* PROJECTS */}
        <group position-z={SECTION_DISTANCE * 3} name="projects">
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
              <MonitorScreen
                rotation-x={-0.18}
                position-z={-0.895}
                position-y={1.74}
              ></MonitorScreen>
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
        <group position-z={SECTION_DISTANCE * 4} name="contact">
          <SectionTitle position-x={0.4}>CONTACT</SectionTitle>
        </group>
      </group>
    </>
  );
};
