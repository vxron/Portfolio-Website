import { useEffect, useRef } from "react";

export const Menu = () => {
  const buttonsRef = useRef(null);
  const starRef = useRef(null);

  const moveStar = (sectionName) => {
    const buttonsEl = buttonsRef.current;
    const starEl = starRef.current;
    if (!buttonsEl || !starEl) return;

    const safeSection =
      sectionName || (window.location.hash || "#home").slice(1);
    const target = buttonsEl.querySelector(
      `a.menu_button[href="#${safeSection}"]`
    );
    if (!target) return;

    const barRect = buttonsEl.getBoundingClientRect();
    const btnRect = target.getBoundingClientRect();

    // center under the target button (relative to the buttons container)
    const centerX = btnRect.left - barRect.left + btnRect.width / 2;

    // hide the star on "home", show otherwise
    starEl.style.opacity = safeSection === "home" ? "0" : "1";
    starEl.style.transform = `translateX(${centerX}px) translateY(0)`;
  };

  useEffect(() => {
    const onSection = (e) => moveStar(e.detail?.section);
    const onHash = () => moveStar((window.location.hash || "#home").slice(1));
    const onResize = () => onHash();

    window.addEventListener("sectionChange", onSection);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("resize", onResize);

    // initial position
    onHash();

    return () => {
      window.removeEventListener("sectionChange", onSection);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("resize", onResize);
    };
  }, []);

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
        {/* the sliding star */}
        <div className="menu_star" ref={starRef} aria-hidden>
          ★
        </div>
      </div>
    </div>
  );
};
