/* eslint-disable react/display-name */
// RESPONSIBLE FOR SPAWNING PARTICLES FROM VFXPARTICLES COMPONENT
/**
 * Parameters:
 * emitter: name of emitter we want to use
 * settings:
 * duration: time it takes to emit ALL the particles (in seconds)
 * nbParticles: # particles to emit
 * spawnMode: time (gradual emission) or burst (all at once)
 * loop: boolean to determine if the emitter should emit particles indefinitely
 * delay: time to wait before starting to emit particles
 * colorStart: an array of colors. for each particle, a random color will be picked from this array
 * colorEnd: same as colorStart but for the end color (same as colorStart if empty)
 * particlesLifetime: an array of two values corresponding to min, max possible random lifetime of the particles
 * speed: an array of two values corresponding to min, max speed
 * size: min, max random size of particles
 * startPositionMin: min possible random position vector of particles
 * startPositionMax: max possible random pos vector
 * startRotationMin: min possible rotation vec
 * startRotationMax: max possible rotation vec
 * rotationSpeedMin: min possible rotation speed
 * rotationSpeedMax: max possible rotation speed
 * directionMin: min possible random direction vec
 * directionMax: max possible random direction vec
 */

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useVFX } from "../hooks/VFXStore";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Euler, Quaternion, Vector3 } from "three";
import { VFXBuilderEmitter } from "./VFXBuilder";

// Dummy variables to keep track of emitter world position
const worldPosition = new Vector3();
const worldQuaternion = new Quaternion();
const worldEuler = new Euler();
const worldRotation = new Euler();
const worldScale = new Vector3();

/* VFXEmitterSettings
 * type definition for VFXEmitter using JSDoc
 * (so that we don't have to open this file each time we need to know the settings from Experience.jsx)
 * MAKE SURE THEY MATCH SETTINGS BELOW
 */
/**
 * @typedef {Object} VFXEmitterSettings
 * @property {number} [duration=1]
 * @property {number} [nbParticles=1000]
 * @property {"time"|"burst"} [spawnMode="time"]
 * @property {boolean} [loop=false]
 * @property {number} [delay=0]
 * @property {string[]} [colorStart=["blue", "skyblue"]]
 * @property {string[]} [colorEnd=[]]
 * @property {[number, number]} [particlesLifetime=[0.5, 6]]
 * @property {[number, number]} [speed=[5, 20]]
 * @property {[number, number]} [size=[0.1, 1]]
 * @property {[number, number, number]} [startPositionMin=[-1, -1, -1]]
 * @property {[number, number, number]} [startPositionMax=[1, 1, 1]]
 * @property {[number, number, number]} [startRotationMin=[0, 0, 0]]
 * @property {[number, number, number]} [startRotationMax=[0, 0, 0]]
 * @property {[number, number, number]} [rotationSpeedMin=[0, 0, 0]]
 * @property {[number, number, number]} [rotationSpeedMax=[0, 0, 0]]
 * @property {[number, number, number]} [directionMin=[0, 0, 0]]
 * @property {[number, number, number]} [directionMax=[0, 0, 0]]
 */

/* VFXEmitterProps
 */
/**
 * @typedef {Object} VFXEmitterProps
 * @property {boolean} [debug]
 * @property {VFXEmitterSettings} [settings]
 * @property {string} emitter
 * @property {React.RefObject<THREE.Object3D>} [ref]
 */

/* Mark VFXEmitter as a React.FC that takes VFXEmitter as props
 */
/**
 * @type React.FC<VFXEmitterProps>
 */
