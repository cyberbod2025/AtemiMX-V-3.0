import React, { useEffect, useState } from "react";

import { useNemCatalog } from "@/hooks/useNemCatalog";

const NemViewer: React.FC = () => {
  const {
    getFases,
    getCamposPorFase,
    getPdasPorCampo,
    getFase,
  } = useNemCatalog();
  const fases = getFases();

  const [selectedFase, setSelectedFase] = useState<string>("");
  const [selectedCampo, setSelectedCampo] = useState<string>("");

  const campos = selectedFase ? getCamposPorFase(selectedFase) : [];
  const pdas = selectedCampo ? getPdasPorCampo(selectedCampo) : [];
  const faseActual = selectedFase ? getFase(selectedFase) : undefined;

  useEffect(() => {
    if (!fases.length) {
      setSelectedFase("");
      return;
    }
    if (!selectedFase || !fases.some((fase) => fase.faseId === selectedFase)) {
      setSelectedFase(fases[0].faseId);
    }
  }, [fases, selectedFase]);

  useEffect(() => {
    if (!campos.length) {
      setSelectedCampo("");
      return;
    }
    if (!selectedCampo || !campos.some((campo) => campo.campoId === selectedCampo)) {
      setSelectedCampo(campos[0].campoId);
    }
  }, [campos, selectedCampo]);

  return (
    <div className="card space-y-6">
      <h2 className="text-2xl font-bold font-display">Visor de Contenidos y Procesos (PDA)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fase-select" className="block text-sm font-medium text-gray-400 mb-2">
            Fase educativa
          </label>
          <select
            id="fase-select"
            className="select-field"
            value={selectedFase}
            onChange={(event) => {
              setSelectedFase(event.target.value);
              setSelectedCampo("");
            }}
          >
            {fases.map((fase) => (
              <option key={fase.faseId} value={fase.faseId}>
                {fase.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="campo-select" className="block text-sm font-medium text-gray-400 mb-2">
            Campo formativo
          </label>
          <select
            id="campo-select"
            className="select-field"
            value={selectedCampo}
            onChange={(event) => setSelectedCampo(event.target.value)}
            disabled={!campos.length}
          >
            {campos.map((campo) => (
              <option key={campo.campoId} value={campo.campoId}>
                {campo.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {faseActual ? (
        <p className="text-sm text-gray-400">
          {faseActual.descripcion}
        </p>
      ) : null}

      <div className="space-y-4">
        {pdas.length > 0 ? (
          pdas.map((pda) => (
            <article key={pda.pdaId} className="p-4 rounded-lg bg-black/20 border border-[var(--accent-2)]/30">
              <header className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-[var(--accent-1)]">{pda.nombre}</h3>
                  <p className="text-sm text-gray-300">{pda.descripcion}</p>
                </div>
                <span className="text-xs text-gray-400">Orden {pda.orden}</span>
              </header>
              <p className="text-sm text-gray-200 mt-3">{pda.descriptor}</p>
              {pda.competencias.length ? (
                <p className="text-xs text-gray-500 mt-2">
                  Competencias: {pda.competencias.join(", ")}
                </p>
              ) : null}
              {pda.evidencias.length ? (
                <p className="text-xs text-gray-500 mt-1">
                  Evidencias: {pda.evidencias.join(", ")}
                </p>
              ) : null}
              {pda.indicadores.length ? (
                <p className="text-xs text-gray-500 mt-1">
                  Indicadores: {pda.indicadores.join(", ")}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No hay Procesos de Desarrollo de Aprendizaje para este campo todavía.</p>
            <p>El catálogo se actualiza con la información oficial de la NEM.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NemViewer;
