/* eslint-disable react/no-unknown-property */
import {
  Center,
  Environment,
  useScroll,
  ContactShadows,
  Float,
  MeshDistortMaterial,
  RoundedBox,
  Html,
} from "@react-three/drei";
import { Avatar } from "./Avatar";
import { useRef, useState, useEffect } from "react";
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
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMobile } from "../hooks/useMobile";
import { Box3, Vector3 } from "three";
import { TinkerTrail } from "./TinkerbellTrail";
import { TinkerbellController } from "./TinkerbellUI";
import { Cursor } from "./Cursor";
import { PixieDust } from "./FairyDust2";
import { VFXParticles } from "./VFXParticles";
import { VFXEmitter } from "./VFXEmitter";
import { Bloom, EffectComposer } from "@react-three/postprocessing";

gsap.registerPlugin(ScrollTrigger);

// Transition speed between sections (higher = slower fade)
const FADE_SPEED = 0.05;

export const Experience = () => {
  // useMobile hook for responsiveness
  const { isMobile, scaleFactor } = useMobile();
  // State machine for revealing/hiding sections (starting at home page)
  const [section, setSection] = useState(config.sections[0]);
  // State machine for flipbook
  const [bookOpen, setBookOpen] = useState(false);

  const sceneContainer = useRef();
  const scrollData = useScroll();

  // Distance along z-axis between sections (as char walks fwd/backward)
  const SECTION_DISTANCE = isMobile ? 10 : 20;

  const titleRef = useRef();
  const tinkerbellRef = useRef();
  const [direction, setDirection] = useState(1); // shared direction

  //const setGlobalSection = useSectionState((state) => state.setSection);
  const emitterBlue = useRef();
  const emitterRed = useRef();
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
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    // update VFX particles position
    emitterRed.current.position.x = Math.sin(time * 6) * 1.5;
    emitterRed.current.position.y = Math.cos(time * 3) * 1.5;
    emitterRed.current.position.z = Math.sin(time * 4) * 1.5;

    emitterBlue.current.position.x = Math.cos(time * 6) * 1.5;
    emitterBlue.current.position.y = Math.sin(time * 3) * 1.5;
    emitterBlue.current.position.z = Math.cos(time * 4) * 1.5;

    // separate logic for mobile experience for horizontal scrolling
    if (isMobile) {
      sceneContainer.current.position.x =
        -scrollData.offset * SECTION_DISTANCE * (scrollData.pages - 1);
      // since we can change between two modes at runtime, need to reset
      sceneContainer.current.position.z = 0;
    } else {
      // vertical scrolling on desktop
      sceneContainer.current.position.z =
        -scrollData.offset * SECTION_DISTANCE * (scrollData.pages - 1);
      sceneContainer.current.position.x = 0;
      // This moves groups in -z dir (towards camera) to sim camera moving backward (in +z dir)
    }
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
        // Handle opacity for entire section group
        /*
        if (child.isGroup) {
          // For the entire group, adjust the opacity based on section visibility
          const groupOpacity = sectionOpacity.current[parent_section] || 0;
          if (child.name === "experience") {
            child.traverse((descendant) => {
              if (descendant.material) {
                descendant.material.opacity = THREE.MathUtils.lerp(
                  descendant.material.opacity,
                  groupOpacity,
                  FADE_SPEED
                );
                descendant.material.transparent = true;
              }
            });
          }
        }
          */
      });
    }
  });

  // Event listener for top bar menu
  useEffect(() => {
    // menu must match config.js sections
    const handleHashChange = () => {
      const sectionIndex = config.sections.indexOf(
        window.location.hash.replace("#", "")
      );
      if (sectionIndex >= 0) {
        // scroll to section
        scrollData.el.scrollTo(
          0,
          (sectionIndex / (config.sections.length - 1)) *
            (scrollData.el.scrollHeight - scrollData.el.clientHeight)
        );
        // scrollData.el is the scrollable element created by ScrollControls
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashChange", handleHashChange);
  }, []);

  // hook for getting size (dimensions) of 3D element on screen (for debugging)
  useEffect(() => {
    if (titleRef.current) {
      const box = new THREE.Box3().setFromObject(titleRef.current);
      const size = new THREE.Vector3();
      box.getSize(size);
      console.log("Measured dimensions:", size);
    }
  }, []);

  return (
    <>
      <Environment preset="sunset" />
      {/* Render avatar; Hide avatar when book opens */}
      <Avatar
        hideAvatar={
          (section === "projects" && !isMobile) ||
          (section === "experience" && bookOpen)
        }
        position-z={isMobile ? -1.8 : 0}
        scale={isMobile ? 1.1 : 1}
        position-x={-0.05}
      />
      {/* Group containing different website sections; must match array defined in config.js */}
      <group ref={sceneContainer} animate={section}>
        {/* HOME */}
        <group name="home">
          <Star
            position-x={-0.009}
            position-z={isMobile ? -2 : 0}
            position-y={isMobile ? 2.15 : 1.97}
            scale={0.3}
          />
          <Float floatIntensity={isMobile ? 1 : 2} speed={2}>
            <MacBookPro
              position-x={isMobile ? -0.9 : -1}
              position-y={isMobile ? 0.7 : 0.1}
              position-z={isMobile ? -2 : 0}
              scale={0.3}
              rotation-y={Math.PI / 4}
            />
          </Float>
          <PalmTree
            scale={0.024}
            rotation-y={
              isMobile
                ? THREE.MathUtils.degToRad(195)
                : THREE.MathUtils.degToRad(140)
            }
            position={
              isMobile ? [1, -0.1, -5] : [4.8 * scaleFactor, -0.5, -4.1]
            }
          />
          <group scale={isMobile ? 0.3 : 1} position-y={isMobile ? -0.4 : 0}>
            <Float
              floatIntensity={0.4}
              rotationIntensity={0.2}
              speed={2}
              floatingRange={[-0.05, 0.05]}
            >
              <Center disableY disableZ>
                <SectionTitle
                  size={0.8}
                  position-x={1.1}
                  position-y={1.4}
                  position-z={-3}
                  bevelEnabled
                  bevelThickness={0.3}
                  rotation-x={isMobile ? -Math.PI / 20 : 0}
                >
                  {config.home.title}
                </SectionTitle>
              </Center>
            </Float>

            <Center disableY disableZ>
              <SectionTitle
                ref={titleRef}
                size={1.1}
                position-z={-3}
                bevelEnabled
                bevelThickness={0.3}
                rotation-y={isMobile ? Math.PI / 20 : Math.PI / 13}
              >
                {config.home.subtitle}
              </SectionTitle>
            </Center>
          </group>
        </group>

        {/* SKILLS */}
        <group
          position-x={isMobile ? SECTION_DISTANCE : 0}
          position-z={isMobile ? -4 : SECTION_DISTANCE}
          name="skills"
        >
          <group position-x={isMobile ? 0 : -2}>
            <SectionTitle
              position-x={0.4}
              rotation-y={isMobile ? Math.PI / 6 : -Math.PI / 6}
            >
              SKILLS
            </SectionTitle>
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
        <group
          position-x={isMobile ? 2 * SECTION_DISTANCE : 0}
          position-z={isMobile ? -3 : 2 * SECTION_DISTANCE}
          name="experience"
        >
          {!bookOpen && (
            <SectionTitle
              position-x={isMobile ? -1 : 0.4}
              position-z={isMobile ? 2.5 : 0}
              scale={isMobile ? 0.75 : 1}
              rotation-y={isMobile ? -Math.PI / 10 : 0}
            >
              EXPERIENCE
            </SectionTitle>
          )}
          {/* Hide title when book opens */}
          <group position={[0, 1, 0.5]}>
            {/* match to FlipBook's y and z */}
            <Float
              rotation-x={-Math.PI / 7}
              floatIntensity={0.5}
              speed={2}
              rotationIntensity={1}
            >
              <FlipBook setBookOpen={setBookOpen} />
            </Float>
          </group>
        </group>

        {/* PROJECTS */}
        <group
          position-x={isMobile ? 3 * SECTION_DISTANCE : 0}
          position-z={isMobile ? -4 : 3 * SECTION_DISTANCE}
          name="projects"
        >
          <group position-x={isMobile ? 0.25 : 1}>
            <SectionTitle
              position-x={isMobile ? -2.4 : -0.5}
              position-z={0}
              rotation-y={isMobile ? Math.PI / 5 : -Math.PI / 6}
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
        <group
          position-x={isMobile ? 3.75 * SECTION_DISTANCE : 0}
          position-z={isMobile ? -4 : 4 * SECTION_DISTANCE}
          rotation-y={Math.PI / 5}
          name="contact"
        >
          <Cursor tinkerRef={tinkerbellRef}></Cursor>
          <SectionTitle position-x={0.4}>CONTACT</SectionTitle>
          {/*ref={tinkerbellRef}
            setDirection={setDirection} // pass setter to child
            direction={direction}*/}
          <TinkerbellController
            ref={tinkerbellRef}
            position-z={-12}
            position-y={1}
            position-x={isMobile ? 10 : 0}
            rotation-y={Math.PI / 15}
            rotation-x={Math.PI / 9}
            rotation-z={-Math.PI / 25}
          ></TinkerbellController>
          {/*<PixieDust />*/}
          <VFXParticles
            position={[6, -2, 0]}
            name="sparks"
            settings={{ nbParticles: 100000, renderMode: "billboard" }}
          ></VFXParticles>
          {/*<VFXEmitter emitter="sparks"></VFXEmitter>*/}
          <VFXEmitter
            ref={emitterRed}
            emitter="sparks"
            settings={{
              nbParticles: 10000,
              colorStart: ["yellowgreen", "palegreen"],
              colorEnd: "#DA70D6",
              size: [0.01, 0.1],
              startPositionMin: [0, 0, 0],
              startPositionMax: [0, 0, 0],
              directionMin: [-0.5, 0, -0.5],
              directionMax: [0.5, 1, 0.5],
              speed: [1, 5],
              loop: true,
            }}
          />
          <VFXEmitter
            ref={emitterBlue}
            emitter="sparks"
            settings={{
              nbParticles: 10000,
              colorStart: ["palegoldenrod", "palegreen"],
              size: [0.01, 0.1],
              startPositionMin: [0, 0, 0],
              startPositionMax: [0, 0, 0],
              directionMin: [-0.5, 0, -0.5],
              directionMax: [0.5, 1, 0.5],
              speed: [1, 5],
              loop: true,
            }}
          />
        </group>
      </group>
    </>
  );
};
