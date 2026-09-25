import type { CSSProperties } from 'react';
import type { Catalogos, ColorTipo } from '../tipos';

/** Para tipos desconocidos o cuando `colorPorTipo` está desactivado. */
export const COLOR_NEUTRO: ColorTipo = {
  solido: 'var(--color-neutral-600)',
  fondo: 'var(--color-neutral-200)',
  texto: 'var(--color-neutral-900)',
};

export function colorDe(tipo: string, catalogos: Pick<Catalogos, 'tipos' | 'colorPorTipo'>): ColorTipo {
  if (!catalogos.colorPorTipo) return COLOR_NEUTRO;
  return catalogos.tipos[tipo] ?? COLOR_NEUTRO;
}

/** Variables CSS que consumen los bloques: --tipo-solido, --tipo-fondo, --tipo-texto. */
export function estiloTipo(color: ColorTipo): CSSProperties {
  return {
    '--tipo-solido': color.solido,
    '--tipo-fondo': color.fondo,
    '--tipo-texto': color.texto,
  } as CSSProperties;
}
