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

export const Experience = () => {
  // useMobile hook for responsiveness
  const { isMobile, scaleFactor } = useMobile();
  // State machine for revealing/hiding sections (starting at home page)
  const [section, setSection] = useState(config.sections[0]);
  useEffect(() => {
    // tell the menu which section is active
    window.dispatchEvent(
      new CustomEvent("sectionChange", { detail: { section } })
    );
  }, [section]);
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

  const emitterBlue = useRef();
  const emitterRed = useRef();
  const alphaMap = useTexture("textures/Particles/symbol_02.png");

  const sectionOpacity = useRef(
    Object.fromEntries(
      config.sections.map((section_name) => [
        section_name,
        section_name == section ? 1 : 0,
      ])
    )
  );

  // Snap settings
  const snapping = useRef(false);
  const snapToRef = useRef((i) => {});

  // ---- Disable browser scroll restoration (prevents landing mid-scroll) ----
  useEffect(() => {
    const prev = history.scrollRestoration;
    try {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
    } catch {}
    return () => {
      try {
        history.scrollRestoration = prev || "auto";
      } catch {}
    };
  }, []);

  // Animate sceneContainer group to move through different sections
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;

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

    if (isMobile) {
      sceneContainer.current.position.x =
        -scrollData.offset * SECTION_DISTANCE * (scrollData.pages - 1);
      sceneContainer.current.position.z = 0;
    } else {
      sceneContainer.current.position.z =
        -scrollData.offset * SECTION_DISTANCE * (scrollData.pages - 1);
      sceneContainer.current.position.x = 0;
    }

    const rawT = scrollData.offset * (scrollData.pages - 1);
    tRef.current = THREE.MathUtils.lerp(tRef.current, rawT, 0.15);
    const t = tRef.current;

    const activeIdx = Math.round(t);
    setSection(config.sections[activeIdx]);

    const CROSSFADE_RADIUS = 0.65;
    sectionOpacity.current = Object.fromEntries(
      config.sections.map((name, i) => {
        const d = Math.abs(t - i);
        const lin = Math.max(0, 1 - d / CROSSFADE_RADIUS);
        const w = lin * lin * (3 - 2 * lin);
        return [name, w];
      })
    );

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
            m.transparent = true;
            const base = typeof m.opacity === "number" ? m.opacity : 1;
            baseOpacityMap.current.set(m, base);
            inited.add(m);
          }
          const base = baseOpacityMap.current.get(m) ?? 1;
          const target = base * weight;
          m.opacity = THREE.MathUtils.lerp(m.opacity ?? base, target, 0.22);
          sum += m.opacity;
          n++;
        }
        if (n) child.visible = sum / n > 0.02;
      });
    }

    // label anchor placement
    if (labelAnchor.current && bookAnchor.current) {
      bookAnchor.current.getWorldPosition(_bookPos.current);
      camera.getWorldDirection(_fwd.current).normalize();
      _up.current.copy(camera.up).normalize();
      _right.current.crossVectors(_fwd.current, _up.current).normalize();
      const dist = camera.position.distanceTo(_bookPos.current);
      const offX = THREE.MathUtils.clamp(dist * 0.18, 0.25, 0.9);
      const offY = THREE.MathUtils.clamp(dist * 0.14, 0.22, 0.75);
      const offZ = THREE.MathUtils.clamp(dist * 0.1, 0.15, 0.5);
      const labelNudgeRight = -1.8;
      const labelNudgeUp = isMobile ? 2.3 : 0.18;
      const labelNudgeFwd = 0.1;
      labelAnchor.current.position
        .copy(_bookPos.current)
        .addScaledVector(_right.current, offX + labelNudgeRight)
        .addScaledVector(_up.current, offY + labelNudgeUp)
        .addScaledVector(_fwd.current, -offZ + labelNudgeFwd);
    }
  });

  // --- Snapping input + initial grace period ---
  useEffect(() => {
    const el = scrollData.el;
    if (!el) return;

    const totalPages = config.sections.length;
    const maxIdx = totalPages - 1;

    // tuneables
    const SNAP_DURATION = 0.75;
    const SNAP_EASE = "power2.out";
    const INITIAL_GRACE_MS = 2000; // ignore ghost wheel at load
    const COOLDOWN_MS = 160; // after each snap
    const FENCE_GRACE_MS = 280; // extra grace after pane scroll
    const MIN_WHEEL_UNITS = 160;
    const MIN_SWIPE_PX = 28;

    // helpers
    const getFenceEl = (target) =>
      target instanceof Element ? target.closest("[data-scroll-fence]") : null;

    // state
    const wheelAccum = { val: 0 };
    const touchAccum = { val: 0 };
    const coolUntil = { t: performance.now() + INITIAL_GRACE_MS };

    const indexToScrollTop = (idx) => {
      const span = el.scrollHeight - el.clientHeight;
      if (span <= 0) return 0;
      return (idx / (totalPages - 1)) * span;
    };

    // force to page 0 on mount if no hash
    let raf1 = 0,
      raf2 = 0;
    if (!window.location.hash) {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          gsap.killTweensOf(el);
          gsap.set(el, { scrollTop: indexToScrollTop(0) });
        });
      });
    }

    const snapTo = (idx, duration = SNAP_DURATION) => {
      idx = THREE.MathUtils.clamp(idx, 0, maxIdx);
      snapping.current = true;
      gsap.killTweensOf(el);
      gsap.to(el, {
        scrollTop: indexToScrollTop(idx),
        duration,
        ease: SNAP_EASE,
        onComplete: () => {
          snapping.current = false;
          coolUntil.t = performance.now() + COOLDOWN_MS;
          wheelAccum.val = 0;
          touchAccum.val = 0;
        },
      });
    };
    snapToRef.current = snapTo;

    const armCooldown = () => {
      coolUntil.t = performance.now() + 500;
      wheelAccum.val = 0;
      touchAccum.val = 0;
    };
    window.addEventListener("focus", armCooldown);
    const onVis = () => {
      if (document.visibilityState === "visible") armCooldown();
    };
    document.addEventListener("visibilitychange", onVis);

    // ====== LISTENERS ======

    // WHEEL
    const onWheel = (e) => {
      // If this wheel started inside a fenced pane, never snap pages.
      // Also arm a short grace so residual momentum outside the pane doesn't snap.
      if (getFenceEl(e.target)) {
        coolUntil.t = Math.max(coolUntil.t, performance.now() + FENCE_GRACE_MS);
        return; // let the pane scroll naturally
      }

      const now = performance.now();
      if (snapping.current || now < coolUntil.t) {
        e.preventDefault();
        e.stopImmediatePropagation?.();
        return;
      }

      const dy = e.deltaY || e.deltaX || 0;
      if (!dy) return;

      wheelAccum.val += dy;
      if (Math.abs(wheelAccum.val) < MIN_WHEEL_UNITS) {
        e.preventDefault();
        e.stopImmediatePropagation?.();
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation?.();

      const dir = Math.sign(wheelAccum.val);
      wheelAccum.val = 0;

      const idxNow = Math.round(scrollData.offset * (totalPages - 1));
      const next = THREE.MathUtils.clamp(
        idxNow + (dir > 0 ? 1 : -1),
        0,
        maxIdx
      );
      if (next !== idxNow) snapTo(next);
    };

    // TOUCH
    const touchState = { x0: 0, y0: 0, fenceEl: null };
    const onTouchStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      touchState.x0 = t.clientX;
      touchState.y0 = t.clientY;
      touchState.fenceEl = getFenceEl(e.target) || null;
      if (touchState.fenceEl) {
        coolUntil.t = Math.max(coolUntil.t, performance.now() + FENCE_GRACE_MS);
      }
      touchAccum.val = 0;
    };

    const onTouchMove = (e) => {
      const t = e.touches?.[0];
      if (!t) return;

      // Any gesture that began inside a fence: never page-snap.
      if (touchState.fenceEl) {
        // keep extending grace while the user is still moving inside the pane
        coolUntil.t = Math.max(coolUntil.t, performance.now() + FENCE_GRACE_MS);
        return;
      }

      const now = performance.now();
      if (snapping.current || now < coolUntil.t) {
        e.preventDefault();
        e.stopImmediatePropagation?.();
        return;
      }

      const dy = touchState.y0 - t.clientY;
      touchState.x0 = t.clientX;
      touchState.y0 = t.clientY;

      touchAccum.val += dy;
      if (Math.abs(touchAccum.val) < MIN_SWIPE_PX) return;

      e.preventDefault();
      e.stopImmediatePropagation?.();

      const dir = Math.sign(touchAccum.val);
      touchAccum.val = 0;

      const idxNow = Math.round(scrollData.offset * (totalPages - 1));
      const next = THREE.MathUtils.clamp(
        idxNow + (dir > 0 ? 1 : -1),
        0,
        maxIdx
      );
      if (next !== idxNow) snapTo(next);
    };

    const onTouchEnd = () => {
      if (touchState.fenceEl) {
        // after lifting the finger, still swallow momentum briefly
        coolUntil.t = Math.max(coolUntil.t, performance.now() + FENCE_GRACE_MS);
        touchState.fenceEl = null;
      }
    };

    // capture:true beats ScrollControls; passive:false so preventDefault works
    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    el.addEventListener("touchstart", onTouchStart, {
      passive: true,
      capture: true,
    });
    el.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });
    el.addEventListener("touchend", onTouchEnd, {
      passive: true,
      capture: true,
    });

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      el.removeEventListener("wheel", onWheel, true);
      el.removeEventListener("touchstart", onTouchStart, true);
      el.removeEventListener("touchmove", onTouchMove, true);
      el.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("focus", armCooldown);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [scrollData.el, config.sections.length]);

  // Hash navigation -> snap (works with the exposed snapToRef)
  useEffect(() => {
    const handleHashChange = () => {
      const idx = config.sections.indexOf(
        window.location.hash.replace("#", "")
      );
      if (idx >= 0) snapToRef.current(idx, 0.6);
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [config.sections.length]);

  return (
    <>
      <Environment preset="sunset" />
      <Avatar
        hideAvatar={
          (section === "projects" && !isMobile) ||
          (section === "experience" && bookOpen)
        }
        position-z={isMobile ? -1.8 : 0}
        scale={isMobile ? 1.1 : 1}
        position-x={-0.05}
      />
      {/* Projects hint (MOBILE): anchored just under the avatar */}
      {section === "projects" && isMobile && (
        <group position-x={-0.05} position-z={-1.8} position-y={-0.3}>
          <Html
            portal={{ current: scrollData.fixed }}
            distanceFactor={8}
            transform={false}
            center
          >
            <div className="projects-hint projects-hint--mobile">
              Tap &amp; scroll projects L/R for more info
            </div>
          </Html>
        </group>
      )}

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
          <group position={[0, 1, 0.5]}>
            <Float
              rotation-x={-Math.PI / 7}
              floatIntensity={0.5}
              speed={2}
              rotationIntensity={1}
            >
              <group ref={bookAnchor}>
                <FlipBook setBookOpen={setBookOpen} />
              </group>

              <group ref={labelAnchor}>
                {section === "experience" && !bookOpen && (
                  <Html
                    portal={{ current: scrollData.fixed }}
                    distanceFactor={8}
                    transform={false}
                  >
                    <div
                      className="flipbook-hint"
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
              <FlipbookArrow
                fromRef={labelAnchor}
                toRef={bookAnchor}
                visible={section === "experience" && !bookOpen}
                curveBend={isMobile ? 0.75 : 0.3}
                bendAxis="up"
                lineWidthPx={isMobile ? 2.2 : 3}
                trimStart={isMobile ? 0.3 : 0.41}
                trimEnd={isMobile ? 0.2 : 0.45}
                highlightSpeed={isMobile ? 0.9 : 1.1}
                toOffsetLocal={isMobile ? [-6, 2.5, 1.58] : [-2.1, -0.45, 0.42]}
                fromOffsetLocal={isMobile ? [-3, 4.5, 1.52] : [0.5, 0.3, 0.36]}
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
              {/* DESKTOP projects hint: anchored above the 3D element */}
              {section === "projects" && !isMobile && (
                <group position={[0.05, 2.75, -0.8]}>
                  <Html
                    portal={{ current: scrollData.fixed }}
                    distanceFactor={8}
                    transform={false}
                    center
                  >
                    <div className="projects-hint projects-hint--desktop">
                      Tap &amp; Scroll Projects for More Info
                    </div>
                  </Html>
                </group>
              )}
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
              nbParticles: 10000,
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
              nbParticles: 4000,
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
              nbParticles: 6000,
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
