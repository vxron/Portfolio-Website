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

import { forwardRef, useImperativeHandle, useRef } from "react";
import { useVFX } from "../hooks/VFXStore";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";

// fwd ref & imperative handle to expose the ref of the object3D component to the parent (manipulate VFXEmitter from the parent)
export const VFXEmitter = forwardRef(
  ({ emitter, settings = {}, ...props }, forwardedRef) => {
    const {
      duration = 1,
      nbParticles = 1000,
      spawnMode = "time", // time or burst
      loop = false,
      delay = 0,
      colorStart = ["white", "skyblue"],
      colorEnd = [],
      particlesLifetime = [0.1, 1],
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
    } = settings;

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
          // passing callback function (setup) to emit
          emit(emitter, rate, () => {
            const randSize = MathUtils.randFloat(size[0], size[1]);
            const color =
              colorStart[MathUtils.randInt(0, colorStart.length - 1)];
            return {
              position: [
                MathUtils.randFloat(startPositionMin[0], startPositionMax[0]),
                MathUtils.randFloat(startPositionMin[1], startPositionMax[1]),
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

    return (
      <>
        <object3D {...props} ref={ref} />
      </>
    );
  }
);
