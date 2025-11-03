import React from "react";
import "@/assets/bg/atemi-bg-animated.css";

export default function AppBackground() {
  return (
    <div className="atemi-bg" aria-hidden="true">
      <div className="atemi-layer atemi-gradient" />
      <div className="atemi-layer atemi-lines" />
      <div className="atemi-overlay" />
    </div>
  );
}
