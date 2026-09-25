import { porInicio, seSolapa } from '../../lib/actividades';
import { aClave, lunesDe, sumarDias } from '../../lib/fechas';
import type { Actividad } from '../../tipos';

export interface CeldaMes {
  clave: string;
  dia: number;
  mes: number;
  enMes: boolean;
  finDeSemana: boolean;
  esHoy: boolean;
  actividades: Actividad[];
}

/** Rejilla de 5 o 6 semanas (lunes a domingo) que cubre el mes. */
export function construirMes(actividades: readonly Actividad[], anio: number, mes: number, hoy: string): CeldaMes[] {
  const inicio = lunesDe(new Date(anio, mes, 1));
  const celdas: CeldaMes[] = Array.from({ length: 42 }, (_, i) => {
    const fecha = sumarDias(inicio, i);
    const clave = aClave(fecha);
    return {
      clave,
      dia: fecha.getDate(),
      mes: fecha.getMonth(),
      enMes: fecha.getMonth() === mes,
      finDeSemana: i % 7 > 4,
      esHoy: clave === hoy,
      actividades: actividades.filter((a) => seSolapa(a, clave, clave)).sort(porInicio),
    };
  });
  return celdas.slice(35).some((c) => c.enMes) ? celdas : celdas.slice(0, 35);
}
