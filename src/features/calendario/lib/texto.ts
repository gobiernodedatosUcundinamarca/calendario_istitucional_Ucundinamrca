/** "1 actividad", "3 actividades". */
export const plural = (n: number): string => `${n} ${n === 1 ? 'actividad' : 'actividades'}`;

/** Minúsculas y sin tildes, para buscar sin importar acentos. */
export const normalizarTexto = (texto: string): string =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
