import { aFecha, indiceSemana, mesCorto, nombreDia } from '../../lib/fechas';
import type { Actividad } from '../../tipos';

export interface GrupoAgenda {
  clave: string;
  dia: number;
  nombreDia: string;
  mes: string;
  esHoy: boolean;
  actividades: Actividad[];
}

/**
 * Agrupa por día de inicio. Las que empezaron antes del periodo quedan en su primer día.
 * `actividades` debe venir ya filtrada al periodo y ordenada por inicio.
 */
export function construirAgenda(actividades: readonly Actividad[], desde: string, hoy: string): GrupoAgenda[] {
  const grupos = new Map<string, Actividad[]>();
  for (const a of actividades) {
    const clave = a.inicio < desde ? desde : a.inicio;
    grupos.set(clave, [...(grupos.get(clave) ?? []), a]);
  }
  return [...grupos.keys()].sort().map((clave) => {
    const fecha = aFecha(clave);
    return {
      clave,
      dia: fecha.getDate(),
      nombreDia: nombreDia(indiceSemana(fecha)),
      mes: mesCorto(fecha.getMonth()),
      esHoy: clave === hoy,
      actividades: grupos.get(clave) ?? [],
    };
  });
}
