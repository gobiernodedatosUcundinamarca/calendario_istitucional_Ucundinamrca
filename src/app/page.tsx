import { actividades } from '@/datos/actividades';
import { calendarios, categorias, configuracion, responsables, tiposActividad, unidadesLider, unidadesRegionales } from '@/datos/catalogos';
import { Calendario, normalizarActividades, type Catalogos } from '@/features/calendario';

/** «2026» o «2026–2027», según los años de las actividades cargadas. */
const anios = actividades.map((a) => a.inicio.slice(0, 4)).sort();
const periodo = anios.length ? [...new Set([anios[0], anios.at(-1)])].join('–') : '';

const catalogos: Catalogos = {
  ...configuracion,
  subtitulo: periodo ? `${configuracion.subtitulo} · ${periodo}` : configuracion.subtitulo,
  unidadesRegionales,
  unidadesLider,
  calendarios,
  responsables,
  tipos: tiposActividad,
  categorias,
};

// Los datos se validan y normalizan al compilar (componente de servidor).
export default function Pagina() {
  return <Calendario actividades={normalizarActividades(actividades, catalogos)} catalogos={catalogos} />;
}
