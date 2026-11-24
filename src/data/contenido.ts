// Todo el texto de la experiencia. No se incluyen resultados, cifras ni aprobaciones inexistentes.

export const AUTORAS = ['Ana Sofía Casas', 'Alejandra Gómez Gutiérrez'];

export type EscenaId =
  | 'intro' | 'hero' | 'origen' | 'oportunidad' | 'metodo' | 'pilotos'
  | 'cronograma' | 'lab' | 'evaluacion' | 'ruta' | 'final';

// len = alto de scroll en pantallas
export const ESCENAS: { id: EscenaId; n: string; nombre: string; len: number; min: number }[] = [
  { id: 'intro', n: '00', nombre: 'urbia', len: 1.4, min: 0.5 },
  { id: 'hero', n: '01', nombre: 'La arquitectura evoluciona', len: 3.2, min: 1.5 },
  { id: 'origen', n: '02', nombre: 'Origen de la propuesta', len: 1.6, min: 1.5 },
  { id: 'oportunidad', n: '03', nombre: 'La oportunidad', len: 1.6, min: 1.5 },
  { id: 'metodo', n: '04', nombre: 'Metodología', len: 2.2, min: 1.5 },
  { id: 'pilotos', n: '05', nombre: 'Cuatro proyectos piloto', len: 6.2, min: 4 },
  { id: 'cronograma', n: '06', nombre: 'Cronograma', len: 1.6, min: 1.5 },
  { id: 'lab', n: '07', nombre: 'Laboratorio', len: 1.6, min: 1.5 },
  { id: 'evaluacion', n: '08', nombre: 'Evaluación', len: 1.6, min: 1 },
  { id: 'ruta', n: '09', nombre: 'Implementación', len: 2.2, min: 1 },
  { id: 'final', n: '10', nombre: 'Ecosistema', len: 1.6, min: 0.5 },
];

export const HERO = {
  titulo: ['La arquitectura evoluciona.', 'Su enseñanza también.'],
  sub: 'Una propuesta para integrar tecnologías emergentes en los procesos proyectuales de Arquitectura.',
  boton: 'Explorar propuesta',
  etapas: ['Línea', 'Planta', 'Estructura', 'Sistema'],
};

export const ORIGEN = {
  titulo: 'De una experiencia académica a una oportunidad institucional.',
  texto:
    'Modelamiento Dinámico nos permitió explorar nuevas maneras de comprender, estudiar, representar y comunicar la arquitectura. Esta propuesta busca llevar ese conocimiento a otros proyectos de la carrera: no como una nueva asignatura ni como un cambio curricular, sino como una intervención transversal coordinada con los profesores de cada proyecto.',
  nodos: [
    { id: 'prog', nombre: 'Programación aplicada', texto: 'Escribir código como herramienta de diseño: automatizar, generar alternativas y construir herramientas propias.' },
    { id: 'modd', nombre: 'Modelamiento dinámico', texto: 'Representar sistemas que cambian en el tiempo: flujos, retroalimentaciones, estados y escenarios.' },
    { id: 'web', nombre: 'Desarrollo web', texto: 'Publicar el proyecto como una experiencia navegable, accesible desde cualquier dispositivo.' },
    { id: 'sim', nombre: 'Simulación', texto: 'Ensayar el comportamiento de un espacio, territorio o sistema antes de decidir.' },
    { id: 'viz', nombre: 'Visualización de información', texto: 'Convertir datos en lecturas espaciales claras para el análisis y la comunicación.' },
    { id: 'comp', nombre: 'Sistemas complejos', texto: 'Comprender la ciudad y el territorio como redes de actores, relaciones y escalas.' },
    { id: 'inter', nombre: 'Herramientas interactivas', texto: 'Interfaces donde el usuario manipula variables y observa consecuencias en tiempo real.' },
  ],
  // relaciones conceptuales entre conocimientos (no son datos medidos)
  enlaces: [
    ['prog', 'modd'], ['prog', 'web'], ['prog', 'sim'], ['prog', 'inter'], ['modd', 'sim'], ['modd', 'comp'],
    ['web', 'inter'], ['web', 'viz'], ['sim', 'viz'], ['viz', 'comp'], ['comp', 'sim'], ['inter', 'viz'],
  ] as [string, string][],
};

export const OPORTUNIDAD = {
  titulo: 'Una oportunidad para liderar nuevas formas de formación arquitectónica.',
  texto:
    'Las tecnologías emergentes ya transforman la práctica. Integrarlas en los procesos proyectuales es una oportunidad para que la Javeriana se posicione como referente de innovación pedagógica en la formación arquitectónica.',
  comparaciones: [
    { id: 'carto', a: 'Cartografía convencional', b: 'Cartografía dinámica', ayuda: 'Arrastre el divisor. A la derecha, mueva el cursor para cambiar el punto de análisis y use el control de hora.' },
    { id: 'modelo', a: 'Modelo estático', b: 'Modelo interactivo', ayuda: 'Arrastre sobre el lado derecho para girar el volumen y ajuste los pisos.' },
    { id: 'simu', a: 'Representación', b: 'Simulación', ayuda: 'Cambie la hora: las sombras se calculan a partir de la posición solar.' },
    { id: 'analisis', a: 'Análisis descriptivo', b: 'Análisis computacional', ayuda: 'Haga clic en el plano para ubicar equipamientos. La cobertura se recalcula.' },
    { id: 'presen', a: 'Presentación tradicional', b: 'Experiencia inmersiva', ayuda: 'Mueva el cursor sobre el lado derecho para recorrer la profundidad.' },
  ],
};

