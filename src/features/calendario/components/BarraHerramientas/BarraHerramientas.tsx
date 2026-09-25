import { Boton } from '@/components/ui/Boton/Boton';
import { Icono } from '@/components/ui/Icono/Icono';
import { clases } from '@/lib/clases';
import { VISTAS } from '../../constantes';
import { plural } from '../../lib/texto';
import type { Vista } from '../../tipos';

interface BarraHerramientasProps {
  titulo: string;
  /** Actividades del periodo visible. */
  cantidad: number;
  vista: Vista;
  onVista: (vista: Vista) => void;
  onDesplazar: (direccion: 1 | -1) => void;
  onHoy: () => void;
}

/** Bloque BEM `barra-herramientas`: periodo, navegación y selector de vista. */
export function BarraHerramientas({ titulo, cantidad, vista, onVista, onDesplazar, onHoy }: BarraHerramientasProps) {
  return (
    <div className="barra-herramientas">
      <h2 className="barra-herramientas__periodo" aria-live="polite">
        {titulo}
      </h2>
      <div className="barra-herramientas__navegacion">
        <Boton icono aria-label="Anterior" onClick={() => onDesplazar(-1)}>
          <Icono nombre="anterior" tamano={18} />
        </Boton>
        <Boton icono aria-label="Siguiente" onClick={() => onDesplazar(1)}>
          <Icono nombre="siguiente" tamano={18} />
        </Boton>
      </div>
      <Boton className="barra-herramientas__hoy" onClick={onHoy}>
        Hoy
      </Boton>
      <span className="barra-herramientas__conteo">{plural(cantidad)}</span>
      <div className="barra-herramientas__vistas" role="group" aria-label="Vista">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={clases('barra-herramientas__vista', v.id === vista && 'barra-herramientas__vista--activa')}
            aria-pressed={v.id === vista}
            onClick={() => onVista(v.id)}
          >
            {v.etiquetaCorta ? (
              <>
                <span className="barra-herramientas__vista-larga">{v.etiqueta}</span>
                <span className="barra-herramientas__vista-corta">{v.etiquetaCorta}</span>
              </>
            ) : (
              v.etiqueta
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
