/* OSE backend selector: home server first (Worker), Render as fallback. */
(function () {
  if (window.oseFetch) return; // already loaded
  const BACKENDS = {
    home:   "https://api-caisson.ose.vn",
    render: "https://ose-caisson-backend.onrender.com",
    local:  "http://127.0.0.1:8019",
  };
  window.OSE_BACKENDS = BACKENDS;
  const CACHE_KEY = "ose_api_auto";
  const CACHE_MS = 5 * 60 * 1000;
  let auto = false;
  const set = (base) => (window.OSE_API_BASE = window.API_BASE = base);

  function remember(name) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ name, t: Date.now() })); } catch (e) {}
  }
  function recalled() {
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (c && BACKENDS[c.name] && Date.now() - c.t < CACHE_MS) return c.name;
    } catch (e) {}
    return null;
  }
  async function alive(base, ms) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
    try { return (await fetch(base + "/api/health", { signal: c.signal, cache: "no-store" })).ok; }
    catch (e) { return false; } finally { clearTimeout(t); }
  }

  function resolve() {
    const h = location.hostname;
    const isLocal = ["localhost", "127.0.0.1"].includes(h);
    // Trang mo tu chinh backend (Render, *-home, localhost khac 5500): goi cung dia chi
    if (location.origin === BACKENDS.render || /-home\.ose\.vn$/.test(h) || (isLocal && location.port !== "5500")) {
      window.OSE_SAME_ORIGIN = true;
      return Promise.resolve(set(location.origin));
    }
    if (isLocal) return Promise.resolve(set(BACKENDS.local));
    // ?api=home | render (ghim)   ?api=auto (bo ghim)
    let forced = new URLSearchParams(location.search).get("api");
    try {
      if (forced === "auto") { localStorage.removeItem("ose_api"); forced = null; }
      else if (forced && BACKENDS[forced]) localStorage.setItem("ose_api", forced);
      else if (forced) forced = null;
      else forced = localStorage.getItem("ose_api");
    } catch (e) {}
    if (forced && BACKENDS[forced]) return Promise.resolve(set(BACKENDS[forced]));

    auto = true;
    const cached = recalled();
    if (cached) return Promise.resolve(set(BACKENDS[cached]));
    set(BACKENDS.home);
    return (async () => {
      if (await alive(BACKENDS.home, 4000)) { remember("home"); return BACKENDS.home; }
      console.warn("[OSE] Home server not responding, switching to Render");
      remember("render");
      return set(BACKENDS.render);
    })();
  }

  window.OSE_API_READY = resolve();

  // Dung thay fetch(): oseFetch("/api/xxx", options). Home mat giua phien -> gui lai sang Render.
  window.oseFetch = async function (path, options) {
    const base = await window.OSE_API_READY;
    const canFailover = auto && base === BACKENDS.home;
    try {
      const res = await fetch(base + path, options);
      if (!canFailover || ![502, 503, 504].includes(res.status)) return res;
    } catch (e) {
      if (!canFailover) throw e;
    }
    console.warn("[OSE] Home server lost, switching to Render");
    remember("render");
    window.OSE_API_READY = Promise.resolve(set(BACKENDS.render));
    return fetch(BACKENDS.render + path, options);
  };
})();