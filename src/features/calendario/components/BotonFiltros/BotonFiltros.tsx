import { Icono } from '@/components/ui/Icono/Icono';

interface BotonFiltrosProps {
  /** Filtros activos (se muestra como globo). */
  cantidad: number;
  abierto: boolean;
  onAbrir: () => void;
}

/** Bloque BEM `boton-filtros`: abre la hoja de filtros. Solo visible en móvil. */
export function BotonFiltros({ cantidad, abierto, onAbrir }: BotonFiltrosProps) {
  return (
    <button
      type="button"
      className="boton-filtros"
      aria-label={cantidad ? `Filtros (${cantidad} activos)` : 'Filtros'}
      aria-controls="panel-filtros"
      aria-expanded={abierto}
      onClick={onAbrir}
    >
      <Icono nombre="filtros" tamano={18} />
      {cantidad > 0 && (
        <span className="boton-filtros__cantidad" aria-hidden="true">
          {cantidad}
        </span>
      )}
    </button>
  );
}
