import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useGLTF, useFBX, useAnimations } from "@react-three/drei";

export const Tinkerbell = forwardRef((props, ref) => {
  const group = useRef();
  // Ref to Tinkerbell's foot for trail in future (todo)
  const footRef = useRef();

  // Load the model and animations
  const gltf = useGLTF("/models/TinkerBellSmall.glb");
  const fbx = useFBX("/animations/TinkerBell.fbx");

  // Attach FBX animation to the GLB model
  const { actions } = useAnimations([fbx.animations[0]], group);

  useEffect(() => {
    const name = fbx.animations[0]?.name;
    if (actions && name) {
      actions[name]?.reset().fadeIn(0.5).play();
    }
  }, [actions, fbx]);

  // Expose the foot ref to parent
  useImperativeHandle(ref, () => footRef.current);

  return (
    <group ref={group} {...props}>
      <primitive object={gltf.scene} />
      <primitive
        object={gltf.scene.getObjectByName("LeftShoe")}
        ref={footRef}
      />
    </group>
  );
});

// Preload assets
useGLTF.preload("/models/TinkerBellSmall.glb");
useFBX.preload("/animations/TinkerBell.fbx");
Tinkerbell.displayName = "Tinkerbell";
