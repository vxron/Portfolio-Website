// THIS FILE HANDLES FLIPBOOK STATE (PAGEATOM) AND DATA (PAGES)

import { atom } from "jotai";
import { config } from "../config";

// Get images from config
const experienceImages = [
  "TESLA",
  "tesla-pg",
  "nokia",
  "nokia-pg",
  "TA",
  "ta-pg",
  "mdafinal",
  "mda-pg",
  "research",
  "research-pg",
  "uhn",
  "uhn-pg",
];
const num_pages = experienceImages.length;

export const pageAtom = atom(0);

// Front cover of book
export const pages = [
  {
    front: "title-pg",
    back: experienceImages[0],
  },
];

// Internal pages
for (let i = 1; i < num_pages - 1; i += 2) {
  pages.push({
    front: experienceImages[i],
    back: experienceImages[i + 1] ?? "title-pg", // fallback if last back is missing,
  });
}

// Back cover of book
pages.push({
  front: experienceImages[num_pages - 1],
  back: "title-pg",
});
