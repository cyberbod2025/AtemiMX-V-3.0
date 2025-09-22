
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
