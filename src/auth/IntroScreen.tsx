import { useEffect, useState } from "react";

interface IntroScreenProps {
  onFinish: () => void;
}

const INTRO_DURATION_MS = 8000;
const FADE_DURATION_MS = 800;

const IntroScreen = ({ onFinish }: IntroScreenProps) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setIsFading(true), Math.max(0, INTRO_DURATION_MS - FADE_DURATION_MS));
    const finishTimer = window.setTimeout(() => onFinish(), INTRO_DURATION_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative">
      <video autoPlay muted playsInline className="w-full h-full object-cover">
        <source src="/branding/INTRO FINAL.mp4" type="video/mp4" />
      </video>
      <div
        className={`absolute inset-0 bg-black transition-opacity ${isFading ? "opacity-100" : "opacity-0"}`}
        style={{ transitionDuration: `${FADE_DURATION_MS}ms` }}
      />
    </div>
  );
};

export default IntroScreen;
