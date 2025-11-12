import { useMemo } from "react";

import type { NemCatalog, NemCampoFormativo, NemPda, NemPhase } from "@/types";
import nemCatalogData from "@/data/nemCatalog.json";

export interface SearchIndicadoresParams {
  faseId?: string;
  campoId?: string;
  palabraClave?: string;
}

export interface UseNemCatalogReturn {
  fases: NemPhase[];
  campos: NemCampoFormativo[];
  pdas: NemPda[];
  getFases: () => NemPhase[];
  getCamposPorFase: (faseId?: string) => NemCampoFormativo[];
  getCampo: (campoId: string) => NemCampoFormativo | undefined;
  getPdasPorCampo: (campoId?: string) => NemPda[];
  findPda: (pdaId: string) => NemPda | undefined;
  searchIndicadores: (params?: SearchIndicadoresParams) => NemPda[];
  formatDescriptor: (pdaId: string) => string | null;
  getFase: (faseId: string) => NemPhase | undefined;
}

const catalog: NemCatalog = nemCatalogData as NemCatalog;

export const useNemCatalog = (): UseNemCatalogReturn => {
  const fases = useMemo(() => {
    return [...catalog.fases].sort((a, b) => a.orden - b.orden);
  }, []);

  const campos = useMemo(() => [...catalog.camposFormativos], []);
  const pdas = useMemo(() => [...catalog.pdas].sort((a, b) => a.orden - b.orden), []);

  const camposMap = useMemo(
    () => new Map(campos.map((campo) => [campo.campoId, campo])),
    [campos],
  );
  const pdasMap = useMemo(
    () => new Map(pdas.map((pda) => [pda.pdaId, pda])),
    [pdas],
  );
  const fasesMap = useMemo(
    () => new Map(fases.map((fase) => [fase.faseId, fase])),
    [fases],
  );

  const getFases = () => fases;
  const getFase = (faseId: string) => fasesMap.get(faseId);
  const getCamposPorFase = (faseId?: string) => {
    if (!faseId) {
      return campos;
    }
    return campos.filter((campo) => campo.faseId === faseId);
  };
  const getCampo = (campoId: string) => camposMap.get(campoId);
  const getPdasPorCampo = (campoId?: string) => {
    if (!campoId) {
      return pdas;
    }
    return pdas.filter((pda) => pda.campoId === campoId);
  };
  const findPda = (pdaId: string) => pdasMap.get(pdaId);

  const searchIndicadores = (params?: SearchIndicadoresParams) => {
    if (!params) {
      return pdas;
    }

    const { faseId, campoId, palabraClave } = params;
    return pdas.filter((pda) => {
      if (campoId && pda.campoId !== campoId) {
        return false;
      }
      if (faseId) {
        const campo = camposMap.get(pda.campoId);
        if (!campo || campo.faseId !== faseId) {
          return false;
        }
      }
      if (palabraClave) {
        const lower = palabraClave.toLowerCase();
        const hayDescriptor = pda.descriptor.toLowerCase().includes(lower);
        const hayCompetencia = pda.competencias.some((competencia) =>
          competencia.toLowerCase().includes(lower),
        );
        const hayIndicador = pda.indicadores.some((indicador) =>
          indicador.toLowerCase().includes(lower),
        );
        if (!(hayDescriptor || hayCompetencia || hayIndicador)) {
          return false;
        }
      }
      return true;
    });
  };

  const formatDescriptor = (pdaId: string) => {
    const pda = findPda(pdaId);
    if (!pda) {
      return null;
    }
    const indicadores = pda.indicadores.join(", ");
    return `${pda.descriptor}${indicadores ? ` (${indicadores})` : ""}`;
  };

  return {
    fases,
    campos,
    pdas,
    getFases,
    getCamposPorFase,
    getCampo,
    getPdasPorCampo,
    findPda,
    searchIndicadores,
    formatDescriptor,
    getFase,
  };
};
