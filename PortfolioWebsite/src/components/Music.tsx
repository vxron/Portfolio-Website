"use client";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const Modal = ({ onClose, toggle }: { toggle: any; onClose: any }) => {
  let modalRoot = document.getElementById("my-modal");
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "my-modal";
    document.body.appendChild(modalRoot);
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
  const audioRef1 = useRef<HTMLAudioElement | null>(null);
  const audioRef2 = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<1 | 2>(1); // track swapper
  const wasPlayingBeforeHide = useRef(false); // remember state across backgrounding

  // Emit "bgmusic:closed" so the scroll hint can start its timer
  const emitClosed = useCallback(() => {
    sessionStorage.setItem("bgmusic_closed", "1");
    window.dispatchEvent(new Event("bgmusic:closed"));
  }, []);

  const playCurrentTrack = () => {
    const current = currentTrack === 1 ? audioRef1.current : audioRef2.current;
    const other = currentTrack === 1 ? audioRef2.current : audioRef1.current;
    other?.pause();
    other?.currentTime && (other.currentTime = 0);
    current?.play();
  };

  const handleTrackEnd = () => {
    setCurrentTrack((prev) => (prev === 1 ? 2 : 1));
  };

  const handleFirstUserInteraction = useCallback(() => {
    const musicConsent = localStorage.getItem("musicConsent");
    if (musicConsent === "true" && !isPlaying) {
      playCurrentTrack();
      setIsPlaying(true);
    }

    ["click", "keydown", "touchstart"].forEach((event) =>
      document.removeEventListener(event, handleFirstUserInteraction)
    );
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    const consent = localStorage.getItem("musicConsent");
    const consentTime = localStorage.getItem("consentTime");

    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const isStale =
      !consent ||
      !consentTime ||
      new Date(consentTime).getTime() + threeDays <= Date.now();

    if (isStale) {
      setShowModal(true);
    } else {
      setIsPlaying(consent === "true");
      if (consent === "true") {
        ["click", "keydown", "touchstart"].forEach((event) =>
          document.addEventListener(event, handleFirstUserInteraction)
        );
      }
    }
  }, [handleFirstUserInteraction]);

  // When track ends, switch and play the next one
  useEffect(() => {
    const current = currentTrack === 1 ? audioRef1.current : audioRef2.current;
    const handleEnd = () => handleTrackEnd();

    if (current) {
      current.addEventListener("ended", handleEnd);
    }

    return () => {
      current?.removeEventListener("ended", handleEnd);
    };
  }, [currentTrack]);

  useEffect(() => {
    if (isPlaying) {
      playCurrentTrack();
    }
  }, [currentTrack, isPlaying]);

  const toggle = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    if (newState) {
      playCurrentTrack();
    } else {
      audioRef1.current?.pause();
      audioRef2.current?.pause();
    }
    localStorage.setItem("musicConsent", String(newState));
    localStorage.setItem("consentTime", new Date().toISOString());
    setShowModal(false);
    if (showModal) emitClosed();
  };

  // Pause when the page/tab/app goes to background; attempt resume on return
  useEffect(() => {
    const pauseAll = () => {
      wasPlayingBeforeHide.current = isPlaying;
      audioRef1.current?.pause();
      audioRef2.current?.pause();
      setIsPlaying(false); // reflect the real state in the UI
    };

    const tryResume = () => {
      // Only resume if user had it playing AND they consented
      if (!wasPlayingBeforeHide.current) return;
      if (localStorage.getItem("musicConsent") !== "true") return;
      const el = currentTrack === 1 ? audioRef1.current : audioRef2.current;
      if (!el) return;
      el.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // iOS may require a gesture; arm a one-time resume
          const onGesture = () => {
            el.play().catch(() => {
              /* give up silently */
            });
            setIsPlaying(true);
            window.removeEventListener("touchstart", onGesture);
            window.removeEventListener("keydown", onGesture);
            window.removeEventListener("click", onGesture);
          };
          window.addEventListener("touchstart", onGesture, {
            once: true,
            passive: true,
          });
          window.addEventListener("keydown", onGesture, { once: true });
          window.addEventListener("click", onGesture, { once: true });
        });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") pauseAll();
      else if (document.visibilityState === "visible") tryResume();
    };
    const onPageHide = () => pauseAll(); // covers navigation away/OS switchers
    const onBlur = () => pauseAll(); // extra safety on some Android builds

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("blur", onBlur);
    };
  }, [isPlaying, currentTrack]);

  // Modal "Yes" handler: start music, remember consent, close modal, emit event
  const acceptInModal = useCallback(() => {
    if (!isPlaying) {
      setIsPlaying(true);
      playCurrentTrack();
    }
    localStorage.setItem("musicConsent", "true");
    localStorage.setItem("consentTime", new Date().toISOString());
    setShowModal(false);
    emitClosed();
  }, [isPlaying, emitClosed]);

  // Modal "No" handler: don’t play, remember choice, close modal, emit event
  const declineInModal = useCallback(() => {
    audioRef1.current?.pause();
    audioRef2.current?.pause();
    setIsPlaying(false);
    localStorage.setItem("musicConsent", "false");
    localStorage.setItem("consentTime", new Date().toISOString());
    setShowModal(false);
    emitClosed();
  }, [emitClosed]);

  return (
    <div className="music_div">
      {showModal && <Modal onClose={declineInModal} toggle={acceptInModal} />}

      <audio ref={audioRef1}>
        <source src={"/audio/Sahar El Layali Violin.mp3"} type="audio/mpeg" />
        your browser does not support the audio element.
      </audio>
      <audio ref={audioRef2}>
        <source src={"/audio/Fee Shi.mp3"} type="audio/mpeg" />
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
