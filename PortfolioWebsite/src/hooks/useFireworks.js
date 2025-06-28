// useFireworks hook to handle creation/management of fireworks

import { create } from "zustand";
import { randFloat, randInt } from "three/src/math/MathUtils.js";

// simple store with empty array of fireworks
const useFireworks = create((set) => {
  return {
    fireworks: [],
    // method to create a firework
    addFirework: () => {
      set((state) => {
        return {
          fireworks: [
            ...state.fireworks,
            {
              id: `${Date.now()}-${randInt(0, 100)}-${state.fireworks.length}`, // to use as key in react component
              position: [0, 0, 0],
              velocity: [randFloat(-8, 8), randFloat(5, 10), randFloat(-8, 8)], // direction/speed of firework
              delay: randFloat(0.8, 2), // time before firework explodes
              color: ["skyblue", "pink"],
            },
          ],
        };
      });
    },
  };
});

export { useFireworks };
