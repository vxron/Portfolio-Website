// THIS FILE CREATES A TRAIL EFFECT ON A PARTICULAR TARGET REF

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/* SimpleTrail Function:
 ** Render trail mesh with plane geometry with number of segments equal to numPoints
 ** Update position of each segment (vertex of the plane) to follow the target
 ** Params:
 ** target: ref of the target <group> to follow
 ** intensity: emissive intensity
 ** numPoints: number of positions we will store in the trail (higher = longer trail)
 ** height: to adjust shape
 ** minDistance: minimum distance before adding a new point in trail
 ** opacity & color
 ** duration: time before the trail starts to fade from its end
 */
export function SimpleTrail({
  target = null,
  color = "#ffffff",
  intensity = 6,
  numPoints = 20,
  height = 0.42,
  minDistance = 0.1,
  opacity = 0.5,
  duration = 20,
}) {
  const mesh = useRef();

  // store all the positions of the target in an array
  const positions = useRef(
    new Array(numPoints).fill(new THREE.Vector3(0, 0, 0))
  );
  // when the target moves, add the new position to the front of the array
  useFrame(() => {
    if (!mesh.current || !target?.current) {
      return;
    }

    // positions of target group
    const curPoint = target.current.position;
    const lastPoint = positions.current[0];

    const distanceToLastPoint = lastPoint.distanceTo(target.current.position);

    if (distanceToLastPoint > minDistance) {
      // add current point to the front of the array with unshift
      positions.current.unshift(curPoint.clone());
      // pop last item so we always keep same numPoints in array (FIFO)
      positions.current.pop();
    }

    const geometry = mesh.current.geometry;
    const positionAttribute = geometry.getAttribute("position");
    // update the position of the vertices of the plane to follow the target
    for (let i = 0; i < numPoints; i++) {
      // start at end of array (queue arch)
      const point = positions.current[positions.current.length - 1 - i];
      // update 2 vertices of plane segment to move according to target point & with specified y height (give depth)
      positionAttribute.setXYZ(i * 2, point.x, point.y - height / 2, point.z);
      positionAttribute.setXYZ(
        i * 2 + 1,
        point.x,
        point.y + height / 2,
        point.z
      );
    }

    // tell Threejs that the position has been updated to re-render
    positionAttribute.needsUpdate = true;
  });

  return (
    <>
      <mesh ref={mesh}>
        <planeGeometry args={[1, 1, 1, numPoints - 1]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
