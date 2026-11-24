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
  { titulo: 'Tesis Tierra Bomba · adaptación frente a la pérdida de suelo costero', url: 'https://alejagoguti-cpu.github.io/tesis_tercer_corte/', nota: 'Alejandra Gómez y Ana Casas, 2026' },
  { titulo: 'Simulador Kennedy', url: 'https://alejagoguti-cpu.github.io/simulador-kennedy/', confirmar: true },
  { titulo: 'Red de problemas Kennedy', url: 'https://alejagoguti-cpu.github.io/red-de-problemas-kennedy/', confirmar: true },
  { titulo: 'Macromodelos Kennedy', url: 'https://alejagoguti-cpu.github.io/macromodelos-kennedy/', confirmar: true },
  { titulo: 'Estrategias Tierra Bomba', url: 'https://alejagoguti-cpu.github.io/estrategias/', confirmar: true },
  { titulo: 'Espacio disponible', nota: 'Agregue aquí un proyecto de Modelamiento Dinámico.' },
  { titulo: 'Espacio disponible', nota: 'Agregue aquí un proyecto de Modelamiento Dinámico.' },
];
