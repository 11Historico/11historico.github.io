import type { CareerGlobalRankingEntry, CareerLocalRankingEntry } from "../src/types/career";
import {
  buildCareerGlobalRankingPayload,
  loadGlobalRanking,
  parseCareerGlobalRanking,
  sanitizeGlobalRankingNick,
  sortCareerGlobalRanking,
  submitGlobalRankingEntry,
  GLOBAL_RANKING_ENDPOINT,
  getGlobalRankingBackendLabel,
  validateGlobalRankingNick,
  validateGlobalRankingPayload,
} from "../src/services/globalRankingService";
import {
  hasSubmittedCareerGlobalRankingEntry,
  loadLastCareerGlobalRankingNick,
  loadSubmittedCareerGlobalRankingIds,
  markCareerGlobalRankingEntrySubmitted,
  saveLastCareerGlobalRankingNick,
} from "../src/storage/careerGlobalRankingStorage";

const memoryStorage = new Map<string, string>();

(globalThis as { window?: unknown }).window = {
  localStorage: {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
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

function createSampleLocalEntry(overrides: Partial<CareerLocalRankingEntry> = {}): CareerLocalRankingEntry {
  return {
    id: "career_2026-07-02T10:00:00.000Z_abcd",
    completedSeasons: 2,
    arcadeScore: 22,
    palmaresScore: 2,
    survivalScore: 20,
    trophyCounts: {
      champions: 0,
      liga: 0,
      europaLeague: 0,
      copa: 0,
      conference: 0,
      supercopa: 1,
    },
    bestLeaguePosition: 4,
    lastSeasonLabel: "2027/28",
    lastLeaguePosition: 8,
    gameVersion: "v0.23.0e",
    createdAt: "2026-07-02T10:00:00.000Z",
    ...overrides,
  };
}

function createSampleGlobalEntry(overrides: Partial<CareerGlobalRankingEntry> = {}): CareerGlobalRankingEntry {
  const base = createSampleLocalEntry();

  return {
    ...base,
    id: base.id,
    careerId: base.id,
    nick: "AthleticFan",
    submittedAt: "2026-07-02T10:05:00.000Z",
    ...overrides,
  };
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function testNickSanitization(): void {
  assert(sanitizeGlobalRankingNick("  Itu!!! 🦁  ") === "Itu", "Debe limpiar caracteres no permitidos y espacios.");
  assert(validateGlobalRankingNick("AB") === "El nick debe tener al menos 3 caracteres.", "Debe exigir nick mínimo.");
  assert(validateGlobalRankingNick("Athletic-123") === undefined, "Debe aceptar nick válido.");
  logOk("Nick global saneado y validado");
}

function testPayloadContract(): void {
  const entry = createSampleLocalEntry();
  const payload = buildCareerGlobalRankingPayload({
    nick: " Itu ",
    entry,
    submittedAt: "2026-07-02T11:00:00.000Z",
  });

  assert(payload.nick === "Itu", "El payload debe usar nick saneado.");
  assert(payload.careerId === entry.id, "El payload debe usar careerId estable.");
  assert(payload.arcadeScore === entry.arcadeScore, "El payload debe conservar puntos arcade.");
  assert(payload.completedSeasons === entry.completedSeasons, "El payload debe conservar temporadas superadas.");
  assert(payload.gameVersion === entry.gameVersion, "El payload debe conservar versión del juego.");
  assert(validateGlobalRankingPayload(payload).length === 0, "El payload válido no debe devolver errores.");
  logOk("Contrato de envío global contiene campos requeridos");
}

function testAppsScriptBackendLabel(): void {
  // El endpoint se incrusta al compilar desde .env.local: el QA comprueba la rama que
  // corresponde a la configuración real, sin depender de que el archivo no exista.
  const expected = GLOBAL_RANKING_ENDPOINT.length > 0 ? "Apps Script · env" : "Backend pendiente";
  assert(awaitedBackendLabel() === expected, `La etiqueta del backend debe ser "${expected}" con esta configuración.`);
  logOk("La etiqueta del backend global coincide con la configuración de compilación");
}

function awaitedBackendLabel(): string {
  return getGlobalRankingBackendLabel("");
}

function testInvalidPayloadIsRejected(): void {
  const payload = buildCareerGlobalRankingPayload({ nick: "AB", entry: createSampleLocalEntry() });
  const errors = validateGlobalRankingPayload(payload);

  assert(errors.length > 0, "Un nick inválido debe rechazar el payload.");
  logOk("Payload inválido se rechaza antes de enviar");
}

async function testSubmitWithoutBackendDoesNotThrow(): Promise<void> {
  const payload = buildCareerGlobalRankingPayload({ nick: "Itu", entry: createSampleLocalEntry() });
  const result = await submitGlobalRankingEntry(payload, { endpoint: "" });

  assert(!result.ok, "Sin endpoint no debe marcar OK.");
  assert(result.status === "not_configured", "Sin endpoint debe quedar como not_configured.");
  logOk("Backend no configurado no rompe Game Over");
}

async function testSubmitSuccessWithMockFetcher(): Promise<void> {
  const payload = buildCareerGlobalRankingPayload({ nick: "Itu", entry: createSampleLocalEntry() });
  let capturedBody = "";

  const result = await submitGlobalRankingEntry(payload, {
    endpoint: "https://example.test/ranking",
    fetcher: async (_input, init) => {
      capturedBody = String(init?.body ?? "");
      return createJsonResponse({ ...payload, id: payload.careerId, submittedAt: payload.submittedAt });
    },
  });

  assert(result.ok, "El mock de envío correcto debe devolver OK.");
  assert(result.entry?.nick === "Itu", "La entrada devuelta debe conservar nick.");
  assert(capturedBody.includes("arcadeScore"), "El POST debe enviar el contrato JSON.");
  logOk("Envío global correcto con fetch mock");
}

async function testSubmitAppsScriptEnvelope(): Promise<void> {
  const payload = buildCareerGlobalRankingPayload({ nick: "Itu", entry: createSampleLocalEntry() });

  const result = await submitGlobalRankingEntry(payload, {
    endpoint: "https://script.google.com/macros/s/example/exec",
    fetcher: async () => createJsonResponse({
      ok: true,
      status: "submitted",
      message: "Apps Script OK",
      entry: { ...payload, id: payload.careerId },
    }),
  });

  assert(result.ok, "La respuesta envoltorio de Apps Script debe ser OK.");
  assert(result.message === "Apps Script OK", "Debe respetar el mensaje del backend.");
  assert(result.entry?.careerId === payload.careerId, "Debe parsear entry desde el envoltorio.");
  logOk("Respuesta Apps Script de envío se interpreta correctamente");
}

async function testSubmitAppsScriptDuplicate(): Promise<void> {
  const payload = buildCareerGlobalRankingPayload({ nick: "Itu", entry: createSampleLocalEntry() });

  const result = await submitGlobalRankingEntry(payload, {
    endpoint: "https://script.google.com/macros/s/example/exec",
    fetcher: async () => createJsonResponse({
      ok: false,
      status: "duplicate",
      message: "Carrera duplicada",
    }),
  });

  assert(!result.ok, "Un duplicado de Apps Script no debe devolver OK.");
  assert(result.status === "duplicate", "Debe clasificar duplicados del backend.");
  assert(result.message === "Carrera duplicada", "Debe mostrar mensaje del backend.");
  logOk("Duplicado Apps Script se clasifica sin romper la carrera");
}

async function testSubmitNetworkError(): Promise<void> {
  const payload = buildCareerGlobalRankingPayload({ nick: "Itu", entry: createSampleLocalEntry() });
  const result = await submitGlobalRankingEntry(payload, {
    endpoint: "https://example.test/ranking",
    fetcher: async () => {
      throw new Error("offline");
    },
  });

  assert(!result.ok, "Un error de red no debe devolver OK.");
  assert(result.status === "network_error", "Un error de red debe clasificarse como network_error.");
  logOk("Error de red no bloquea la carrera");
}

async function testLoadWithoutBackend(): Promise<void> {
  const result = await loadGlobalRanking({ endpoint: "" });

  assert(!result.ok, "Sin endpoint la carga global no debe ser OK.");
  assert(result.status === "not_configured", "Sin endpoint debe ser not_configured.");
  assert(result.entries.length === 0, "Sin endpoint debe devolver lista vacía.");
  logOk("Ranking global sin backend muestra estado vacío controlado");
}

async function testLoadSortsAndLimitsGlobalRanking(): Promise<void> {
  const entries = Array.from({ length: 105 }, (_, index) => createSampleGlobalEntry({
    id: `career_${index}`,
    careerId: `career_${index}`,
    nick: `Nick${index}`,
    arcadeScore: index,
    completedSeasons: index % 4,
    submittedAt: `2026-07-02T10:${String(index % 60).padStart(2, "0")}:00.000Z`,
  }));
  const result = await loadGlobalRanking({
    endpoint: "https://example.test/ranking",
    fetcher: async (input) => {
      assert(String(input).includes("action=top"), "La carga debe pedir action=top.");
      return createJsonResponse({ entries });
    },
  });

  assert(result.ok, "La carga con mock debe ser OK.");
  assert(result.entries.length === 100, "Debe limitar a Top 100.");
  assert(result.entries[0].arcadeScore === 104, "Debe ordenar por puntos descendentes.");
  logOk("Carga global ordena y limita Top 100");
}

async function testLoadAppsScriptEnvelope(): Promise<void> {
  const entry = createSampleGlobalEntry({ arcadeScore: 99 });
  const result = await loadGlobalRanking({
    endpoint: "https://script.google.com/macros/s/example/exec",
    fetcher: async (input) => {
      assert(String(input).includes("action=top"), "Debe pedir action=top a Apps Script.");
      assert(String(input).includes("limit=100"), "Debe pedir límite Top 100.");
      return createJsonResponse({ ok: true, status: "loaded", message: "Top global", entries: [entry] });
    },
  });

  assert(result.ok, "La carga desde envoltorio Apps Script debe ser OK.");
  assert(result.entries.length === 1, "Debe leer entries desde el envoltorio.");
  assert(result.message === "Top global", "Debe respetar mensaje de carga del backend.");
  logOk("Respuesta Apps Script de Top global se interpreta correctamente");
}

function testGlobalRankingParserDropsInvalidRows(): void {
  const parsed = parseCareerGlobalRanking({
    entries: [createSampleGlobalEntry(), { nick: "Roto" }, null],
  });

  assert(parsed.length === 1, "El parser debe ignorar filas inválidas.");
  assert(parsed[0].nick === "AthleticFan", "Debe conservar filas válidas.");
  logOk("Parser global ignora datos inválidos");
}

function testTieBreaks(): void {
  const sorted = sortCareerGlobalRanking([
    createSampleGlobalEntry({ id: "a", careerId: "a", arcadeScore: 20, completedSeasons: 2, palmaresScore: 0, bestLeaguePosition: 8, submittedAt: "2026-07-02T10:00:00.000Z" }),
    createSampleGlobalEntry({ id: "b", careerId: "b", arcadeScore: 20, completedSeasons: 2, palmaresScore: 0, bestLeaguePosition: 4, submittedAt: "2026-07-02T09:00:00.000Z" }),
    createSampleGlobalEntry({ id: "c", careerId: "c", arcadeScore: 20, completedSeasons: 2, palmaresScore: 0, bestLeaguePosition: 4, submittedAt: "2026-07-02T11:00:00.000Z" }),
  ]);

  assert(sorted[0].id === "c", "Si empatan puntos y posición, gana fecha más reciente.");
  assert(sorted[1].id === "b", "La mejor posición debe desempatar antes que peor liga.");
  logOk("Desempates globales por mejor posición y fecha");
}

function testGlobalRankingStorage(): void {
  memoryStorage.clear();
  saveLastCareerGlobalRankingNick(" Itu!! ");
  markCareerGlobalRankingEntrySubmitted("career_1");
  markCareerGlobalRankingEntrySubmitted("career_1");

  assert(loadLastCareerGlobalRankingNick() === "Itu", "Debe guardar último nick saneado.");
  assert(hasSubmittedCareerGlobalRankingEntry("career_1"), "Debe marcar carrera enviada.");
  assert(loadSubmittedCareerGlobalRankingIds().length === 1, "No debe duplicar carreras enviadas.");
  logOk("Storage global guarda nick y evita duplicados locales");
}

function testGlobalRankingStorageIgnoresCorruptData(): void {
  memoryStorage.clear();
  memoryStorage.set("once_historico_zurigorri_career_global_submitted_ids_v1", "{bad json");

  assert(loadSubmittedCareerGlobalRankingIds().length === 0, "Datos corruptos deben devolver lista vacía.");
  logOk("Storage global tolera datos corruptos");
}

console.log("QA Global Ranking Apps Script Backend");

testNickSanitization();
testPayloadContract();
testAppsScriptBackendLabel();
testInvalidPayloadIsRejected();
await testSubmitWithoutBackendDoesNotThrow();
await testSubmitSuccessWithMockFetcher();
await testSubmitAppsScriptEnvelope();
await testSubmitAppsScriptDuplicate();
await testSubmitNetworkError();
await testLoadWithoutBackend();
await testLoadSortsAndLimitsGlobalRanking();
await testLoadAppsScriptEnvelope();
testGlobalRankingParserDropsInvalidRows();
testTieBreaks();
testGlobalRankingStorage();
testGlobalRankingStorageIgnoresCorruptData();

console.log("QA global ranking backend OK");
