// API pública de la funcionalidad. Fuera de src/features/calendario importa solo desde aquí.
export { Calendario } from './components/Calendario/Calendario';
export { normalizarActividades } from './lib/actividades';
export type { Actividad, ActividadFuente, Catalogos } from './tipos';
