import { clases } from '@/lib/clases';
import { estiloTipo } from '../../lib/colores';
import { aFecha, lunesDe } from '../../lib/fechas';
import type { Actividad } from '../../tipos';
import { construirSemana } from './modelo';

interface VistaSemanaProps {
  actividades: readonly Actividad[];
  ancla: string;
  hoy: string;
  onSeleccionar: (id: string) => void;
}

/** Bloque BEM `vista-semana`: siete columnas (una fila por día en móvil). */
export function VistaSemana({ actividades, ancla, hoy, onSeleccionar }: VistaSemanaProps) {
  const dias = construirSemana(actividades, lunesDe(aFecha(ancla)), hoy);

  return (
    <div className="vista-semana">
      {dias.map((d) => (
        <section
          key={d.clave}
          className={clases('vista-semana__dia', d.finDeSemana && 'vista-semana__dia--finde', d.esHoy && 'vista-semana__dia--hoy')}
          aria-label={`${d.nombre} ${d.dia}`}
        >
          <div className="vista-semana__cabecera">
            <span className="vista-semana__nombre rotulo">{d.nombre.slice(0, 3)}</span>
            <span className="vista-semana__numero">{d.dia}</span>
          </div>
          <div className="vista-semana__actividades">
            {d.actividades.length ? (
              d.actividades.map((a) => (
                <button key={a.id} type="button" className="vista-semana__actividad" style={estiloTipo(a.color)} onClick={() => onSeleccionar(a.id)}>
                  <span className="oculto-visual">{a.tipo}: </span>
                  <span className="vista-semana__hora">{a.hora ? `${a.hora} h` : 'Todo el día'}</span>
                  <span className="vista-semana__nombre-actividad">{a.nombre}</span>
                  <span className="vista-semana__unidad">{a.lider}</span>
                </button>
              ))
            ) : (
              <span className="vista-semana__vacio">Sin actividades</span>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