export const METODO = {
  titulo: 'Aprender tecnología haciendo arquitectura.',
  nota: 'Los workshops se articulan con los tiempos, contenidos y objetivos definidos por los profesores responsables de cada proyecto.',
  capas: [
    { n: '01', t: 'Identificar una necesidad del proyecto', d: 'Junto al profesor se reconoce un problema del proyecto donde una herramienta puede ampliar la comprensión o la capacidad de decisión.', ej: ['¿Qué no podemos ver hoy?', '¿Qué decisión necesita evidencia?', '¿Qué debe comunicarse mejor?'] },
    { n: '02', t: 'Seleccionar una tecnología pertinente', d: 'Se elige la tecnología por su pertinencia para el problema, no por novedad. Se prioriza lo que los estudiantes puedan apropiar en pocas semanas.', ej: ['Programación', 'Simulación', 'Cartografía dinámica', 'Visualización 3D'] },
    { n: '03', t: 'Desarrollar un ejercicio práctico guiado', d: 'Un ejercicio paso a paso que reproduce el problema del proyecto con datos y geometrías del propio taller.', ej: ['Sesión guiada', 'Trabajo por equipos', 'Material de apoyo reutilizable'] },
    { n: '04', t: 'Aplicar la herramienta al proyecto', d: 'Cada equipo adapta lo aprendido a su propuesta. La herramienta informa decisiones, no las reemplaza.', ej: ['Prototipo propio', 'Asesorías', 'Integración en entregas'] },
    { n: '05', t: 'Evaluar y documentar los resultados', d: 'Se evalúa con estudiantes y profesores y se documenta para que otros talleres puedan replicarlo.', ej: ['Indicadores del piloto', 'Repositorio abierto', 'Guía replicable'] },
  ],
};

export type PilotoId = 'habitat' | 'urbanos' | 'patrimonio' | 'territorios';

export const PILOTOS: {
  id: PilotoId; n: string; nombre: string; profesor: string; escenario: string;
  workshops: string[]; demo: string; entregable: string; color: string; transicion: string;
}[] = [
  {
    id: 'habitat', n: '01', nombre: 'Hábitat del Siglo XXI', profesor: 'Gonzalo Correal', color: '#D5FF3F',
    escenario: 'Conjunto habitacional con variables ambientales y espaciales manipulables.',
    workshops: ['Programación aplicada al diseño', 'Simulación del comportamiento espacial', 'Exploración de alternativas habitacionales', 'Visualización de variables ambientales', 'Desarrollo de herramientas interactivas'],
    demo: 'Un modelo de vivienda que se transforma al modificar ocupación, orientación, iluminación o configuración espacial.',
    entregable: 'Prototipo interactivo aplicado al proyecto de hábitat.',
    transicion: 'El modelo se descompone en módulos habitacionales.',
  },
  {
    id: 'urbanos', n: '02', nombre: 'Centros Urbanos', profesor: 'Juan Jacobo Molina', color: '#304FFE',
    escenario: 'Ciudad con redes, edificios, infraestructuras y sistemas ambientales.',
    workshops: ['Cartografía interactiva', 'Análisis territorial mediante programación', 'Visualización de datos urbanos', 'Teoría de redes', 'Simulación de escenarios urbanos'],
    demo: 'Una ciudad donde se activan y desactivan capas de movilidad, equipamientos, espacio público, estructura ecológica y usos; las relaciones entre sistemas se actualizan.',
    entregable: 'Plataforma interactiva de análisis urbano.',
    transicion: 'La cámara se eleva y los edificios se convierten en una red urbana.',
  },
  {
    id: 'patrimonio', n: '03', nombre: 'Patrimonio', profesor: 'Ernesto Moure', color: '#F4F3EF',
    escenario: 'Estructura patrimonial que se reconstruye mediante una nube de puntos y geometrías tridimensionales.',
    workshops: ['Digitalización arquitectónica', 'Visualización tridimensional', 'Recorridos virtuales', 'Narrativas espaciales', 'Plataformas de divulgación patrimonial'],
    demo: 'Un edificio patrimonial que alterna entre representación histórica, levantamiento digital, modelo tridimensional y recorrido interactivo.',
    entregable: 'Experiencia digital de interpretación patrimonial.',
    transicion: 'La geometría se fragmenta en una nube de puntos y se reconstruye.',
  },
  {
    id: 'territorios', n: '04', nombre: 'Nuevos Territorios', profesor: 'Por coordinar con la Facultad', color: '#4FD1C5',
    escenario: 'Territorio con topografía, cuerpos de agua, vegetación, asentamientos y condiciones ambientales. Caso demostrativo posible: Tierra Bomba, sujeto a los alcances del proyecto académico.',
    workshops: ['Simulación ambiental y territorial', 'Cartografía de sistemas socioecológicos', 'Visualización de variables climáticas', 'Herramientas de participación comunitaria', 'Simulación de estrategias arquitectónicas', 'Interfaces accesibles para comunidades'],
    demo: 'Un territorio interactivo donde se activan estrategias de agua, energía, vegetación, infraestructura, equipamientos y condiciones ambientales.',
    entregable: 'Simulador territorial interactivo aplicado a una problemática real.',
    transicion: 'La red digital se transforma en curvas de nivel, topografía, vegetación y paisaje.',
  },
];

