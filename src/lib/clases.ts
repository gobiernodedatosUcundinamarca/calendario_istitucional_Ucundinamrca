/** Une clases BEM ignorando las condiciones falsas: clases('boton', activo && 'boton--activo'). */
export const clases = (...lista: (string | false | null | undefined)[]): string => lista.filter(Boolean).join(' ');
