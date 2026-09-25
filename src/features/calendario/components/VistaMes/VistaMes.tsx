import { clases } from '@/lib/clases';
import { MAX_PILDORAS_DIA, MAX_PUNTOS_DIA } from '../../constantes';
import { estiloTipo } from '../../lib/colores';
import { DIAS_SEMANA, aFecha, nombreMes } from '../../lib/fechas';
import { plural } from '../../lib/texto';
import type { Actividad } from '../../tipos';
import { construirMes } from './modelo';

interface VistaMesProps {
  actividades: readonly Actividad[];
  ancla: string;
  hoy: string;
  onSeleccionar: (id: string) => void;
  onIrADia: (clave: string) => void;
}

/** Bloque BEM `vista-mes`: rejilla mensual con píldoras (escritorio) o puntos (móvil). */
export function VistaMes({ actividades, ancla, hoy, onSeleccionar, onIrADia }: VistaMesProps) {
  const fecha = aFecha(ancla);
  const celdas = construirMes(actividades, fecha.getFullYear(), fecha.getMonth(), hoy);

  return (
    <div className="vista-mes">
      <div className="vista-mes__encabezados rotulo" aria-hidden="true">
        {DIAS_SEMANA.map((d) => (
          <span key={d} className="vista-mes__encabezado">
            <span className="vista-mes__encabezado-largo">{d.slice(0, 3)}</span>
            <span className="vista-mes__encabezado-corto">{d.charAt(0)}</span>
          </span>
        ))}
      </div>
      <div className="vista-mes__rejilla">
        {celdas.map((c) => (
          <div
            key={c.clave}
            className={clases(
              'vista-mes__dia',
              !c.enMes && 'vista-mes__dia--fuera',
              c.enMes && c.finDeSemana && 'vista-mes__dia--finde',
              c.esHoy && 'vista-mes__dia--hoy',
            )}
          >
            <button
              type="button"
              className="vista-mes__numero"
              aria-label={`${c.dia} de ${nombreMes(c.mes)}, ${c.actividades.length ? plural(c.actividades.length) : 'sin actividades'}`}
              onClick={() => onIrADia(c.clave)}
            >
              <span className="vista-mes__circulo">{c.dia}</span>
              <span className="vista-mes__puntos">
                {c.actividades.slice(0, MAX_PUNTOS_DIA).map((a) => (
                  <span key={a.id} className="vista-mes__punto" style={estiloTipo(a.color)} />
                ))}
              </span>
            </button>
            {c.actividades.slice(0, MAX_PILDORAS_DIA).map((a) => (
              <button key={a.id} type="button" className="vista-mes__pildora" title={`${a.tipo} · ${a.nombre}`} style={estiloTipo(a.color)} onClick={() => onSeleccionar(a.id)}>
                <span className="vista-mes__pildora-punto" />
                <span className="vista-mes__pildora-texto">
                  <span className="oculto-visual">{a.tipo}: </span>
                  {a.nombre}
                </span>
              </button>
            ))}
            {c.actividades.length > MAX_PILDORAS_DIA && (
              <button type="button" className="vista-mes__mas" onClick={() => onIrADia(c.clave)}>
                +{c.actividades.length - MAX_PILDORAS_DIA} más
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
