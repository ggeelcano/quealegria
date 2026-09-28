/* Qué Alegría Qué Buen Día · demo de tienda (buscador de regalos, packs personalizables, cesta) */
const IMG = 'img/';
const WA = '34696511177';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const eur = n => n.toFixed(2).replace('.', ',') + ' €';

const PARA = {
  mama: { n: 'Mamá', s: 'Cumpleaños, Día de la Madre', img: 'p5018.jpg' },
  especial: { n: 'Persona especial', s: 'Pareja, amiga, hermana', img: 'p13998.jpg' },
  profe: { n: 'Profe', s: 'Fin de curso, Navidad', img: 'p1904.jpg' },
  boda: { n: 'Novios y testigos', s: '¿Quieres ser mi testigo?', img: 'p5740.jpg' },
  papa: { n: 'Papá', s: 'Cumpleaños, Día del Padre', img: 'p1867.jpg' },
  bebe: { n: 'Recién nacido', s: 'Bebé y papás', img: 'p9816.jpg' },
};
const OCC = { cumple: 'Cumpleaños', navidad: 'Navidad', madre: 'Día de la Madre', padre: 'Día del Padre', fincurso: 'Fin de curso', boda: 'Boda', nacimiento: 'Nacimiento', sanvalentin: 'San Valentín', gracias: 'Para dar las gracias' };
const BUDGET = [
  { k: 'b25', n: 'Hasta 25 €', min: 0, max: 25 }, { k: 'b40', n: 'De 25 a 40 €', min: 25, max: 40 },
  { k: 'b60', n: 'De 40 a 60 €', min: 40, max: 60 }, { k: 'bmax', n: 'Más de 60 €', min: 60, max: 1e9 }, { k: 'any', n: 'Me da igual', min: 0, max: 1e9 },
];
const KIND = { pack: 'Pack regalo', navidad: 'Especial Navidad', flores: 'Flores preservadas', joya: 'Joyita de plata', taller: 'Taller para regalar', taza: 'Taza con mensaje' };
const RANK = { pack: 0, navidad: 1, flores: 2, taza: 3, joya: 4, taller: 5 };
const SHIP = [
  { k: 'pen', n: 'A domicilio (península)', d: '48-72 h laborables desde que sale del taller', p: 5.40, pre: 'desde ' },
  { k: 'local', n: 'En 24 h en tu zona', d: 'Majadahonda, Pozuelo, Las Rozas, Boadilla, Villanueva del Pardillo y V. de la Cañada', p: 6 },
  { k: 'pick', n: 'Recogida en el taller', d: 'Ctra. de Boadilla 35, local 23 · listo en 24-48 h', p: 0 },
];
// Palabras clave → etiqueta corta para «qué lleva dentro» en las tarjetas
const SHORT = [[/taza/i, 'Taza'], [/libreta/i, 'Libreta'], [/chocolate/i, 'Chocolate'], [/bomba de ba/i, 'Bomba de baño'], [/jab[oó]n/i, 'Jabón'], [/vel(it)?a/i, 'Velita'],
  [/crem(it)?a de manos|cremita/i, 'Cremita'], [/chuches/i, 'Chuches'], [/collar|pulsera|joyita/i, 'Joyita'], [/reg[aá][ñn][aá]s/i, 'Regañás'], [/pat[eé]/i, 'Paté'], [/crema de queso/i, 'Crema de queso'],
  [/aceitunas/i, 'Aceitunas'], [/aceite de oliva la chinata 100/i, 'Aceite'], [/tabla/i, 'Tabla'], [/l[aá]mina/i, 'Lámina'], [/capazo|cesta|cesto/i, 'Cesta de mimbre'], [/caja de madera/i, 'Caja de madera'],
  [/mousse/i, 'Mousse facial'], [/tarjet[oó]n/i, 'Tarjetón'], [/letra de flores/i, 'Letra de flores'], [/corona/i, 'Corona'], [/flor|ramillete|ramito|arreglo/i, 'Flores']];