export const INDICADORES = [
  { id: 'part', t: 'Participación estudiantil', como: 'Asistencia por sesión sobre estudiantes inscritos en el taller.', instrumento: 'Registro de asistencia', momento: 'Cada sesión', tipo: 'serie' },
  { id: 'fin', t: 'Finalización de ejercicios', como: 'Ejercicios guiados entregados sobre ejercicios propuestos.', instrumento: 'Repositorio de entregas', momento: 'Semanas 3 y 4', tipo: 'embudo' },
  { id: 'apl', t: 'Aplicación efectiva al proyecto', como: 'Proyectos que incorporan la herramienta en una decisión documentada, valorados con rúbrica por el profesor.', instrumento: 'Rúbrica del profesor', momento: 'Semana 5', tipo: 'embudo' },
  { id: 'comp', t: 'Desarrollo de competencias tecnológicas', como: 'Autoevaluación antes y después en cinco competencias (escala 1–5).', instrumento: 'Encuesta pre / post', momento: 'Semanas 1 y 6', tipo: 'radar' },
  { id: 'pert', t: 'Pertinencia académica', como: 'Grado en que el workshop respondió a la necesidad identificada en la semana 1.', instrumento: 'Entrevista al profesor', momento: 'Semana 6', tipo: 'escala' },
  { id: 'prof', t: 'Valoración de los profesores', como: 'Valoración en escala Likert de utilidad, carga y coordinación.', instrumento: 'Encuesta a profesores', momento: 'Semana 6', tipo: 'escala' },
  { id: 'rep', t: 'Capacidad de replicación', como: 'Existencia de material documentado que otro taller pueda reutilizar sin las autoras.', instrumento: 'Lista de verificación', momento: 'Cierre', tipo: 'check' },
  { id: 'cont', t: 'Continuidad de las herramientas', como: 'Uso de las herramientas desarrolladas en entregas posteriores o semestres siguientes.', instrumento: 'Seguimiento', momento: '3 y 6 meses después', tipo: 'serie' },
];

export const RUTA = [
  { t: 'Coordinación con la Facultad', d: 'Presentación de la propuesta a la dirección y acuerdo de alcances del piloto.', recursos: ['Reunión con la dirección', 'Documento de propuesta'], pendiente: 'Definir instancias de aprobación y acompañamiento.' },
  { t: 'Selección de proyectos', d: 'Confirmación de las asignaturas piloto y de su semestre de ejecución.', recursos: ['Lista de proyectos candidatos'], pendiente: 'Confirmar profesor responsable de Nuevos Territorios.' },
  { t: 'Articulación con profesores', d: 'Ajuste del cronograma de seis semanas a los tiempos de cada asignatura.', recursos: ['Cronograma configurable', 'Matriz necesidad–tecnología'], pendiente: 'Concertar sesiones, horarios y espacios.' },
  { t: 'Ejecución de workshops', d: 'Desarrollo de las sesiones guiadas y del acompañamiento a los equipos.', recursos: ['Salas con equipos', 'Software libre o licenciado', 'Material de apoyo'], pendiente: 'Definir disponibilidad de salas y licencias.' },
  { t: 'Evaluación', d: 'Aplicación de los indicadores y documentación del piloto.', recursos: ['Instrumentos de evaluación', 'Repositorio'], pendiente: 'Validar instrumentos con la Facultad.' },
  { t: 'Posible ampliación', d: 'Decisión institucional sobre continuidad o ampliación a otros talleres, según los resultados.', recursos: ['Informe de evaluación'], pendiente: 'Depende de la evaluación del piloto.' },
];

export const FINAL = {
  titulo: ['Cuatro proyectos.', 'Nuevas herramientas.', 'Una oportunidad para transformar la formación arquitectónica.'],
  sub: 'Propuesta de articulación de workshops de tecnologías emergentes dentro de las asignaturas proyectuales de Arquitectura.',
};

export const AVISO = 'Propuesta en discusión. No está aprobada por la Facultad.';
