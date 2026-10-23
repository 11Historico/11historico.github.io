// src/services/analytics.ts
//
// Analítica sin cookies (v0.25.13). Solo dos eventos: inicio de carrera y Game Over.
// Está desactivada salvo que la compilación defina VITE_ANALYTICS_HOST con la URL del
// sitio del proveedor. Sin esa variable no se carga ningún script ni se envía nada.
// No se escriben cookies ni localStorage, y ninguna propiedad lleva datos de partida.

export type AnalyticsEvent = "career_start" | "game_over";

interface GoatCounterApi {
  count: (options: { path: string; title: string; event: boolean }) => void;
}

const ANALYTICS_HOST = (import.meta.env.VITE_ANALYTICS_HOST ?? "").trim();
// Verificar la URL del script en la documentación del proveedor antes de activar.
const ANALYTICS_SCRIPT_SRC = "https://gc.zgo.at/count.js";

let scriptRequested = false;
const pendingEvents: AnalyticsEvent[] = [];

function getApi(): GoatCounterApi | undefined {
  return (window as unknown as { goatcounter?: GoatCounterApi }).goatcounter;
}

function send(event: AnalyticsEvent): void {
  const api = getApi();

  if (api) {
    api.count({ path: event, title: event, event: true });
    return;
  }

  pendingEvents.push(event);
}

function flushPendingEvents(): void {
  while (pendingEvents.length > 0) {
    const event = pendingEvents.shift();
    if (event) send(event);
  }
}

function loadScript(): void {
  if (scriptRequested || typeof document === "undefined") return;
  scriptRequested = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = ANALYTICS_SCRIPT_SRC;
  script.setAttribute("data-goatcounter", `${ANALYTICS_HOST.replace(/\/+$/, "")}/count`);
  script.addEventListener("load", flushPendingEvents);
  document.head.appendChild(script);
}

export function isAnalyticsEnabled(): boolean {
  return ANALYTICS_HOST.length > 0;
}

export function trackEvent(event: AnalyticsEvent): void {
  if (!isAnalyticsEnabled() || typeof window === "undefined") return;

  loadScript();
  send(event);
}
