import { porHora, porRelevancia, seSolapa } from '../../lib/actividades';
import { aClave, nombreDia, sumarDias } from '../../lib/fechas';
import type { Actividad } from '../../tipos';

export interface DiaSemana {
  clave: string;
  nombre: string;
  dia: number;
  finDeSemana: boolean;
  esHoy: boolean;
  actividades: Actividad[];
}

export function construirSemana(actividades: readonly Actividad[], lunes: Date, hoy: string): DiaSemana[] {
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(lunes, i);
    const clave = aClave(fecha);
    return {
      clave,
      nombre: nombreDia(i),
      dia: fecha.getDate(),
      finDeSemana: i > 4,
      esHoy: clave === hoy,
      actividades: actividades.filter((a) => seSolapa(a, clave, clave)).sort(porRelevancia(porHora)),
    };
  });
}
