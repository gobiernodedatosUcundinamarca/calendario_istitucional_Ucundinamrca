/**
 * Catálogos del calendario institucional.
 *
 * Los nombres de cada lista se convierten en tipos de TypeScript, así que una
 * actividad con una sede, unidad, responsable o categoría que no esté aquí no compila.
 * Las sedes, unidades líder y categorías son las del «Formato Calendario Institucional - Áreas».
 */
import type { ColorTipo } from '@/features/calendario/tipos';
import { responsables } from './responsables';

export { responsables };

export const configuracion = {
  /** La página le agrega los años de las actividades cargadas (ej. «· 2026» o «· 2026–2027»). */
  subtitulo: 'Universidad de Cundinamarca',
  /** Colorear las actividades según su tipo (false = todas en gris neutro). */
  colorPorTipo: true,
};

/** Sede, seccionales, extensiones y oficinas (ucundinamarca.edu.co). */
export const unidadesRegionales = [
  'Fusagasugá',
  'Girardot',
  'Ubaté',
  'Chía',
  'Facatativá',
  'Soacha',
  'Zipaquirá',
  'Bogotá D.C.',
] as const;

export const unidadesLider = [
  'Vicerrectoría Académica',
  'Vicerrectoría Administrativa y Financiera',
  'Secretaría General',
] as const;

/** Calendario en el que se publica cada actividad (columna «Calendario» del formato). */
export const calendarios = ['Académico', 'Administrativo'] as const;

/**
 * Tipos = grupos de categorías, uno por color. solido = punto/borde, fondo = relleno,
 * texto = texto sobre el fondo. «Otro» usa los neutros del sistema de diseño.
 */
export const tiposActividad = {
  'Órganos colegiados': { solido: '#007B3E', fondo: '#dcefe4', texto: '#00482B' },
  'Reuniones y gestión': { solido: '#DAAA00', fondo: '#fdf3c2', texto: '#5c4700' },
  'Formación y academia': { solido: '#00A99D', fondo: '#d6f1ee', texto: '#00564f' },
  'Procesos institucionales': { solido: '#F7931E', fondo: '#fde6cc', texto: '#7a4300' },
  'Bienestar y comunidad': { solido: '#79C000', fondo: '#e7f4d0', texto: '#3a5c00' },
  'Otro': { solido: '#6f7672', fondo: '#edf1ee', texto: '#232524' },
} as const satisfies Record<string, ColorTipo>;

/** Categorías del formato y el tipo (color) al que pertenece cada una. */
export const categorias = {
  'Comité': 'Órganos colegiados',
  'Consejo': 'Órganos colegiados',
  'Comisión': 'Órganos colegiados',
  'Reunión': 'Reuniones y gestión',
  'Mesa de trabajo': 'Reuniones y gestión',
  'Actividad administrativa': 'Reuniones y gestión',
  'Auditoría / Control': 'Reuniones y gestión',
  'Capacitación / Taller': 'Formación y academia',
  'Seminario / Conferencia / Foro': 'Formación y academia',
  'Encuentro': 'Formación y academia',
  'Actividad académica': 'Formación y academia',
  'Proceso electoral': 'Procesos institucionales',
  'Registro, admisiones y grados': 'Procesos institucionales',
  'Jornada / Conmemoración': 'Bienestar y comunidad',
  'Cultura': 'Bienestar y comunidad',
  'Deporte': 'Bienestar y comunidad',
  'Salud y bienestar': 'Bienestar y comunidad',
  'Equidad y diversidad': 'Bienestar y comunidad',
  'Otro': 'Otro',
} as const satisfies Record<string, keyof typeof tiposActividad>;

export type UnidadRegional = (typeof unidadesRegionales)[number];
export type UnidadLider = (typeof unidadesLider)[number];
export type TipoCalendario = (typeof calendarios)[number];
export type Responsable = (typeof responsables)[number];
export type TipoActividad = keyof typeof tiposActividad;
export type Categoria = keyof typeof categorias;
