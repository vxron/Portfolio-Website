// CREATES VFX ENGINE FOR REPEATED USE

import { useMemo, useRef, useEffect, useState } from "react";
import {
  Euler,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  Vector3,
  DynamicDrawUsage,
  AdditiveBlending,
} from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { Color } from "three";
import { useVFX } from "../hooks/VFXStore";

// Dummy variables to manipulate particles
const tmpPosition = new Vector3();
const tmpRotationEuler = new Euler();
const tmpRotation = new Quaternion();
const tmpScale = new Vector3(1, 1, 1);
const tmpMatrix = new Matrix4();
const tmpColor = new Color();

/* VFXParticles:
 * Will use InstancedMesh to create particles to render 3D shapes
 * InstancedMesh uses 4x4 matrix (pos, rotation, scale) for each particle
 * The InstancedMesh takes 3 props:
 * 1 - The geometry of the particles
 * 2 - The material of the particles
 * 3 - Number of instances the component can handle (max number of particles in a frame)
 */

/**
 * @typedef {Object} VFXParticlesSettings
 * @property {number} [nbParticles=1000]
 * @property {number} [intensity=1]
 * @property {"billboard"|"mesh"} [renderMode="mesh"]
 * @property {[number, number]} [fadeSize=[0.1, 0.9]]
 * @property {[number, number]} [fadeAlpha=[0, 1.0]]
 */

/**
 * @typedef {Object} VFXParticlesProps
 * @property {string} name
 * @property {React.ReactElement} [geometry]
 * @property {THREE.Texture} [alphaMap]
 * @property {VFXParticlesSettings} settings
 */

/**
 * @type React.FC<VFXParticlesProps>
 */
