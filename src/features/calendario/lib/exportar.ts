import type { Actividad } from '../tipos';
import { estadoDe, porInicio } from './actividades';
import { aClave, aFecha, sumarDias } from './fechas';
import { normalizarTexto, textoHora } from './texto';

// ── CSV ─────────────────────────────────────────────────────────────────
// Punto y coma: separador de listas de Excel con configuración regional de Colombia.
// El BOM (\ufeff) hace que Excel lea bien las tildes.
const celda = (valor: string) => `"${valor.replace(/"/g, '""')}"`;

export function aCsv(actividades: readonly Actividad[], hoy: string): string {
  const encabezado =
    'Actividad;Calendario;Categoría;Subcategoría;Tipo;Inicio;Fin;Hora inicio;Hora fin;Unidad regional;Lugar;Responsable;Unidad líder;Estado;Observaciones;Documento';
  const filas = [...actividades].sort(porInicio).map((a) =>
    [a.nombre, a.calendario, a.categoria, a.subcategoria, a.tipo, a.inicio, a.fin, a.hora, a.horaFin, a.regionales.join(' / '), a.lugar,
      a.responsable, a.lider, estadoDe(a, hoy), a.observaciones, a.documento]
      .map(celda)
      .join(';'),
  );
  return `\ufeff${[encabezado, ...filas].join('\r\n')}`;
}

// ── iCalendar (RFC 5545) ────────────────────────────────────────────────
const escaparIcs = (texto: string) => texto.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);

/** Parte las líneas en máximo 75 octetos UTF-8. */
function plegar(linea: string): string {
  let salida = '';
  let octetos = 0;
  for (const caracter of linea) {
    const cp = caracter.codePointAt(0) ?? 0;
    const tam = cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
    if (octetos + tam > 75) {
      salida += '\r\n ';
      octetos = 1;
    }
    salida += caracter;
    octetos += tam;
  }
  return salida;
}

/** UID estable aunque cambie el orden de los datos. */
const uid = (a: Actividad) =>
  `${`${a.inicio}-${normalizarTexto(a.nombre)}`.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}@ucundinamarca.edu.co`;

export function aIcs(actividades: readonly Actividad[], ahora = new Date()): string {
  const sello = ahora.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UCundinamarca//Calendario institucional//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const a of actividades) {
    const descripcion = [
      a.hora && `Hora: ${textoHora(a)}`,
      a.lugar && `Lugar: ${a.lugar}`,
      `Calendario: ${a.calendario}`,
      `Categoría: ${a.categoria}${a.subcategoria ? ` · ${a.subcategoria}` : ''}`,
      `Responsable: ${a.responsable}`,
      `Unidad líder: ${a.lider}`,
      `Unidades regionales: ${a.regionales.join(', ')}`,
      a.documento && `Documento: ${a.documento}${a.enlace ? ` (${a.enlace})` : ''}`,
    ]
      .filter(Boolean)
      .join('\n');
    lineas.push(
      'BEGIN:VEVENT',
      `UID:${uid(a)}`,
      `DTSTAMP:${sello}`,
      `DTSTART;VALUE=DATE:${a.inicio.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${aClave(sumarDias(aFecha(a.fin), 1)).replace(/-/g, '')}`,
      `SUMMARY:${escaparIcs(a.nombre)}`,
      `DESCRIPTION:${escaparIcs(descripcion)}`,
      ...(a.lugar ? [`LOCATION:${escaparIcs(`${a.lugar}, ${a.regionales.join(', ')}`)}`] : []),
      `CATEGORIES:${escaparIcs(a.categoria)}`,
      'END:VEVENT',
    );
  }
  lineas.push('END:VCALENDAR');
  return `${lineas.map(plegar).join('\r\n')}\r\n`;
}

// ── Descarga en el navegador ────────────────────────────────────────────
export function descargarArchivo(nombre: string, contenido: string, tipoMime: string): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipoMime }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
