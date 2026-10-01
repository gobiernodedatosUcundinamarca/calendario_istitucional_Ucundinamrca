'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import { Boton } from '@/components/ui/Boton/Boton';
import { Campo } from '@/components/ui/Campo/Campo';
import { Entrada } from '@/components/ui/Entrada/Entrada';
import { Icono } from '@/components/ui/Icono/Icono';
import { clases } from '@/lib/clases';
import { useEsMovil } from '../../hooks/useEsMovil';
import { contarOpciones } from '../../lib/actividades';
import { colorDe, estiloTipo } from '../../lib/colores';
import { plural } from '../../lib/texto';
import type { Actividad, Catalogos, Filtros, GrupoFiltro } from '../../tipos';
import { GrupoCasillas } from './GrupoCasillas';

interface PanelFiltrosProps {
  /** Todas las actividades (para los conteos de cada opción). */
  actividades: readonly Actividad[];
  catalogos: Catalogos;
  filtros: Filtros;
  /** Actividades que pasan los filtros actuales. */
  total: number;
  /** Hoja abierta (solo móvil). */
  abierto: boolean;
  onFiltros: (cambios: Partial<Filtros>) => void;
  onAlternar: (grupo: GrupoFiltro, valor: string) => void;
  onLimpiar: () => void;
  onCerrar: () => void;
}

/** Bloque BEM `panel-filtros`: barra lateral en escritorio, hoja inferior en móvil. */
export function PanelFiltros({ actividades, catalogos, filtros, total, abierto, onFiltros, onAlternar, onLimpiar, onCerrar }: PanelFiltrosProps) {
  const panel = useRef<HTMLElement>(null);
  const esMovil = useEsMovil();
  const cerrar = useEffectEvent(onCerrar);
  const esHoja = abierto && esMovil;

  // Hoja: al abrir enfoca el panel, Escape cierra y el foco vuelve al botón que la abrió.
  useEffect(() => {
    if (!esHoja) return;
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrar();
      }
    };
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      previo?.focus();
    };
  }, [esHoja]);

  const conteo = (grupo: GrupoFiltro, opciones: readonly string[]) => contarOpciones(actividades, filtros, grupo, opciones);
  const tipos = Object.keys(catalogos.tipos);
  const conteoTipos = conteo('tipos', tipos);
  const agrupar = (grupo: GrupoFiltro, opciones: readonly string[]) => {
    const n = conteo(grupo, opciones);
    return opciones.map((o) => ({ valor: o, activo: filtros[grupo].includes(o), cantidad: n.get(o) ?? 0 }));
  };

  return (
    <>
      {esHoja && <div className="panel-filtros__velo" onClick={onCerrar} />}
      <aside ref={panel} id="panel-filtros" className={clases('panel-filtros', abierto && 'panel-filtros--abierto')} aria-label="Filtros" tabIndex={-1}>
        <button type="button" className="panel-filtros__asa" aria-label="Cerrar filtros" onClick={onCerrar}>
          <span className="panel-filtros__asa-barra" />
        </button>

        <div className="panel-filtros__desplazable">
          <div className="panel-filtros__cabecera">
            <h2 className="panel-filtros__titulo">Filtros</h2>
            <Boton variante="fantasma" className="panel-filtros__limpiar" onClick={onLimpiar}>
              Limpiar todo
            </Boton>
          </div>

          <div className="panel-filtros__busqueda">
            <Icono nombre="buscar" className="panel-filtros__icono-busqueda" />
            <Entrada
              clara
              type="search"
              className="panel-filtros__entrada-busqueda"
              placeholder="Buscar actividad"
              aria-label="Buscar actividad"
              value={filtros.texto}
              onChange={(e) => onFiltros({ texto: e.target.value })}
            />
          </div>

          <div className="panel-filtros__grupo" role="group" aria-labelledby="filtro-fecha">
            <span className="panel-filtros__rotulo rotulo" id="filtro-fecha">
              Fecha
            </span>
            <div className="panel-filtros__fechas">
              <Campo para="filtro-desde" etiqueta="Desde">
                <Entrada id="filtro-desde" clara type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={(e) => onFiltros({ desde: e.target.value })} />
              </Campo>
              <Campo para="filtro-hasta" etiqueta="Hasta">
                <Entrada id="filtro-hasta" clara type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={(e) => onFiltros({ hasta: e.target.value })} />
              </Campo>
            </div>
          </div>

          <GrupoCasillas id="filtro-regional" titulo="Unidad regional" opciones={agrupar('regionales', catalogos.unidadesRegionales)} onAlternar={(v) => onAlternar('regionales', v)} />
          <GrupoCasillas id="filtro-calendario" titulo="Calendario" ajustado opciones={agrupar('calendarios', catalogos.calendarios)} onAlternar={(v) => onAlternar('calendarios', v)} />
          <GrupoCasillas id="filtro-lider" titulo="Unidad líder" ajustado opciones={agrupar('lideres', catalogos.unidadesLider)} onAlternar={(v) => onAlternar('lideres', v)} />
          <GrupoCasillas id="filtro-responsable" titulo="Responsable" opciones={agrupar('responsables', catalogos.responsables)} onAlternar={(v) => onAlternar('responsables', v)} />

          <div className="panel-filtros__grupo" role="group" aria-labelledby="filtro-tipo">
            <span className="panel-filtros__rotulo rotulo" id="filtro-tipo">
              Tipo de actividad
            </span>
            <div className="panel-filtros__chips">
              {tipos.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={clases('panel-filtros__chip', filtros.tipos.includes(t) && 'panel-filtros__chip--activo')}
                  aria-pressed={filtros.tipos.includes(t)}
                  style={estiloTipo(colorDe(t, catalogos))}
                  title={plural(conteoTipos.get(t) ?? 0)}
                  onClick={() => onAlternar('tipos', t)}
                >
                  <span className="panel-filtros__chip-punto" />
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-filtros__pie">
          <Boton variante="primario" className="panel-filtros__ver" onClick={onCerrar}>
            Ver {plural(total)}
          </Boton>
        </div>
      </aside>
    </>
  );
}
