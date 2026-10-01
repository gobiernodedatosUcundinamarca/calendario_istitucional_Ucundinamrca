import { clases } from '@/lib/clases';
import { aFecha } from '../../lib/fechas';
import { plural } from '../../lib/texto';
import type { Actividad } from '../../tipos';
import { construirAnio } from './modelo';

interface VistaAnioProps {
  actividades: readonly Actividad[];
  ancla: string;
  hoy: string;
  onIrAMes: (primerDia: string) => void;
}

/** Bloque BEM `vista-anio`: doce meses como mapa de densidad (actividades puntuales por día). */
export function VistaAnio({ actividades, ancla, hoy, onIrAMes }: VistaAnioProps) {
  const fecha = aFecha(ancla);
  const anio = fecha.getFullYear();
  const { meses, rangos } = construirAnio(actividades, anio, hoy);

  return (
    <>
      <div className="vista-anio">
        {meses.map((m) => (
          <button
            key={m.indice}
            type="button"
            className={clases('vista-anio__mes', m.indice === fecha.getMonth() && 'vista-anio__mes--actual')}
            aria-label={`${m.nombre} ${anio}, ${m.total ? plural(m.total) : 'sin actividades'}`}
            onClick={() => onIrAMes(m.primerDia)}
          >
            <span className="vista-anio__mes-cabecera">
              <span className="vista-anio__mes-nombre">{m.nombre}</span>
              <span className="vista-anio__mes-total">{m.total ? `${m.total} act.` : '—'}</span>
            </span>
            <span className="vista-anio__rejilla" aria-hidden="true">
              {m.celdas.map((c) => (
                <span key={c.clave} className={clases('vista-anio__celda', c.nivel > 0 && `vista-anio__celda--nivel-${c.nivel}`, c.esHoy && 'vista-anio__celda--hoy')}>
                  {c.dia}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
      <div className="vista-anio__leyenda">
        <span className="vista-anio__leyenda-titulo">Actividades por día:</span>
        {rangos.map((texto, i) => (
          <span key={texto} className="vista-anio__leyenda-item">
            <span className={`vista-anio__muestra vista-anio__muestra--nivel-${i + 1}`} aria-hidden="true" />
            {texto}
          </span>
        ))}
        <span className="vista-anio__leyenda-nota">No cuenta las actividades de una semana o más.</span>
      </div>
    </>
  );
}
