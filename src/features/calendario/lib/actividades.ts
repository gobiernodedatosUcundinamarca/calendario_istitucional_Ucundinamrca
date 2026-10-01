import type { Actividad, ActividadFuente, Catalogos, EstadoActividad, Filtros, GrupoFiltro } from '../tipos';
import { colorDe } from './colores';
import { aFecha } from './fechas';
import { normalizarTexto } from './texto';

const FECHA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Valida y normaliza los datos de src/datos. Corre en el servidor al compilar:
 * un dato inválido detiene `pnpm build` con un mensaje claro.
 */
export function normalizarActividades(fuente: readonly ActividadFuente[], catalogos: Catalogos): Actividad[] {
  return fuente.map((a, i) => {
    const error = (detalle: string) => new Error(`Actividad ${i + 1} («${a.nombre}»): ${detalle}`);
    if (!FECHA.test(a.inicio)) throw error(`fecha de inicio inválida "${a.inicio}" (usa AAAA-MM-DD).`);
    if (!FECHA.test(a.fin)) throw error(`fecha de fin inválida "${a.fin}" (usa AAAA-MM-DD).`);
    if (a.fin < a.inicio) throw error('la fecha de fin es anterior a la de inicio.');
    if (a.hora !== undefined && !HORA.test(a.hora)) throw error(`hora inválida "${a.hora}" (usa HH:MM, 24 h).`);
    if (a.horaFin !== undefined) {
      if (!HORA.test(a.horaFin)) throw error(`hora fin inválida "${a.horaFin}" (usa HH:MM, 24 h).`);
      if (a.hora === undefined || a.horaFin <= a.hora) throw error('la hora fin necesita una hora de inicio anterior.');
    }

    const regionales = a.regionales === 'todas' ? [...catalogos.unidadesRegionales] : [...a.regionales];
    const tipo = catalogos.categorias[a.categoria] ?? 'Otro';
    return {
      id: `a${i}`,
      nombre: a.nombre,
      categoria: a.categoria,
      subcategoria: a.subcategoria ?? '',
      tipo,
      calendario: a.calendario,
      inicio: a.inicio,
      fin: a.fin,
      hora: a.hora ?? '',
      horaFin: a.horaFin ?? '',
      responsable: a.responsable,
      lider: a.lider,
      regionales,
      todasLasRegionales: regionales.length === catalogos.unidadesRegionales.length,
      lugar: a.lugar ?? '',
      observaciones: a.observaciones ?? '',
      documento: a.documento ?? '',
      enlace: a.enlace ?? '',
      estadoFijo: a.estado ?? null,
      color: colorDe(tipo, catalogos),
    };
  });
}

export function estadoDe(a: Actividad, hoy: string): EstadoActividad {
  if (a.estadoFijo) return a.estadoFijo;
  if (a.fin < hoy) return 'Finalizada';
  if (a.inicio > hoy) return 'Programada';
  return 'En curso';
}

/** ¿La actividad ocurre en algún día entre `desde` y `hasta` (incluidos)? */
export const seSolapa = (a: Actividad, desde: string, hasta: string): boolean => a.inicio <= hasta && a.fin >= desde;

export const porInicio = (x: Actividad, y: Actividad): number =>
  x.inicio < y.inicio ? -1 : x.inicio > y.inicio ? 1 : x.hora.localeCompare(y.hora);

/** Primero las de todo el día, luego por hora. */
export const porHora = (x: Actividad, y: Actividad): number => (x.hora || '00').localeCompare(y.hora || '00');

export const duracionDias = (a: Actividad): number => Math.round((aFecha(a.fin).getTime() - aFecha(a.inicio).getTime()) / 86_400_000) + 1;

/** Campañas, convocatorias y demás actividades de una semana o más. */
export const esLarga = (a: Actividad): boolean => duracionDias(a) >= 7;

/** Para listar un día: primero las puntuales y al final las de una semana o más. */
export const porRelevancia = (orden: (x: Actividad, y: Actividad) => number) => (x: Actividad, y: Actividad): number =>
  Number(esLarga(x)) - Number(esLarga(y)) || orden(x, y);

export const filtrosVacios = (): Filtros => ({
  texto: '',
  desde: '',
  hasta: '',
  regionales: [],
  calendarios: [],
  lideres: [],
  responsables: [],
  tipos: [],
});

export function cumpleFiltros(a: Actividad, f: Filtros): boolean {
  if (f.texto && !normalizarTexto(`${a.nombre} ${a.categoria} ${a.subcategoria} ${a.lugar} ${a.responsable} ${a.lider} ${a.regionales.join(' ')}`).includes(normalizarTexto(f.texto))) return false;
  if (f.regionales.length && !a.regionales.some((r) => f.regionales.includes(r))) return false;
  if (f.calendarios.length && !f.calendarios.includes(a.calendario)) return false;
  if (f.lideres.length && !f.lideres.includes(a.lider)) return false;
  if (f.responsables.length && !f.responsables.includes(a.responsable)) return false;
  if (f.tipos.length && !f.tipos.includes(a.tipo)) return false;
  if (f.desde && a.fin < f.desde) return false;
  if (f.hasta && a.inicio > f.hasta) return false;
  return true;
}

/** Qué campo de la actividad compara cada grupo de filtros. */
export const COINCIDE: Record<GrupoFiltro, (a: Actividad, valor: string) => boolean> = {
  regionales: (a, v) => a.regionales.includes(v),
  calendarios: (a, v) => a.calendario === v,
  lideres: (a, v) => a.lider === v,
  responsables: (a, v) => a.responsable === v,
  tipos: (a, v) => a.tipo === v,
};

/**
 * Cuántas actividades tendría cada opción de un grupo si se marcara,
 * aplicando el resto de filtros (el propio grupo no cuenta).
 */
export function contarOpciones(actividades: readonly Actividad[], f: Filtros, grupo: GrupoFiltro, opciones: readonly string[]): Map<string, number> {
  const base = actividades.filter((a) => cumpleFiltros(a, { ...f, [grupo]: [] }));
  return new Map(opciones.map((o) => [o, base.filter((a) => COINCIDE[grupo](a, o)).length]));
}
