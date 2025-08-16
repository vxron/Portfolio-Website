/* eslint-disable react/no-unknown-property */
import {
  Center,
  Environment,
  useScroll,
  Float,
  RoundedBox,
  useTexture,
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
//import { useSectionState } from "../States";
//import { SectionContext } from "../States";
import { FlipBook } from "./FlipBook";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMobile } from "../hooks/useMobile";
import { TinkerbellController } from "./TinkerbellUI";
import { VFXParticles } from "./VFXParticles";
import { VFXEmitter } from "./VFXEmitter";

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

  //const setGlobalSection = useSectionState((state) => state.setSection);
  const emitterBlue = useRef();
  const emitterRed = useRef();
  const alphaMap = useTexture("textures/Particles/symbol_02.png");
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
    emitterRed.current.position.x = isMobile
      ? Math.sin(time * 6) * 2.5
      : Math.sin(time * 6) * 1.5;
    emitterRed.current.position.y = isMobile
      ? Math.cos(time * 3) * 2.6
      : Math.cos(time * 3) * 1.7;
    emitterRed.current.position.z = Math.sin(time * 4) * 1.5;

    emitterBlue.current.position.x = isMobile
      ? Math.cos(time * 6) * 2.5
      : Math.cos(time * 6) * 1.5;
    emitterBlue.current.position.y = isMobile
      ? Math.sin(time * 3) * 2.5
      : Math.sin(time * 3) * 1.6;
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
            scale={0.025}
            rotation-y={
              isMobile
                ? THREE.MathUtils.degToRad(195)
                : THREE.MathUtils.degToRad(140)
            }
            position={
              isMobile ? [1, -0.6, -5] : [4.8 * scaleFactor, -0.95, -3.5]
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
                  position-y={isMobile ? 1 : 1.4}
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
                position-y={isMobile ? -0.5 : -0.1}
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
          <SectionTitle position-x={0.4}>CONTACT</SectionTitle>
          {!isMobile ? (
            <TinkerbellController
              ref={tinkerbellRef}
              position-z={-12}
              position-y={isMobile ? 1 : 4.5}
              position-x={isMobile ? 10 : -18}
              rotation-y={Math.PI / 15}
              rotation-x={Math.PI / 9}
              rotation-z={-Math.PI / 25}
            ></TinkerbellController>
          ) : null}
          <VFXParticles
            position={isMobile ? [6, -2, 0] : [0, 0, -3]}
            name="sparks"
            alphaMap={alphaMap}
            settings={{
              nbParticles: 100000,
              renderMode: "billboard",
              intensity: 1.2,
              fadeSize: [0, 0],
              fadeAlpha: [0, 1],
            }}
          ></VFXParticles>
          <VFXEmitter
            ref={emitterRed}
            emitter="sparks"
            settings={{
              nbParticles: 5000,
              colorStart: ["pink", "#ff99cc"],
              colorEnd: "#DA70D6",
              size: isMobile ? [0.05, 0.5] : [0.02, 0.22],
              startPositionMin: isMobile ? [8, 6, 0] : [1, 3, 0],
              startPositionMax: isMobile ? [8, 6, 0] : [1, 3, 0],
              directionMin: [-0.5, 0, -0.5],
              directionMax: [0.5, 1, 0.5],
              speed: [0.9, 3],
              loop: true,
              lifetime: isMobile ? [0.8, 2.6] : [0.8, 2.2],
            }}
          />
          <VFXEmitter
            ref={emitterBlue}
            emitter="sparks"
            settings={{
              nbParticles: 8000,
              colorStart: ["#eb16af", "#ffa9ed"],
              startPositionMin: isMobile ? [7, 4, 0] : [1.2, 1.5, 0],
              startPositionMax: isMobile ? [7, 4, 0] : [1, 1.4, 0],
              directionMin: [-0.5, 0, -0.5],
              directionMax: [0.5, 1, 0.5],
              particlesLifetime: [0.1, 2.7],
              speed: [0.9, 3],
              size: isMobile ? [0.05, 0.5] : [0.05, 0.22],
              loop: true,
              lifetime: isMobile ? [0.8, 2.6] : [0.8, 2.2],
            }}
          />
        </group>
      </group>
    </>
  );
};
