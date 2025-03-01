import { useAtom } from "jotai";
import { projectAtom } from "./Interface";
import { useTexture } from "@react-three/drei";
import { config } from "../config";

export const MonitorScreen = ({ ...props }) => {
  // Access projectAtom (global var), no need for setter since we won't update it
  const [project] = useAtom(projectAtom);
  // UseTexture hook to use project image on monitor screen
  const projectTexture = useTexture(project.image);
  return (
    <group {...props}>
      <mesh>
        <planeGeometry args={[1.14, 0.66]} />
        <meshBasicMaterial map={projectTexture} />
      </mesh>
    </group>
  );
};

// Build loop to preload textures at beginning so they can show up without delay
// TODO: trying to make implementation where if project image src is not specified we don't try to preload
config.projects.forEach((project) => {
  useTexture.preload(project.image);
});