export const VFXEmitter = forwardRef(
  ({ debug = false, emitter, settings = {}, ...props }, forwardedRef) => {
    const [
      {
        duration = 1,
        nbParticles = 1000,
        spawnMode = "time", // time or burst
        loop = false,
        delay = 0,
        colorStart = ["blue", "skyblue"],
        colorEnd = [],
        particlesLifetime = [0.5, 6],
        speed = [5, 20],
        size = [0.1, 1],
        startPositionMin = [-1, -1, -1],
        startPositionMax = [1, 1, 1],
        startRotationMin = [0, 0, 0],
        startRotationMax = [0, 0, 0],
        rotationSpeedMin = [0, 0, 0],
        rotationSpeedMax = [0, 0, 0],
        directionMin = [0, 0, 0],
        directionMax = [0, 0, 0],
      },
      setSettings,
    ] = useState(settings);

    const onRestart = useCallback(() => {
      emitted.current = 0;
      elapsedTime.current = 0;
    }, []);

    const emit = useVFX((state) => state.emit);
    const ref = useRef();
    useImperativeHandle(forwardedRef, () => ref.current);

    const emitted = useRef(0); // store the number of particles emitted so far
    const elapsedTime = useRef(0); // store the time elapsed since the emitter started

    useFrame(({ clock }, delta) => {
      const time = clock.elapsedTime;
      if (emitted.current < nbParticles || loop) {
        if (!ref) {
          return;
        }
        // decide on # particles to emit at once for burst vs time mode
        const particlesToEmit =
          spawnMode === "burst"
            ? nbParticles
            : Math.max(
                0,
                Math.floor(
                  ((elapsedTime.current - delay) / duration) * nbParticles
                )
              );
        // calculate rate of particles to emit
        const rate = particlesToEmit - emitted.current;
        if (rate > 0 && elapsedTime.current >= delay) {
          // passing callback function (setup) to emit as 3rd param
          emit(emitter, rate, () => {
            // decompose worldMatrix to get emitter's position, rotation, scale
            ref.current.updateWorldMatrix(true);
            const worldMatrix = ref.current.matrixWorld;
            worldMatrix.decompose(worldPosition, worldQuaternion, worldScale);
            worldEuler.setFromQuaternion(worldQuaternion);
            worldRotation.setFromQuaternion(worldQuaternion);

            // generate all the desired particle attributes
            const randSize = MathUtils.randFloat(size[0], size[1]);
            const color =
              colorStart[MathUtils.randInt(0, colorStart.length - 1)];
            return {
              // we use worldPosition to make particles follow emitter
              position: [
                worldPosition.x +
                  MathUtils.randFloat(startPositionMin[0], startPositionMax[0]),
                worldPosition.y +
                  MathUtils.randFloat(startPositionMin[1], startPositionMax[1]),
                worldPosition.z +
                  MathUtils.randFloat(startPositionMin[2], startPositionMax[2]),
              ],
              direction: [
                MathUtils.randFloat(directionMin[0], directionMax[0]),
                MathUtils.randFloat(directionMin[1], directionMax[1]),
                MathUtils.randFloat(directionMin[2], directionMax[2]),
              ],
              scale: [randSize, randSize, randSize],
              rotation: [
                MathUtils.randFloat(startRotationMin[0], startRotationMax[0]),
                MathUtils.randFloat(startRotationMin[1], startRotationMax[1]),
                MathUtils.randFloat(startRotationMin[2], startRotationMax[2]),
              ],
              rotationSpeed: [
                MathUtils.randFloat(rotationSpeedMin[0], rotationSpeedMax[0]),
                MathUtils.randFloat(rotationSpeedMin[1], rotationSpeedMax[1]),
                MathUtils.randFloat(rotationSpeedMin[2], rotationSpeedMax[2]),
              ],
              lifetime: [
                time, // must be of whole jsx experience for synchronization
                MathUtils.randFloat(particlesLifetime[0], particlesLifetime[1]),
              ],
              colorStart: color,
              colorEnd: colorEnd?.length
                ? colorEnd[MathUtils.randInt(0, colorEnd.length - 1)]
                : color,
              speed: [MathUtils.randFloat(speed[0], speed[1])],
            };
          });

          emitted.current += rate;
        }
      }
      elapsedTime.current += delta;
    });

    const settingsBuilder = useMemo(
      () =>
        debug ? (
          <VFXBuilderEmitter
            settings={settings}
            onChange={setSettings}
            onRestart={onRestart}
          />
        ) : null,
      [debug]
    );

    return (
      <>
        {settingsBuilder}
        <object3D {...props} ref={ref} />
      </>
    );
  }
);
