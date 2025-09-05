import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function ScrollHint({
  text = "Scroll to make me walk",
  bottom = 84,
  offsetX = 0, // horizontal nudge (px)
  showDelay = 400, // ms before appearing
  autoHide = 2500, // ms visible time
  sessionKey = "scrollHintSeen_v2",
  testing = false, // set true to force show while debugging
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!testing && sessionStorage.getItem(sessionKey) === "1") return;

    const open = setTimeout(() => setVisible(true), showDelay);
    const close = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(sessionKey, "1");
    }, showDelay + autoHide);

    const hide = () => {
      setVisible(false);
      sessionStorage.setItem(sessionKey, "1");
    };

    // Hide on any sign of intent
    window.addEventListener("wheel", hide, { passive: true });
    window.addEventListener("touchstart", hide, { passive: true });
    window.addEventListener("keydown", hide);

    return () => {
      clearTimeout(open);
      clearTimeout(close);
      window.removeEventListener("wheel", hide);
      window.removeEventListener("touchstart", hide);
      window.removeEventListener("keydown", hide);
    };
  }, [testing, sessionKey, showDelay, autoHide]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 28,
            mass: 0.6,
          }}
          style={{
            position: "absolute",
            left: "50%",
            transform: `translateX(calc(-50% + ${offsetX}px))`,
            bottom,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              background: "rgba(255,255,255,0.88)",
              color: "#222",
              borderRadius: 9999,
              padding: "8px 14px",
              boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
              fontSize: 14,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
