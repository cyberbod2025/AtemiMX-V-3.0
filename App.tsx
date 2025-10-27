import React from "react";
import Dashboard from "./Dashboard";
import OnboardingBubble from "./OnboardingBubble";
import AngelGuardian from "./AngelGuardian";
import Modules from "./Modules";
import NemViewer from "./NemViewer";
import Sase310Module from "./modules/sase310/Sase310Module";

export default function App() {
  return (
    <main
      style={{
        backgroundColor: "#0b0b0e",
        color: "#e6e7e8",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "Inter, Poppins, system-ui, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "2rem", color: "#00e676" }}>
        🧩 AtemiMX Dashboard
      </h1>

      <section style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <OnboardingBubble />
        <Dashboard />
        <Modules />
        <section style={{ marginTop: "2rem" }}>
          <Sase310Module />
        </section>
        <NemViewer />
        <AngelGuardian />
      </section>
    </main>
  );
}
