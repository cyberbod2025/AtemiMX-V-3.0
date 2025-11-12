
export type NivelEducativo = 'preescolar' | 'primaria' | 'secundaria';
export type MateriaSecundaria = 'lenguajes' | 'matematicas' | 'ciencias' | 'historia' | 'formacion' | 'artes' | 'tecnologia';
export type CampoFormativo = 'Lenguajes' | 'Saberes y Pensamiento Científico' | 'Ética, Naturaleza y Sociedades' | 'De lo Humano y lo Comunitario';

export interface PerfilDocente {
  configuracion: 'guiada' | 'avanzado';
  esDocente: boolean;
  nivel: NivelEducativo;
  materia?: MateriaSecundaria;
  campoFormativo?: CampoFormativo | CampoFormativo[];
  nombre: string;
  escuela: string;
  cicloEscolar: string;
}

export interface Proceso {
  descripcion: string;
}

export interface Contenido {
  titulo: string;
  procesos: Proceso[];
}

export interface CampoData {
  contenidos: Contenido[];
}

export interface FaseData {
  nombre: string;
  grados: string[];
  campos: {
    [key in CampoFormativo]?: CampoData;
  };
}

export interface CatalogoNEM {
  [key: string]: FaseData;
}

export interface NemPhase {
  faseId: string;
  nombre: string;
  descripcion: string;
  orden: number;
  camposFormativos: string[];
}

export interface NemCampoFormativo {
  campoId: string;
  nombre: string;
  descripcion: string;
  faseId: string;
  pdaIds: string[];
}

export interface NemPda {
  pdaId: string;
  campoId: string;
  nombre: string;
  descripcion: string;
  descriptor: string;
  competencias: string[];
  evidencias: string[];
  indicadores: string[];
  recursos: string[];
  orden: number;
}

export interface NemCatalog {
  fases: NemPhase[];
  camposFormativos: NemCampoFormativo[];
  pdas: NemPda[];
 }

export interface GuardianReport {
  id: string;
  title: string;
  summary: string;
  transcript: string;
  /** ISO string con la fecha/hora de grabación */
  date: string;
  /** Fecha ya formateada para mostrar en UI (opcional) */
  displayDate?: string;
}
