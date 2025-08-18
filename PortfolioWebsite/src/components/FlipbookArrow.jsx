// FlipbookArrow.jsx
import { QuadraticBezierLine } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useMemo } from "react";

export default function FlipbookArrow({
  fromRef,
  toRef,
  visible = true,
  curveBend = 0.22,
  bendAxis = "right", // "right" | "up" | "forward"
  lineWidthPx = 3,
  trimStart = 0.2, // 0 = start exactly at label, 0.5 = halfway to target
  trimEnd = 0.1, // 0 = end exactly at flipbook, 0.5 = halfway back toward label
  highlightSpeed = 1.2,
  fromOffsetLocal = [0, 0, 0],
  toOffsetLocal = [0, 0, 0],
  maxWorldLength = Infinity, // optionally cap the length (in world units)
  debug = false,
}) {
  const { camera } = useThree();

  const base = useRef();
  const runner = useRef();
  const head = useRef();

  // world-space anchors
  const A = useRef(new THREE.Vector3()); // raw start (label)
  const B = useRef(new THREE.Vector3()); // raw end (flipbook)

  // trimmed segment
  const S = useRef(new THREE.Vector3()); // start after trimStart
  const E = useRef(new THREE.Vector3()); // end   after trimEnd
  const M = useRef(new THREE.Vector3()); // control point

  // camera basis & temps
  const F = useRef(new THREE.Vector3());
  const R = useRef(new THREE.Vector3());
  const U = useRef(new THREE.Vector3());
  const tmp = useRef(new THREE.Vector3());

  // cached local offsets
  const fromOff = useMemo(
    () => new THREE.Vector3(...fromOffsetLocal),
    [fromOffsetLocal[0], fromOffsetLocal[1], fromOffsetLocal[2]]
  );
  const toOff = useMemo(
    () => new THREE.Vector3(...toOffsetLocal),
    [toOffsetLocal[0], toOffsetLocal[1], toOffsetLocal[2]]
  );

  const toWorldWithOffset = (ref, local, out) => {
    if (!ref?.current) return out.set(0, 0, 0);
    out.copy(local);
    ref.current.localToWorld(out);
    return out;
  };

  useFrame((_, dt) => {
    if (!fromRef?.current || !toRef?.current) return;

    // 1) fetch anchors in world space (with local nudges)
    toWorldWithOffset(fromRef, fromOff, A.current);
    toWorldWithOffset(toRef, toOff, B.current);

    // 2) clamp trims and handle degenerate cases
    let t0 = THREE.MathUtils.clamp(trimStart, 0, 0.49);
    let t1 = THREE.MathUtils.clamp(trimEnd, 0, 0.49);

    const span = A.current.distanceTo(B.current);
    if (span < 1e-4) {
      // if anchors coincide, make a tiny span so math won’t collapse
      B.current.copy(A.current).addScalar(0.02);
      t0 = 0.2;
      t1 = 0.2;
    }

    // 3) compute trimmed endpoints along the A->B segment
    //    S = A + (B - A) * t0
    S.current.copy(B.current).sub(A.current).multiplyScalar(t0).add(A.current);
    //    E = B - (B - A) * t1  == B + (A - B) * t1
    E.current
      .copy(B.current)
      .sub(A.current)
      .multiplyScalar(1 - t1)
      .add(A.current);

    // Optional: hard-cap the length from the start side
    if (Number.isFinite(maxWorldLength)) {
      const curLen = S.current.distanceTo(E.current);
      if (curLen > maxWorldLength) {
        const dir = tmp.current.subVectors(E.current, S.current).normalize();
        S.current.copy(E.current).addScaledVector(dir, -maxWorldLength);
      }
    }

    // 4) control point bowed to the camera's right
    camera.getWorldDirection(F.current).normalize();
    U.current.copy(camera.up).normalize();
    R.current.crossVectors(F.current, U.current).normalize();

    const len = S.current.distanceTo(E.current);
    M.current.copy(S.current).add(E.current).multiplyScalar(0.5);
    const axis =
      bendAxis === "up"
        ? U.current
        : bendAxis === "forward"
        ? F.current
        : R.current;
    M.current.addScaledVector(axis, len * curveBend);

    // 5) update lines (use array form to avoid type/ref quirks)
    base.current?.setPoints(
      S.current.toArray(),
      E.current.toArray(),
      M.current.toArray()
    );
    if (runner.current) {
      runner.current.setPoints(
        S.current.toArray(),
        E.current.toArray(),
        M.current.toArray()
      );
      const mat = runner.current.material;
      if (mat?.dashed) mat.dashOffset -= dt * highlightSpeed;
    }

    // 6) orient arrow head toward the end
    if (head.current) {
      head.current.position.copy(E.current);
      const dir = tmp.current.subVectors(E.current, M.current).normalize();
      head.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir
      );
      head.current.position.addScaledVector(dir, 0.02);
    }
  });

  return (
    <group visible={visible} frustumCulled={false}>
      <QuadraticBezierLine
        ref={base}
        start={[0, 0, 0]}
        end={[0, 0, 0]}
        mid={[0, 0, 0]}
        color="#ff56c2"
        lineWidth={lineWidthPx}
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
      />
      <QuadraticBezierLine
        ref={runner}
        start={[0, 1, 0]}
        end={[0, 3, 0]}
        mid={[0, 2, 0]}
        color="#ff56c2"
        lineWidth={lineWidthPx + 0.5}
        dashed
        dashScale={1}
        dashSize={0.2}
        gapSize={0.25}
        transparent
        opacity={1}
        depthWrite={false}
        depthTest={false}
      />
      <mesh ref={head}>
        <coneGeometry args={[0.045, 0.11, 16]} />
        <meshStandardMaterial
          color="#ff56c2"
          emissive="#ff56c2"
          emissiveIntensity={0.35}
          transparent
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      {debug && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="lime" />
        </mesh>
      )}
    </group>
  );
}
