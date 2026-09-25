'use client';

import { useMemo, useReducer } from 'react';
import { estadoInicial, reductor } from '../../estado/reductor';
import { useEsMovil } from '../../hooks/useEsMovil';
import { useHoy } from '../../hooks/useHoy';
import { cumpleFiltros, porInicio, seSolapa } from '../../lib/actividades';
import { calcularPeriodo, desplazarAncla } from '../../lib/periodo';
import type { Actividad, Catalogos, Filtros, GrupoFiltro } from '../../tipos';
import { BarraHerramientas } from '../BarraHerramientas/BarraHerramientas';
import { BotonFiltros } from '../BotonFiltros/BotonFiltros';
import { DetalleActividad } from '../DetalleActividad/DetalleActividad';
import { Encabezado } from '../Encabezado/Encabezado';
import { contarFiltrosActivos, FiltrosActivos } from '../FiltrosActivos/FiltrosActivos';
import { MenuExportar } from '../MenuExportar/MenuExportar';
import { PanelFiltros } from '../PanelFiltros/PanelFiltros';
import { VistaAgenda } from '../VistaAgenda/VistaAgenda';
import { VistaAnio } from '../VistaAnio/VistaAnio';
import { VistaLineaTiempo } from '../VistaLineaTiempo/VistaLineaTiempo';
import { VistaMes } from '../VistaMes/VistaMes';
import { VistaSemana } from '../VistaSemana/VistaSemana';

interface CalendarioProps {
  actividades: readonly Actividad[];
  catalogos: Catalogos;
}

/**
 * Raíz del calendario (bloque BEM `calendario`). "Hoy" depende del reloj del visitante,
 * así que en el servidor se muestra un estado de carga y el calendario se arma en el navegador.
 */
export function Calendario({ actividades, catalogos }: CalendarioProps) {
  const hoy = useHoy();
  if (!hoy) {
    return (
      <div className="calendario">
        <Encabezado subtitulo={catalogos.subtitulo} />
        <p className="calendario__cargando" role="status">
          Cargando calendario…
        </p>
      </div>
    );
  }
  return <CalendarioListo actividades={actividades} catalogos={catalogos} hoy={hoy} />;
}

function CalendarioListo({ actividades, catalogos, hoy }: CalendarioProps & { hoy: string }) {
  const esMovil = useEsMovil();
  const [estado, despachar] = useReducer(reductor, undefined, estadoInicial);
  const { filtros } = estado;

  const vista = estado.vista ?? (esMovil ? 'agenda' : 'mes');
  const ancla = estado.ancla ?? hoy;
  const periodo = calcularPeriodo(vista, ancla, filtros);

  const filtradas = useMemo(() => actividades.filter((a) => cumpleFiltros(a, filtros)), [actividades, filtros]);
  const enPeriodo = useMemo(
    () => filtradas.filter((a) => seSolapa(a, periodo.desde, periodo.hasta)).sort(porInicio),
    [filtradas, periodo.desde, periodo.hasta],
  );
  const seleccionada = estado.seleccion ? actividades.find((a) => a.id === estado.seleccion) : undefined;

  const seleccionar = (id: string) => despachar({ tipo: 'seleccionar', id });
  const alternar = (grupo: GrupoFiltro, valor: string) => despachar({ tipo: 'alternar', grupo, valor });
  const cambiarFiltros = (cambios: Partial<Filtros>) => despachar({ tipo: 'filtros', cambios });

  return (
    <div className="calendario">
      <Encabezado subtitulo={catalogos.subtitulo}>
        <MenuExportar actividades={filtradas} hoy={hoy} abierto={estado.menuExportar} onCambiar={(abierto) => despachar({ tipo: 'menuExportar', abierto })} />
        <BotonFiltros cantidad={contarFiltrosActivos(filtros)} abierto={estado.hojaFiltros} onAbrir={() => despachar({ tipo: 'hojaFiltros', abierta: true })} />
      </Encabezado>

      <div className="calendario__cuerpo">
        <PanelFiltros
          actividades={actividades}
          catalogos={catalogos}
          filtros={filtros}
          total={filtradas.length}
          abierto={estado.hojaFiltros}
          onFiltros={cambiarFiltros}
          onAlternar={alternar}
          onLimpiar={() => despachar({ tipo: 'limpiar' })}
          onCerrar={() => despachar({ tipo: 'hojaFiltros', abierta: false })}
        />

        <main className="calendario__principal">
          <BarraHerramientas
            titulo={periodo.titulo}
            cantidad={enPeriodo.length}
            vista={vista}
            onVista={(v) => despachar({ tipo: 'vista', vista: v })}
            onDesplazar={(direccion) => despachar({ tipo: 'ir', ancla: desplazarAncla(vista, ancla, direccion) })}
            onHoy={() => despachar({ tipo: 'ir', ancla: null })}
          />
          <FiltrosActivos filtros={filtros} onAlternar={alternar} onFiltros={cambiarFiltros} />

          {/* La clave reinicia el desplazamiento al cambiar de vista o de periodo. */}
          <div className="calendario__contenido" key={`${vista}|${periodo.titulo}`}>
            {vista === 'mes' && (
              <VistaMes actividades={filtradas} ancla={ancla} hoy={hoy} onSeleccionar={seleccionar} onIrADia={(clave) => despachar({ tipo: 'ir', ancla: clave, vista: 'semana' })} />
            )}
            {vista === 'semana' && <VistaSemana actividades={filtradas} ancla={ancla} hoy={hoy} onSeleccionar={seleccionar} />}
            {vista === 'agenda' && <VistaAgenda actividades={enPeriodo} desde={periodo.desde} hoy={hoy} onSeleccionar={seleccionar} />}
            {vista === 'linea' && (
              <VistaLineaTiempo
                actividades={enPeriodo}
                ancla={ancla}
                hoy={hoy}
                unidades={filtros.lideres.length ? filtros.lideres : catalogos.unidadesLider}
                onSeleccionar={seleccionar}
              />
            )}
            {vista === 'anio' && <VistaAnio actividades={filtradas} ancla={ancla} hoy={hoy} onIrAMes={(clave) => despachar({ tipo: 'ir', ancla: clave, vista: 'mes' })} />}
          </div>
        </main>
      </div>

      {seleccionada && <DetalleActividad actividad={seleccionada} hoy={hoy} onCerrar={() => despachar({ tipo: 'seleccionar', id: null })} />}
    </div>
  );
}
