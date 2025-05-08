import { useProgress } from "@react-three/drei";
import { config } from "../config";
import { useEffect } from "react";

export const LoadingScreen = ({ onFinish }) => {
  const { progress, active } = useProgress();

  useEffect(() => {
    if (!active) {
      // All assets done loading
      onFinish?.();
    }
  }, [active, onFinish]);

  return (
    <div className={`loading-screen ${active ? "" : "loading-screen--hidden"}`}>
      <div className="loading-screen__container">
        <h1 className="loading-screen__title">{config.title}</h1>
        <div className="progress__container">
          <div
            className="progress__bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
