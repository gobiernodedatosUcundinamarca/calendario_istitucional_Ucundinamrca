import { filtrosVacios } from '../lib/actividades';
import type { Filtros, GrupoFiltro, Vista } from '../tipos';

export interface EstadoCalendario {
  /** null = vista por defecto (Mes en escritorio, Agenda en móvil). */
  vista: Vista | null;
  /** Día de referencia del periodo visible. null = hoy. */
  ancla: string | null;
  filtros: Filtros;
  /** id de la actividad abierta en el detalle. */
  seleccion: string | null;
  menuExportar: boolean;
  /** Hoja inferior de filtros (solo móvil). */
  hojaFiltros: boolean;
}

export type AccionCalendario =
  | { tipo: 'vista'; vista: Vista }
  | { tipo: 'ir'; ancla: string | null; vista?: Vista }
  | { tipo: 'filtros'; cambios: Partial<Filtros> }
  | { tipo: 'alternar'; grupo: GrupoFiltro; valor: string }
  | { tipo: 'limpiar' }
  | { tipo: 'seleccionar'; id: string | null }
  | { tipo: 'menuExportar'; abierto: boolean }
  | { tipo: 'hojaFiltros'; abierta: boolean };

export const estadoInicial = (): EstadoCalendario => ({
  vista: null,
  ancla: null,
  filtros: filtrosVacios(),
  seleccion: null,
  menuExportar: false,
  hojaFiltros: false,
});

export function reductor(estado: EstadoCalendario, accion: AccionCalendario): EstadoCalendario {
  switch (accion.tipo) {
    case 'vista':
      return { ...estado, vista: accion.vista, menuExportar: false };
    case 'ir':
      return { ...estado, ancla: accion.ancla, vista: accion.vista ?? estado.vista };
    case 'filtros':
      return { ...estado, filtros: { ...estado.filtros, ...accion.cambios } };
    case 'alternar': {
      const actuales = estado.filtros[accion.grupo];
      const siguientes = actuales.includes(accion.valor) ? actuales.filter((v) => v !== accion.valor) : [...actuales, accion.valor];
      return { ...estado, filtros: { ...estado.filtros, [accion.grupo]: siguientes } };
    }
    case 'limpiar':
      return { ...estado, filtros: filtrosVacios() };
    case 'seleccionar':
      return { ...estado, seleccion: accion.id, menuExportar: false };
    case 'menuExportar':
      return { ...estado, menuExportar: accion.abierto };
    case 'hojaFiltros':
      return { ...estado, hojaFiltros: accion.abierta, menuExportar: false };
  }
}
