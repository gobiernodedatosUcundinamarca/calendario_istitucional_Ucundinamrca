import { clases } from '@/lib/clases';

interface Opcion {
  valor: string;
  activo: boolean;
  /** Actividades que quedarían al marcarla. */
  cantidad: number;
}

interface GrupoCasillasProps {
  id: string;
  titulo: string;
  opciones: readonly Opcion[];
  /** Nombres largos que pueden ocupar dos líneas. */
  ajustado?: boolean;
  onAlternar: (valor: string) => void;
}

/** Elementos `panel-filtros__grupo--lista` / `panel-filtros__casilla`: lista de casillas con conteo. */
export function GrupoCasillas({ id, titulo, opciones, ajustado = false, onAlternar }: GrupoCasillasProps) {
  return (
    <div className="panel-filtros__grupo panel-filtros__grupo--lista" role="group" aria-labelledby={id}>
      <span className="panel-filtros__rotulo rotulo" id={id}>
        {titulo}
      </span>
      {opciones.map((o) => (
        <label key={o.valor} className={clases('panel-filtros__casilla', ajustado && 'panel-filtros__casilla--ajustada')}>
          <input type="checkbox" className="panel-filtros__casilla-control" checked={o.activo} onChange={() => onAlternar(o.valor)} />
          <span className="panel-filtros__casilla-texto">{o.valor}</span>
          <span className="panel-filtros__casilla-conteo">{o.cantidad}</span>
        </label>
      ))}
    </div>
  );
}
