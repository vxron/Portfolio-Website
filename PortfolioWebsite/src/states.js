//import create from "zustand";
/*
// Global variable to store current section state
export const useSectionState = create((set) => ({
  section: "home", // initial section
  setSection: (newSection) => set({ section: newSection }),
}));
*/

import { createContext, useContext } from "react";

export const SectionContext = createContext();

export const useSection = () => useContext(SectionContext);