export const VFXParticles = ({
  name,
  settings = {},
  alphaMap,
  geometry,
  ...props
}) => {
  // Part of VFXStore
  const registerEmitter = useVFX((state) => state.registerEmitter);
  const unregisterEmitter = useVFX((state) => state.unregisterEmitter);
  const {
    nbParticles = 1000,
    intensity = 1.2,
    renderMode = "mesh", // mesh vs Billboard (all particles face camera)
    fadeSize = [0, 0], // from when in lifetime particles will start to fade in, and when they start to fade out
    fadeAlpha = [0, 1], // opacity of fade
  } = settings;
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
    instanceRotationSpeed: new Float32Array(nbParticles * 3), // speed per rot axis
  });
  // Cursor to track where we are in buffer attriute (which particle)
  const cursor = useRef(0);
  // keep track of which attributes need update
  const lastCursor = useRef(0);
  const needUpdate = useRef(false);

  // 'Emit' loops over the particles & sets a random pos, rotation & scale (instanceMatrix) + custom attributes
  // Takes a callback function 'setup' to call the random generation particle settings within VFXEmitter component
  // (setup will be called for each particle emitted so that they can have unique settings)
  const emit = (count, setup) => {
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
      if (cursor.current >= nbParticles) {
        // if we spawn more than max number of particles, start cursor back to 0 (overwrite)
        cursor.current = 0;
      }
      // callback setup function for each emitted particle to get all data settings
      const {
        scale,
        rotation,
        rotationSpeed,
        position,
        direction,
        lifetime,
        colorStart,
        colorEnd,
        speed,
      } = setup();

      // Compose design matrix for current particle index
      tmpPosition.set(...position);
      tmpRotationEuler.set(...rotation);
      tmpRotation.setFromEuler(tmpRotationEuler);
      tmpScale.set(...scale);
      tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
      //mesh.current.setMatrixAt(i, tmpMatrix);
      mesh.current.setMatrixAt(cursor.current, tmpMatrix);

      // Set particle attributes to definitions in VFXEmitter
      tmpColor.setStyle(colorStart);
      instanceColor.set(
        [tmpColor.r, tmpColor.g, tmpColor.b],
        cursor.current * 3
      );
      tmpColor.setStyle(colorEnd);
      instanceColorEnd.set(
        [tmpColor.r, tmpColor.g, tmpColor.b],
        cursor.current * 3
      );
      instanceRotationSpeed.set(rotationSpeed, cursor.current * 3);
      instanceLifetime.set(lifetime, cursor.current * 2);
      instanceSpeed.set(speed, cursor.current);
      instanceDirection.set(direction, cursor.current * 3);

      cursor.current++;
      cursor.current = cursor.current % nbParticles;
    }

    // tell renderer that buffer attributes have been updated from VFXEmitter
    /*mesh.current.instanceMatrix.needsUpdate = true;
    instanceColor.needsUpdate = true;
    instanceColorEnd.needsUpdate = true;
    instanceDirection.needsUpdate = true;
    instanceLifetime.needsUpdate = true;
    instanceSpeed.needsUpdate = true;
    instanceRotationSpeed.needsUpdate = true;*/
    needUpdate.current = true; // because we emitted particles
  };
  useEffect(() => {
    //emit(nbParticles);
    registerEmitter(name, emit); // register emitter when component mounts
    return () => {
      unregisterEmitter(name); // unregister emitter when it unmounts
    };
  }, []);

  // need CPU to keep track of time attribute w clock
  useFrame(({ clock }) => {
    if (!mesh.current) {
      return;
    }
    mesh.current.material.uniforms.uIntensity.value = intensity;
    mesh.current.material.uniforms.uFadeSize.value = fadeSize;
    mesh.current.material.uniforms.uFadeAlpha.value = fadeAlpha;
    // Update timer --> something wrong here
    console.log(mesh.current.material.uniforms.uTime);
    const mat = mesh.current.material;
    if (Array.isArray(mat) && mat[0]?.uniforms?.uTime) {
      console.log("entered first if");
      mat[0].uniforms.uTime.value = clock.elapsedTime;
    } else if (mat?.uniforms?.uTime) {
      console.log("entered else if");
      mat.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  // decide range of attributes requiring update
  const onBeforeRender = () => {
    if (!needUpdate.current || !mesh.current) {
      return;
    }
    const attributes = [
      mesh.current.instanceMatrix,
      mesh.current.geometry.getAttribute("instanceColor"),
      mesh.current.geometry.getAttribute("instanceColorEnd"),
      mesh.current.geometry.getAttribute("instanceDirection"),
      mesh.current.geometry.getAttribute("instanceLifetime"),
      mesh.current.geometry.getAttribute("instanceSpeed"),
      mesh.current.geometry.getAttribute("instanceRotationSpeed"),
    ];
    attributes.forEach((attribute) => {
      attribute.clearUpdateRanges();
      // if lastCursor is above current, it means we went back to 0 (i.e. need update)
      if (lastCursor.current > cursor.current) {
        // add update range from 0 to cursor
        attribute.addUpdateRange(0, cursor.current * attribute.itemSize);
        // add update range from lastCursor.current to end of array
        attribute.addUpdateRange(
          lastCursor.current * attribute.itemSize,
          nbParticles * attribute.itemSize -
            lastCursor.current * attribute.itemSize
        );
      } else {
        attribute.addUpdateRange(
          lastCursor.current * attribute.itemSize,
          cursor.current * attribute.itemSize -
            lastCursor.current * attribute.itemSize
        );
      }
      attribute.needsUpdate = true; // will only update on defined range
    });
    // reset
    lastCursor.current = cursor.current;
    needUpdate.current = false;
  };

  return (
    <group {...props}>
      <instancedMesh
        args={[defaultGeometry, null, nbParticles]}
        ref={mesh}
        onBeforeRender={onBeforeRender}
      >
        {geometry}
        <particlesMaterial
          transparent
          depthWrite={false}
          alphaMap={alphaMap}
          defines={{
            BILLBOARD_MODE: renderMode === "billboard",
            MESH_MODE: renderMode === "mesh",
          }}
        />
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
    </group>
  );
};

// Custom Shader Material for custom attributes (instanceMatrix for each particle)
// (instanceMatrix is built in attribute of the WebGLProgram when using instancing)
// * uTime uniform : prop to pass the elapsed time; lets us calculate age & progress
const ParticlesMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1,
    uFadeSize: [0.1, 0.9],
    uFadeAlpha: [0, 1.0],
    alphaMap: null,
  },
  /* glsl VERTEX SHADER */ `
mat4 rotationX(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat4(
      1,  0,  0,  0,
      0,  c, -s,  0,
      0,  s,  c,  0,
      0,  0,  0,  1
  );
}

mat4 rotationY(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat4(
       c,  0,  s,  0,
       0,  1,  0,  0,
      -s,  0,  c,  0,
       0,  0,  0,  1
  );
}

mat4 rotationZ(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat4(
      c, -s,  0,  0,
      s,  c,  0,  0,
      0,  0,  1,  0,
      0,  0,  0,  1
  );
}

uniform float uTime;
uniform vec2 uFadeSize;

varying vec2 vUv;
varying vec3 vColor;
varying vec3 vColorEnd;
varying float vProgress; // between 0 and 1 
varying float vAge;
varying float vDuration;

attribute float instanceSpeed;
attribute vec3 instanceRotationSpeed;
attribute vec3 instanceDirection;
attribute vec3 instanceColor;
attribute vec3 instanceColorEnd;
attribute vec2 instanceLifetime; // x: startTime, y: duration

// ensure particles always face camera
vec3 billboard(vec2 v, mat4 view) {
  vec3 up = vec3(view[0][1], view[1][1], view[2][1]);
  vec3 right = vec3(view[0][0], view[1][0], view[2][0]);
  vec3 p = right * v.x + up * v.y;
  return p;
}

void main() {
  float startTime = instanceLifetime.x; 
  float duration = instanceLifetime.y;
  float age = uTime - startTime;
  vProgress = age / duration;
  vAge = age;
  vDuration = duration;
  // stop processing unborn/dead particles asap (position 9999 hella far from camera hehe)
  if (vProgress < 0.0 || vProgress > 1.0) {
    gl_Position = vec4(vec3(9999.0), 1.0);
    return;
  }

  // calculate scale for fade in/out
  float scale = smoothstep(0.0, uFadeSize.x, vProgress) * smoothstep(1.01, uFadeSize.y, vProgress);

  vec3 normalizedDirection = length(instanceDirection) > 0.0 ? normalize(instanceDirection) : vec3(0.0); // normalize to avoid particles moving faster when dir is not a unit vec
  vec3 offset = normalizedDirection * age * instanceSpeed; // calc particle offset based on age and speed

  vec3 rotationSpeed = instanceRotationSpeed * age;
  mat4 rotX = rotationX(rotationSpeed.x);
  mat4 rotY = rotationY(rotationSpeed.y);
  mat4 rotZ = rotationZ(rotationSpeed.z);
  mat4 rotationMatrix = rotZ * rotY * rotX;

  vec4 startPosition = modelMatrix * instanceMatrix * rotationMatrix * vec4(position, 1.0);
  vec3 instancePosition = startPosition.xyz;

  vec3 finalPosition = instancePosition + offset; // get final pos by applying offset
  vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0); 
#ifdef MESH_MODE
  /* Mesh Mode */
    vec4 startPosition = modelMatrix * instanceMatrix * rotationMatrix * vec4(position * scale, 1.0);

    vec3 instancePosition = startPosition.xyz;

    vec3 finalPosition = instancePosition + offset;
    mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
#endif

#ifdef BILLBOARD_MODE
  /* Billboard Mode */
    vec4 localPos = vec4(position, 1.0);
    localPos.xyz = billboard(position.xy, viewMatrix) * scale; // transform to make particles always face camera

    vec4 worldPos = modelMatrix * instanceMatrix * rotationMatrix * localPos;
    worldPos.xyz += offset; // Apply offset (particle pos) in world space
    mvPosition = modelViewMatrix * worldPos;
#endif
  
  gl_Position = projectionMatrix * mvPosition; // transform world pos to camera space
  
  vUv = uv;
  vColor = instanceColor;
  vColorEnd = instanceColorEnd;
}
`,
  /* glsl FRAGMENT SHADER */ `
varying vec2 vUv;
varying vec3 vColor;
varying vec3 vColorEnd;
varying float vProgress;
varying float vAge;
varying float vDuration;
uniform float uIntensity;
uniform vec2 uFadeAlpha;
uniform sampler2D alphaMap;

void main() {
  if (vProgress < 0.0 || vProgress > 1.0) {
    discard; // discard used to prevent unborn and dead particles from being rendered
  }
  vec3 finalColor = mix(vColor, vColorEnd, vProgress);

  // calculate fade in / fade out
  float alpha = smoothstep(0.0, uFadeAlpha.x, vProgress) * smoothstep(1.01, uFadeAlpha.y, vProgress);

  finalColor *= uIntensity;

// use alphamap if we have custom texture for particles
#ifdef USE_ALPHAMAP
    vec2 uv = vUv;
    vec4 tex = texture2D(alphaMap, uv);
    gl_FragColor = vec4(finalColor, tex.a * alpha);
#else
    gl_FragColor = vec4(finalColor, alpha);
#endif
}`
);

extend({ ParticlesMaterial });
