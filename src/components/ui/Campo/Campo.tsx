import type { ReactNode } from 'react';

interface CampoProps {
  /** id del control que etiqueta. */
  para: string;
  etiqueta: string;
  children: ReactNode;
}

/** Bloque BEM `campo`: etiqueta visible + control. */
export function Campo({ para, etiqueta, children }: CampoProps) {
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={para}>
        {etiqueta}
      </label>
      {children}
    </div>
  );
}
