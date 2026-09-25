import type { CSSProperties } from 'react';
import { clases } from '@/lib/clases';
import { estiloTipo } from '../../lib/colores';
import { aFecha } from '../../lib/fechas';
import { plural } from '../../lib/texto';
import type { Actividad } from '../../tipos';
import { construirLinea } from './modelo';

interface VistaLineaTiempoProps {
  /** Actividades del mes, ordenadas por inicio. */
  actividades: readonly Actividad[];
  ancla: string;
  hoy: string;
  /** Unidades líder a mostrar (las filtradas o todas). */
  unidades: readonly string[];
  onSeleccionar: (id: string) => void;
}

/** Bloque BEM `vista-linea`: barras por unidad líder a lo largo del mes. */
export function VistaLineaTiempo({ actividades, ancla, hoy, unidades, onSeleccionar }: VistaLineaTiempoProps) {
  const fecha = aFecha(ancla);
  const { dias, diaHoy, unidades: filas } = construirLinea(actividades, fecha.getFullYear(), fecha.getMonth(), hoy, unidades);

  return (
    <div className="vista-linea" style={{ '--dias': dias.length } as CSSProperties}>
      <div className="vista-linea__cabecera">
        <span className="vista-linea__rotulo rotulo">Unidad líder</span>
        <div className="vista-linea__dias" aria-hidden="true">
          {dias.map((d) => (
            <span key={d.dia} className={clases('vista-linea__dia', d.esHoy ? 'vista-linea__dia--hoy' : d.finDeSemana && 'vista-linea__dia--finde')}>
              <span className="vista-linea__letra">{d.letra}</span>
              <span className="vista-linea__numero">{d.dia}</span>
            </span>
          ))}
        </div>
      </div>

      {filas.map((u) => (
        <section key={u.nombre} className="vista-linea__unidad" aria-label={u.nombre}>
          <div className="vista-linea__unidad-info">
            <span className="vista-linea__unidad-nombre">{u.nombre}</span>
            <span className="vista-linea__unidad-conteo">{plural(u.barras.length)}</span>
          </div>
          <div className="vista-linea__barras">
            {diaHoy > 0 && <span className="vista-linea__hoy" style={{ gridColumn: `${diaHoy} / ${diaHoy + 1}`, gridRow: `1 / span ${u.carriles}` }} />}
            {u.barras.map((b) => (
              <button
                key={b.actividad.id}
                type="button"
                className="vista-linea__barra"
                title={`${b.actividad.tipo} · ${b.actividad.nombre}`}
                style={{ ...estiloTipo(b.actividad.color), gridColumn: `${b.desde} / ${b.hasta}`, gridRow: b.carril }}
                onClick={() => onSeleccionar(b.actividad.id)}
              >
                <span className="vista-linea__barra-texto">
                  <span className="oculto-visual">{b.actividad.tipo}: </span>
                  {b.actividad.nombre}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {filas.length === 0 && <p className="vacio">No hay actividades con estos filtros en este mes.</p>}
    </div>
  );
}
