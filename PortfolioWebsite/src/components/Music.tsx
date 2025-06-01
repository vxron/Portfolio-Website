"use client";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const Modal = ({ onClose, toggle }: { toggle: any; onClose: any }) => {
  const modalRoot = document.getElementById("my-modal");
  if (!modalRoot) {
    return null;
  }
  return createPortal(
    <div className="music_popup_overlay">
      <div className="music_popup_div">
        <p className="music_popup_p">
          Do you want to play the background music?
        </p>
        <div className="music_popup_button_div">
          <button onClick={toggle} className="music_popup_button right_margin">
            Yes
          </button>
          <button onClick={onClose} className="music_popup_button">
            No
          </button>
        </div>
      </div>
    </div>,

    modalRoot
  );
};

export const BgMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleFirstUserInteraction = useCallback(() => {
    const musicConsent = localStorage.getItem("musicConsent");
    if (musicConsent === "true" && !isPlaying && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }

    ["click", "keydown", "touchstart"].forEach((event) =>
      document.removeEventListener(event, handleFirstUserInteraction)
    );
  }, [isPlaying, audioRef]);

  useEffect(() => {
    console.log("👀 Modal shown?", showModal); //debugging
    //setShowModal(true); // Force modal for testing
    const consent = localStorage.getItem("musicConsent");
    const consentTime = localStorage.getItem("consentTime");

    if (
      consent &&
      consentTime &&
      new Date(consentTime).getTime() + 3 * 24 * 60 * 60 * 1000 > Date.now()
    ) {
      setIsPlaying(consent === "true");

      if (consent === "true") {
        // Browser allows audio only after interaction — listen for first one
        const resumePlayback = () => {
          audioRef.current?.play();
          ["click", "keydown", "touchstart"].forEach((event) =>
            document.removeEventListener(event, resumePlayback)
          );
        };

        ["click", "keydown", "touchstart"].forEach((event) =>
          document.addEventListener(event, handleFirstUserInteraction)
        );
      }
    } else {
      setShowModal(true);
    }
  }, [handleFirstUserInteraction]);

  const toggle = () => {
    const newState = !isPlaying;
    setIsPlaying(!isPlaying);
    if (audioRef.current)
      newState ? audioRef.current.play() : audioRef.current.pause();
    localStorage.setItem("musicConsent", String(newState));
    localStorage.setItem("consentTime", new Date().toISOString());
    setShowModal(false);
  };
  return (
    <div className="music_div">
      {showModal && (
        <Modal onClose={() => setShowModal(false)} toggle={toggle} />
      )}

      <audio ref={audioRef} loop>
        <source src={"/audio/Sahar El Layali Violin.mp3"} type="audio/mpeg" />
        your browser does not support the audio element.
      </audio>
      <motion.button
        onClick={toggle}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        className="music_button w-10 h-10 xs:w-14 xs:h-14 text-foreground rounded-full flex items-center justify-center cursor-pointer z-50 p-2.5 xs:p-4 custom-bg"
        aria-label={"Sound control button"}
        name={"Sound control button"}
      >
        {isPlaying ? (
          <Volume2 className="music_icon" strokeWidth={1.5} />
        ) : (
          <VolumeX className="music_icon" strokeWidth={1.5} />
        )}
      </motion.button>
    </div>
  );
};

export default BgMusic;
