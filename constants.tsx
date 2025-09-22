import type { CatalogoNEM, CampoFormativo, MateriaSecundaria } from './types';
import React from 'react';

export const FASES_NEM: { [key: string]: { nombre: string, nivel: string } } = {
  "2": { nombre: "Fase 2", nivel: "Preescolar" },
  "3": { nombre: "Fase 3", nivel: "Primaria (1° y 2°)" },
  "4": { nombre: "Fase 4", nivel: "Primaria (3° y 4°)" },
  "5": { nombre: "Fase 5", nivel: "Primaria (5° y 6°)" },
  "6": { nombre: "Fase 6", nivel: "Secundaria (1°, 2° y 3°)" },
};

export const MATERIAS_SECUNDARIA: { value: MateriaSecundaria, label: string }[] = [
    { value: 'lenguajes', label: 'Lenguajes' },
    { value: 'matematicas', label: 'Matemáticas' },
    { value: 'ciencias', label: 'Ciencias' },
    { value: 'historia', label: 'Historia' },
    { value: 'formacion', label: 'Formación Cívica y Ética' },
    { value: 'artes', label: 'Artes' },
    { value: 'tecnologia', label: 'Tecnología' },
];

export const MAPEO_MATERIA_CAMPO: { [key in MateriaSecundaria]: CampoFormativo } = {
    lenguajes: 'Lenguajes',
    matematicas: 'Saberes y Pensamiento Científico',
    ciencias: 'Saberes y Pensamiento Científico',
    historia: 'Ética, Naturaleza y Sociedades',
    formacion: 'Ética, Naturaleza y Sociedades',
    artes: 'De lo Humano y lo Comunitario',
    tecnologia: 'De lo Humano y lo Comunitario',
};

export const CAMPOS_FORMATIVOS: CampoFormativo[] = [
    'Lenguajes',
    'Saberes y Pensamiento Científico',
    'Ética, Naturaleza y Sociedades',
    'De lo Humano y lo Comunitario',
];

export const CATALOGO_NEM: CatalogoNEM = {
  "2": { 
    nombre:"Fase 2 · Preescolar", 
    grados:["1","2","3"], 
    campos: {
      "Lenguajes": { 
        contenidos: [ 
          { titulo:"Comunicación oral de necesidades, emociones, gustos, ideas y saberes", procesos:[{descripcion:"Emplea palabras, gestos, señas, imágenes, sonidos o movimientos corporales que le permitan expresar lo que siente."}] },
          { titulo:"Narración de historias mediante diversos lenguajes", procesos:[{descripcion:"Narra historias que le son familiares, pero con elementos, personajes y escenarios distintos."}] }
        ] 
      },
      "Saberes y Pensamiento Científico": { 
        contenidos:[ 
          { titulo:"Los saberes numéricos como herramienta para resolver situaciones del entorno", procesos:[{descripcion:"Usa números con distintos propósitos y en diversas situaciones."}] }
        ] 
      },
      "Ética, Naturaleza y Sociedades": { 
        contenidos:[ 
          { titulo:"Interacción, cuidado y conservación de la naturaleza", procesos:[{descripcion:"Manifiesta interés por cuidar a la naturaleza y encuentra formas creativas de resolver problemas socioambientales."}] }
        ] 
      },
      "De lo Humano y lo Comunitario": { 
        contenidos:[ 
          { titulo:"Construcción de la identidad personal a partir de su origen étnico, cultural y lingüístico", procesos:[{descripcion:"Comparte con sus pares información personal: su nombre, edad, gustos, etc."}] }
        ] 
      }
    }
  },
  "6": { 
    nombre:"Fase 6 · Secundaria", 
    grados:["1","2","3"], 
    campos: {
      "Lenguajes": { 
        contenidos: [ 
          { titulo:"La diversidad de lenguas y su uso en la comunicación familiar, escolar y comunitaria", procesos:[{descripcion:"Comprende las características y recursos lingüísticos de la lengua española."},{descripcion:"Elabora textos argumentativos sobre la interculturalidad."}] }
        ] 
      },
       "Saberes y Pensamiento Científico": { 
        contenidos: [ 
          { titulo:"Expresiones de fracciones como decimales y de decimales como fracciones", procesos:[{descripcion:"Usa diversas estrategias para convertir números fraccionarios a decimales y viceversa."}] }
        ] 
      }
    }
  }
};

export const GuardianIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  // FIX: Converted from JSX to React.createElement to be compatible with a .ts file.
  // This resolves parsing errors for JSX syntax in a non-tsx file.
  React.createElement('svg',
    { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", ...props },
    React.createElement('path', { d: "M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" })
  )
);


// FIX: Rewrote AtemiLogo from JSX to React.createElement calls to be compatible with a .ts file extension.
// This resolves parsing errors that occur when JSX syntax is used in a non-tsx file.
export const AtemiLogo: React.ReactElement = React.createElement('svg',
  { viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement('path', { d: "M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z", fill: "url(#paint0_linear_1_2)" }),
  React.createElement('path', { d: "M50 10L86.6 30V70L50 90L13.4 70V30L50 10Z", stroke: "#00E676", strokeWidth: "3" }),
  React.createElement('text', { x: "50", y: "58", fontFamily: "Bahnschrift, Segoe UI, sans-serif", fontSize: "30", fill: "#FFFFFF", textAnchor: "middle", fontWeight: "bold" }, 'A'),
  React.createElement('defs', null,
    React.createElement('linearGradient', { id: "paint0_linear_1_2", x1: "50", y1: "0", x2: "50", y2: "100", gradientUnits: "userSpaceOnUse" },
      React.createElement('stop', { stopColor: "#9B1B30" }),
      React.createElement('stop', { offset: "1", stopColor: "#6a1322" })
    )
  )
);