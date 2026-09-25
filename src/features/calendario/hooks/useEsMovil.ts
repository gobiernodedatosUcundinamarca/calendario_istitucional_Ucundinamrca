'use client';

import { useSyncExternalStore } from 'react';
import { CONSULTA_MOVIL } from '../constantes';

const suscribir = (avisar: () => void) => {
  const consulta = window.matchMedia(CONSULTA_MOVIL);
  consulta.addEventListener('change', avisar);
  return () => consulta.removeEventListener('change', avisar);
};

/** true por debajo del punto de quiebre móvil (860 px). */
export function useEsMovil(): boolean {
  return useSyncExternalStore(suscribir, () => window.matchMedia(CONSULTA_MOVIL).matches, () => false);
}
