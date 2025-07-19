/*
useMobile hook:
1 - Changes the base position and scale of items based on available width
    (after threshold, switch to mobile version)
2 - Fine tune pos and scale based on a scaleFactor 
    (rerender when value changes)
*/

import { useEffect, useState } from "react";

const REFERENCE_WIDTH = 1920; // Typical Screen Size
const MOBILE_THRESHOLD = 900; // Switch to mobile view (or portrait tablets)

export const useMobile = () => {
  const [scaleFactor, setScaleFactor] = useState(
    window.innerWidth / REFERENCE_WIDTH
  ); // Size of the screen divided by our reference (e.g., 1920 --> scale factor of 1)
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= MOBILE_THRESHOLD
  ); // Cause re-render when variable changes, thus need useState

  useEffect(() => {
    const handleResize = () => {
      setScaleFactor(window.innerWidth / REFERENCE_WIDTH);
      if (window.innerWidth <= MOBILE_THRESHOLD) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };
    window.addEventListener("resize", handleResize); // call handleResize function
    return () => window.removeEventListener("resize", handleResize); // remove event listenener on cleanup
  }, []);

  return {
    scaleFactor,
    isMobile,
  };
};
