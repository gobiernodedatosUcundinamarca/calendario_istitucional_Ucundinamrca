import { seSolapa } from '../../lib/actividades';
import { aClave, aFecha, capitalizar, lunesDe, MESES, sumarDias } from '../../lib/fechas';
import type { Actividad } from '../../tipos';

/** 0 = sin actividades … 4 = cuatro o más el mismo día. */
export type NivelDensidad = 0 | 1 | 2 | 3 | 4;

export interface CeldaAnio {
  clave: string;
  /** null = relleno fuera del mes. */
  dia: number | null;
  nivel: NivelDensidad;
  esHoy: boolean;
}

export interface MesAnio {
  indice: number;
  nombre: string;
  primerDia: string;
  total: number;
  celdas: CeldaAnio[];
}

/** Actividades por día del año (una actividad de varios días cuenta en cada día). */
function contarPorDia(actividades: readonly Actividad[], anio: number): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const a of actividades) {
    for (let f = aFecha(a.inicio), fin = aFecha(a.fin); f <= fin; f = sumarDias(f, 1)) {
      if (f.getFullYear() !== anio) continue;
      const clave = aClave(f);
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    }
  }
  return conteo;
}

export function construirAnio(actividades: readonly Actividad[], anio: number, hoy: string): MesAnio[] {
  const porDia = contarPorDia(actividades, anio);
  return MESES.map((nombre, indice) => {
    const primero = new Date(anio, indice, 1);
    const inicio = lunesDe(primero);
    const celdas = Array.from({ length: 42 }, (_, i): CeldaAnio => {
      const f = sumarDias(inicio, i);
      const clave = aClave(f);
      const enMes = f.getMonth() === indice;
      return {
        clave,
        dia: enMes ? f.getDate() : null,
        nivel: enMes ? (Math.min(porDia.get(clave) ?? 0, 4) as NivelDensidad) : 0,
        esHoy: enMes && clave === hoy,
      };
    });
    const primerDia = aClave(primero);
    const ultimoDia = aClave(new Date(anio, indice + 1, 0));
    return {
      indice,
      nombre: capitalizar(nombre),
      primerDia,
      total: actividades.filter((a) => seSolapa(a, primerDia, ultimoDia)).length,
      celdas,
    };
  });
}
