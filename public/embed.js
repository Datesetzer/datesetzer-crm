/*!
 * Datesetzer CRM Embed v1.0
 * Einbinden auf datesetzer.de:
 *   <script src="https://crm.datesetzer.de/embed.js" data-key="API_KEY" async></script>
 * Formular markieren:
 *   <form data-crm-form>...</form>
 */
(function(w, d) {
  "use strict";
  var s = d.currentScript;
  var KEY = s && s.getAttribute("data-key");
  var SEL = (s && s.getAttribute("data-form")) || "[data-crm-form]";
  var API = "https://crm.datesetzer.de/api/public/inbound";

  if (!KEY) { console.warn("[Datesetzer] data-key fehlt"); return; }

  function utm() {
    var sp = new URLSearchParams(w.location.search);
    return {
      utmSource:   sp.get("utm_source"),
      utmMedium:   sp.get("utm_medium"),
      utmCampaign: sp.get("utm_campaign"),
    };
  }

  function send(data) {
    return fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": KEY },
      body: JSON.stringify(Object.assign({}, data, utm(), {
        pageUrl: w.location.href,
        referrer: d.referrer || null,
      })),
    }).then(function(r) { return r.json(); });
  }

  var MAP = {
    vorname:"firstName", firstname:"firstName", first_name:"firstName",
    nachname:"lastName", lastname:"lastName",   last_name:"lastName",
    email:"email", mail:"email",
    telefon:"phone", tel:"phone", phone:"phone",
    firma:"company", company:"company", unternehmen:"company",
    nachricht:"message", message:"message", notes:"notes",
  };

  function attach(form) {
    if (form._ds) return;
    form._ds = true;
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      var fd = new FormData(form);
      var data = {};
      fd.forEach(function(v, k) { data[MAP[k.toLowerCase()] || k] = String(v).trim(); });
      data.source = form.getAttribute("data-crm-source") || "WEBSITE";

      var btn = form.querySelector("[type=submit]");
      var orig = btn && btn.textContent;
      if (btn) { btn.disabled = true; btn.textContent = "Wird gesendet…"; }

      send(data).then(function() {
        var ok = d.createElement("div");
        ok.style.cssText = "padding:12px 16px;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);color:#34d399;font-family:sans-serif;font-size:14px;margin-top:10px";
        ok.textContent = form.getAttribute("data-crm-success") || "Vielen Dank! Wir melden uns in Kürze.";
        form.parentNode.insertBefore(ok, form.nextSibling);
        form.reset();
        w.dispatchEvent(new CustomEvent("ds:submitted", { detail: data }));
      }).catch(function() {
        if (btn) { btn.disabled = false; btn.textContent = orig; }
      });
    });
  }

  function init() {
    d.querySelectorAll(SEL).forEach(attach);
    new MutationObserver(function(ms) {
      ms.forEach(function(m) {
        m.addedNodes.forEach(function(n) {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches(SEL)) attach(n);
          if (n.querySelectorAll) n.querySelectorAll(SEL).forEach(attach);
        });
      });
    }).observe(d.body, { childList: true, subtree: true });
  }

  w.DatesetzerCRM = { submit: send };
  d.readyState === "loading" ? d.addEventListener("DOMContentLoaded", init) : init();
})(window, document);
