'use client';

import { useEffect, useEffectEvent, useRef, type ReactNode } from 'react';
import { clases } from '@/lib/clases';

interface DialogoProps {
  /** id del título visible del diálogo. */
  tituloId: string;
  onCerrar: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * Bloque BEM `dialogo`: ventana modal (hoja inferior en móvil).
 * Al abrir enfoca el elemento con `data-autofocus`; Tab queda dentro;
 * Escape o clic en el fondo cierran; al cerrar devuelve el foco.
 */
export function Dialogo({ tituloId, onCerrar, className, children }: DialogoProps) {
  const panel = useRef<HTMLDivElement>(null);
  const cerrar = useEffectEvent(onCerrar);

  useEffect(() => {
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrar();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const enfocables = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea');
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (!primero || !ultimo) return;
      const activo = document.activeElement;
      if (!panel.current.contains(activo) || (e.shiftKey && activo === primero)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primero).focus();
      } else if (!e.shiftKey && activo === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      previo?.focus();
    };
  }, []);

  return (
    <div
      className="dialogo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div ref={panel} className={clases('dialogo__panel', className)} role="dialog" aria-modal="true" aria-labelledby={tituloId}>
        {children}
      </div>
    </div>
  );
}
