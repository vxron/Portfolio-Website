import React, { useEffect, useRef, useState } from "react";
import { useGraph } from "@react-three/fiber";
import { useGLTF, useFBX, useAnimations, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { useMobile } from "../hooks/useMobile";

export function Avatar({ hideAvatar, ...props }) {
  const { isMobile } = useMobile();
  const { nodes, materials } = useGLTF("/models/67a7f88926adc938cec34756.glb");
  const { animations: idleAnimation } = useFBX("/animations/Idle_V2.fbx");
  const { animations: walkingAnimation } = useFBX("/animations/Walking.fbx");

  const group = useRef();
  // Name animations (which are stored as single-item arrays) to differentiate them
  idleAnimation[0].name = "Idle";
  walkingAnimation[0].name = "Walking";

  // Create array of possible animations to apply to group (actions)
  const { actions } = useAnimations(
    [idleAnimation[0], walkingAnimation[0]],
    group
  );

  const [animation, setAnimation] = useState("Idle"); // Default Idle state
  // Play animation based on state
  useEffect(() => {
    if (!actions.Idle || !actions.Walking) return;

    const current = actions[animation];
    const previous = actions[animation === "Idle" ? "Walking" : "Idle"];

    current.reset().play();
    current.crossFadeFrom(previous, 0.5, true);

    return () => {
      previous?.fadeOut(0.5);
    };
  }, [animation, actions]);

  const scrollData = useScroll();
  // Store previous scroll to get distance between different scrolls (& use ref instead of state to avoid re-renders each time we update lastScroll value)
  const lastScroll = useRef(0);

  useFrame(() => {
    // Hide avatar when it should be hidden by making opacity 0
    if (!group.current) return;
    // Fade + depth-write guard to avoid silhouette on the book
    group.current.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const mats = Array.isArray(child.material)
        ? child.material
        : [child.material];
      mats.forEach((mat) => {
        // make sure we actually blend
        if (mat.transparent !== true) mat.transparent = true;

        const target = hideAvatar ? 0 : 1;
        const next = THREE.MathUtils.lerp(mat.opacity ?? 1, target, 0.12);
        mat.opacity = next;

        // don't write depth while hiding
        if (hideAvatar) {
          mat.depthWrite = false;
        } else {
          // re-enable once it's visible enough to act opaque again
          mat.depthWrite = next > 0.18;
        }
        if (next < 0.01) {
          mat.colorWrite = false;
          child.visible = false;
        } else {
          mat.colorWrite = true;
          child.visible = true;
        }
      });
    });

    // Get scroll delta btwn current scroll pos and last scroll pos
    const scrollDelta = scrollData.offset - lastScroll.current;
    let walkingDir = 0;
    // If we have scrolled fwd or backward, set animation state to walking
    if (Math.abs(scrollDelta) > 0.0001) {
      setAnimation("Walking");
      if (scrollDelta > 0) {
        // Moving forward
        walkingDir = isMobile ? Math.PI / 2 : 0;
      } else {
        // Moving backward
        walkingDir = isMobile ? -Math.PI / 2 : Math.PI;
      }
    } else {
      setAnimation("Idle");
    }
    // Set rotation of group about y (vertical) axis to the direction defined using a Lerp to transition gradually
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      walkingDir,
      0.08
    );
    lastScroll.current = scrollData.offset; // Update last scroll value
  });

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="Wolf3D_Hair"
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Top"
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Bottom"
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Footwear"
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Body"
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  );
}

// Good to preload resources
useGLTF.preload("/models/67a7f88926adc938cec34756.glb");
useFBX.preload("/animations/Idle.fbx");
useFBX.preload("/animations/Walking.fbx");
