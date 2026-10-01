/** "08:00–10:00 h", "08:00 h" o "Todo el día". */
export const textoHora = (a: { hora: string; horaFin: string }): string =>
  a.hora ? `${a.hora}${a.horaFin ? `–${a.horaFin}` : ''} h` : 'Todo el día';

/** "1 actividad", "3 actividades". */
export const plural = (n: number): string => `${n} ${n === 1 ? 'actividad' : 'actividades'}`;

/** Minúsculas y sin tildes, para buscar sin importar acentos. */
export const normalizarTexto = (texto: string): string =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
