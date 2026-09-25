import { Insignia } from '@/components/ui/Insignia/Insignia';
import { clases } from '@/lib/clases';
import { VARIANTE_ESTADO } from '../../constantes';
import { estadoDe } from '../../lib/actividades';
import { estiloTipo } from '../../lib/colores';
import { textoRango } from '../../lib/fechas';
import type { Actividad } from '../../tipos';
import { construirAgenda } from './modelo';

interface VistaAgendaProps {
  /** Actividades del periodo, ordenadas por inicio. */
  actividades: readonly Actividad[];
  desde: string;
  hoy: string;
  onSeleccionar: (id: string) => void;
}

/** Bloque BEM `vista-agenda`: lista por día con responsable, unidad y estado. */
export function VistaAgenda({ actividades, desde, hoy, onSeleccionar }: VistaAgendaProps) {
  const grupos = construirAgenda(actividades, desde, hoy);
  if (!grupos.length) return <p className="vacio">No hay actividades con estos filtros en este periodo.</p>;

  return (
    <div className="vista-agenda">
      {grupos.map((g) => (
        <section key={g.clave} className={clases('vista-agenda__grupo', g.esHoy && 'vista-agenda__grupo--hoy')} aria-label={`${g.nombreDia} ${g.dia} ${g.mes}`}>
          <div className="vista-agenda__fecha" aria-hidden="true">
            <span className="vista-agenda__fecha-dia">{g.dia}</span>
            <span className="vista-agenda__fecha-texto">{g.nombreDia}</span>
            <span className="vista-agenda__fecha-texto">{g.mes}</span>
          </div>
          <div className="vista-agenda__actividades">
            {g.actividades.map((a) => {
              const estado = estadoDe(a, hoy);
              return (
                <button key={a.id} type="button" className="vista-agenda__actividad" style={estiloTipo(a.color)} onClick={() => onSeleccionar(a.id)}>
                  <span className="vista-agenda__principal">
                    <span className="vista-agenda__punto" />
                    <span className="vista-agenda__textos">
                      <span className="vista-agenda__nombre">
                        <span className="oculto-visual">{a.tipo}: </span>
                        {a.nombre}
                      </span>
                      <span className="vista-agenda__cuando">
                        {textoRango(a.inicio, a.fin)} · {a.hora ? `${a.hora} h` : 'Todo el día'}
                      </span>
                      <span className="vista-agenda__unidad-movil">{a.lider}</span>
                    </span>
                  </span>
                  <span className="vista-agenda__columna vista-agenda__columna--responsable">
                    <span className="vista-agenda__clave">Responsable</span>
                    <span className="vista-agenda__valor">{a.responsable}</span>
                  </span>
                  <span className="vista-agenda__columna">
                    <span className="vista-agenda__clave">{a.lider}</span>
                    <span className="vista-agenda__valor">{a.todasLasRegionales ? 'Todas las unidades regionales' : a.regionales.join(' · ')}</span>
                  </span>
                  <Insignia variante={VARIANTE_ESTADO[estado]} className="vista-agenda__estado">
                    {estado}
                  </Insignia>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
