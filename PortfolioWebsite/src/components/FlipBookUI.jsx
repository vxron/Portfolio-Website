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

/*
config.experience.forEach((exp) => {
  if (exp.image) {
    experienceImages.push(exp.image);
  }
});
*/

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

/*
export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);

  
  return (
    <>
      <main className=" pointer-events-none select-none z-10 fixed  inset-0  flex justify-between flex-col">
        <div className="w-full overflow-auto pointer-events-auto flex justify-center">
          <div className="overflow-auto flex items-center gap-4 max-w-full p-10">
            {[...pages].map((_, index) => (
              <button
                key={index}
                className={`border-transparent hover:border-white transition-all duration-300  px-4 py-3 rounded-full  text-lg uppercase shrink-0 border ${
                  index === page
                    ? "bg-white/90 text-black"
                    : "bg-black/30 text-white"
                }`}
                onClick={() => setPage(index)}
              >
                {index === 0 ? "Cover" : `Page ${index}`}
              </button>
            ))}
            <button
              className={`border-transparent hover:border-white transition-all duration-300  px-4 py-3 rounded-full  text-lg uppercase shrink-0 border ${
                page === pages.length
                  ? "bg-white/90 text-black"
                  : "bg-black/30 text-white"
              }`}
              onClick={() => setPage(pages.length)}
            >
              Back Cover
            </button>
          </div>
        </div>
      </main>
    </>
  );
};
*/
