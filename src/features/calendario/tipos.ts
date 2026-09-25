import type { Responsable, TipoActividad, UnidadLider, UnidadRegional } from '@/datos/catalogos';

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

export type EstadoActividad = 'Programada' | 'En curso' | 'Finalizada' | 'Aplazada';

/** Actividad tal como se escribe en src/datos/actividades.ts. */
export interface ActividadFuente {
  nombre: string;
  tipo: TipoActividad;
  inicio: FechaISO;
  fin: FechaISO;
  hora?: Hora;
  responsable: Responsable;
  lider: UnidadLider;
  regionales: 'todas' | readonly UnidadRegional[];
  documento?: string;
  enlace?: string;
  estado?: EstadoActividad;
}

/** Actividad normalizada que usan las vistas. */
export interface Actividad {
  id: string;
  nombre: string;
  tipo: string;
  inicio: string;
  fin: string;
  /** '' = todo el día. */
  hora: string;
  responsable: string;
  lider: string;
  regionales: readonly string[];
  todasLasRegionales: boolean;
  documento: string;
  enlace: string;
  estadoFijo: EstadoActividad | null;
  color: ColorTipo;
}

export interface Catalogos {
  subtitulo: string;
  colorPorTipo: boolean;
  unidadesRegionales: readonly string[];
  unidadesLider: readonly string[];
  responsables: readonly string[];
  tipos: Readonly<Record<string, ColorTipo>>;
}

export type Vista = 'mes' | 'semana' | 'agenda' | 'linea' | 'anio';

export type GrupoFiltro = 'regionales' | 'lideres' | 'responsables' | 'tipos';

export interface Filtros extends Record<GrupoFiltro, readonly string[]> {
  texto: string;
  /** '' = sin límite. */
  desde: string;
  hasta: string;
}
