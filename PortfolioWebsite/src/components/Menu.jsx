import { useEffect, useRef, useCallback } from "react";

export const Menu = () => {
  const buttonsRef = useRef(null);
  const starRef = useRef(null);

  const pinToRef = useRef(null);
  const pinTimerRef = useRef(0);

  const clearPin = useCallback(() => {
    pinToRef.current = null;
    if (pinTimerRef.current) {
      clearTimeout(pinTimerRef.current);
      pinTimerRef.current = 0;
    }
  }, []);

  // Move the star under a section's button.
  // If we're pinned to a different section, ignore requests unless force=true.
  const moveStar = useCallback((sectionName, { force = false } = {}) => {
    const buttonsEl = buttonsRef.current;
    const starEl = starRef.current;
    if (!buttonsEl || !starEl) return;

    const safe = sectionName || (window.location.hash || "#home").slice(1);

    // Guard: if pinned elsewhere, ignore intermediate updates
    if (pinToRef.current && pinToRef.current !== safe && !force) return;

    const target = buttonsEl.querySelector(`a.menu_button[href="#${safe}"]`);
    if (!target) return;

    const barRect = buttonsEl.getBoundingClientRect();
    const btnRect = target.getBoundingClientRect();
    const centerX = btnRect.left - barRect.left + btnRect.width / 2;

    starEl.style.opacity = safe === "home" ? "0" : "1";
    starEl.style.transform = `translateX(${centerX}px) translateY(0)`;
  }, []);

  // Pin helper: set pin to a target and force the star there now
  const pinTo = useCallback(
    (section) => {
      pinToRef.current = section;
      moveStar(section, { force: true });

      // Safety unpin in case arrival event never comes
      if (pinTimerRef.current) clearTimeout(pinTimerRef.current);
      pinTimerRef.current = setTimeout(() => {
        clearPin();
      }, 3000);
    },
    [moveStar, clearPin]
  );

  useEffect(() => {
    // Fired by Experience on each section change
    const onSection = (e) => {
      const s = e.detail?.section;
      if (!s) return;

      // If pinned to a different destination, ignore
      if (pinToRef.current && s !== pinToRef.current) return;

      moveStar(s);

      // Arrived at the pinned destination -> unpin
      if (pinToRef.current && s === pinToRef.current) clearPin();
    };

    // When the hash changes (user clicked a menu item), PIN to that target
    const onHash = () => {
      const s = (window.location.hash || "#home").slice(1);
      if (s && s !== "home") {
        pinTo(s); // <-- pin here
      } else {
        clearPin(); // home shouldn't stay pinned
        moveStar(s, { force: true }); // also hide/star position for home
      }
    };

    // Keep centered on resize; prefer pinned target if present
    const onResize = () => {
      const s = pinToRef.current || (window.location.hash || "#home").slice(1);
      moveStar(s, { force: true });
    };

    window.addEventListener("sectionChange", onSection);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("resize", onResize);

    // initial placement
    onResize();

    return () => {
      window.removeEventListener("sectionChange", onSection);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("resize", onResize);
    };
  }, [moveStar, pinTo, clearPin]);

  return (
    <div className="menu">
      <div className="menu_buttons" ref={buttonsRef}>
        <a className="menu_button" href="#home">
          Home
        </a>
        <a className="menu_button" href="#skills">
          Skills
        </a>
        <a className="menu_button" href="#experience">
          Experience
        </a>
        <a className="menu_button" href="#projects">
          Projects
        </a>
        <a className="menu_button" href="#contact">
          Contact
        </a>
        {/* sliding star */}
        <div className="menu_star" ref={starRef} aria-hidden>
          ★
        </div>
      </div>
    </div>
  );
};
