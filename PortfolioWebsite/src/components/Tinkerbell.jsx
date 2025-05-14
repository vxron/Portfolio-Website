import { useRef, useEffect } from "react";
import { useGLTF, useFBX, useTexture, useAnimations } from "@react-three/drei";

export function Tinkerbell(props) {
  const group = useRef();
  const { nodes, materials } = useGLTF("/models/TinkerBell.glb");
  const { animations } = useFBX("/animations/TinkerBell.fbx");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    console.log("Available materials:", Object.keys(materials));
  }, [materials]);
  useEffect(() => {
    console.log("Loaded node keys:", Object.keys(nodes));
  }, [nodes]);

  // Debugging stage lol
  if (!nodes || !nodes.Body) {
    console.warn("Tinkerbell nodes not ready or key missing");
    return null;
  }

  // Inline texture loading
  const dress = useTexture({
    map: "/textures/tinkerbell_dress_Material.003_BaseColor.png",
    displacementMap: "/textures/tinkerbell_dress_Material.003_Height.png",
    metalnessMap: "/textures/tinkerbell_dress_Material.003_Metallic.png",
    normalMap: "/textures/tinkerbell_dress_Material.003_Normal.png",
    roughnessMap: "/textures/tinkerbell_dress_Material.003_Roughness.png",
  });
  const hair = useTexture({
    map: "/textures/tinkerbell_hair_texture_Material.001_BaseColor.png",
    displacementMap:
      "/textures/tinkerbell_hair_texture_Material.001_Height.png",
    metalnessMap: "/textures/tinkerbell_hair_texture_Material.001_Metallic.png",
    normalMap: "/textures/tinkerbell_hair_texture_Material.001_Normal.png",
    roughnessMap:
      "/textures/tinkerbell_hair_texture_Material.001_Roughness.png",
  });
  const wings = useTexture({
    map: "/textures/tinkerbell_wings_Material.011_BaseColor.png",
    displacementMap: "/textures/tinkerbell_wings_Material.011_Height.png",
    metalnessMap: "/textures/tinkerbell_wings_Material.011_Metallic.png",
    normalMap: "/textures/tinkerbell_wings_Material.011_Normal.png",
    roughnessMap: "/textures/tinkerbell_wings_Material.011_Roughness.png",
  });
  const body = useTexture({
    map: "/textures/TinkerBellBody_Material.004_BaseColor.png",
    displacementMap: "/textures/TinkerBellBody_Material.004_Height.png",
    metalnessMap: "/textures/TinkerBellBody_Material.004_Metallic.png",
    normalMap: "/textures/TinkerBellBody_Material.004_Normal.png",
    roughnessMap: "/textures/TinkerBellBody_Material.004_Roughness.png",
  });
  const eyes = useTexture({
    map: "/textures/TinkerBellEyes_Material.010_BaseColor.png",
    displacementMap: "/textures/TinkerBellEyes_Material.010_Height.png",
    metalnessMap: "/textures/TinkerBellEyes_Material.010_Metallic.png",
    normalMap: "/textures/TinkerBellEyes_Material.010_Normal.png",
    roughnessMap: "/textures/TinkerBellEyes_Material.010_Roughness.png",
  });
  const lashes = useTexture({
    map: "/textures/TinkerBellLashes.png",
  });

  useEffect(() => {
    // Assign textures
    if (materials.Body) Object.assign(materials.Body, body);
    if (materials.Dress) Object.assign(materials.Dress, dress);
    if (materials.Hair) Object.assign(materials.Hair, hair);
    if (materials.WingTexture) Object.assign(materials.WingTexture, wings);
    if (materials.LeftEye) Object.assign(materials.LeftEye, eyes);
    if (materials.RightEye) Object.assign(materials.RightEye, eyes);
    if (materials.Eyelashes) Object.assign(materials.Eyelashes, lashes);

    // Animate wings
    if (actions["WingFlap"]) {
      actions["WingFlap"].setEffectiveTimeScale(0.5);
      actions["WingFlap"].play();
    }
  }, [dress, hair, wings, body, eyes, lashes, materials, actions]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={nodes.Body} />

      <skinnedMesh
        geometry={nodes.Body.geometry}
        material={materials.Body}
        skeleton={nodes.Body.skeleton}
      />

      <skinnedMesh
        geometry={nodes.Dress.geometry}
        material={materials.Dress}
        skeleton={nodes.Dress.skeleton}
      />
    </group>
  );
}

useGLTF.preload("/models/TinkerBell.glb");
useFBX.preload("/animations/TinkerBell.fbx");
