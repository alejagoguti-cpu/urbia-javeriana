// ESPACIOS CONFIGURABLES para los proyectos reales de las autoras.
// Edite esta lista: titulo, url (se abre / se incrusta), imagen opcional (ruta en /public), glb opcional.
// `confirmar: true` muestra la etiqueta "por confirmar" hasta que las autoras validen el contenido.
export type ProyectoAutoras = {
  titulo: string;
  url?: string;
  imagen?: string;
  glb?: string; // modelo comprimido (Draco/Meshopt) en /public/modelos
  nota?: string;
  confirmar?: boolean;
};

export const PROYECTOS_AUTORAS: ProyectoAutoras[] = [
  { titulo: 'Simulador Kennedy', url: 'https://alejagoguti-cpu.github.io/simulador-kennedy/', confirmar: true },
  { titulo: 'Red de problemas Kennedy', url: 'https://alejagoguti-cpu.github.io/red-de-problemas-kennedy/', confirmar: true },
  { titulo: 'Macromodelos Kennedy', url: 'https://alejagoguti-cpu.github.io/macromodelos-kennedy/', confirmar: true },
  { titulo: 'Estrategias Tierra Bomba', url: 'https://alejagoguti-cpu.github.io/estrategias/', confirmar: true },
  { titulo: 'Espacio disponible', nota: 'Agregue aquí un proyecto de Modelamiento Dinámico.' },
  { titulo: 'Espacio disponible', nota: 'Agregue aquí un proyecto de Modelamiento Dinámico.' },
];
