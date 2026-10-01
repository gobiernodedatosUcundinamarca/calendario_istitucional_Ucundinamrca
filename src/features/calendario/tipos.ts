import type { Categoria, Responsable, TipoCalendario, UnidadLider, UnidadRegional } from '@/datos/catalogos';

/** Fecha "AAAA-MM-DD" en hora local. */
export type FechaISO = `${number}-${number}-${number}`;
/** Hora "HH:MM" en formato 24 h. */
export type Hora = `${number}:${number}`;

export interface ColorTipo {
  /** Punto, borde y barra. */
  solido: string;
  /** Relleno de píldoras y tarjetas. */
  fondo: string;
  /** Texto sobre `fondo`. */
  texto: string;
}

export type EstadoActividad = 'Programada' | 'En curso' | 'Finalizada';

/** Actividad tal como se escribe en src/datos/actividades.ts. */
export interface ActividadFuente {
  nombre: string;
  /** Una de `categorias`; define el tipo (y el color). */
  categoria: Categoria;
  /** Línea, programa o serie a la que pertenece (texto libre del formato). */
  subcategoria?: string;
  /** Calendario académico o administrativo. */
  calendario: TipoCalendario;
  inicio: FechaISO;
  fin: FechaISO;
  hora?: Hora;
  /** Solo junto con `hora`, y posterior a ella. */
  horaFin?: Hora;
  responsable: Responsable;
  lider: UnidadLider;
  regionales: 'todas' | readonly UnidadRegional[];
  lugar?: string;
  observaciones?: string;
}

/** Actividad normalizada que usan las vistas. */
export interface Actividad {
  id: string;
  nombre: string;
  categoria: string;
  /** '' = sin subcategoría. */
  subcategoria: string;
  /** Grupo de la categoría (color y filtro «Tipo de actividad»). */
  tipo: string;
  calendario: string;
  inicio: string;
  fin: string;
  /** '' = todo el día. */
  hora: string;
  /** '' = sin hora de fin. */
  horaFin: string;
  responsable: string;
  lider: string;
  regionales: readonly string[];
  todasLasRegionales: boolean;
  lugar: string;
  observaciones: string;
  color: ColorTipo;
}

export interface Catalogos {
  subtitulo: string;
  colorPorTipo: boolean;
  unidadesRegionales: readonly string[];
  unidadesLider: readonly string[];
  calendarios: readonly string[];
  responsables: readonly string[];
  tipos: Readonly<Record<string, ColorTipo>>;
  /** Categoría → tipo. */
  categorias: Readonly<Record<string, string>>;
}

export type Vista = 'mes' | 'semana' | 'agenda' | 'linea' | 'anio';

export type GrupoFiltro = 'regionales' | 'calendarios' | 'lideres' | 'responsables' | 'tipos';

export interface Filtros extends Record<GrupoFiltro, readonly string[]> {
  texto: string;
  /** '' = sin límite. */
  desde: string;
  hasta: string;
}
