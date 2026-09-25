import { Icono } from '@/components/ui/Icono/Icono';
import { fechaCorta } from '../../lib/fechas';
import type { Filtros, GrupoFiltro } from '../../tipos';

const GRUPOS: readonly GrupoFiltro[] = ['regionales', 'lideres', 'responsables', 'tipos'];

interface Chip {
  clave: string;
  etiqueta: string;
  quitar: () => void;
}

export function contarFiltrosActivos(f: Filtros): number {
  return GRUPOS.reduce((n, g) => n + f[g].length, 0) + (f.desde ? 1 : 0) + (f.hasta ? 1 : 0) + (f.texto ? 1 : 0);
}

interface FiltrosActivosProps {
  filtros: Filtros;
  onAlternar: (grupo: GrupoFiltro, valor: string) => void;
  onFiltros: (cambios: Partial<Filtros>) => void;
}

/** Bloque BEM `filtros-activos`: cada filtro aplicado como chip que se quita con un clic. */
export function FiltrosActivos({ filtros, onAlternar, onFiltros }: FiltrosActivosProps) {
  const chips: Chip[] = GRUPOS.flatMap((g) => filtros[g].map((v) => ({ clave: `${g}:${v}`, etiqueta: v, quitar: () => onAlternar(g, v) })));
  if (filtros.desde) chips.push({ clave: 'desde', etiqueta: `Desde ${fechaCorta(filtros.desde)}`, quitar: () => onFiltros({ desde: '' }) });
  if (filtros.hasta) chips.push({ clave: 'hasta', etiqueta: `Hasta ${fechaCorta(filtros.hasta)}`, quitar: () => onFiltros({ hasta: '' }) });
  if (filtros.texto) chips.push({ clave: 'texto', etiqueta: `“${filtros.texto}”`, quitar: () => onFiltros({ texto: '' }) });
  if (!chips.length) return null;

  return (
    <div className="filtros-activos" role="group" aria-label="Filtros activos">
      {chips.map((c) => (
        <button key={c.clave} type="button" className="filtros-activos__chip" aria-label={`Quitar filtro ${c.etiqueta}`} onClick={c.quitar}>
          {c.etiqueta}
          <Icono nombre="cerrar" tamano={14} />
        </button>
      ))}
    </div>
  );
}
