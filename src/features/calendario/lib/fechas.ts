/** Fechas como claves "AAAA-MM-DD" en hora local; las semanas empiezan el lunes. */

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

export function aFecha(clave: string): Date {
  return new Date(Number(clave.slice(0, 4)), Number(clave.slice(5, 7)) - 1, Number(clave.slice(8, 10)));
}

export function aClave(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

export function sumarDias(fecha: Date, dias: number): Date {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

/** 0 = lunes … 6 = domingo. */
export function indiceSemana(fecha: Date): number {
  return (fecha.getDay() + 6) % 7;
}

export function lunesDe(fecha: Date): Date {
  return sumarDias(fecha, -indiceSemana(fecha));
}

export const nombreMes = (mes: number): string => MESES[mes] ?? '';
export const mesCorto = (mes: number): string => nombreMes(mes).slice(0, 3);
export const nombreDia = (indice: number): string => DIAS_SEMANA[indice] ?? '';
export const capitalizar = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1);

/** "7 sep" */
export function fechaCorta(clave: string): string {
  const f = aFecha(clave);
  return `${f.getDate()} ${mesCorto(f.getMonth())}`;
}

/** "25 de septiembre de 2026", "7 – 12 de septiembre 2026" o "1 sep – 9 oct 2026". */
export function textoRango(inicio: string, fin: string): string {
  const a = aFecha(inicio);
  const b = aFecha(fin);
  if (inicio === fin) return `${a.getDate()} de ${nombreMes(a.getMonth())} de ${a.getFullYear()}`;
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()} – ${b.getDate()} de ${nombreMes(b.getMonth())} ${b.getFullYear()}`;
  }
  return `${a.getDate()} ${mesCorto(a.getMonth())} – ${b.getDate()} ${mesCorto(b.getMonth())} ${b.getFullYear()}`;
}

/** "21 – 27 sep 2026" o "28 sep – 4 oct 2026". */
export function textoSemana(lunes: Date): string {
  const domingo = sumarDias(lunes, 6);
  const inicio = lunes.getMonth() === domingo.getMonth() ? `${lunes.getDate()}` : `${lunes.getDate()} ${mesCorto(lunes.getMonth())}`;
  return `${inicio} – ${domingo.getDate()} ${mesCorto(domingo.getMonth())} ${domingo.getFullYear()}`;
}
