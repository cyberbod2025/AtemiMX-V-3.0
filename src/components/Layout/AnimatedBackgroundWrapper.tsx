import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import startupSound from "@/assets/sfx/atemi-startup.mp3";

const TRANSITION_DURATION = 1.5;
const BASE_VOLUME = 0.35;
const FADE_VOLUME = 0.12;
const FADE_DELAY = 1000;

export default function AnimatedBackgroundWrapper() {
  const [animationKey, setAnimationKey] = useState(() => Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === "undefined") {
      return;
    }

    const audio = new Audio(startupSound);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const playStartupSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = BASE_VOLUME;

    const playResult = audio.play();
    if (typeof playResult?.then === "function") {
      playResult
        .then(() => {
          window.setTimeout(() => {
            if (!audio.paused) {
              audio.volume = FADE_VOLUME;
            }
          }, FADE_DELAY);
        })
        .catch(() => {
          // Silently ignore autoplay rejections.
        });
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const observer = new MutationObserver(() => {
      setAnimationKey(Date.now());
      playStartupSound();
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [playStartupSound]);

  return (
    <AnimatePresence>
      <motion.div
        key={animationKey}
        className="role-glow"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 0.35, scale: 1 }}
        exit={{ opacity: 0, scale: 1 }}
        transition={{ duration: TRANSITION_DURATION, ease: "easeInOut" }}
      />
    </AnimatePresence>
  );
}

