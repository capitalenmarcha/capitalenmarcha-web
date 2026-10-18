// Capital en Marcha: compartir el resultado de una calculadora con un enlace.
// Uso: <script src="compartir.js" defer data-calc="nombreFuncion"></script>
(function () {
  var script = document.currentScript, fnName = script && script.getAttribute("data-calc");
  function campos() {
    return Array.prototype.filter.call(document.querySelectorAll("input[id], select[id]"), function (e) {
      return e.type !== "hidden" && e.type !== "button" && e.type !== "submit" && !e.closest("#cookie-banner, .cookie-banner");
    });
  }
  function calcular() { var f = window[fnName]; if (typeof f === "function") { try { f(); } catch (e) {} } }

  function iniciar() {
    var boton = document.querySelector('[onclick^="' + fnName + '("]');
    if (!fnName || !boton) return;

    // 1) Si el enlace trae datos, se rellenan y se calcula
    var q = new URLSearchParams(location.search), hay = false;
    campos().forEach(function (e) {
      if (!q.has(e.id)) return;
      var v = q.get(e.id);
      if (e.type === "checkbox" || e.type === "radio") e.checked = v === "1";
      else e.value = v;
      hay = true;
    });
    if (hay) {
      calcular();
      setTimeout(function () { boton.scrollIntoView({behavior: "smooth", block: "start"}); }, 300);
    }

    // 2) Botón "Compartir mi resultado"
    var wrap = document.createElement("div");
    wrap.style.cssText = "margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;";
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = "🔗 Compartir mi resultado";
    b.style.cssText = "background:#fff;color:#1d4ed8;border:2px solid #1d4ed8;border-radius:10px;padding:10px 16px;font-size:15px;font-weight:bold;cursor:pointer;font-family:inherit;";
    var aviso = document.createElement("span");
    aviso.setAttribute("role", "status");
    aviso.style.cssText = "font-size:14px;color:#059669;font-weight:bold;";
    wrap.appendChild(b); wrap.appendChild(aviso);
    boton.insertAdjacentElement("afterend", wrap);

    b.addEventListener("click", function () {
      var p = new URLSearchParams();
      campos().forEach(function (e) {
        if (e.type === "checkbox" || e.type === "radio") p.set(e.id, e.checked ? "1" : "0");
        else if (e.value !== "") p.set(e.id, e.value);
      });
      var url = location.origin + location.pathname + "?" + p.toString();
      var titulo = document.title.split("|")[0].trim();
      function ok(msg) { aviso.textContent = msg; setTimeout(function () { aviso.textContent = ""; }, 4000); }
      if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        navigator.share({title: titulo, text: "Mira mi cálculo en Capital en Marcha:", url: url}).catch(function () {});
      } else if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(function () { ok("✓ Enlace copiado. Pégalo donde quieras."); },
          function () { window.prompt("Copia este enlace:", url); });
      } else {
        window.prompt("Copia este enlace:", url);
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
