import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useMobile } from "../hooks/useMobile";

export default function ResponsiveScale({
  children,
  baseW = 6, // design width in world units
  baseH = 4, // design height in world units
  mult = useMobile ? 0.98 : 0.88, // overall zoom (lower = farther/“zoomed out”)
  clamp = [0.65, 1.25],
}) {
  const { viewport } = useThree();
  const group = useRef();

  useEffect(() => {
    const s = Math.min(viewport.width / baseW, viewport.height / baseH) * mult;
    const k = THREE.MathUtils.clamp(s, clamp[0], clamp[1]);
    group.current?.scale.setScalar(k);
  }, [viewport.width, viewport.height, baseW, baseH, mult, clamp]);

  return <group ref={group}>{children}</group>;
}
