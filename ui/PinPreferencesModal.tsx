import React from "react";

interface PinPreferencesModalProps {
  open: boolean;
  pinEnabled: boolean;
  onRequestSetup: () => void;
  onDisable: () => void;
  onClose: () => void;
}

export const PinPreferencesModal: React.FC<PinPreferencesModalProps> = ({
  open,
  pinEnabled,
  onRequestSetup,
  onDisable,
  onClose,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="pin-preferences" role="dialog" aria-modal="true" aria-label="Configuración de PIN AtemiMX">
      <div className="pin-preferences__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="pin-preferences__panel">
        <header>
          <p>AtemiMX</p>
          <h3>Seguridad y autenticación</h3>
          <p className="pin-preferences__hint">
            Define cómo quieres volver a entrar a la app cuando regreses desde este dispositivo.
          </p>
        </header>
        <section>
          <p className={`pin-preferences__status ${pinEnabled ? "is-active" : ""}`}>
            {pinEnabled ? "PIN activo para reingreso." : "El PIN aún no está configurado."}
          </p>
          <div className="pin-preferences__actions">
            <button type="button" className="pin-preferences__primary" onClick={onRequestSetup}>
              {pinEnabled ? "Cambiar PIN" : "Configurar PIN"}
            </button>
            {pinEnabled ? (
              <button type="button" className="pin-preferences__ghost" onClick={onDisable}>
                Desactivar PIN
              </button>
            ) : null}
          </div>
        </section>
        <footer>
          <button type="button" className="pin-preferences__ghost" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PinPreferencesModal;
