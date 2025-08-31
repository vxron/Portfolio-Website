/* eslint-disable react/no-unknown-property */
import {
  Center,
  Environment,
  useScroll,
  Float,
  RoundedBox,
  useTexture,
  Html,
} from "@react-three/drei";
import { Avatar } from "./Avatar";
import { useRef, useState, useEffect } from "react";
import { SectionTitle } from "./SectionTitle";
import { useFrame, useThree } from "@react-three/fiber";
import { config } from "../config";
import { Star } from "./Star";
import { BookCase } from "./BookCase";
import { CouchSmall } from "./CouchSmall";
import { Lamp } from "./Lamp";
import { MacBookPro } from "./MacBookPro";
import { PalmTree } from "./PalmTree";
import { Monitor } from "./Monitor";
import * as THREE from "three";
import { MonitorScreen } from "./MonitorScreen";
import { FlipBook } from "./FlipBook";
import FlipbookArrow from "./FlipbookArrow";
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
  const { camera } = useThree();
  // Anchors for arrow/label — both in WORLD, near the flipbook
  const labelAnchor = useRef();
  const bookAnchor = useRef();
  // temp vectors to avoid allocations
  const _bookPos = useRef(new THREE.Vector3());
  const _fwd = useRef(new THREE.Vector3());
  const _right = useRef(new THREE.Vector3());
  const _up = useRef(new THREE.Vector3());

  // simple smoothing + per-material base opacity cache
  const tRef = useRef(0);
  const baseOpacityMap = useRef(new WeakMap());

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
    // Smooth the scroll position in "section units" (0..N-1)
    const rawT = scrollData.offset * (scrollData.pages - 1);
    tRef.current = THREE.MathUtils.lerp(tRef.current, rawT, 0.15); // 0.12–0.2 = smoother
    const t = tRef.current;

    const activeIdx = Math.round(t);
    setSection(config.sections[activeIdx]);

    // Start fades sooner with a soft window around each section
    const CROSSFADE_RADIUS = 0.65; // 0.5–0.8 to taste
    sectionOpacity.current = Object.fromEntries(
      config.sections.map((name, i) => {
        const d = Math.abs(t - i);
        const lin = Math.max(0, 1 - d / CROSSFADE_RADIUS);
        const w = lin * lin * (3 - 2 * lin); // smoothstep
        return [name, w]; // 0..1
      })
    );

    /* Make sure scene is loaded, then traverse all children of sceneContainer (basically everything),
    and apply correct opacities based on above */
    /* Linear Interpolation logic:
    --> start is current material opacity, 
    --> target is invisible (0) if leaving section, otherwise (1) if it's current section based on above,
    --> transition is fade_speed */
    // Smooth fades for single & multi-material meshes, without popping.
    // - Fade opacity with LERP each frame
    // - Switch transparent/depthWrite only at the ends of fades
    // - Toggle visibility based on *current* opacity, not the target
    // Smooth fades for standard mesh materials only (skip VFX/shaders/additive).
    // smooth fades (skip VFX materials) and RESTORE original flags after fade
    const inited = (Experience.__fadeInit ||= new WeakSet());
    const shouldFade = (m) => {
      const isStandard =
        m.isMeshStandardMaterial ||
        m.isMeshPhysicalMaterial ||
        m.isMeshLambertMaterial ||
        m.isMeshPhongMaterial ||
        m.isMeshBasicMaterial;
      const isCustom =
        m.isShaderMaterial ||
        m.isRawShaderMaterial ||
        m.isPointsMaterial ||
        m.isSpriteMaterial;
      return isStandard && !isCustom && m.blending === THREE.NormalBlending;
    };

    let parent_section = "home";
    if (sceneContainer.current) {
      sceneContainer.current.traverse((child) => {
        if (child.parent === sceneContainer.current)
          parent_section = child.name;
        if (!child.isMesh || !child.material) return;

        const weight = sectionOpacity.current[parent_section] || 0;
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];

        let sum = 0,
          n = 0;
        for (const m of mats) {
          if (!shouldFade(m)) continue;

          if (!inited.has(m)) {
            // enable opacity to actually render; do this once
            m.transparent = true;
            // leave depthWrite as-is to avoid changing your page/VFX behavior
            const base = typeof m.opacity === "number" ? m.opacity : 1;
            baseOpacityMap.current.set(m, base);
            inited.add(m);
          }

          const base = baseOpacityMap.current.get(m) ?? 1;
          const target = base * weight;
          // simple, uniform smoothing
          m.opacity = THREE.MathUtils.lerp(m.opacity ?? base, target, 0.22); // 0.18–0.28 to taste

          sum += m.opacity;
          n++;
        }

        if (n) {
          // optional: hide when fully faded to save a few draws (won’t pop)
          child.visible = sum / n > 0.02;
        }
      });
    }
    // Position the label relative to the flipbook
    if (labelAnchor.current && bookAnchor.current) {
      // book world position
      bookAnchor.current.getWorldPosition(_bookPos.current);
      // camera basis
      camera.getWorldDirection(_fwd.current).normalize(); // camera forward
      _up.current.copy(camera.up).normalize(); // world up of camera
      _right.current.crossVectors(_fwd.current, _up.current).normalize(); // camera right
      // distance-aware offsets so it looks good on any zoom
      const dist = camera.position.distanceTo(_bookPos.current);
      const offX = THREE.MathUtils.clamp(dist * 0.18, 0.25, 0.9); // right
      const offY = THREE.MathUtils.clamp(dist * 0.14, 0.22, 0.75); // up
      const offZ = THREE.MathUtils.clamp(dist * 0.1, 0.15, 0.5); // toward camera
      const labelNudgeRight = -1.9;
      const labelNudgeUp = 0.0;
      const labelNudgeFwd = 0.0;
      labelAnchor.current.position
        .copy(_bookPos.current)
        .addScaledVector(_right.current, offX + labelNudgeRight)
        .addScaledVector(_up.current, offY + labelNudgeUp)
        .addScaledVector(_fwd.current, -offZ + labelNudgeFwd);
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
    return () => window.removeEventListener("hashchange", handleHashChange);
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
          <group scale={isMobile ? 0.3 : 1} position-y={isMobile ? -0.7 : 0}>
            <Float
              floatIntensity={0.4}
              rotationIntensity={0.2}
              speed={2}
              floatingRange={[-0.05, 0.05]}
            >
              <Center disableY disableZ>
                <SectionTitle
                  size={isMobile ? 1.1 : 0.9}
                  position-x={isMobile ? 0.0 : 1.1}
                  position-y={isMobile ? 1.1 : 1.4}
                  position-z={-3}
                  bevelEnabled
                  bevelThickness={0.3}
                  rotation-x={isMobile ? -Math.PI / 20 : 0}
                >
                  {config.home.title}
                </SectionTitle>
              </Center>
            </Float>

            <Float
              floatIntensity={isMobile ? 0.4 : 0}
              rotationIntensity={isMobile ? 0.3 : 0}
              speed={2.1}
              floatingRange={[-0.05, 0.05]}
            >
              <Center disableY disableZ>
                <SectionTitle
                  ref={titleRef}
                  size={1.1}
                  position-z={-3}
                  position-y={isMobile ? -0.7 : -0.1}
                  bevelEnabled
                  bevelThickness={0.3}
                  rotation-y={isMobile ? 0 : Math.PI / 13}
                  rotation-x={isMobile ? -Math.PI / 20 : 0}
                >
                  {config.home.subtitle}
                </SectionTitle>
              </Center>
            </Float>
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
              {/* Target: wrap the actual FlipBook so the arrow locks to its pivot */}
              <group ref={bookAnchor}>
                <FlipBook setBookOpen={setBookOpen} />
              </group>

              {/* Source: keep the group mounted; only toggle the Html inside */}
              <group ref={labelAnchor}>
                {section === "experience" && !bookOpen && (
                  <Html
                    portal={{ current: scrollData.fixed }}
                    distanceFactor={8}
                    // avoid blocking pointer events; keep it purely informational
                    transform={false}
                  >
                    <div
                      className="flipbook-hint flipbook-hint--raised"
                      style={{ pointerEvents: "none" }}
                    >
                      Tap Flipbook To Open
                    </div>
                  </Html>
                )}
              </group>
            </Float>
            <group
              rotation-x={-Math.PI / 5}
              rotation-y={-Math.PI / 6.5}
              rotation-z={-Math.PI / 8}
            >
              {/* Animated arrow between labelAnchor (source) and bookAnchor (target) */}
              <FlipbookArrow
                fromRef={labelAnchor}
                toRef={bookAnchor}
                visible={section === "experience" && !bookOpen}
                curveBend={0.3}
                bendAxis="up"
                lineWidthPx={3}
                trimStart={0.42}
                trimEnd={0.44}
                highlightSpeed={1.1}
                toOffsetLocal={[-2.1, -0.7, 0.04]} // right, up, toward camera (LOCAL to flipbook)
                fromOffsetLocal={[0.5, 0.3, 0.0]} // adjust if the label anchor feels off
              />
            </group>
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
