import { useRef, useEffect } from "react";
import { useGLTF, useFBX, useAnimations } from "@react-three/drei";

export function Tinkerbell(props) {
  const group = useRef();

  // Load static model
  const { scene, animations: glbAnimations } = useGLTF(
    "/models/TinkerBell.glb"
  );

  // Load wing animation
  const wingAnim = useFBX("/animations/TinkerBell.fbx");

  // Attach animation to group
  const { actions } = useAnimations([wingAnim.animations[0]], group);

  useEffect(() => {
    // Start wing animation
    if (actions && wingAnim.animations[0]) {
      const name = wingAnim.animations[0].name;
      actions[name]?.reset().fadeIn(0.5).play();
    }
  }, [actions, wingAnim]);

  return (
    <group ref={group} {...props}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/TinkerBell.glb");
useFBX.preload("/animations/TinkerBell.fbx");
