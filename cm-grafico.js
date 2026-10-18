// Capital en Marcha: gráfico de líneas interactivo reutilizable (SVG, sin librerías).
// CMGrafico.linea(contenedor, opciones)
//   opciones.titulo, opciones.sub        textos
//   opciones.n                           número de puntos (0..n-1)
//   opciones.series [{nombre, color, valores[], area}]
//   opciones.xEtiqueta(i)                texto del eje X para el punto i
//   opciones.xPaso                       cada cuántos puntos se rotula el eje X (opcional)
//   opciones.refs [{y, texto}]           líneas horizontales de referencia
//   opciones.marcas [{i, texto}]         líneas verticales (p. ej. jubilación)
//   opciones.puntos [{i, y, texto, color}] puntos destacados con etiqueta
//   opciones.tip(i) -> {cabecera, filas:[[etiqueta, valor, destacado]]}
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var CSS = ".cm-chart{--surface:#fff;--ink:#0f172a;--ink2:#475569;--muted:#64748b;--grid:#eef2f7;--axis:#cbd5e1;background:var(--surface);border:1px solid #e2e8f0;border-radius:16px;padding:20px 20px 12px;margin-top:22px;position:relative;font-family:Arial,sans-serif;text-align:left}" +
    ".cm-chart .ch-title{font-size:17px;font-weight:bold;color:var(--ink)}" +
    ".cm-chart .ch-sub{font-size:14px;color:var(--ink2);margin-top:4px;line-height:1.5}" +
    ".cm-chart .ch-leg{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--ink2);margin-top:10px}" +
    ".cm-chart .ch-leg i{display:inline-block;width:14px;height:3px;border-radius:2px;margin-right:6px;vertical-align:3px}" +
    ".cm-chart svg{display:block;width:100%;height:auto;overflow:visible;margin-top:10px;touch-action:pan-y}" +
    ".cm-chart svg:focus{outline:none}.cm-chart svg:focus-visible{outline:2px solid #2563eb;outline-offset:4px;border-radius:6px}" +
    ".cm-chart .ch-tip{position:absolute;pointer-events:none;background:#0f172a;color:#f8fafc;border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.5;min-width:170px;box-shadow:0 10px 30px rgba(15,23,42,.25);opacity:0;transition:opacity .12s;z-index:5}" +
    ".cm-chart .ch-tip .t-h{color:#cbd5e1;font-size:12px;margin-bottom:4px}" +
    ".cm-chart .ch-tip .t-r{display:flex;justify-content:space-between;gap:14px}" +
    ".cm-chart .ch-tip .t-r b{font-variant-numeric:tabular-nums}.cm-chart .ch-tip .t-r.t-tot{font-size:15px}" +
    ".cm-chart .ch-tip .t-r i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}" +
    ".cm-chart .ch-line{stroke-dasharray:var(--len);stroke-dashoffset:var(--len);transition:stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)}" +
    ".cm-chart .ch-line.on{stroke-dashoffset:0}" +
    "@media (prefers-reduced-motion:reduce){.cm-chart .ch-line{transition:none}}" +
    "@media (max-width:640px){.cm-chart{padding:16px 12px 10px}}";
  function css() { if (document.getElementById("cm-grafico-css")) return; var s = document.createElement("style"); s.id = "cm-grafico-css"; s.textContent = CSS; document.head.appendChild(s); }
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function niceStep(max, n) { var raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function fmtEje(x) {
    if (x >= 1e6) return (x / 1e6).toLocaleString("es-ES", {maximumFractionDigits: 1}) + " M€";
    if (x >= 1e3) return (x / 1e3).toLocaleString("es-ES", {maximumFractionDigits: 1}) + " mil €";
    return Math.round(x) + " €";
  }

  function dibujar(box, o) {
    css();
    box.className = "cm-chart"; box.hidden = false;
    if (!box._parts) {
      box.textContent = "";
      var t = document.createElement("div"); t.className = "ch-title";
      var s = document.createElement("div"); s.className = "ch-sub";
      var l = document.createElement("div"); l.className = "ch-leg";
      var svg = el("svg", {role: "img", tabindex: "0"});
      var tip = document.createElement("div"); tip.className = "ch-tip"; tip.setAttribute("role", "status"); tip.setAttribute("aria-live", "polite");
      box.appendChild(t); box.appendChild(s); box.appendChild(l); box.appendChild(svg); box.appendChild(tip);
      box._parts = {t: t, s: s, l: l, svg: svg, tip: tip};
      var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { dibujar(box, box._o); }, 150); });
    }
    box._o = o;
    var P = box._parts, svg = P.svg, tip = P.tip;
    P.t.textContent = o.titulo || ""; P.s.textContent = o.sub || "";
    P.l.textContent = "";
    if (o.series.length > 1) o.series.forEach(function (se) {
      var sp = document.createElement("span"), i = document.createElement("i"); i.style.background = se.color;
      sp.appendChild(i); sp.appendChild(document.createTextNode(se.nombre)); P.l.appendChild(sp);
    });
    P.l.style.display = o.series.length > 1 ? "" : "none";

    var W = Math.max(280, Math.round(svg.getBoundingClientRect().width || box.clientWidth || 720)), small = W < 520, H = small ? 250 : 300;
    var M = {t: 20, r: small ? 12 : 16, b: 30, l: small ? 56 : 66};
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var n = o.n, maxV = 0;
    o.series.forEach(function (se) { se.valores.forEach(function (v) { if (v > maxV) maxV = v; }); });
    (o.refs || []).forEach(function (r) { if (r.y > maxV) maxV = r.y; });
    maxV = maxV || 1;
    var step = niceStep(maxV, small ? 4 : 5), ymax = Math.ceil(maxV * 1.04 / step) * step;
    var iw = W - M.l - M.r, ih = H - M.t - M.b;
    var x = function (i) { return M.l + (n > 1 ? i / (n - 1) : 0) * iw; }, y = function (v) { return M.t + ih - Math.max(0, v) / ymax * ih; };
    var g = el("g", {"aria-hidden": "true"}, svg);
    for (var tv = 0; tv <= ymax + 1e-9; tv += step) {
      el("line", {x1: M.l, x2: W - M.r, y1: y(tv), y2: y(tv), stroke: tv === 0 ? "var(--axis)" : "var(--grid)", "stroke-width": 1}, g);
      el("text", {x: M.l - 8, y: y(tv) + 4, "text-anchor": "end", "font-size": 12, fill: "var(--muted)"}, g).textContent = fmtEje(tv);
    }
    var xp = o.xPaso || Math.max(1, Math.ceil((n - 1) / (small ? 4 : 7)));
    if (o.xPasoFn) xp = o.xPasoFn(small);
    for (var i = 0; i < n; i += xp) {
      if (i > 0 && x(n - 1) - x(i) < (small ? 72 : 80)) continue;
      el("text", {x: x(i), y: H - 10, "text-anchor": i === 0 ? "start" : "middle", "font-size": 12, fill: "var(--muted)"}, g).textContent = o.xEtiqueta(i);
    }
    el("text", {x: x(n - 1), y: H - 10, "text-anchor": "end", "font-size": 12, fill: "var(--muted)"}, g).textContent = o.xEtiqueta(n - 1);
    // Marcas verticales
    (o.marcas || []).forEach(function (m) {
      el("line", {x1: x(m.i), x2: x(m.i), y1: M.t, y2: M.t + ih, stroke: "var(--axis)", "stroke-width": 1, "stroke-dasharray": "4 4"}, svg);
      var right = x(m.i) > M.l + iw * 0.6;
      var tt = el("text", {x: right ? x(m.i) - 6 : x(m.i) + 6, y: M.t + 12, "text-anchor": right ? "end" : "start", "font-size": 12, "font-weight": "bold", fill: "var(--ink2)"}, svg);
      tt.textContent = m.texto;
    });
    // Referencias horizontales
    var refTxt = [];
    (o.refs || []).forEach(function (r) {
      el("line", {x1: M.l, x2: W - M.r, y1: y(r.y), y2: y(r.y), stroke: "var(--ink2)", "stroke-width": 1, "stroke-dasharray": "2 4"}, svg);
      if (r.texto) refTxt.push(el("text", {x: M.l + 6 + (r.xFrac || 0) * iw, y: y(r.y) - 6, "font-size": 12, "font-weight": "bold", fill: "var(--ink2)", stroke: "var(--surface)", "stroke-width": 3, "paint-order": "stroke"}, svg)); if (r.texto) refTxt[refTxt.length - 1].textContent = r.texto;
    });
    // Series
    var lines = [];
    o.series.forEach(function (se) {
      var d = se.valores.map(function (v, k) { return (k ? "L" : "M") + x(k).toFixed(1) + "," + y(v).toFixed(1); }).join("");
      if (se.area) el("path", {d: d + "L" + x(n - 1) + "," + y(0) + "L" + x(0) + "," + y(0) + "Z", fill: se.color, "fill-opacity": 0.1}, svg);
      lines.push(el("path", {d: d, fill: "none", stroke: se.color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round", "class": "ch-line"}, svg));
    });
    // Etiqueta directa al final de cada serie (si hay más de una)
    if (o.series.length > 1) {
      var ys = o.series.map(function (se) { return {se: se, yy: y(se.valores[n - 1])}; }).sort(function (a, b) { return a.yy - b.yy; });
      for (var k = 1; k < ys.length; k++) if (ys[k].yy - ys[k - 1].yy < 16) ys[k].yy = ys[k - 1].yy + 16;
      ys.forEach(function (o2) {
        el("text", {x: W - M.r - 2, y: o2.yy - 8, "text-anchor": "end", "font-size": 12, "font-weight": "bold", fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 3, "paint-order": "stroke"}, svg).textContent = o2.se.final || o2.se.corto || o2.se.nombre;
      });
    }
    // Puntos destacados
    var placed = refTxt.map(function (t) { return t.getBBox(); });
    function choca(bb) { return bb.x < M.l + 2 || bb.x + bb.width > W - 2 || placed.some(function (q) { return bb.x < q.x + q.width + 3 && q.x < bb.x + bb.width + 3 && bb.y < q.y + q.height && q.y < bb.y + bb.height; }); }
    (o.puntos || []).forEach(function (p) {
      var cx = x(p.i), cy = y(p.y);
      el("circle", {cx: cx, cy: cy, r: 5, fill: p.color || "#059669", stroke: "var(--surface)", "stroke-width": 2}, svg);
      if (!p.texto) return;
      var lt = el("text", {"font-size": 12, "font-weight": "bold", fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 3, "paint-order": "stroke"}, svg);
      lt.textContent = p.texto;
      var pos = [[cx - 9, cy - 9, "end"], [cx + 9, cy + 16, "start"], [cx - 9, cy + 18, "end"], [cx + 9, cy - 9, "start"]], ok = false;
      for (var k = 0; k < pos.length && !ok; k++) {
        lt.setAttribute("x", pos[k][0]); lt.setAttribute("y", pos[k][1]); lt.setAttribute("text-anchor", pos[k][2]);
        var bb = lt.getBBox(); if (!choca(bb)) { placed.push(bb); ok = true; }
      }
      if (!ok) svg.removeChild(lt);
    });
    lines.forEach(function (ln) {
      ln.style.setProperty("--len", ln.getTotalLength ? ln.getTotalLength() : 3000);
      if (box._drawn) ln.classList.add("on");
    });
    if (!box._drawn) { box._drawn = true; requestAnimationFrame(function () { requestAnimationFrame(function () { lines.forEach(function (ln) { ln.classList.add("on"); }); }); }); }
    // Interacción
    var cross = el("line", {y1: M.t, y2: M.t + ih, stroke: "var(--ink2)", "stroke-width": 1, opacity: 0}, svg);
    var dots = o.series.map(function (se) { return el("circle", {r: 5, fill: se.color, stroke: "var(--surface)", "stroke-width": 2, opacity: 0}, svg); });
    var active = -1;
    function show(i) {
      if (i < 0 || i >= n) return; active = i;
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("opacity", 1);
      dots.forEach(function (d, k) { d.setAttribute("cx", x(i)); d.setAttribute("cy", y(o.series[k].valores[i])); d.setAttribute("opacity", 1); });
      var info = o.tip(i); tip.textContent = "";
      var hd = document.createElement("div"); hd.className = "t-h"; hd.textContent = info.cabecera; tip.appendChild(hd);
      info.filas.forEach(function (f) {
        var r = document.createElement("div"); r.className = "t-r" + (f[2] ? " t-tot" : "");
        var a = document.createElement("span");
        if (f[3]) { var c = document.createElement("i"); c.style.background = f[3]; a.appendChild(c); }
        a.appendChild(document.createTextNode(f[0]));
        var b = document.createElement("b"); b.textContent = f[1];
        r.appendChild(a); r.appendChild(b); tip.appendChild(r);
      });
      var rect = svg.getBoundingClientRect(), br = box.getBoundingClientRect(), s = rect.width / W;
      tip.style.opacity = 1;
      var tw = tip.offsetWidth, th = tip.offsetHeight, topY = Math.min.apply(null, o.series.map(function (se) { return y(se.valores[i]); }));
      var cx = x(i) * s + rect.left - br.left, cy = topY * s + rect.top - br.top;
      tip.style.left = Math.min(Math.max(8, cx - tw / 2), br.width - tw - 8) + "px";
      tip.style.top = Math.max(8, cy - th - 14) + "px";
    }
    function hide() { active = -1; tip.style.opacity = 0; cross.setAttribute("opacity", 0); dots.forEach(function (d) { d.setAttribute("opacity", 0); }); }
    svg.onpointermove = function (e) {
      var rect = svg.getBoundingClientRect(), mx = (e.clientX - rect.left) * W / rect.width;
      if (mx < M.l - 10 || mx > W - M.r + 10) { hide(); return; }
      show(Math.round(Math.max(0, Math.min(1, (mx - M.l) / iw)) * (n - 1)));
    };
    svg.onpointerleave = hide; svg.onblur = hide;
    svg.onfocus = function () { show(n - 1); };
    svg.onkeydown = function (e) {
      if (e.key === "ArrowRight") { show(Math.min(n - 1, active < 0 ? 0 : active + 1)); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { show(Math.max(0, active < 0 ? n - 1 : active - 1)); e.preventDefault(); }
      else if (e.key === "Escape") hide();
    };
    svg.setAttribute("aria-label", (o.titulo || "Gráfico") + ". " + (o.sub || "") + " Usa las flechas para recorrer los años.");
  }
  function ocultar(box) { if (box) box.hidden = true; }
  window.CMGrafico = {linea: dibujar, ocultar: ocultar, fmtEje: fmtEje};
})();
