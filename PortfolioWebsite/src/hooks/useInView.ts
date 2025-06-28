import { useState, useEffect, useRef, RefObject } from "react";

export function useInView<T extends Element>(
  options?: IntersectionObserverInit
): { ref: RefObject<T>; inView: boolean } {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      options
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, options]);

  return { ref, inView };
}
