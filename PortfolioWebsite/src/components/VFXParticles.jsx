// CREATES VFX ENGINE FOR REPEATED USE

import { useMemo, useRef, useEffect, useState } from "react";
import {
  Euler,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  Vector3,
  MathUtils,
  DynamicDrawUsage,
} from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { Color } from "three";

const tmpColor = new Color();
// Dummy variables to manipulate particles
const tmpPosition = new Vector3();
const tmpRotationEuler = new Euler();
const tmpRotation = new Quaternion();
const tmpScale = new Vector3(1, 1, 1);
const tmpMatrix = new Matrix4();

/* VFXParticles:
 * Will use InstancedMesh to create particles to render 3D shapes
 * InstancedMesh uses 4x4 matrix (pos, rotation, scale) for each particle
 * The InstancedMesh takes 3 props:
 * 1 - The geometry of the particles
 * 2 - The material of the particles
 * 3 - Number of instances the component can handle (max number of particles in a frame)
 */
export const VFXParticles = ({ settings = {} }) => {
  const { nbParticles = 1000 } = settings;
  const mesh = useRef();
  // Geometry that will be used for each particle
  const defaultGeometry = useMemo(() => new PlaneGeometry(0.5, 0.5), []);
  // Custom attributes for particles:
  // * useState to avoid re-creating at each render
  // * Float32Array stores the values of the attributes (size is #particles * #components of attribute)
  const [attributeArrays] = useState({
    instanceColor: new Float32Array(nbParticles * 3), // rgb
    instanceColorEnd: new Float32Array(nbParticles * 3),
    instanceDirection: new Float32Array(nbParticles * 3),
    instanceLifetime: new Float32Array(nbParticles * 2), // 1st value is the start time, 2nd is lifetime/duration
    instanceSpeed: new Float32Array(nbParticles * 1),
    instanceRotationSpeed: new Float32Array(nbParticles * 3),
  });

  // 'Emit' loops over the particles & sets a random pos, rotation & scale (instanceMatrix) + custom attributes
  const emit = (count) => {
    // Set particle attributes
    const instanceColor = mesh.current.geometry.getAttribute("instanceColor");
    const instanceColorEnd =
      mesh.current.geometry.getAttribute("instanceColorEnd");
    const instanceDirection =
      mesh.current.geometry.getAttribute("instanceDirection");
    const instanceLifetime =
      mesh.current.geometry.getAttribute("instanceLifetime");
    const instanceSpeed = mesh.current.geometry.getAttribute("instanceSpeed");
    const instanceRotationSpeed = mesh.current.geometry.getAttribute(
      "instanceRotationSpeed"
    );
    for (let i = 0; i < count; i++) {
      const position = [
        MathUtils.randFloatSpread(5),
        MathUtils.randFloatSpread(5),
        MathUtils.randFloatSpread(5),
      ];
      const scale = [
        MathUtils.randFloatSpread(1),
        MathUtils.randFloatSpread(1),
        MathUtils.randFloatSpread(1),
      ];
      const rotation = [
        MathUtils.randFloatSpread(Math.PI),
        MathUtils.randFloatSpread(Math.PI),
        MathUtils.randFloatSpread(Math.PI),
      ];
      // Compose design matrix for current particle index
      tmpPosition.set(...position);
      tmpRotationEuler.set(...rotation);
      tmpRotation.setFromEuler(tmpRotationEuler);
      tmpScale.set(...scale);
      tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
      mesh.current.setMatrixAt(i, tmpMatrix);

      // Set random color attribute for now for each particle
      tmpColor.setRGB(Math.random(), Math.random(), Math.random());
      instanceColor.set([tmpColor.r, tmpColor.g, tmpColor.b], i * 3);
      // All attributes
      tmpColor.setRGB(Math.random(), Math.random(), Math.random());
      instanceColorEnd.set([tmpColor.r, tmpColor.g, tmpColor.b], i * 3);

      const direction = [
        MathUtils.randFloatSpread(1),
        MathUtils.randFloatSpread(1),
        MathUtils.randFloatSpread(1),
      ];
      instanceDirection.set(direction, i * 3);

      const lifetime = [0.0, MathUtils.randFloat(1, 4)];
      instanceLifetime.set(lifetime, i * 2);

      const speed = MathUtils.randFloat(5, 20);
      instanceSpeed.set([speed], i);

      const rotationSpeed = [
        MathUtils.randFloatSpread(1),
        MathUtils.randFloatSpread(1),
        MathUtils.randFloatSpread(1),
      ];
      instanceRotationSpeed.set(rotationSpeed, i * 3);
    }
  };
  useEffect(() => {
    emit(nbParticles);
  }, []);

  useFrame(({ clock }) => {
    if (!mesh.current) {
      return;
    }
    // Update timer --> something wrong here
    console.log(mesh.current.material.uniforms.uTime);
    const mat = mesh.current.material;
    if (Array.isArray(mat) && mat[0]?.uniforms?.uTime) {
      mat[0].uniforms.uTime.value = clock.elapsedTime;
    } else if (mat?.uniforms?.uTime) {
      mat.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <>
      <instancedMesh args={[defaultGeometry, null, nbParticles]} ref={mesh}>
        <particlesMaterial color="orange" />
        <instancedBufferAttribute
          attach={"geometry-attributes-instanceColor"}
          args={[attributeArrays.instanceColor]}
          itemSize={3}
          count={nbParticles}
          usage={DynamicDrawUsage}
        />
        <instancedBufferAttribute
          attach={"geometry-attributes-instanceColorEnd"}
          args={[attributeArrays.instanceColorEnd]}
          itemSize={3}
          count={nbParticles}
          usage={DynamicDrawUsage}
        />
        <instancedBufferAttribute
          attach={"geometry-attributes-instanceDirection"}
          args={[attributeArrays.instanceDirection]}
          itemSize={3}
          count={nbParticles}
          usage={DynamicDrawUsage}
        />
        <instancedBufferAttribute
          attach={"geometry-attributes-instanceLifetime"}
          args={[attributeArrays.instanceLifetime]}
          itemSize={2}
          count={nbParticles}
          usage={DynamicDrawUsage}
        />
        <instancedBufferAttribute
          attach={"geometry-attributes-instanceSpeed"}
          args={[attributeArrays.instanceSpeed]}
          itemSize={1}
          count={nbParticles}
          usage={DynamicDrawUsage}
        />
        <instancedBufferAttribute
          attach={"geometry-attributes-instanceRotationSpeed"}
          args={[attributeArrays.instanceRotationSpeed]}
          itemSize={3}
          count={nbParticles}
          usage={DynamicDrawUsage}
        />
      </instancedMesh>
    </>
  );
};

// Custom Shader Material for custom attributes (instanceMatrix for each particle)
// (instanceMatrix is built in attribute of the WebGLProgram when using instancing)
// * uTime uniform : prop to pass the elapsed time; lets us calculate age & progress
const ParticlesMaterial = shaderMaterial(
  {
    uTime: 0,
  },
  /* glsl */ `
uniform float uTime;

varying vec2 vUv;
varying vec3 vColor;
varying vec3 vColorEnd;
varying float vProgress;

attribute float instanceSpeed;
attribute vec3 instanceRotationSpeed;
attribute vec3 instanceDirection;
attribute vec3 instanceColor;
attribute vec3 instanceColorEnd;
attribute vec2 instanceLifetime; // x: startTime, y: duration

void main() {
  float startTime = instanceLifetime.x;
  float duration = instanceLifetime.y;
  float age = uTime - startTime;
  vProgress = age / duration;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(instanceMatrix * vec4(position, 1.0));

  vUv = uv;
  vColor = instanceColor;
  vColorEnd = instanceColorEnd;
}
`,
  /* glsl */ `
varying vec3 vColor;
varying vec3 vColorEnd;
varying float vProgress;
varying vec2 vUv;


void main() {
  if (vProgress < 0.0 || vProgress > 1.0) {
    discard;
  }
  vec3 finalColor = mix(vColor, vColorEnd, vProgress);
  gl_FragColor = vec4(finalColor, 1.0);
}
`
);
// * discard used to prevent unborn and dead particles from being rendered

extend({ ParticlesMaterial });
