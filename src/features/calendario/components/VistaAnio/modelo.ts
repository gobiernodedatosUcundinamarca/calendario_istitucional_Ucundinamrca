import { esLarga, seSolapa } from '../../lib/actividades';
import { aClave, aFecha, capitalizar, lunesDe, MESES, sumarDias } from '../../lib/fechas';
import type { Actividad } from '../../tipos';

/** 0 = sin actividades puntuales … 4 = el cuartil más alto. */
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

export interface ModeloAnio {
  meses: MesAnio[];
  /** Rango de actividades por día de cada nivel (1 a 4), para la leyenda. */
  rangos: [string, string, string, string];
}

/**
 * Actividades por día del año. Las de una semana o más (campañas, convocatorias) no cuentan:
 * ocupan todos los días y taparían la diferencia entre días tranquilos y días llenos.
 */
function contarPorDia(actividades: readonly Actividad[], anio: number): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const a of actividades) {
    if (esLarga(a)) continue;
    for (let f = aFecha(a.inicio), fin = aFecha(a.fin); f <= fin; f = sumarDias(f, 1)) {
      if (f.getFullYear() !== anio) continue;
      const clave = aClave(f);
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    }
  }
  return conteo;
}

/** Límites superiores de los niveles 1, 2 y 3 según los cuartiles de los días con actividades. */
function umbrales(conteos: Iterable<number>): [number, number, number] {
  const valores = [...conteos].filter((v) => v > 0).sort((x, y) => x - y);
  const cuartil = (p: number) => valores[Math.floor(p * (valores.length - 1))] ?? 1;
  const u1 = Math.max(cuartil(0.25), 1);
  const u2 = Math.max(cuartil(0.5), u1 + 1);
  const u3 = Math.max(cuartil(0.75), u2 + 1);
  return [u1, u2, u3];
}

const rango = (desde: number, hasta: number) => (desde === hasta ? `${desde}` : `${desde}–${hasta}`);

export function construirAnio(actividades: readonly Actividad[], anio: number, hoy: string): ModeloAnio {
  const porDia = contarPorDia(actividades, anio);
  const [u1, u2, u3] = umbrales(porDia.values());
  const nivel = (c: number): NivelDensidad => (c === 0 ? 0 : c <= u1 ? 1 : c <= u2 ? 2 : c <= u3 ? 3 : 4);

  const meses = MESES.map((nombre, indice) => {
    const primero = new Date(anio, indice, 1);
    const inicio = lunesDe(primero);
    const celdas = Array.from({ length: 42 }, (_, i): CeldaAnio => {
      const f = sumarDias(inicio, i);
      const clave = aClave(f);
      const enMes = f.getMonth() === indice;
      return { clave, dia: enMes ? f.getDate() : null, nivel: enMes ? nivel(porDia.get(clave) ?? 0) : 0, esHoy: enMes && clave === hoy };
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

  return { meses, rangos: [rango(1, u1), rango(u1 + 1, u2), rango(u2 + 1, u3), `${u3 + 1} o más`] };
}
