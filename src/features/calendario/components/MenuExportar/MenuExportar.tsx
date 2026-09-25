'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import { Boton } from '@/components/ui/Boton/Boton';
import { Icono } from '@/components/ui/Icono/Icono';
import { aCsv, aIcs, descargarArchivo } from '../../lib/exportar';
import { plural } from '../../lib/texto';
import type { Actividad } from '../../tipos';

interface MenuExportarProps {
  /** Actividades con los filtros actuales (sin límite de periodo). */
  actividades: readonly Actividad[];
  hoy: string;
  abierto: boolean;
  onCambiar: (abierto: boolean) => void;
}

/** Bloque BEM `menu-exportar`: CSV, iCalendar e impresión. Se cierra con Escape o clic fuera. */
export function MenuExportar({ actividades, hoy, abierto, onCambiar }: MenuExportarProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const cambiar = useEffectEvent(onCambiar);

  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e: PointerEvent) => {
      if (e.target instanceof Node && !raiz.current?.contains(e.target)) cambiar(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cambiar(false);
    };
    document.addEventListener('pointerdown', alPresionar);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('pointerdown', alPresionar);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  const exportar = (nombre: string, contenido: string, tipoMime: string) => {
    descargarArchivo(nombre, contenido, tipoMime);
    onCambiar(false);
  };

  return (
    <div className="menu-exportar" ref={raiz}>
      <Boton className="menu-exportar__disparador" aria-expanded={abierto} aria-controls="menu-exportar-opciones" onClick={() => onCambiar(!abierto)}>
        <Icono nombre="descargar" />
        <span className="menu-exportar__etiqueta">Exportar</span>
      </Boton>
      {abierto && (
        <div className="menu-exportar__lista" id="menu-exportar-opciones">
          <p className="menu-exportar__nota">{plural(actividades.length)} con los filtros actuales</p>
          <button type="button" className="menu-exportar__opcion" onClick={() => exportar('calendario-ucundinamarca.csv', aCsv(actividades, hoy), 'text/csv;charset=utf-8')}>
            Excel / CSV
          </button>
          <button type="button" className="menu-exportar__opcion" onClick={() => exportar('calendario-ucundinamarca.ics', aIcs(actividades), 'text/calendar;charset=utf-8')}>
            iCalendar (.ics)
          </button>
          <button
            type="button"
            className="menu-exportar__opcion"
            onClick={() => {
              onCambiar(false);
              window.setTimeout(() => window.print(), 50);
            }}
          >
            Imprimir / PDF
          </button>
        </div>
      )}
    </div>
  );
}
