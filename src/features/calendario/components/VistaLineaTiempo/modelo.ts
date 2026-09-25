import { aClave, aFecha, indiceSemana } from '../../lib/fechas';
import type { Actividad } from '../../tipos';

export interface DiaLinea {
  dia: number;
  letra: string;
  finDeSemana: boolean;
  esHoy: boolean;
}

export interface BarraLinea {
  actividad: Actividad;
  /** Columna de inicio (1 = día 1) y columna final exclusiva, para grid-column. */
  desde: number;
  hasta: number;
  carril: number;
}

export interface UnidadLinea {
  nombre: string;
  barras: BarraLinea[];
  carriles: number;
}

export interface ModeloLinea {
  dias: DiaLinea[];
  /** Día de hoy dentro del mes (0 si hoy no está en este mes). */
  diaHoy: number;
  unidades: UnidadLinea[];
}

const LETRAS = 'LMMJVSD';

/**
 * Una fila por unidad líder; cada actividad es una barra del día de inicio al de fin.
 * Las que se cruzan bajan a otro carril. `actividades` debe venir ordenada por inicio.
 */
export function construirLinea(actividades: readonly Actividad[], anio: number, mes: number, hoy: string, unidades: readonly string[]): ModeloLinea {
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const primerDia = aClave(new Date(anio, mes, 1));
  const ultimoDia = aClave(new Date(anio, mes, totalDias));
  const diaHoy = hoy >= primerDia && hoy <= ultimoDia ? aFecha(hoy).getDate() : 0;

  const dias = Array.from({ length: totalDias }, (_, i): DiaLinea => {
    const semana = indiceSemana(new Date(anio, mes, i + 1));
    return { dia: i + 1, letra: LETRAS.charAt(semana), finDeSemana: semana > 4, esHoy: i + 1 === diaHoy };
  });

  const filas = unidades
    .map((nombre): UnidadLinea => {
      const finCarriles: number[] = [];
      const barras = actividades
        .filter((a) => a.lider === nombre)
        .map((a): BarraLinea => {
          const desde = a.inicio < primerDia ? 1 : aFecha(a.inicio).getDate();
          const fin = a.fin > ultimoDia ? totalDias : aFecha(a.fin).getDate();
          let carril = finCarriles.findIndex((f) => f < desde);
          if (carril < 0) {
            carril = finCarriles.length;
            finCarriles.push(fin);
          } else {
            finCarriles[carril] = fin;
          }
          return { actividad: a, desde, hasta: fin + 1, carril: carril + 1 };
        });
      return { nombre, barras, carriles: finCarriles.length };
    })
    .filter((u) => u.barras.length > 0);

  return { dias, diaHoy, unidades: filas };
}
