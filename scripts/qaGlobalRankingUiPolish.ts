import type { CareerLocalRankingEntry } from "../src/types/career";
import {
  GLOBAL_RANKING_TIMEOUT_MS,
  buildCareerGlobalRankingPayload,
  clearStoredGlobalRankingEndpoint,
  getGlobalRankingEndpointSource,
  getGlobalRankingBackendLabel,
  isGlobalRankingConfigured,
  loadGlobalRanking,
  loadStoredGlobalRankingEndpoint,
  saveStoredGlobalRankingEndpoint,
  submitGlobalRankingEntry,
  validateGlobalRankingEndpoint,
} from "../src/services/globalRankingService";

const memoryStorage = new Map<string, string>();

(globalThis as { window?: { localStorage: Storage } }).window = {
  localStorage: {
    get length() {
      return memoryStorage.size;
    },
    clear: () => memoryStorage.clear(),
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    key: (index: number) => Array.from(memoryStorage.keys())[index] ?? null,
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
  },
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createSampleLocalEntry(): CareerLocalRankingEntry {
  return {
    id: "career_ui_polish_20260703",
    completedSeasons: 3,
    arcadeScore: 31,
    palmaresScore: 1,
    survivalScore: 30,
    trophyCounts: {
      champions: 0,
      liga: 0,
      europaLeague: 0,
      copa: 0,
      conference: 0,
      supercopa: 1,
    },
    bestLeaguePosition: 3,
    lastSeasonLabel: "2028/29",
    lastLeaguePosition: 5,
    gameVersion: "v0.23.0e",
    createdAt: "2026-07-03T09:00:00.000Z",
  };
}

function testEndpointValidation(): void {
  assert(validateGlobalRankingEndpoint("") === "Pega la URL /exec del despliegue de Apps Script.", "Debe pedir URL cuando está vacía.");
  assert(validateGlobalRankingEndpoint("http://script.google.com/macros/s/demo/exec") === "El endpoint debe empezar por https://.", "Debe exigir HTTPS.");
  assert(validateGlobalRankingEndpoint("https://example.com/exec") === "El endpoint debe ser una URL de Apps Script.", "Debe exigir dominio Apps Script.");
  assert(validateGlobalRankingEndpoint("https://script.google.com/macros/s/demo/dev") === "Usa la URL pública que termina en /exec, no /dev.", "Debe rechazar /dev.");
  assert(validateGlobalRankingEndpoint("https://script.google.com/macros/s/demo/exec") === undefined, "Debe aceptar URL /exec válida.");
  logOk("Endpoint Apps Script se valida con mensajes claros");
}

function testEndpointStorageOverride(): void {
  clearStoredGlobalRankingEndpoint();

  const endpoint = "https://script.google.com/macros/s/demo/exec/";
  const result = saveStoredGlobalRankingEndpoint(endpoint);

  assert(result.ok, "Guardar endpoint válido debe devolver OK.");
  assert(loadStoredGlobalRankingEndpoint() === "https://script.google.com/macros/s/demo/exec", "Debe normalizar y guardar endpoint sin barra final.");
  assert(isGlobalRankingConfigured(), "Endpoint guardado en navegador debe activar ranking global.");
  assert(getGlobalRankingEndpointSource() === "browser", "El endpoint guardado en navegador debe tener prioridad.");
  assert(getGlobalRankingBackendLabel() === "Apps Script · navegador", "El label debe indicar endpoint guardado en navegador.");

  clearStoredGlobalRankingEndpoint();
  assert(loadStoredGlobalRankingEndpoint() === "", "Debe permitir borrar endpoint local.");
  logOk("Endpoint local se guarda, prioriza y borra sin tocar Git");
}

async function testLoadUsesStoredEndpoint(): Promise<void> {
  const endpoint = "https://script.google.com/macros/s/demo/exec";
  saveStoredGlobalRankingEndpoint(endpoint);

  const result = await loadGlobalRanking({
    fetcher: async (input) => {
      const url = String(input);
      assert(url.startsWith(endpoint), "La carga debe usar el endpoint guardado en navegador.");
      assert(url.includes("action=top"), "La carga debe pedir action=top.");
      return createJsonResponse({ ok: true, status: "loaded", message: "Top global", entries: [] });
    },
  });

  assert(result.ok, "La carga con endpoint guardado debe funcionar.");
  assert(result.entries.length === 0, "El Top vacío debe seguir siendo lista vacía controlada.");
  logOk("Ranking global carga usando endpoint guardado en navegador");
}

async function testSubmitUsesStoredEndpoint(): Promise<void> {
  const endpoint = "https://script.google.com/macros/s/demo/exec";
  saveStoredGlobalRankingEndpoint(endpoint);

  const payload = buildCareerGlobalRankingPayload({
    nick: "Itu",
    entry: createSampleLocalEntry(),
    submittedAt: "2026-07-03T09:05:00.000Z",
  });

  const result = await submitGlobalRankingEntry(payload, {
    fetcher: async (input, init) => {
      assert(String(input) === endpoint, "El envío debe usar el endpoint guardado en navegador.");
      assert(String(init?.body ?? "").includes("arcadeScore"), "El envío debe conservar el contrato JSON.");
      return createJsonResponse({ ok: true, status: "submitted", message: "Carrera enviada", entry: { ...payload, id: payload.careerId } });
    },
  });

  assert(result.ok, "El envío con endpoint guardado debe funcionar.");
  assert(result.entry?.nick === "Itu", "La entrada enviada debe conservar nick.");
  logOk("Envío global usa endpoint guardado en navegador");
}

async function testSlowColdStartIsNotCutAtSixSeconds(): Promise<void> {
  assert(
    GLOBAL_RANKING_TIMEOUT_MS >= 30000,
    `La lectura debe aguantar el arranque en frío de Apps Script (medido 30-40 s); límite actual ${GLOBAL_RANKING_TIMEOUT_MS} ms.`,
  );

  const slow = await loadGlobalRanking({
    endpoint: "https://script.google.com/macros/s/demo/exec",
    timeoutMs: 50,
    fetcher: (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
  });

  assert(!slow.ok && slow.status === "network_error", "Una lectura que supera el límite debe acabar como network_error controlado, no colgada.");
  logOk(`La lectura del ranking aguanta ${GLOBAL_RANKING_TIMEOUT_MS} ms y sigue cortando con error controlado`);
}

console.log("QA Global Ranking UI Polish");

testEndpointValidation();
testEndpointStorageOverride();
await testLoadUsesStoredEndpoint();
await testSubmitUsesStoredEndpoint();
await testSlowColdStartIsNotCutAtSixSeconds();

console.log("QA global ranking UI polish OK");