const shortList = it => { const out = []; for (const s of it.inside || []) { const m = SHORT.find(([r]) => r.test(s)); if (m && !out.includes(m[1])) out.push(m[1]); } return out; };
const byId = id => ITEMS.find(i => String(i.id) === String(id));
const isCustom = it => (it.opts || []).some(o => ['mug', 'jewel', 'choc', 'chips'].includes(o.t));

/* ---------- Tarjetas ---------- */
function card(it) {
  const sl = shortList(it); const more = sl.length > 4 ? `<span>+${sl.length - 4}</span>` : '';
  return `<article class="card">
    <div class="ph"><img src="${IMG + it.img}" alt="${esc(it.name)}" loading="lazy"><span class="tag">${KIND[it.kind]}</span></div>
    <div class="bd">
      <h3><button type="button" data-open="${it.id}">${esc(it.name)}</button></h3>
      ${sl.length ? `<div class="in-list" aria-label="Qué lleva">${sl.slice(0, 4).map(s => `<span>${s}</span>`).join('')}${more}</div>` : ''}
      <div class="row"><span class="price">${it.from ? '<small>desde</small>' : ''}${eur(it.price)}</span>${isCustom(it) ? '<span class="pz">Personalízalo</span>' : ''}</div>
    </div></article>`;
}
const sortRec = (a, b) => (RANK[a.kind] - RANK[b.kind]) || ((b.best || 0) - (a.best || 0)) || (a.price - b.price);

/* ---------- Buscador de regalos ---------- */
const F = { step: 0, para: null, occ: null, bud: null };
const matches = (it, f = F) => (!f.para || it.para.includes(f.para)) && (!f.occ || f.occ === 'any' || it.occ.includes(f.occ)) &&
  (!f.bud || (b => it.price >= b.min && it.price <= b.max)(BUDGET.find(x => x.k === f.bud)));
function renderFinder() {
  const el = $('#finder'); const dots = `<div class="f-steps" aria-hidden="true">${[0, 1, 2].map(i => `<i class="${i <= F.step ? 'on' : ''}"></i>`).join('')}</div>`;
  const back = F.step > 0 && F.step < 3 ? `<button type="button" class="f-back" data-fback>← Atrás</button>` : '<span></span>';
  let body = '';
  if (F.step === 0) {
    body = `<h2>¿Para quién es el regalo?</h2><div class="f-opts">${Object.entries(PARA).map(([k, p]) =>
      `<button type="button" class="f-opt" data-fpara="${k}"><img src="${IMG + p.img}" alt=""><span>${p.n}<small>${p.s}</small></span></button>`).join('')}</div>`;
  } else if (F.step === 1) {
    const occs = Object.keys(OCC).map(k => [k, ITEMS.filter(i => matches(i, { para: F.para, occ: k })).length]).filter(([, n]) => n > 0);
    body = `<h2>¿Qué celebráis?</h2><div class="f-opts">${occs.map(([k, n]) =>
      `<button type="button" class="f-opt" data-focc="${k}"><span>${OCC[k]}<small>${n} ideas</small></span></button>`).join('')}
      <button type="button" class="f-opt" data-focc="any"><span>Sin motivo, porque sí<small>${ITEMS.filter(i => matches(i, { para: F.para })).length} ideas</small></span></button></div>`;
  } else if (F.step === 2) {
    body = `<h2>¿Cuánto quieres gastar?</h2><div class="f-opts">${BUDGET.map(b => { const n = ITEMS.filter(i => matches(i, { para: F.para, occ: F.occ, bud: b.k })).length;
      return `<button type="button" class="f-opt" data-fbud="${b.k}" ${n ? '' : 'disabled'}><span>${b.n}<small>${n ? n + ' regalos' : 'nada en este rango'}</small></span></button>`; }).join('')}</div>`;
  } else {
    const n = ITEMS.filter(i => matches(i)).length;
    body = `<div class="f-done"><h2>Tenemos ${n} ${n === 1 ? 'regalo' : 'regalos'} para ti</h2>
      <div class="f-sum"><span>${PARA[F.para].n}</span><span>${F.occ === 'any' ? 'Porque sí' : OCC[F.occ]}</span><span>${BUDGET.find(b => b.k === F.bud).n}</span></div>
      <p>Los packs primero, con lo que lleva cada uno a la vista.</p>
      <a class="btn wide" href="#resultados">Ver los regalos</a>
      <p style="margin-top:12px"><button type="button" class="link-btn" data-freset>Empezar de nuevo</button></p></div>`;
  }
  el.innerHTML = `<div class="f-top">${dots}${back}</div>${body}`;
}
function renderResults() {
  const sec = $('#resultados');
  if (F.step < 3) { sec.hidden = true; return; }
  const list = ITEMS.filter(i => matches(i)).sort(sortRec);
  sec.hidden = false;
  $('#resEyebrow').textContent = `${PARA[F.para].n} · ${F.occ === 'any' ? 'Porque sí' : OCC[F.occ]} · ${BUDGET.find(b => b.k === F.bud).n}`;
  $('#resTitle').textContent = `${list.length} ${list.length === 1 ? 'regalo' : 'regalos'} para ${PARA[F.para].n.toLowerCase()}`;
  $('#resGrid').innerHTML = list.map(card).join('') || '<p class="empty">No hay nada con esas respuestas. Escríbenos por WhatsApp y te preparamos algo a medida.</p>';
}
function finderGo(patch) {
  Object.assign(F, patch); renderFinder(); renderResults();
  if (F.step === 3) setTimeout(() => $('#resultados').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }), 60);
}

