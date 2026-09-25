'use client';

import { useId } from 'react';
import { Boton } from '@/components/ui/Boton/Boton';
import { Dialogo } from '@/components/ui/Dialogo/Dialogo';
import { Icono, type NombreIcono } from '@/components/ui/Icono/Icono';
import { Insignia } from '@/components/ui/Insignia/Insignia';
import { VARIANTE_ESTADO } from '../../constantes';
import { estadoDe } from '../../lib/actividades';
import { estiloTipo } from '../../lib/colores';
import { aIcs, descargarArchivo } from '../../lib/exportar';
import { textoRango } from '../../lib/fechas';
import type { Actividad } from '../../tipos';

interface DetalleActividadProps {
  actividad: Actividad;
  hoy: string;
  onCerrar: () => void;
}

/** Bloque BEM `detalle-actividad` (dentro de `dialogo`). */
export function DetalleActividad({ actividad: a, hoy, onCerrar }: DetalleActividadProps) {
  const tituloId = useId();
  const estado = estadoDe(a, hoy);
  const datos: [NombreIcono, string, string][] = [
    ['calendario', 'Fecha', `${textoRango(a.inicio, a.fin)} · ${a.hora ? `${a.hora} h` : 'Todo el día'}`],
    ['persona', 'Responsable', a.responsable],
    ['edificio', 'Unidad líder', a.lider],
    ['ubicacion', 'Unidad regional', a.todasLasRegionales ? 'Todas las unidades regionales' : a.regionales.join(' · ')],
  ];
  const documento = (
    <>
      <Icono nombre="documento" tamano={20} className="detalle-actividad__documento-icono" />
      <span className="detalle-actividad__documento-textos">
        <span className="detalle-actividad__documento-nombre">{a.documento}</span>
        <span className="detalle-actividad__documento-sub">Documento de soporte</span>
      </span>
    </>
  );

  return (
    <Dialogo tituloId={tituloId} onCerrar={onCerrar} className="detalle-actividad">
      <div className="detalle-actividad__superior">
        <span className="detalle-actividad__tipo" style={estiloTipo(a.color)}>
          {a.tipo}
        </span>
        <Insignia variante={VARIANTE_ESTADO[estado]}>{estado}</Insignia>
        <Boton icono className="detalle-actividad__cerrar" aria-label="Cerrar" data-autofocus onClick={onCerrar}>
          <Icono nombre="cerrar" />
        </Boton>
      </div>

      <h3 id={tituloId} className="detalle-actividad__titulo">
        {a.nombre}
      </h3>

      <dl className="detalle-actividad__datos">
        {datos.map(([icono, clave, valor]) => (
          <div key={clave} className="detalle-actividad__dato">
            <dt className="detalle-actividad__clave">
              <Icono nombre={icono} tamano={18} className="detalle-actividad__icono" />
              {clave}
            </dt>
            <dd className="detalle-actividad__valor">{valor}</dd>
          </div>
        ))}
      </dl>

      {a.documento &&
        (a.enlace ? (
          <a className="detalle-actividad__documento detalle-actividad__documento--enlace" href={a.enlace} target="_blank" rel="noopener noreferrer">
            {documento}
            <span className="detalle-actividad__documento-abrir">Abrir</span>
          </a>
        ) : (
          <div className="detalle-actividad__documento">{documento}</div>
        ))}

      <div className="dialogo__acciones">
        <Boton className="dialogo__accion" onClick={() => descargarArchivo('actividad.ics', aIcs([a]), 'text/calendar;charset=utf-8')}>
          Añadir a mi calendario
        </Boton>
        <Boton variante="primario" className="dialogo__accion" onClick={onCerrar}>
          Listo
        </Boton>
      </div>
    </Dialogo>
  );
}
