import type { VarianteInsignia } from '@/components/ui/Insignia/Insignia';
import type { EstadoActividad, Vista } from './tipos';

export const VISTAS: readonly { id: Vista; etiqueta: string; etiquetaCorta?: string }[] = [
  { id: 'mes', etiqueta: 'Mes' },
  { id: 'semana', etiqueta: 'Semana' },
  { id: 'agenda', etiqueta: 'Agenda' },
  { id: 'linea', etiqueta: 'Línea de tiempo', etiquetaCorta: 'Línea' },
  { id: 'anio', etiqueta: 'Año' },
];

/** Debe coincidir con los @media (max-width: 860px) de los CSS. */
export const CONSULTA_MOVIL = '(max-width: 860px)';

export const VARIANTE_ESTADO: Record<EstadoActividad, VarianteInsignia> = {
  Programada: 'contorno',
  'En curso': 'acento-2',
  Finalizada: 'neutra',
};

/** Actividades visibles por día en la vista Mes antes de "+N más". */
export const MAX_PILDORAS_DIA = 3;
/** Puntos por día en la vista Mes en móvil. */
export const MAX_PUNTOS_DIA = 4;
