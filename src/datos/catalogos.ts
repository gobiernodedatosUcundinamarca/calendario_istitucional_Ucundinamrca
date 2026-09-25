/**
 * Catálogos del calendario. DATOS DE EJEMPLO del diseño: reemplázalos por los oficiales.
 *
 * Los nombres de cada lista se convierten en tipos de TypeScript, así que una
 * actividad con una unidad, responsable o tipo que no esté aquí no compila.
 */
import type { ColorTipo } from '@/features/calendario/tipos';

export const configuracion = {
  subtitulo: 'Universidad de Cundinamarca · 2026',
  /** Colorear las actividades según su tipo (false = todas en gris neutro). */
  colorPorTipo: true,
};

export const unidadesRegionales = [
  'Fusagasugá',
  'Girardot',
  'Ubaté',
  'Chía',
  'Chocontá',
  'Facatativá',
  'Soacha',
  'Zipaquirá',
  'Bogotá D.C.',
] as const;

export const unidadesLider = [
  'Vicerrectoría Académica',
  'Vicerrectoría Administrativa y Financiera',
  'Dirección de Planeación Institucional',
  'Dirección de Investigación',
  'Bienestar Universitario',
  'Admisiones y Registro',
  'Interacción Social Universitaria',
  'Autoevaluación y Acreditación',
] as const;

export const responsables = [
  'María Fernanda Rojas',
  'Carlos Andrés Peña',
  'Luisa Moreno Díaz',
  'Jorge Iván Castillo',
  'Diana Marcela Ruiz',
  'Andrés Felipe Gómez',
  'Paula Andrea Vargas',
  'Ricardo Salazar Ortiz',
] as const;

/** Colores por tipo: solido = punto/borde, fondo = relleno, texto = texto sobre el fondo. */
export const tiposActividad = {
  'Académica': { solido: '#007B3E', fondo: '#dcefe4', texto: '#00482B' },
  'Administrativa': { solido: '#DAAA00', fondo: '#fdf3c2', texto: '#5c4700' },
  'Evento': { solido: '#00A99D', fondo: '#d6f1ee', texto: '#00564f' },
  'Convocatoria': { solido: '#F7931E', fondo: '#fde6cc', texto: '#7a4300' },
  'Institucional': { solido: '#79C000', fondo: '#e7f4d0', texto: '#3a5c00' },
} as const satisfies Record<string, ColorTipo>;

export type UnidadRegional = (typeof unidadesRegionales)[number];
export type UnidadLider = (typeof unidadesLider)[number];
export type Responsable = (typeof responsables)[number];
export type TipoActividad = keyof typeof tiposActividad;
