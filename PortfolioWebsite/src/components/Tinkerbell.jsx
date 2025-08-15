import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  Suspense,
} from "react";
import { useGLTF, useFBX, useAnimations, Html } from "@react-three/drei";

export const Tinkerbell = forwardRef((props, ref) => {
  const group = useRef();
  const footRef = useRef(null);

  // Load assets
  const { scene } = useGLTF("/models/TinkerBellSmall.glb");
  const fbx = useFBX("/animations/TinkerBell.fbx");

  // Drive the FBX anim on the group (guard in case animations[0] is missing)
  const { actions } = useAnimations(fbx?.animations ?? [], group);
  useEffect(() => {
    const first = fbx?.animations?.[0];
    if (first && actions) actions[first.name]?.reset().fadeIn(0.5).play();
  }, [actions, fbx]);

  // Expose LeftShoe (if present) WITHOUT mounting it as a separate primitive
  useEffect(() => {
    if (!scene) return;
    const shoe = scene.getObjectByName("LeftShoe");
    footRef.current = shoe || null;
  }, [scene]);

  useImperativeHandle(ref, () => footRef.current, []);

  if (!scene) return null; // Suspense will handle fallback at parent

  return (
    <group ref={group} {...props}>
      <primitive object={scene} dispose={null} />
    </group>
  );
});

Tinkerbell.displayName = "Tinkerbell";
useGLTF.preload("/models/TinkerBellSmall.glb");
useFBX.preload("/animations/TinkerBell.fbx");