/* ---------- Secciones ---------- */
const PK = { para: 'all', sort: 'rec' };
function renderPacks() {
  const packs = ITEMS.filter(i => i.kind === 'pack');
  $('#packChips').innerHTML = [['all', 'Todos'], ...Object.entries(PARA).map(([k, p]) => [k, p.n])].map(([k, n]) => {
    const c = k === 'all' ? packs.length : packs.filter(i => i.para.includes(k)).length;
    return c ? `<button type="button" data-pk="${k}" aria-pressed="${PK.para === k}">${n} <span aria-hidden="true">·</span> ${c}</button>` : ''; }).join('');
  let list = packs.filter(i => PK.para === 'all' || i.para.includes(PK.para));
  list = PK.sort === 'asc' ? list.sort((a, b) => a.price - b.price) : PK.sort === 'desc' ? list.sort((a, b) => b.price - a.price) : list.sort(sortRec);
  $('#packGrid').innerHTML = list.map(card).join('');
}
const IDEAS = [['flores', 'Flores preservadas'], ['joya', 'Joyitas de plata'], ['taza', 'Tazas con mensaje'], ['taller', 'Talleres para regalar']];
let ideaTab = 'flores';
function renderIdeas() {
  $('#ideaTabs').innerHTML = IDEAS.map(([k, n]) => `<button type="button" role="tab" data-idea="${k}" aria-selected="${ideaTab === k}">${n}</button>`).join('');
  $('#ideaGrid').innerHTML = ITEMS.filter(i => i.kind === ideaTab && !(i.kind === 'flores' && i.occ.length === 1 && i.occ[0] === 'navidad')).sort((a, b) => a.price - b.price).map(card).join('');
}
function renderStatic() {
  $('#bestGrid').innerHTML = ITEMS.filter(i => i.best).map(card).join('');
  $('#xmasRail').innerHTML = ITEMS.filter(i => i.kind === 'navidad' || ([10424, 14465, 14492].includes(i.id))).map(card).join('');
}

/* ---------- Ficha con personalización ---------- */
const M = { it: null, sel: {}, txt: {}, img: 0, date: '', noOpen: false, lastFocus: null };
function defaults(it) {
  const sel = {};
  (it.opts || []).forEach((o, gi) => {
    if (!o.opts || !o.opts.length) return;
    if (o.t === 'jewel' && !o.opts.some(x => x.none) && /quieres|añad/i.test(o.label)) o.opts.unshift({ n: 'Sin joyita', none: 1, p: 0 });
    const none = o.opts.findIndex(x => x.none); sel[gi] = none >= 0 ? none : 0;
  });
  return sel;
}
const chosen = gi => M.it.opts[gi].opts[M.sel[gi]];
const mugCustom = () => (M.it.opts || []).some((o, gi) => o.t === 'mug' && chosen(gi) && (chosen(gi).custom || chosen(gi).p > 0));
// taza «con los datos de la ceremonia»: se paga aparte pero no es mensaje libre
const mugData = () => (M.it.opts || []).some((o, gi) => o.t === 'mug' && chosen(gi) && chosen(gi).p > 0 && !chosen(gi).custom);
function total() { let t = M.it.price; (M.it.opts || []).forEach((o, gi) => { if (o.opts && M.sel[gi] != null) t += chosen(gi).p || 0; }); return t; }

