import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { config } from "../config";

// Get images from config
const num_exps = config.experience.length;
const experienceImages = [];
config.experience.forEach((exp) => {
  if (exp.image) {
    experienceImages.push(exp.image);
  }
});

export const pageAtom = atom(0);
export const pages = [
  {
    front: "exp_images/pink-bg.jpg",
    back: "exp_images/pink-bg.jpg",
  },
];

for (let i = 1; i < num_exps - 1; i += 2) {
  pages.push({
    front: experienceImages[i % num_exps],
    back: experienceImages[(i + 1) % num_exps],
  });
}

pages.push({
  front: experienceImages[num_exps - 1],
  back: "exp_images/pink-bg.jpg",
});

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);

  return (
    <>
      <main className=" pointer-events-none select-none z-10 fixed  inset-0  flex justify-between flex-col">
        <a
          className="pointer-events-auto mt-10 ml-10"
          href="https://lessons.wawasensei.dev/courses/react-three-fiber"
        >
          <img className="w-20" src="/images/wawasensei-white.png" />
        </a>
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
