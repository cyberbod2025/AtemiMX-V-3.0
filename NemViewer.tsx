import React, { useState } from 'react';
import { CATALOGO_NEM, FASES_NEM, CAMPOS_FORMATIVOS } from './constants';
import type { CampoFormativo } from './types';

const NemViewer: React.FC = () => {
  const [selectedFase, setSelectedFase] = useState<string>('2');
  const [selectedCampo, setSelectedCampo] = useState<CampoFormativo>('Lenguajes');

  const faseData = CATALOGO_NEM[selectedFase];
  const campoData = faseData?.campos?.[selectedCampo];

  return (
    <div className="card space-y-6">
      <h2 className="text-2xl font-bold">Visor de Contenidos y Procesos (PDA)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fase-select" className="block text-sm font-medium text-gray-400 mb-2">Fase Educativa</label>
          <select 
            id="fase-select"
            className="select-field" 
            value={selectedFase} 
            onChange={(e) => setSelectedFase(e.target.value)}
          >
            {Object.entries(FASES_NEM).map(([key, value]) => (
              <option key={key} value={key}>{value.nombre} - {value.nivel}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="campo-select" className="block text-sm font-medium text-gray-400 mb-2">Campo Formativo</label>
          <select 
            id="campo-select"
            className="select-field" 
            value={selectedCampo} 
            onChange={(e) => setSelectedCampo(e.target.value as CampoFormativo)}
          >
            {CAMPOS_FORMATIVOS.map(campo => (
              <option key={campo} value={campo}>{campo}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        {campoData && campoData.contenidos.length > 0 ? (
          <div className="space-y-4">
            {campoData.contenidos.map((contenido, index) => (
              <div key={index} className="p-4 rounded-lg bg-black/20 border border-[#8A1538]/30">
                <h3 className="font-bold text-[#39FF14]">{contenido.titulo}</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-300 pl-2">
                  {contenido.procesos.map((proceso, pIndex) => (
                    <li key={pIndex}>{proceso.descripcion}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No hay contenidos de ejemplo para esta selección en el catálogo actual.</p>
            <p>El catálogo se irá completando progresivamente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NemViewer;