function stepTitle(o, n) {
  const T = { mug: 'Elige la taza', jewel: /quieres|añad/i.test(o.label) ? 'Añade una joyita' : 'Elige la joyita', choc: 'Sabor del chocolate' };
  let t = T[o.t] || o.label.replace(/\(obligatorio\)/i, '').replace(/^¿?/, '').replace(/\?$/, '').replace(/^(la|el|los|las|tu|tus)\s+/i, '').trim();
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return `<h3><span>${n}.</span>${esc(t)}</h3>`;
}
function optBtn(o, gi, x, xi) {
  const on = M.sel[gi] === xi; const pr = x.p ? `<span class="pr">+${eur(x.p)}</span>` : '';
  if (o.t === 'mug' || o.t === 'jewel') {
    const pic = x.img ? (o.t === 'mug' ? `<span class="pic"><img src="${IMG + x.img}" alt="" loading="lazy"></span>` : `<img src="${IMG + x.img}" alt="" loading="lazy">`)
      : `<span class="ph0">${x.none ? 'Sin joyita' : x.custom ? 'Tu mensaje' : esc(x.n)}</span>`;
    return `<button type="button" class="opt" data-g="${gi}" data-x="${xi}" aria-pressed="${on}">${pic}<span class="nm">${esc(x.n)}</span>${pr}</button>`;
  }
  const dot = x.c ? `<i style="background:${x.c2 ? `linear-gradient(90deg,${x.c} 50%,${x.c2} 50%)` : x.c}"></i>` : '';
  return `<button type="button" class="pill-opt" data-g="${gi}" data-x="${xi}" aria-pressed="${on}">${dot}<span>${esc(x.n)}</span>${pr}</button>`;
}
function mugSvg(text) {
  const words = (text || 'Tu mensaje aquí').slice(0, 60).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > 14 && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur);
  const ls = lines.slice(0, 4); const y0 = 60 - (ls.length - 1) * 9;
  return `<svg viewBox="0 0 140 110" role="img" aria-label="Vista previa de la taza"><path d="M112 34c14 0 18 8 18 18s-6 20-20 20" fill="none" stroke="#d9d0d3" stroke-width="7"/><rect x="14" y="14" width="100" height="86" rx="10" fill="#fff" stroke="#e1d7da" stroke-width="2"/><ellipse cx="64" cy="15" rx="50" ry="5" fill="#f4eff1" stroke="#e1d7da" stroke-width="2"/>${ls.map((l, i) => `<text x="64" y="${y0 + i * 18}" text-anchor="middle" font-family="Caveat, cursive" font-size="17" font-weight="700" fill="#406666">${esc(l)}</text>`).join('')}</svg>`;
}
function renderCfg() {
  const it = M.it; let n = 0; let html = '';
  (it.opts || []).forEach((o, gi) => {
    if (o.opts && o.opts.length) {
      if (o.opts.length === 1 && !o.opts[0].p) return; // una sola opción: no hay nada que elegir
      const grid = (o.t === 'mug' || o.t === 'jewel') ? 'opts' : 'pills';
      html += `<div class="step">${stepTitle(o, ++n)}<div class="${grid}" role="group" aria-label="${esc(o.label)}">${o.opts.map((x, xi) => optBtn(o, gi, x, xi)).join('')}</div>`;
      if (o.t === 'mug' && chosen(gi).custom) html += `<label class="field">Mensaje para la taza<input type="text" maxlength="60" data-txt="mug" value="${esc(M.txt.mug || '')}" placeholder="Ej. Gracias por este curso tan bonito"></label><div class="mug-prev" id="mugPrev">${mugSvg(M.txt.mug)}<p>Así lo verás en la taza. Te confirmamos el diseño final por WhatsApp si hace falta.</p></div>`;
      html += '</div>';
    } else if (o.t === 'text' && (!o.when || mugData())) {
      const lbl = o.when ? 'Datos para la taza (nombres y fecha)' : o.label.replace(/^(\d+\.\s*)/, '');
      html += `<div class="step"><label class="field">${esc(lbl)}<input type="text" maxlength="120" data-txt="t${gi}" value="${esc(M.txt['t' + gi] || '')}"></label></div>`;
    }
  });
  const hasName = (it.opts || []).some(o => o.t === 'name'), hasCard = (it.opts || []).some(o => o.t === 'card');
  if (hasName || hasCard || it.kind !== 'taller') {
    html += `<div class="step"><h3><span>${++n}.</span>Tu mensaje</h3>
      <label class="field">¿Para quién es?<input type="text" maxlength="40" data-txt="to" value="${esc(M.txt.to || '')}" placeholder="Ej. Mamá" autocomplete="off"></label>
      <label class="field">Mensaje para la tarjeta<textarea maxlength="250" data-txt="card" placeholder="Escribe aquí lo que quieres que lea al abrirlo">${esc(M.txt.card || '')}</textarea><small>Lo escribimos en una tarjeta y va en un sobre kraft.</small></label>
      <div class="card-prev" aria-hidden="true"><div class="to" id="cpTo">${esc(M.txt.to ? 'Para ' + M.txt.to : 'Para…')}</div><div class="msg ${M.txt.card ? '' : 'ph'}" id="cpMsg">${esc(M.txt.card || 'Tu mensaje aparecerá aquí')}</div><div class="sig">Qué alegría, qué buen día</div></div>
      <label class="check"><input type="checkbox" data-noopen ${M.noOpen ? 'checked' : ''}><span>Es un cumpleaños o una sorpresa: poned en la caja «No abrir hasta su día»</span></label>
    </div>`;
  }
  $('#mCfg').innerHTML = html;
  $('#mTot').textContent = eur(total());
  renderDeliv();
}
function addBiz(d, n) { const x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() % 6) n--; } return x; }
const fmtD = d => d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');
function renderDeliv() {
  const now = new Date(); const a = addBiz(now, 3), b = addBiz(now, 5);
  const iso = x => x.toISOString().slice(0, 10);
  let extra = '';
  if (M.date) { const want = new Date(M.date + 'T12:00'); extra = want >= b ? `<li class="ok">Llega a tiempo para el ${fmtD(want)}.</li>` : want >= addBiz(now, 1) ? `<li class="warn">Va justo para el ${fmtD(want)}: elige entrega en 24 h o escríbenos por WhatsApp.</li>` : `<li class="warn">Elige una fecha a partir de mañana.</li>`; }
  $('#mDeliv').innerHTML = `<b>Si lo pides hoy</b><ul>
    <li>Península: llega entre el <b>${fmtD(a)}</b> y el <b>${fmtD(b)}</b> · desde 5,40 €</li>
    <li>Majadahonda, Pozuelo, Las Rozas y alrededores: en 24 h laborables · 6 €</li>
    <li>Recogida en el taller: gratis</li>
    <li><label class="field" style="margin-top:4px">¿Para qué día lo necesitas? (opcional)<input type="date" data-date min="${iso(addBiz(now, 1))}" value="${M.date}"></label></li>${extra}</ul>`;
}
function openSheet(id) {
  const it = byId(id); if (!it) return;
  M.it = it; M.sel = defaults(it); M.txt = {}; M.img = 0; M.date = ''; M.noOpen = false; M.lastFocus = document.activeElement;
  const imgs = [it.img, ...(it.gallery || [])];
  $('#mKicker').textContent = KIND[it.kind] + (it.para.length ? ' · para ' + it.para.slice(0, 2).map(p => PARA[p].n.toLowerCase()).join(' o ') : '');
  $('#mTitle').textContent = it.name;
  $('#mBase').textContent = (it.from ? 'Desde ' : '') + eur(it.price);
  $('#mIntro').textContent = it.intro || '';
  $('#mInside').innerHTML = it.inside && it.inside.length ? `<h3>Qué lleva dentro</h3><ul>${it.inside.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : '';
  $('#mInside').hidden = !(it.inside && it.inside.length);
  $('#mThumbs').innerHTML = imgs.length > 1 ? imgs.map((s, i) => `<button type="button" data-mimg="${i}" aria-pressed="${i === 0}" aria-label="Foto ${i + 1}"><img src="${IMG + s}" alt=""></button>`).join('') : '';
  setMainImg(it.img);
  renderCfg();
  const sh = $('#sheet'); sh.hidden = false; $('#sheetIn').scrollTop = 0; document.body.style.overflow = 'hidden';
  $('#mClose').focus();
}
function setMainImg(src, alt) { const im = $('#mImg'); im.src = IMG + src; im.alt = alt || M.it.name; }
function closeSheet() { if ($('#sheet').hidden) return; $('#sheet').hidden = true; document.body.style.overflow = ''; if (M.lastFocus) M.lastFocus.focus(); }
function summary() {
  const out = [];
  (M.it.opts || []).forEach((o, gi) => { if (o.opts && o.opts.length > 1 || (o.opts && o.opts[0] && o.opts[0].p)) { const x = chosen(gi); if (!x.none) out.push(x.n + (x.p ? ` (+${eur(x.p)})` : '')); } });
  if (M.txt.mug && mugCustom()) out.push(`Taza: «${M.txt.mug}»`);
  Object.entries(M.txt).filter(([k, v]) => /^t\d+$/.test(k) && v).forEach(([, v]) => out.push(v));
  if (M.txt.to) out.push('Para ' + M.txt.to);
  if (M.txt.card) out.push(`Tarjeta: «${M.txt.card.slice(0, 60)}${M.txt.card.length > 60 ? '…' : ''}»`);
  if (M.noOpen) out.push('«No abrir hasta su día»');
  if (M.date) out.push('Lo necesito para el ' + fmtD(new Date(M.date + 'T12:00')));
  return out;
}

/* ---------- Cesta ---------- */
const C = { items: [], ship: 'pen' };
function renderCart() {
  let sub = 0, n = 0;
  $('#cartItems').innerHTML = C.items.length ? C.items.map((c, i) => { sub += c.price * c.q; n += c.q;
    return `<div class="c-item"><img src="${IMG + c.img}" alt=""><div><b>${esc(c.name)}</b>${c.lines.length ? `<ul>${c.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
      <div class="c-row"><div class="qty"><button type="button" data-q="-1" data-i="${i}" aria-label="Quitar uno">−</button><span>${c.q}</span><button type="button" data-q="1" data-i="${i}" aria-label="Añadir uno">+</button></div><strong>${eur(c.price * c.q)}</strong></div></div></div>`; }).join('')
    : '<p class="c-empty">Tu cesta está vacía.<br>Empieza por el buscador de regalos.</p>';
  const s = SHIP.find(x => x.k === C.ship); const ship = sub ? s.p : 0;
  $('#shipBox').innerHTML = '<legend>¿Cómo lo recibes?</legend>' + SHIP.map(x => `<label><input type="radio" name="ship" value="${x.k}" ${C.ship === x.k ? 'checked' : ''}><span>${x.n}<small>${x.d}</small></span><em>${x.p ? (x.pre || '') + eur(x.p) : 'Gratis'}</em></label>`).join('');
  $('#cSub').textContent = eur(sub); $('#cShip').textContent = ship ? eur(ship) : (sub ? 'Gratis' : '—'); $('#cTot').textContent = eur(sub + ship);
  $('#cartCount').textContent = n;
}
function openCart(o) {
  const c = $('#cart'); c.classList.toggle('open', o); c.setAttribute('aria-hidden', String(!o)); $('#overlay').hidden = !o;
  document.body.style.overflow = o ? 'hidden' : ''; if (o) $('#cartClose').focus();
}
let tT; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('show'), 2600); }

