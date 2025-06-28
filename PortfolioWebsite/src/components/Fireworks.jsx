{
  /*
import { useEffect, useRef } from "react";
import { useFireworks } from "../hooks/useFireworks";

export const Fireworks = () => {
  const addFirework = useFireworks((state) => state.addFirework);
  const fireworks = useFireworks((state) => state.fireworks);

  useEffect(() => {
    console.log("Fireworks component mounted – adding firework");
    addFirework();
  }, [addFirework]);

  console.log("Current fireworks:", fireworks);

  return null;
};
*/
}

import { useFireworks } from "../hooks/useFireworks";
import { useRef, useState } from "react";
import { useCursor } from "@react-three/drei";

export const Fireworks = (props) => {
  const addFirework = useFireworks((state) => state.addFirework);
  const fireworks = useFireworks((state) => state.fireworks);
  const triggerRef = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  console.log(fireworks);
  return (
    <group {...props}>
      {/* Clickable Box to Start Fireworks */}
      <mesh
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          console.log("[FireworksSystem] Clicked — adding firework!");
          addFirework();
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </group>
  );
};
