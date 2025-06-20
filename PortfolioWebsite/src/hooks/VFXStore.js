// HOOK TO TAKE CARE OF REGISTERING & UNREGISTERING THE EMITTERS FROM THE VFXPARTICLES COMPONENT
/**
 * Emitters: An object to store all the emitters
 * registerEmitter: Func to register an emitter with a given name
 * unregisterEmitter: Func to unregister an emitter
 * emit: Func to call the emitter
 */

import { create } from "zustand";

export const useVFX = create((set, get) => ({
  emitters: {},
  registerEmitter: (name, emitter) => {
    if (get().emitters[name]) {
      console.warn(`Emitter ${name} already exists`);
      return;
    }
    set((state) => {
      state.emitters[name] = emitter;
      return state;
    });
  },
  unregisterEmitter: (name) => {
    set((state) => {
      delete state.emitters[name];
      return state;
    });
  },
  emit: (name, ...params) => {
    const emitter = get().emitters[name];
    if (!emitter) {
      console.warn(`Emitter ${name} not found`);
      return;
    }
    emitter(...params);
  },
}));