/* ---------- Eventos ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const fp = t.closest('[data-fpara]'); if (fp) return finderGo({ para: fp.dataset.fpara, step: 1 });
  const fo = t.closest('[data-focc]'); if (fo) return finderGo({ occ: fo.dataset.focc, step: 2 });
  const fb = t.closest('[data-fbud]'); if (fb) return finderGo({ bud: fb.dataset.fbud, step: 3 });
  if (t.closest('[data-fback]')) return finderGo({ step: F.step - 1 });
  if (t.closest('[data-freset]') || t.closest('#resReset')) { finderGo({ step: 0, para: null, occ: null, bud: null }); $('#buscador').scrollIntoView(); return; }
  const op = t.closest('[data-open]'); if (op) return openSheet(op.dataset.open);
  const pk = t.closest('[data-pk]'); if (pk) { PK.para = pk.dataset.pk; return renderPacks(); }
  const idb = t.closest('[data-idea]'); if (idb) { ideaTab = idb.dataset.idea; return renderIdeas(); }
  const ob = t.closest('[data-g]'); if (ob) {
    const gi = +ob.dataset.g, xi = +ob.dataset.x; M.sel[gi] = xi; const x = chosen(gi);
    if (x.img && (M.it.opts[gi].t === 'mug' || M.it.opts[gi].t === 'jewel')) setMainImg(x.img, x.n);
    const y = $('#sheetIn').scrollTop; renderCfg(); $('#sheetIn').scrollTop = y;
    document.querySelector(`[data-g="${gi}"][data-x="${xi}"]`)?.focus({ preventScroll: true }); return;
  }
  const mi = t.closest('[data-mimg]'); if (mi) { const i = +mi.dataset.mimg; setMainImg([M.it.img, ...(M.it.gallery || [])][i]); document.querySelectorAll('[data-mimg]').forEach(b => b.setAttribute('aria-pressed', b === mi)); return; }
  if (t.closest('#mClose') || t.id === 'sheet') return closeSheet();
  if (t.closest('#mAdd')) {
    C.items.push({ name: M.it.name, img: M.it.img, price: total(), q: 1, lines: summary() });
    renderCart(); closeSheet(); openCart(true); return;
  }
  const q = t.closest('[data-q]'); if (q) { const c = C.items[+q.dataset.i]; c.q += +q.dataset.q; if (c.q <= 0) C.items.splice(+q.dataset.i, 1); return renderCart(); }
  if (t.closest('#cartBtn')) return openCart(true);
  if (t.closest('#cartClose') || t.id === 'overlay') return openCart(false);
  if (t.closest('#checkout')) return toast(C.items.length ? 'Demo: aquí se paga con tarjeta o transferencia, como ahora.' : 'Añade algo a la cesta primero.');
  if (t.closest('#burger')) { const d = $('#drawer'); const o = d.hidden; d.hidden = !o; $('#burger').setAttribute('aria-expanded', String(o)); return; }
  if (t.closest('#drawer a')) { $('#drawer').hidden = true; $('#burger').setAttribute('aria-expanded', 'false'); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.txt) {
    M.txt[t.dataset.txt] = t.value;
    if (t.dataset.txt === 'mug') $('#mugPrev').firstElementChild.outerHTML = mugSvg(t.value);
    if (t.dataset.txt === 'to') $('#cpTo').textContent = t.value ? 'Para ' + t.value : 'Para…';
    if (t.dataset.txt === 'card') { const m = $('#cpMsg'); m.textContent = t.value || 'Tu mensaje aparecerá aquí'; m.classList.toggle('ph', !t.value); }
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.name === 'ship') { C.ship = t.value; renderCart(); }
  if (t.dataset.date !== undefined) { M.date = t.value; renderDeliv(); }
  if (t.dataset.noopen !== undefined) M.noOpen = t.checked;
});
$('#packSort').addEventListener('change', e => { PK.sort = e.target.value; renderPacks(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSheet(); openCart(false); } });

renderFinder(); renderStatic(); renderPacks(); renderIdeas(); renderCart();
