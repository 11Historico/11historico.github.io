import type { CareerLocalRankingEntry } from "../src/types/career";
import {
  buildCareerGlobalRankingPayload,
  checkGlobalRankingHealth,
  GLOBAL_RANKING_ENDPOINT,
  loadGlobalRanking,
  submitGlobalRankingEntry,
} from "../src/services/globalRankingService";

// Apps Script en frío tarda hasta 30-40 s; con 12 s esta QA fallaba aunque el backend estuviera bien.
const QA_TIMEOUT_MS = 60000;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function getEndpoint(): string {
  return (
    process.env.VITE_GLOBAL_RANKING_ENDPOINT ??
    GLOBAL_RANKING_ENDPOINT ??
    ""
  ).trim();
}

function shouldRunWriteSmokeTest(): boolean {
  return process.env.FUTBOL11_GLOBAL_RANKING_WRITE_QA === "1";
}

function createQaLocalEntry(now = new Date()): CareerLocalRankingEntry {
  const iso = now.toISOString();
  const safeTimestamp = iso.replace(/[^0-9]/g, "");

  return {
    id: `qa_real_backend_${safeTimestamp}`,
    completedSeasons: 2,
    arcadeScore: 23,
    palmaresScore: 3,
    survivalScore: 20,
    trophyCounts: {
      champions: 0,
      liga: 0,
      europaLeague: 0,
      copa: 1,
      conference: 0,
      supercopa: 0,
    },
    bestLeaguePosition: 4,
    lastSeasonLabel: "2027/28",
    lastLeaguePosition: 8,
    gameVersion: "v0.23.0e",
    createdAt: iso,
  };
}

async function testHealth(endpoint: string): Promise<void> {
  const result = await checkGlobalRankingHealth({ endpoint, timeoutMs: QA_TIMEOUT_MS });

  assert(result.ok, `Healthcheck debe responder OK. Recibido: ${result.status} · ${result.message}`);
  assert(result.status === "healthy", `Healthcheck debe devolver status healthy, pero devolvió ${result.status}.`);
  logOk("Backend Apps Script responde health");
}

async function testTopLoad(endpoint: string): Promise<void> {
  const result = await loadGlobalRanking({ endpoint, timeoutMs: QA_TIMEOUT_MS });

  assert(result.ok, `Top global debe cargar. Recibido: ${result.status} · ${result.message}`);
  assert(Array.isArray(result.entries), "Top global debe devolver un array de entradas.");
  assert(result.entries.length <= 100, "Top global no debe superar 100 entradas.");
  logOk("Top global real carga sin romper la app");
}

async function testRealSubmitAndDuplicate(endpoint: string): Promise<void> {
  const localEntry = createQaLocalEntry();
  const payload = buildCareerGlobalRankingPayload({
    nick: "QA-Futbol11",
    entry: localEntry,
    submittedAt: new Date().toISOString(),
  });

  const firstSubmit = await submitGlobalRankingEntry(payload, { endpoint, timeoutMs: QA_TIMEOUT_MS });

  assert(firstSubmit.ok, `Primer envío real debe ser OK. Recibido: ${firstSubmit.status} · ${firstSubmit.message}`);
  assert(firstSubmit.entry?.careerId === payload.careerId, "El backend debe devolver la carrera enviada.");
  logOk("Envío real al ranking global funciona");

  const ranking = await loadGlobalRanking({ endpoint, timeoutMs: QA_TIMEOUT_MS });

  assert(ranking.ok, `Top global debe cargar tras envío. Recibido: ${ranking.status} · ${ranking.message}`);
  assert(
    ranking.entries.some((entry) => entry.careerId === payload.careerId && entry.nick === "QA-Futbol11"),
    "La carrera enviada debe aparecer en el Top global real.",
  );
  logOk("La carrera enviada aparece en el Top global real");

  const duplicateSubmit = await submitGlobalRankingEntry(payload, { endpoint, timeoutMs: QA_TIMEOUT_MS });

  assert(!duplicateSubmit.ok, "Reenviar la misma carrera no debe devolver OK.");
  assert(duplicateSubmit.status === "duplicate", `El duplicado debe clasificarse como duplicate, pero fue ${duplicateSubmit.status}.`);
  logOk("Duplicado real queda bloqueado por Apps Script");
}

console.log("QA Global Ranking Real Backend");

const endpoint = getEndpoint();

assert(endpoint.length > 0, "Falta VITE_GLOBAL_RANKING_ENDPOINT. Configura .env.local o la variable de entorno antes de ejecutar esta QA.");
assert(endpoint.includes("/exec"), "El endpoint real debe ser la URL /exec del despliegue de Apps Script.");

await testHealth(endpoint);
await testTopLoad(endpoint);

if (shouldRunWriteSmokeTest()) {
  await testRealSubmitAndDuplicate(endpoint);
} else {
  logOk("Smoke test de escritura omitido: define FUTBOL11_GLOBAL_RANKING_WRITE_QA=1 para enviar una carrera QA real.");
}

console.log("QA global ranking real backend OK");
