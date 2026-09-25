import { actividades } from '@/datos/actividades';
import { configuracion, responsables, tiposActividad, unidadesLider, unidadesRegionales } from '@/datos/catalogos';
import { Calendario, normalizarActividades, type Catalogos } from '@/features/calendario';

const catalogos: Catalogos = {
  ...configuracion,
  unidadesRegionales,
  unidadesLider,
  responsables,
  tipos: tiposActividad,
};

// Los datos se validan y normalizan al compilar (componente de servidor).
export default function Pagina() {
  return <Calendario actividades={normalizarActividades(actividades, catalogos)} catalogos={catalogos} />;
}
