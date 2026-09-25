import type { Filtros, Vista } from '../tipos';
import { aClave, aFecha, capitalizar, fechaCorta, lunesDe, nombreMes, sumarDias, textoSemana } from './fechas';

export interface Periodo {
  titulo: string;
  desde: string;
  hasta: string;
}

/** Rango que muestra cada vista. La Agenda usa el rango de fechas del filtro si está completo. */
export function calcularPeriodo(vista: Vista, ancla: string, filtros: Filtros): Periodo {
  const f = aFecha(ancla);
  const anio = f.getFullYear();
  const mes = f.getMonth();

  if (vista === 'semana') {
    const lunes = lunesDe(f);
    return { titulo: textoSemana(lunes), desde: aClave(lunes), hasta: aClave(sumarDias(lunes, 6)) };
  }
  if (vista === 'anio') {
    return { titulo: `Año ${anio}`, desde: `${anio}-01-01`, hasta: `${anio}-12-31` };
  }
  if (vista === 'agenda' && filtros.desde && filtros.hasta) {
    return { titulo: `${fechaCorta(filtros.desde)} – ${fechaCorta(filtros.hasta)}`, desde: filtros.desde, hasta: filtros.hasta };
  }
  return {
    titulo: `${capitalizar(nombreMes(mes))} ${anio}`,
    desde: aClave(new Date(anio, mes, 1)),
    hasta: aClave(new Date(anio, mes + 1, 0)),
  };
}

/** Semana en semana, año en año; el resto, mes en mes (al día 1). */
export function desplazarAncla(vista: Vista, ancla: string, direccion: 1 | -1): string {
  const f = aFecha(ancla);
  if (vista === 'semana') return aClave(sumarDias(f, 7 * direccion));
  if (vista === 'anio') return aClave(new Date(f.getFullYear() + direccion, f.getMonth(), 1));
  return aClave(new Date(f.getFullYear(), f.getMonth() + direccion, 1));
}
