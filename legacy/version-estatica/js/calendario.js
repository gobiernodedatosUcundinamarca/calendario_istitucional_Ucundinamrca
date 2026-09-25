/*
 * Calendario institucional — Universidad de Cundinamarca.
 *
 * Sin dependencias ni paso de compilación. El estado vive en `state`; `view()`
 * devuelve el HTML de toda la aplicación y `patchChildren()` lo aplica sobre el
 * DOM existente, así se conservan el foco, el cursor de los campos y el
 * desplazamiento. Los eventos se delegan: cada `data-click` / `data-input` /
 * `data-change` apunta a una función registrada en `handlers` durante el render.
 *
 * Los datos (catálogos y actividades) están en js/datos.js.
 */
(function () {
  'use strict';

  const CFG = window.CALENDARIO || {};
  const REG = CFG.unidadesRegionales || [];
  const LID = CFG.unidadesLider || [];
  const RESP = CFG.responsables || [];
  const TIPO = CFG.tipos || {};
  const TIPOS = Object.keys(TIPO);

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DOW = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const NEUTRAL = { solid: 'var(--color-neutral-600)', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-900)' };
  const EST = { 'Programada': 'tag tag-outline', 'En curso': 'tag tag-accent-2', 'Finalizada': 'tag tag-neutral', 'Aplazada': 'tag tag-accent' };
  const VIEWS = [['mes', 'Mes'], ['semana', 'Semana'], ['lista', 'Agenda'], ['linea', 'Línea de tiempo', 'Línea'], ['anio', 'Año']];
  const MOBILE = window.matchMedia('(max-width: 860px)');

  // ── Fechas: cadenas AAAA-MM-DD en hora local ───────────────────────────
  const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const ks = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const add = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const mon = d => add(d, -((d.getDay() + 6) % 7));
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const ab = m => MESES[m].slice(0, 3);
  const fd = s => { const d = pd(s); return d.getDate() + ' ' + ab(d.getMonth()); };
  const rangeL = (s, e) => {
    const a = pd(s), b = pd(e);
    if (s === e) return a.getDate() + ' de ' + MESES[a.getMonth()] + ' de ' + a.getFullYear();
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return a.getDate() + ' – ' + b.getDate() + ' de ' + MESES[b.getMonth()] + ' ' + b.getFullYear();
    return a.getDate() + ' ' + ab(a.getMonth()) + ' – ' + b.getDate() + ' ' + ab(b.getMonth()) + ' ' + b.getFullYear();
  };
  const plural = n => n + (n === 1 ? ' actividad' : ' actividades');
  let TODAY = ks(new Date());

  // ── Actividades ────────────────────────────────────────────────────────
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const events = (CFG.actividades || []).map((a, i) => {
    const warn = m => console.warn('[calendario] Actividad ' + (i + 1) + ' («' + a.nombre + '»): ' + m);
    if (!ISO.test(a.inicio || '')) { warn('fecha de inicio inválida (' + a.inicio + '); se omite.'); return null; }
    if (a.fin && !ISO.test(a.fin)) warn('fecha de fin inválida (' + a.fin + '); se usa la de inicio.');
    const e = {
      id: 'e' + i, n: a.nombre || 'Actividad sin nombre', s: a.inicio,
      e: a.fin && ISO.test(a.fin) && a.fin >= a.inicio ? a.fin : a.inicio, h: a.hora || '',
      resp: a.responsable || '', lid: a.lider || '', tipo: a.tipo || '',
      regs: a.regionales === 'todas' ? REG.slice() : (a.regionales || []).slice(),
      estFixed: a.estado || null, doc: a.documento || '', docUrl: a.enlace || ''
    };
    if (!TIPO[e.tipo]) warn('tipo desconocido: ' + e.tipo);
    if (!LID.includes(e.lid)) warn('unidad líder desconocida: ' + e.lid);
    if (!RESP.includes(e.resp)) warn('responsable desconocido: ' + e.resp);
    e.regs.forEach(r => REG.includes(r) || warn('unidad regional desconocida: ' + r));
    return e;
  }).filter(Boolean);

  const estado = e => e.estFixed || (e.e < TODAY ? 'Finalizada' : e.s > TODAY ? 'Programada' : 'En curso');
  const ov = (e, a, b) => e.s <= b && e.e >= a;
  const byS = (x, y) => x.s < y.s ? -1 : x.s > y.s ? 1 : (x.h || '').localeCompare(y.h || '');
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const pass = (e, f) => {
    if (f.q && !norm(e.n + ' ' + e.resp + ' ' + e.lid + ' ' + e.regs.join(' ')).includes(norm(f.q))) return false;
    if (f.resp.length && !f.resp.includes(e.resp)) return false;
    if (f.reg.length && !e.regs.some(r => f.reg.includes(r))) return false;
    if (f.lid.length && !f.lid.includes(e.lid)) return false;
    if (f.tipo.length && !f.tipo.includes(e.tipo)) return false;
    if (f.from && e.e < f.from) return false;
    if (f.to && e.s > f.to) return false;
    return true;
  };
  const blankF = () => ({ q: '', resp: [], reg: [], lid: [], tipo: [], from: '', to: '' });
  const col = t => CFG.colorPorTipo === false ? NEUTRAL : (TIPO[t] || NEUTRAL);

  // ── Exportación ────────────────────────────────────────────────────────
  const dl = (name, text, type) => {
    const u = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };
  // Punto y coma: es el separador de listas de Excel con configuración regional de Colombia.
  const cq = v => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = l => '\ufeff' + ['Actividad;Inicio;Fin;Hora;Responsable;Unidad regional;Unidad líder;Tipo;Estado;Documento']
    .concat(l.slice().sort(byS).map(e => [e.n, e.s, e.e, e.h, e.resp, e.regs.join(' / '), e.lid, e.tipo, estado(e), e.doc].map(cq).join(';')))
    .join('\r\n');
  const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, m => '\\' + m);
  const fold = line => { // RFC 5545: líneas de máximo 75 octetos
    let out = '', len = 0;
    for (const ch of line) {
      const c = ch.codePointAt(0), b = c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
      if (len + b > 75) { out += '\r\n '; len = 1; }
      out += ch; len += b;
    }
    return out;
  };
  const uid = e => (e.s + '-' + norm(e.n)).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '@ucundinamarca.edu.co';
  const ics = l => {
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UCundinamarca//Calendario institucional//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    l.forEach(e => {
      const desc = [e.h && 'Hora: ' + e.h, 'Responsable: ' + e.resp, 'Unidad líder: ' + e.lid, 'Unidades regionales: ' + e.regs.join(', '),
        e.doc && 'Documento: ' + e.doc + (e.docUrl ? ' (' + e.docUrl + ')' : '')].filter(Boolean).join('\n');
      lines.push('BEGIN:VEVENT', 'UID:' + uid(e), 'DTSTAMP:' + now,
        'DTSTART;VALUE=DATE:' + e.s.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + ks(add(pd(e.e), 1)).replace(/-/g, ''),
        'SUMMARY:' + icsEsc(e.n), 'DESCRIPTION:' + icsEsc(desc), 'CATEGORIES:' + icsEsc(e.tipo), 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  };

  // ── Estado ─────────────────────────────────────────────────────────────
  const state = { view: MOBILE.matches ? 'lista' : 'mes', anchor: TODAY, f: blankF(), sel: null, exp: false, sheet: false };
  let handlers = [];
  const h = fn => handlers.push(fn) - 1;
  const set = p => { Object.assign(state, p); render(); };
  const setF = p => set({ f: Object.assign({}, state.f, p) });
  const tog = (g, v) => () => {
    const cur = state.f[g];
    setF({ [g]: cur.includes(v) ? cur.filter(x => x !== v) : cur.concat(v) });
  };
  const openSel = id => () => set({ sel: id, exp: false });
  const step = dir => () => {
    const a = pd(state.anchor), v = state.view;
    const nx = v === 'semana' ? add(a, 7 * dir) : v === 'anio' ? new Date(a.getFullYear() + dir, a.getMonth(), 1) : new Date(a.getFullYear(), a.getMonth() + dir, 1);
    set({ anchor: ks(nx) });
  };

  // ── Plantillas ─────────────────────────────────────────────────────────
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const tv = t => esc('--t-bg:' + t.bg + ';--t-fg:' + t.fg + ';--t-solid:' + t.solid);
  const I = {
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path><path d="M12 15V3"></path>',
    search: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
    prev: '<path d="m15 18-6-6 6-6"></path>',
    next: '<path d="m9 18 6-6-6-6"></path>',
    x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
    sliders: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"></path>',
    cal: '<rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>',
    user: '<circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path>',
    building: '<rect width="16" height="20" x="4" y="2" rx="2"></rect><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"></path>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"></path>'
  };
  const svg = (d, s) => '<svg width="' + (s || 16) + '" height="' + (s || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';

  function dv(e) {
    const est = estado(e);
    return {
      style: tv(col(e.tipo)), dateLabel: rangeL(e.s, e.e), time: e.h ? e.h + ' h' : 'Todo el día',
      reg: e.regs.length === REG.length ? 'Todas las unidades regionales' : esc(e.regs.join(' · ')),
      est: esc(est), estCls: EST[est] || 'tag tag-neutral'
    };
  }

  function view() {
    const f = state.f, v = state.view, A = pd(state.anchor), Y = A.getFullYear(), M = A.getMonth();
    const list = events.filter(e => pass(e, f));
    const mS = ks(new Date(Y, M, 1)), mE = ks(new Date(Y, M + 1, 0));
    const rng = !!(f.from && f.to), lS = rng ? f.from : mS, lE = rng ? f.to : mE;
    const ws = mon(A), we = add(ws, 6), wS = ks(ws), wE = ks(we);
    const inL = list.filter(e => ov(e, lS, lE)).sort(byS);
    const inM = list.filter(e => ov(e, mS, mE)).sort(byS);

    const weekLabel = ws.getMonth() === we.getMonth()
      ? ws.getDate() + ' – ' + we.getDate() + ' ' + ab(we.getMonth()) + ' ' + we.getFullYear()
      : ws.getDate() + ' ' + ab(ws.getMonth()) + ' – ' + we.getDate() + ' ' + ab(we.getMonth()) + ' ' + we.getFullYear();
    const period = v === 'semana' ? weekLabel : v === 'anio' ? 'Año ' + Y : (v === 'lista' && rng) ? fd(f.from) + ' – ' + fd(f.to) : cap(MESES[M]) + ' ' + Y;
    const n = v === 'semana' ? list.filter(e => ov(e, wS, wE)).length
      : v === 'anio' ? list.filter(e => ov(e, Y + '-01-01', Y + '-12-31')).length
      : v === 'lista' ? inL.length : inM.length;

    const chips = [];
    ['reg', 'lid', 'resp', 'tipo'].forEach(g => f[g].forEach(x => chips.push({ label: x, remove: tog(g, x) })));
    if (f.from) chips.push({ label: 'Desde ' + fd(f.from), remove: () => setF({ from: '' }) });
    if (f.to) chips.push({ label: 'Hasta ' + fd(f.to), remove: () => setF({ to: '' }) });
    if (f.q) chips.push({ label: '“' + f.q + '”', remove: () => setF({ q: '' }) });

    const body = v === 'mes' ? vMes(list, Y, M)
      : v === 'semana' ? vSemana(list, ws)
      : v === 'lista' ? vLista(inL, lS)
      : v === 'linea' ? vLinea(inM, Y, M, mS, mE, f)
      : vAnio(list, Y, M);

    return '<div class="cal-app' + (state.sheet ? ' is-sheet-open' : '') + '">' +
      header(list, chips) +
      '<div class="cal-body">' + filtros(list, f) + main(period, n, chips, body, v) + '</div>' +
      (state.sheet ? '<div class="cal-sheet-backdrop" data-key="sheet-bd" data-click="' + h(() => set({ sheet: false })) + '"></div>' : '') +
      detail() +
      '</div>';
  }

  function header(list, chips) {
    const item = (label, fn) => '<button class="cal-menu-item" data-click="' + h(fn) + '">' + label + '</button>';
    return '<header class="cal-header">' +
      '<img class="cal-escudo" src="assets/escudo-ucundinamarca.png" alt="Escudo Universidad de Cundinamarca">' +
      '<div class="cal-brand"><h1 class="cal-brand-title">Calendario institucional</h1><span class="cal-brand-sub">' + esc(CFG.subtitulo || 'Universidad de Cundinamarca') + '</span></div>' +
      '<div class="cal-spacer"></div>' +
      '<div class="cal-menu-wrap">' +
        '<button class="btn btn-secondary cal-export-btn" aria-expanded="' + state.exp + '" data-click="' + h(() => set({ exp: !state.exp })) + '">' + svg(I.download) + '<span class="cal-export-label">Exportar</span></button>' +
        (state.exp ? '<div class="cal-menu" data-key="menu">' +
          '<div class="cal-menu-note">' + plural(list.length) + ' con los filtros actuales</div>' +
          item('Excel / CSV', () => { dl('calendario-ucundinamarca.csv', csv(list), 'text/csv;charset=utf-8'); set({ exp: false }); }) +
          item('iCalendar (.ics)', () => { dl('calendario-ucundinamarca.ics', ics(list), 'text/calendar;charset=utf-8'); set({ exp: false }); }) +
          item('Imprimir / PDF', () => { set({ exp: false }); setTimeout(() => window.print(), 50); }) +
        '</div>' : '') +
      '</div>' +
      '<button class="cal-filter-btn" aria-label="Filtros" aria-controls="cal-filtros" aria-expanded="' + state.sheet + '" data-click="' + h(() => set({ sheet: true, exp: false })) + '">' + svg(I.sliders, 18) +
        (chips.length ? '<span class="cal-filter-badge">' + chips.length + '</span>' : '') + '</button>' +
      '</header>';
  }

  function filtros(list, f) {
    const grp = (g, vs, m) => {
      const base = events.filter(e => pass(e, Object.assign({}, f, { [g]: [] })));
      return vs.map(x => ({ label: x, on: f[g].includes(x), n: base.filter(e => m(e, x)).length, toggle: tog(g, x) }));
    };
    const checks = (id, title, g, vs, m, wrap) =>
      '<div class="cal-fgroup cal-fgroup--list" role="group" aria-labelledby="' + id + '"><div class="cal-flabel" id="' + id + '">' + title + '</div>' +
      grp(g, vs, m).map(it => '<label class="cal-check' + (wrap ? ' cal-check--wrap' : '') + '">' +
        '<input type="checkbox"' + (it.on ? ' checked' : '') + ' data-change="' + h(it.toggle) + '">' +
        '<span class="cal-check-label">' + esc(it.label) + '</span><span class="cal-check-n">' + it.n + '</span></label>').join('') +
      '</div>';
    const tipos = grp('tipo', TIPOS, (e, x) => e.tipo === x).map(it =>
      '<button class="cal-chip" aria-pressed="' + it.on + '" style="' + tv(col(it.label)) + '" data-click="' + h(it.toggle) + '"><span class="cal-chip-dot"></span>' + esc(it.label) + '</button>').join('');
    const closeSheet = h(() => set({ sheet: false }));

    return '<aside class="cal-filtros" id="cal-filtros" aria-label="Filtros" tabindex="-1">' +
      '<div class="cal-sheet-handle" data-click="' + closeSheet + '"><span></span></div>' +
      '<div class="cal-filtros-scroll">' +
        '<div class="cal-filtros-head"><h2 class="cal-filtros-title">Filtros</h2><button class="btn btn-ghost" data-click="' + h(() => set({ f: blankF() })) + '">Limpiar todo</button></div>' +
        '<div class="cal-search">' + svg(I.search) + '<input class="input" type="search" placeholder="Buscar actividad" aria-label="Buscar actividad" value="' + esc(f.q) + '" data-input="' + h(ev => setF({ q: ev.target.value })) + '"></div>' +
        '<div class="cal-fgroup" role="group" aria-labelledby="fl-fecha"><div class="cal-flabel" id="fl-fecha">Fecha</div><div class="cal-dates">' +
          '<div class="field"><label for="f-desde">Desde</label><input id="f-desde" class="input" type="date" value="' + esc(f.from) + '"' + (f.to ? ' max="' + esc(f.to) + '"' : '') + ' data-input="' + h(ev => setF({ from: ev.target.value })) + '"></div>' +
          '<div class="field"><label for="f-hasta">Hasta</label><input id="f-hasta" class="input" type="date" value="' + esc(f.to) + '"' + (f.from ? ' min="' + esc(f.from) + '"' : '') + ' data-input="' + h(ev => setF({ to: ev.target.value })) + '"></div>' +
        '</div></div>' +
        checks('fl-reg', 'Unidad regional', 'reg', REG, (e, x) => e.regs.includes(x)) +
        checks('fl-lid', 'Unidad líder', 'lid', LID, (e, x) => e.lid === x, true) +
        checks('fl-resp', 'Responsable', 'resp', RESP, (e, x) => e.resp === x) +
        '<div class="cal-fgroup" role="group" aria-labelledby="fl-tipo"><div class="cal-flabel" id="fl-tipo">Tipo de actividad</div><div class="cal-chips">' + tipos + '</div></div>' +
      '</div>' +
      '<div class="cal-sheet-foot"><button class="btn btn-primary" data-click="' + closeSheet + '">Ver ' + plural(list.length) + '</button></div>' +
      '</aside>';
  }

  function main(period, n, chips, body, v) {
    return '<main class="cal-main">' +
      '<div class="cal-toolbar">' +
        '<h2 class="cal-period" aria-live="polite">' + esc(period) + '</h2>' +
        '<div class="cal-nav">' +
          '<button class="btn btn-secondary btn-icon" aria-label="Anterior" data-click="' + h(step(-1)) + '">' + svg(I.prev, 18) + '</button>' +
          '<button class="btn btn-secondary btn-icon" aria-label="Siguiente" data-click="' + h(step(1)) + '">' + svg(I.next, 18) + '</button>' +
        '</div>' +
        '<button class="btn btn-secondary cal-today" data-click="' + h(() => set({ anchor: TODAY })) + '">Hoy</button>' +
        '<span class="cal-count">' + plural(n) + '</span>' +
        '<div class="cal-spacer"></div>' +
        '<div class="cal-views" role="group" aria-label="Vista">' +
          VIEWS.map(([id, l, short]) => '<button class="cal-view" aria-pressed="' + (v === id) + '" data-click="' + h(() => set({ view: id, exp: false })) + '">' +
            (short ? '<span class="cal-view-long">' + l + '</span><span class="cal-view-short">' + short + '</span>' : l) + '</button>').join('') +
        '</div>' +
      '</div>' +
      (chips.length ? '<div class="cal-active" data-key="chips" role="group" aria-label="Filtros activos">' +
        chips.map(c => '<button class="cal-active-chip" aria-label="Quitar filtro ' + esc(c.label) + '" data-click="' + h(c.remove) + '">' + esc(c.label) + svg(I.x, 14) + '</button>').join('') +
      '</div>' : '') +
      '<div class="cal-content" data-key="' + esc(v + '|' + period) + '">' + body + '</div>' +
      '</main>';
  }

  // ── Vistas ─────────────────────────────────────────────────────────────
  function vMes(list, Y, M) {
    const gs = mon(new Date(Y, M, 1));
    let cells = [];
    for (let i = 0; i < 42; i++) { const d = add(gs, i); cells.push({ d, key: ks(d), inM: d.getMonth() === M, wk: i % 7 > 4 }); }
    if (cells.slice(35).every(c => !c.inM)) cells = cells.slice(0, 35);

    const dow = DOW.map(d => '<span><span class="cal-dow-long">' + d.slice(0, 3) + '</span><span class="cal-dow-short">' + d[0] + '</span></span>').join('');
    const grid = cells.map(c => {
      const evs = list.filter(e => ov(e, c.key, c.key)).sort(byS);
      const goDay = h(() => set({ anchor: c.key, view: 'semana' }));
      const label = c.d.getDate() + ' de ' + MESES[c.d.getMonth()] + ', ' + (evs.length ? plural(evs.length) : 'sin actividades');
      return '<div class="cal-day' + (!c.inM ? ' is-out' : c.wk ? ' is-weekend' : '') + (c.key === TODAY ? ' is-today' : '') + '">' +
        '<button class="cal-day-num" aria-label="' + label + '" data-click="' + goDay + '"><span class="cal-day-n">' + c.d.getDate() + '</span>' +
          '<span class="cal-dots">' + evs.slice(0, 4).map(e => '<span style="--t-solid:' + esc(col(e.tipo).solid) + '"></span>').join('') + '</span></button>' +
        evs.slice(0, 3).map(e => '<button class="cal-pill" title="' + esc(e.n) + '" style="' + tv(col(e.tipo)) + '" data-click="' + h(openSel(e.id)) + '"><span class="cal-pill-dot"></span><span class="cal-pill-text">' + esc(e.n) + '</span></button>').join('') +
        (evs.length > 3 ? '<button class="cal-more" data-click="' + goDay + '">+' + (evs.length - 3) + ' más</button>' : '') +
        '</div>';
    }).join('');
    return '<div class="cal-mes"><div class="cal-dow cal-flabel" aria-hidden="true">' + dow + '</div><div class="cal-mes-grid">' + grid + '</div></div>';
  }

  function vSemana(list, ws) {
    return '<div class="cal-semana">' + [0, 1, 2, 3, 4, 5, 6].map(i => {
      const d = add(ws, i), key = ks(d);
      const evs = list.filter(e => ov(e, key, key)).sort((x, y) => (x.h || '00').localeCompare(y.h || '00'));
      const items = evs.length ? evs.map(e => {
        const x = dv(e);
        return '<button class="cal-wev" style="' + x.style + '" data-click="' + h(openSel(e.id)) + '">' +
          '<span class="cal-wev-time">' + x.time + '</span><span class="cal-wev-name">' + esc(e.n) + '</span><span class="cal-wev-lid">' + esc(e.lid) + '</span></button>';
      }).join('') : '<span class="cal-wday-empty">Sin actividades</span>';
      return '<div class="cal-wday' + (i > 4 ? ' is-weekend' : '') + (key === TODAY ? ' is-today' : '') + '">' +
        '<div class="cal-wday-head"><span class="cal-flabel">' + DOW[i].slice(0, 3) + '</span><span class="cal-wday-num cal-heading">' + d.getDate() + '</span></div>' +
        '<div class="cal-wday-items">' + items + '</div></div>';
    }).join('') + '</div>';
  }

  function vLista(inL, lS) {
    const gm = {};
    inL.forEach(e => { const g = e.s < lS ? lS : e.s; (gm[g] = gm[g] || []).push(e); });
    const keys = Object.keys(gm).sort();
    if (!keys.length) return '<div class="cal-empty">No hay actividades con estos filtros en este periodo.</div>';
    return '<div class="cal-lista">' + keys.map(g => {
      const d = pd(g);
      return '<section class="cal-lgroup' + (g === TODAY ? ' is-today' : '') + '" data-key="' + g + '">' +
        '<div class="cal-ldate"><span class="cal-ldate-day cal-heading">' + d.getDate() + '</span><span class="cal-ldate-sub">' + DOW[(d.getDay() + 6) % 7] + '</span><span class="cal-ldate-sub">' + ab(d.getMonth()) + '</span></div>' +
        '<div class="cal-litems">' + gm[g].map(e => {
          const x = dv(e);
          return '<button class="cal-lev" data-key="' + e.id + '" style="' + x.style + '" data-click="' + h(openSel(e.id)) + '">' +
            '<span class="cal-lev-main"><span class="cal-lev-dot"></span><span class="cal-lev-text"><span class="cal-lev-name">' + esc(e.n) + '</span>' +
              '<span class="cal-lev-when">' + x.dateLabel + ' · ' + x.time + '</span><span class="cal-lev-lid-sm">' + esc(e.lid) + '</span></span></span>' +
            '<span class="cal-lev-col cal-lev-col--resp"><span class="cal-lev-k">Responsable</span><span class="cal-lev-v">' + esc(e.resp) + '</span></span>' +
            '<span class="cal-lev-col"><span class="cal-lev-k">' + esc(e.lid) + '</span><span class="cal-lev-v">' + x.reg + '</span></span>' +
            '<span class="' + x.estCls + '">' + x.est + '</span></button>';
        }).join('') + '</div></section>';
    }).join('') + '</div>';
  }

  function vLinea(inM, Y, M, mS, mE, f) {
    const N = new Date(Y, M + 1, 0).getDate();
    const td = TODAY >= mS && TODAY <= mE ? pd(TODAY).getDate() : 0;
    let days = '';
    for (let n = 1; n <= N; n++) {
      const wd = (new Date(Y, M, n).getDay() + 6) % 7;
      days += '<span class="cal-lday' + (n === td ? ' is-today' : wd > 4 ? ' is-weekend' : '') + '"><span class="cal-lday-l">' + 'LMMJVSD'[wd] + '</span><span class="cal-lday-n">' + n + '</span></span>';
    }
    const units = (f.lid.length ? f.lid : LID).map(u => {
      const lanes = [];
      const bars = inM.filter(e => e.lid === u).map(e => {
        const s = e.s < mS ? 1 : pd(e.s).getDate(), en = e.e > mE ? N : pd(e.e).getDate();
        let l = lanes.findIndex(x => x < s);
        if (l < 0) { l = lanes.length; lanes.push(en); } else lanes[l] = en;
        return '<button class="cal-lbar" title="' + esc(e.n) + '" style="grid-column:' + s + ' / ' + (en + 1) + ';grid-row:' + (l + 1) + ';' + tv(col(e.tipo)) + '" data-click="' + h(openSel(e.id)) + '"><span>' + esc(e.n) + '</span></button>';
      });
      return { u, bars, lanes: lanes.length };
    }).filter(x => x.bars.length);

    return '<div class="cal-linea" style="--n:' + N + '">' +
      '<div class="cal-lhead"><span class="cal-flabel">Unidad líder</span><div class="cal-ldays" aria-hidden="true">' + days + '</div></div>' +
      units.map(x => '<div class="cal-lunit"><div class="cal-lunit-info"><span class="cal-lunit-name">' + esc(x.u) + '</span><span class="cal-lunit-count">' + plural(x.bars.length) + '</span></div>' +
        '<div class="cal-lbars">' + (td ? '<span class="cal-ltoday" style="grid-column:' + td + ' / ' + (td + 1) + ';grid-row:1 / span ' + x.lanes + '"></span>' : '') + x.bars.join('') + '</div></div>').join('') +
      (units.length ? '' : '<div class="cal-empty">No hay actividades con estos filtros en este mes.</div>') +
      '</div>';
  }

  function vAnio(list, Y, M) {
    const cnt = {};
    list.forEach(e => {
      for (let d = pd(e.s), end = pd(e.e); d <= end; d = add(d, 1)) if (d.getFullYear() === Y) { const k = ks(d); cnt[k] = (cnt[k] || 0) + 1; }
    });
    const months = MESES.map((m, mi) => {
      const fs = new Date(Y, mi, 1), g = mon(fs);
      let cells = '';
      for (let i = 0; i < 42; i++) {
        const d = add(g, i), inm = d.getMonth() === mi, k = ks(d), c = inm ? Math.min(cnt[k] || 0, 4) : 0;
        cells += '<span class="cal-acell' + (c ? ' cal-l' + c : '') + (inm && k === TODAY ? ' is-today' : '') + '">' + (inm ? d.getDate() : '') + '</span>';
      }
      const tot = list.filter(e => ov(e, ks(fs), ks(new Date(Y, mi + 1, 0)))).length;
      return '<button class="cal-amonth' + (mi === M ? ' is-current' : '') + '" aria-label="' + cap(m) + ' ' + Y + ', ' + (tot ? plural(tot) : 'sin actividades') + '" data-click="' + h(() => set({ anchor: ks(fs), view: 'mes' })) + '">' +
        '<span class="cal-amonth-head"><span class="cal-amonth-name cal-heading">' + cap(m) + '</span><span class="cal-amonth-total">' + (tot ? tot + ' act.' : '—') + '</span></span>' +
        '<span class="cal-amonth-grid" aria-hidden="true">' + cells + '</span></button>';
    }).join('');
    return '<div class="cal-anio">' + months + '</div>' +
      '<div class="cal-legend">Menos<span class="cal-l1"></span><span class="cal-l2"></span><span class="cal-l3"></span><span class="cal-l4"></span>Más actividades por día</div>';
  }

  function detail() {
    const e = state.sel && events.find(x => x.id === state.sel);
    if (!e) return '';
    const x = dv(e), close = h(() => set({ sel: null }));
    const fact = (icon, k, val) => svg(icon, 18) + '<span class="cal-fact-k">' + k + '</span><span class="cal-fact-v">' + val + '</span>';
    const docInner = svg(I.file, 20) + '<span class="cal-doc-text"><span class="cal-doc-name">' + esc(e.doc) + '</span><span class="cal-doc-sub">Documento de soporte</span></span>';
    const doc = !e.doc ? '' : e.docUrl
      ? '<a class="cal-doc" href="' + esc(e.docUrl) + '" target="_blank" rel="noopener">' + docInner + '<span class="cal-doc-open">Abrir</span></a>'
      : '<div class="cal-doc">' + docInner + '</div>';
    return '<div class="cal-backdrop" data-key="detail" data-click="' + h((ev, el) => { if (ev.target === el) set({ sel: null }); }) + '">' +
      '<div class="cal-dialog dialog" role="dialog" aria-modal="true" aria-labelledby="cal-dlg-title">' +
        '<div class="cal-dialog-top"><span class="cal-type-tag" style="' + x.style + '">' + esc(e.tipo) + '</span><span class="' + x.estCls + '">' + x.est + '</span>' +
          '<span class="cal-spacer"></span><button class="btn btn-secondary btn-icon" aria-label="Cerrar" data-autofocus data-click="' + close + '">' + svg(I.x) + '</button></div>' +
        '<h3 class="cal-dialog-title" id="cal-dlg-title">' + esc(e.n) + '</h3>' +
        '<div class="cal-facts">' +
          fact(I.cal, 'Fecha', x.dateLabel + ' · ' + x.time) + fact(I.user, 'Responsable', esc(e.resp)) +
          fact(I.building, 'Unidad líder', esc(e.lid)) + fact(I.pin, 'Unidad regional', x.reg) +
        '</div>' +
        doc +
        '<div class="dialog-actions"><button class="btn btn-secondary" data-click="' + h(() => dl('actividad.ics', ics([e]), 'text/calendar;charset=utf-8')) + '">Añadir a mi calendario</button>' +
          '<button class="btn btn-primary" data-click="' + close + '">Listo</button></div>' +
      '</div></div>';
  }

  // ── Aplicación sobre el DOM ────────────────────────────────────────────
  const keyOf = n => (n.nodeType === 1 && n.getAttribute('data-key')) || null;
  const same = (a, b) => a.nodeType === b.nodeType && a.nodeName === b.nodeName &&
    (a.nodeName !== 'INPUT' || a.getAttribute('type') === b.getAttribute('type'));

  function patch(a, b) {
    if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    for (const at of Array.from(a.attributes)) if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
    for (const at of Array.from(b.attributes)) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    patchChildren(a, b);
    if (a.nodeName === 'INPUT') {
      if (a.type === 'checkbox') a.checked = b.hasAttribute('checked');
      else { const v = b.getAttribute('value') || ''; if (a.value !== v) a.value = v; }
    }
  }

  // Deja en `a` los hijos de `b`, reutilizando nodos: por `data-key` si lo tienen, si no por posición.
  function patchChildren(a, b) {
    const next = Array.from(b.childNodes), keyed = new Map();
    for (const n of Array.from(a.childNodes)) { const k = keyOf(n); if (k) keyed.set(k, n); }
    next.forEach((nb, i) => {
      const cur = a.childNodes[i] || null, k = keyOf(nb);
      let m = k ? keyed.get(k) : (cur && !keyOf(cur) ? cur : null);
      if (m && !same(m, nb)) m = null;
      if (m) { if (k) keyed.delete(k); if (m !== cur) a.insertBefore(m, cur); patch(m, nb); }
      else a.insertBefore(nb, cur);
    });
    while (a.childNodes.length > next.length) a.removeChild(a.lastChild);
  }

  const root = document.getElementById('app');
  let prevSel = null, prevSheet = false, returnFocus = null;

  function render() {
    TODAY = ks(new Date());
    handlers = [];
    const tpl = document.createElement('template');
    tpl.innerHTML = view();
    patchChildren(root, tpl.content);

    // Foco: al abrir el detalle va al botón Cerrar; al cerrarlo vuelve a donde estaba.
    if (state.sel !== prevSel) {
      if (state.sel && !prevSel) returnFocus = document.activeElement;
      if (state.sel) { const b = root.querySelector('.cal-dialog [data-autofocus]'); if (b) b.focus(); }
      else if (returnFocus && returnFocus.isConnected) returnFocus.focus();
      prevSel = state.sel;
    }
    if (state.sheet !== prevSheet) {
      prevSheet = state.sheet;
      const el = root.querySelector(state.sheet ? '.cal-filtros' : '.cal-filter-btn');
      if (el && MOBILE.matches) el.focus();
    }
  }

  const dispatch = attr => ev => {
    const el = ev.target.closest && ev.target.closest('[' + attr + ']');
    const fn = el && root.contains(el) && handlers[+el.getAttribute(attr)];
    if (fn) fn(ev, el);
    return !!fn;
  };
  const onClick = dispatch('data-click');

  document.addEventListener('click', ev => {
    // Un clic fuera del menú Exportar lo cierra.
    const outside = state.exp && !(ev.target.closest && ev.target.closest('.cal-menu-wrap'));
    if (outside) state.exp = false;
    if (!onClick(ev) && outside) render();
  });
  document.addEventListener('input', dispatch('data-input'));
  document.addEventListener('change', dispatch('data-change'));

  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      if (state.sel) set({ sel: null });
      else if (state.sheet) set({ sheet: false });
      else if (state.exp) set({ exp: false });
      else return;
      ev.preventDefault();
    } else if (ev.key === 'Tab' && state.sel) { // mantiene el foco dentro del detalle
      const dlg = root.querySelector('.cal-dialog');
      const els = dlg ? dlg.querySelectorAll('a[href], button') : [];
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1], act = document.activeElement;
      if (!dlg.contains(act) || (ev.shiftKey && act === first)) { (ev.shiftKey ? last : first).focus(); ev.preventDefault(); }
      else if (!ev.shiftKey && act === last) { first.focus(); ev.preventDefault(); }
    }
  });

  // Si la página queda abierta al cambiar el día, se actualizan "hoy" y los estados.
  setInterval(() => { if (ks(new Date()) !== TODAY) render(); }, 60000);

  render();
})();
