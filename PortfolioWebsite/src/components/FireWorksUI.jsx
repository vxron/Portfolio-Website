import { useFireworks } from "../hooks/useFireworks";

export const FireworksUI = () => {
  const addFirework = useFireworks((state) => state.addFirework);

  return (
    <section className="fixed inset-0 z-10 flex items-center justify-center">
      <div className="absolute top-4 left-4 md:top-8 md:left-14 opacity-0 animate-fade-in-down animation-delay-200"></div>
      <div className="absolute left-4 md:left-15 -translate-x-1/2 -rotate-90 flex items-center gap-4 animation-delay-1500 animate-fade-in-down opacity-0"></div>
      <div
        className={`p-4 flex flex-col items-center gap-2 md:gap-4 mt-[50vh] animate-fade-in-up opacity-0 animation-delay-1000`}
      >
        <h1 className="bold text-white/80 text-4xl md:text-5xl font-extrabold text-center">
          Sky Adventure
        </h1>
        <p className="text-white/70 text-sm">
          Discover our amazing fireworks collection
        </p>
        <div className="flex gap-4">
          <button
            className="bg-white rounded-full px-4 md:px-8 py-2 grayscale hover:filter-none hover:bg-white/20 hover:text-white transition-colors duration-400 cursor-pointer"
            onClick={addFirework}
          >
            🎆 Classic
          </button>
          <button
            className="bg-white rounded-full px-4 md:px-8 py-2 grayscale hover:filter-none hover:bg-white/20 hover:text-white transition-colors duration-400 cursor-pointer"
            onClick={addFirework}
          >
            💖 Love
          </button>
          <button
            className="bg-white rounded-full px-4 md:px-8 py-2 grayscale hover:filter-none hover:bg-white/20 hover:text-white transition-colors duration-400 cursor-pointer"
            onClick={addFirework}
          >
            🌊 Sea
          </button>
        </div>
        <p className="text-white/70 text-sm text-center">
          Start the <b>fireworks show</b>!
        </p>
      </div>
    </section>
  );
};
