import React, { useMemo, useState } from "react";

interface Props {
  onAccept: () => void;
}

const legalDocs = [
  {
    label: "Aviso de Privacidad",
    emoji: "📘",
    href: "https://docs.google.com/document/d/1fofju9x-kRUH2zU1S9LllmxPiTqQ3HcwbLVCPUhBcNM/edit?usp=sharing",
  },
  {
    label: "Términos de Uso",
    emoji: "⚖️",
    href: "https://docs.google.com/document/d/1Vo1o8ew31LPTwHrX1y41hklHtowaIQtMEBr0WPDdZHA/edit?usp=drive_link",
  },
  {
    label: "Protocolo Ángel Guardián",
    emoji: "🎤",
    href: "https://docs.google.com/document/d/1XlAIXN__SLEmX-3Dyhjig7RTZu5W3amtSfKkQCWF6uw/edit?usp=drive_link",
  },
];

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "radial-gradient(circle at top, rgba(0, 191, 255, 0.15), transparent 55%)",
  padding: "24px",
};

const cardStyle: React.CSSProperties = {
  maxWidth: "640px",
  width: "100%",
  backgroundColor: "rgba(12, 21, 40, 0.92)",
  border: "1px solid rgba(0, 191, 255, 0.3)",
  borderRadius: "18px",
  padding: "32px",
  boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)",
  color: "#ecf6ff",
  fontFamily: '"Montserrat","Inter",system-ui,sans-serif',
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "20px 0",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: "999px",
  border: "none",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
  background:
    "linear-gradient(120deg, rgba(0, 191, 255, 0.95), rgba(255, 51, 102, 0.95))",
  color: "#04101f",
  transition: "opacity 0.2s ease",
};

const OnboardingLegal: React.FC<Props> = ({ onAccept }) => {
  const [accepted, setAccepted] = useState(false);

  const docsList = useMemo(
    () =>
      legalDocs.map((doc) => (
        <li key={doc.href}>
          <a
            href={doc.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "#a8e1ff",
              fontWeight: 500,
            }}
          >
            <span aria-hidden="true" role="img">
              {doc.emoji}
            </span>
            <span>{doc.label}</span>
          </a>
        </li>
      )),
    [],
  );

  return (
    <div style={containerStyle}>
      <section style={cardStyle} aria-labelledby="legal-consent-title">
        <h2 id="legal-consent-title" style={{ fontSize: "1.6rem", marginBottom: "12px" }}>
          Condiciones de Uso y Privacidad
        </h2>
        <p style={{ color: "#c7d9ec", lineHeight: 1.5 }}>
          Antes de usar AtemiMX, revisa los documentos oficiales del{" "}
          <strong>Proyecto AtemiMX · Piloto Docente 2025–2026</strong>.
        </p>

        <ul style={listStyle}>{docsList}</ul>

        <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
          <input
            id="acceptLegal"
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>He leído y acepto los documentos anteriores.</span>
        </label>

        <button
          id="continueApp"
          type="button"
          disabled={!accepted}
          style={{
            ...buttonStyle,
            marginTop: "24px",
            opacity: accepted ? 1 : 0.4,
            cursor: accepted ? "pointer" : "not-allowed",
          }}
          onClick={onAccept}
        >
          Continuar
        </button>
      </section>
    </div>
  );
};

export default OnboardingLegal;
