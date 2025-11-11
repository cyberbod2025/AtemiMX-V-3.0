import React from "react";
import { ShieldCheck } from "lucide-react";

interface AngelGuardianFabProps {
  onOpen: () => void;
}

export const AngelGuardianFab: React.FC<AngelGuardianFabProps> = ({ onOpen }) => {
  return (
    <button type="button" className="guardian-fab" onClick={onOpen} aria-label="Abrir Ángel Guardián">
      <ShieldCheck size={24} />
      <span>Ángel Guardián</span>
    </button>
  );
};

export default AngelGuardianFab;
