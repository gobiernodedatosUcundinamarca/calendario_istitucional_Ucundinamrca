'use client';

import { useSyncExternalStore } from 'react';
import { aClave } from '../lib/fechas';

const suscribir = (avisar: () => void) => {
  const id = window.setInterval(avisar, 60_000);
  return () => window.clearInterval(id);
};

/**
 * Fecha de hoy ("AAAA-MM-DD") según el reloj del visitante; se actualiza al cambiar el día.
 * Devuelve null en el servidor y durante la hidratación: la página es estática y
 * "hoy" no puede fijarse al momento de compilar.
 */
export function useHoy(): string | null {
  return useSyncExternalStore(suscribir, () => aClave(new Date()), () => null);
}
