/**
 * Futbol11 v0.23.0b — Global Ranking Backend Apps Script
 * (hardening pass: puntuación recalculada en servidor, tope de entradas,
 * columnas a prueba de auto-conversión de Sheets — ver notas junto a cada cambio)
 *
 * v0.24.5b — Backend Ranking Migration: añade columnas estructuradas por
 * competición europea/nacional (al final de HEADERS, sin tocar las
 * columnas existentes) para poder filtrar/ordenar directamente en Sheets
 * sin parsear el JSON de trophyCounts. No cambia el formato que recibe o
 * devuelve el cliente: trophyCounts sigue viajando igual que siempre: esto
 * es solo una vista adicional en la hoja. Ver migrateExistingTrophyColumns_
 * para rellenar filas ya existentes.
 *
 * Deploy as Web app:
 * - Execute as: Me
 * - Who has access: Anyone
 *
 * Frontend env variable:
 * VITE_GLOBAL_RANKING_ENDPOINT=<web app /exec URL>
 */

const SHEET_NAME = 'RankingGlobal';
const TOP_LIMIT = 100;
const MAX_NICK_LENGTH = 24;
// El endpoint es público ("Anyone"): estos topes evitan que un envío con
// datos absurdos (temporadas o posiciones fuera de rango) infle el ranking
// o rompa el orden, y que la hoja crezca sin límite.
const MAX_TOTAL_ENTRIES = 5000;
const MAX_COMPLETED_SEASONS = 500;
const MAX_LEAGUE_POSITION = 64;
// Debe reflejar src/career/careerRules.ts CAREER_PALMARES_POINTS. Si cambia
// ahí, cambia aquí también.
const PALMARES_POINTS = {
  champions: 10,
  liga: 8,
  europaLeague: 6,
  copa: 5,
  conference: 4,
  supercopa: 2,
};
// Columnas (1-based, ver HEADERS) que deben guardarse como texto plano para
// que Sheets no las reinterprete como número o fecha (p. ej. un nick "007"
// pasando a 7, o un ISO 8601 pasando a fecha de Sheets).
const TEXT_COLUMNS = [1, 2, 3, 10, 12, 13, 14, 15];
const HEADERS = [
  'id',
  'careerId',
  'nick',
  'completedSeasons',
  'arcadeScore',
  'palmaresScore',
  'survivalScore',
  'trophyCounts',
  'bestLeaguePosition',
  'lastSeasonLabel',
  'lastLeaguePosition',
  'gameVersion',
  'createdAt',
  'submittedAt',
  'serverReceivedAt',
  // v0.24.5b: desglose de trophyCounts en columnas propias, añadidas al
  // final para no desplazar los índices ya usados por TEXT_COLUMNS ni por
  // ningún cliente existente. Son solo para consulta/orden en Sheets: la
  // fuente de verdad sigue siendo la columna trophyCounts (JSON).
  'championsTitles',
  'ligaTitles',
  'europaLeagueTitles',
  'copaTitles',
  'conferenceTitles',
  'supercopaTitles',
  // v0.25.2: moderación. Escribe SÍ (o TRUE) en esta columna para ocultar una
  // fila del ranking global sin borrar sus datos. Las filas vacías son visibles.
  'oculto',
];

function doGet(event) {
  try {
    const params = event && event.parameter ? event.parameter : {};
    const action = String(params.action || 'top');

    if (action === 'health') {
      return jsonOutput_({ ok: true, status: 'healthy', message: 'Futbol11 global ranking backend activo.' });
    }

    if (action !== 'top') {
      return jsonOutput_({ ok: false, status: 'invalid_payload', message: 'Acción no soportada.' });
    }

    const limit = clampNumber_(Number(params.limit || TOP_LIMIT), 1, TOP_LIMIT);
    const entries = getTopEntries_(limit);

    return jsonOutput_({ ok: true, status: 'loaded', message: 'Ranking global cargado.', entries });
  } catch (error) {
    return jsonOutput_(toErrorResponse_(error));
  }
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(5000);

    const payload = parsePostPayload_(event);
    const entry = normalizePayload_(payload);
    const sheet = getRankingSheet_();
    const existingEntries = readEntries_(sheet);

    if (existingEntries.some((existing) => existing.careerId === entry.careerId)) {
      return jsonOutput_({
        ok: false,
        status: 'duplicate',
        message: 'Esta carrera ya estaba registrada en el ranking global.',
      });
    }

    if (existingEntries.length >= MAX_TOTAL_ENTRIES) {
      return jsonOutput_({
        ok: false,
        status: 'server_error',
        message: 'El ranking global ha alcanzado su límite de entradas.',
      });
    }

    appendEntryRow_(sheet, entry);

    return jsonOutput_({
      ok: true,
      status: 'submitted',
      message: 'Carrera enviada al ranking global.',
      entry,
    });
  } catch (error) {
    return jsonOutput_(toErrorResponse_(error));
  } finally {
    try {
      lock.releaseLock();
    } catch (_error) {
      // Lock not acquired or already released.
    }
  }
}

function parsePostPayload_(event) {
  const rawBody = event && event.postData && event.postData.contents ? event.postData.contents : '';

  if (rawBody) {
    return JSON.parse(rawBody);
  }

  if (event && event.parameter && event.parameter.payload) {
    return JSON.parse(event.parameter.payload);
  }

  throw new Error('Payload vacío.');
}

function normalizePayload_(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload inválido.');
  }

  const nick = sanitizeNick_(payload.nick);
  const careerId = String(payload.careerId || '').trim();
  const submittedAt = String(payload.submittedAt || new Date().toISOString());
  const createdAt = String(payload.createdAt || '');
  const completedSeasons = clampInt_(
    toNonNegativeNumber_(payload.completedSeasons, 'completedSeasons'),
    0,
    MAX_COMPLETED_SEASONS,
  );
  const trophyCounts = normalizeTrophyCounts_(payload.trophyCounts);
  // El servidor recalcula la puntuación a partir de temporadas + palmarés en
  // vez de confiar en el arcadeScore/palmaresScore/survivalScore que manda el
  // cliente: el endpoint es público, así que un payload manual no puede
  // inflarse el marcador.
  const scores = computeScores_(completedSeasons, trophyCounts);

  const entry = {
    id: careerId,
    careerId,
    nick,
    completedSeasons,
    arcadeScore: scores.arcadeScore,
    palmaresScore: scores.palmaresScore,
    survivalScore: scores.survivalScore,
    trophyCounts,
    bestLeaguePosition: clampInt_(
      toPositiveNumber_(payload.bestLeaguePosition, 'bestLeaguePosition'),
      1,
      MAX_LEAGUE_POSITION,
    ),
    lastSeasonLabel: String(payload.lastSeasonLabel || '').trim(),
    lastLeaguePosition: clampInt_(
      toPositiveNumber_(payload.lastLeaguePosition, 'lastLeaguePosition'),
      1,
      MAX_LEAGUE_POSITION,
    ),
    gameVersion: String(payload.gameVersion || '').trim(),
    createdAt,
    submittedAt,
    serverReceivedAt: new Date().toISOString(),
  };

  if (careerId.length < 6) throw new Error('careerId obligatorio.');
  if (nick.length < 3) throw new Error('El nick debe tener al menos 3 caracteres.');
  if (!entry.lastSeasonLabel) throw new Error('lastSeasonLabel obligatorio.');
  if (!entry.gameVersion) throw new Error('gameVersion obligatorio.');
  if (!entry.createdAt) throw new Error('createdAt obligatorio.');

  return entry;
}

function computeScores_(completedSeasons, trophyCounts) {
  const palmaresScore =
    trophyCounts.champions * PALMARES_POINTS.champions +
    trophyCounts.liga * PALMARES_POINTS.liga +
    trophyCounts.europaLeague * PALMARES_POINTS.europaLeague +
    trophyCounts.copa * PALMARES_POINTS.copa +
    trophyCounts.conference * PALMARES_POINTS.conference +
    trophyCounts.supercopa * PALMARES_POINTS.supercopa;
  const survivalScore = Math.max(0, completedSeasons) * 10;

  return {
    arcadeScore: survivalScore + palmaresScore,
    palmaresScore,
    survivalScore,
  };
}

function sanitizeNick_(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N} _.-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NICK_LENGTH);
}

function normalizeTrophyCounts_(value) {
  const source = value && typeof value === 'object' ? value : {};

  return {
    champions: toSafeInteger_(source.champions),
    liga: toSafeInteger_(source.liga),
    europaLeague: toSafeInteger_(source.europaLeague),
    copa: toSafeInteger_(source.copa),
    conference: toSafeInteger_(source.conference),
    supercopa: toSafeInteger_(source.supercopa),
  };
}

function getRankingSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const needsHeaders = currentHeaders.some((value, index) => value !== HEADERS[index]);

  if (needsHeaders) {
    headerRange.setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// Sheets decide el tipo de una celda por el formato que tenga *antes* de
// escribir el valor: formatear después de escribir no deshace la conversión.
// Por eso cada fila nueva se formatea como texto plano antes de rellenarla.
function formatTextColumns_(sheet, row) {
  TEXT_COLUMNS.forEach((column) => {
    sheet.getRange(row, column).setNumberFormat('@');
  });
}

function appendEntryRow_(sheet, entry) {
  const targetRow = sheet.getLastRow() + 1;
  formatTextColumns_(sheet, targetRow);
  sheet.getRange(targetRow, 1, 1, HEADERS.length).setValues([toRow_(entry)]);
}

/**
 * Migración de un solo uso: aplica formato de texto a las columnas sensibles
 * de todas las filas ya existentes. Las filas antiguas cuyo nick o fecha ya
 * se convirtieron (p. ej. "007" -> 7) no recuperan el valor original; esto
 * solo evita que se sigan corrompiendo al reescribirse. Ejecutar una vez a
 * mano desde el editor de Apps Script tras desplegar esta versión.
 */
function migrateExistingColumnFormats_() {
  const sheet = getRankingSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  TEXT_COLUMNS.forEach((column) => {
    sheet.getRange(2, column, lastRow - 1).setNumberFormat('@');
  });
}

/**
 * Migración de un solo uso (v0.24.5b): rellena las columnas estructuradas
 * de títulos (championsTitles...supercopaTitles) para las filas ya
 * existentes, leyendo su columna trophyCounts (JSON) tal cual. No toca
 * trophyCounts ni ninguna otra columna: es puramente aditiva. Ejecutar una
 * vez a mano desde el editor de Apps Script tras desplegar esta versión.
 */
function migrateExistingTrophyColumns_() {
  const sheet = getRankingSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  const trophyColumnIndex = HEADERS.indexOf('trophyCounts') + 1;
  const firstNewColumn = HEADERS.indexOf('championsTitles') + 1;
  const trophyCells = sheet.getRange(2, trophyColumnIndex, lastRow - 1).getValues();
  const rows = trophyCells.map((row) => trophyCountsToColumns_(parseTrophyCountsCell_(row[0])));

  sheet.getRange(2, firstNewColumn, rows.length, rows[0].length).setValues(rows);
}

function readEntries_(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, HEADERS.length)
    .getValues()
    .filter((row) => !isHiddenRow_(row))
    .map(rowToEntry_)
    .filter(Boolean);
}

// v0.25.2: columna de moderación "oculto" (ver HEADERS).
const HIDDEN_COLUMN_INDEX = HEADERS.indexOf('oculto');

function isHiddenRow_(row) {
  const value = row[HIDDEN_COLUMN_INDEX];
  if (value === true) return true;

  return ['SI', 'SÍ', 'TRUE', '1'].indexOf(String(value).trim().toUpperCase()) !== -1;
}

function getTopEntries_(limit) {
  return sortEntries_(readEntries_(getRankingSheet_())).slice(0, limit);
}

function sortEntries_(entries) {
  return entries.sort((left, right) => {
    if (right.arcadeScore !== left.arcadeScore) return right.arcadeScore - left.arcadeScore;
    if (right.completedSeasons !== left.completedSeasons) return right.completedSeasons - left.completedSeasons;
    if (right.palmaresScore !== left.palmaresScore) return right.palmaresScore - left.palmaresScore;
    if (left.bestLeaguePosition !== right.bestLeaguePosition) return left.bestLeaguePosition - right.bestLeaguePosition;
    return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
  });
}

function toRow_(entry) {
  return [
    entry.id,
    entry.careerId,
    entry.nick,
    entry.completedSeasons,
    entry.arcadeScore,
    entry.palmaresScore,
    entry.survivalScore,
    JSON.stringify(entry.trophyCounts),
    entry.bestLeaguePosition,
    entry.lastSeasonLabel,
    entry.lastLeaguePosition,
    entry.gameVersion,
    entry.createdAt,
    entry.submittedAt,
    entry.serverReceivedAt,
  ].concat(trophyCountsToColumns_(entry.trophyCounts), ['']);
}

// v0.24.5b: mismo orden que las columnas añadidas al final de HEADERS.
function trophyCountsToColumns_(trophyCounts) {
  var counts = normalizeTrophyCounts_(trophyCounts);

  return [
    counts.champions,
    counts.liga,
    counts.europaLeague,
    counts.copa,
    counts.conference,
    counts.supercopa,
  ];
}

function rowToEntry_(row) {
  try {
    return {
      id: cellToString_(row[0]),
      careerId: cellToString_(row[1]),
      nick: sanitizeNick_(cellToString_(row[2])),
      completedSeasons: toSafeInteger_(row[3]),
      arcadeScore: toSafeInteger_(row[4]),
      palmaresScore: toSafeInteger_(row[5]),
      survivalScore: toSafeInteger_(row[6]),
      trophyCounts: parseTrophyCountsCell_(row[7]),
      bestLeaguePosition: toSafeInteger_(row[8]),
      lastSeasonLabel: cellToString_(row[9]),
      lastLeaguePosition: toSafeInteger_(row[10]),
      gameVersion: cellToString_(row[11]),
      createdAt: cellToString_(row[12]),
      submittedAt: cellToString_(row[13]),
    };
  } catch (_error) {
    return null;
  }
}

// Defensa ante filas escritas antes de este arreglo (o si Sheets vuelve a
// convertir algo igualmente): una celda que Sheets ya trate como fecha llega
// aquí como objeto Date, no como el string ISO original.
function cellToString_(value) {
  if (value instanceof Date) return value.toISOString();
  return String(value || '');
}

function parseTrophyCountsCell_(value) {
  try {
    return normalizeTrophyCounts_(typeof value === 'string' ? JSON.parse(value) : value);
  } catch (_error) {
    return normalizeTrophyCounts_({});
  }
}

function toNonNegativeNumber_(value, label) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) throw new Error(label + ' inválido.');

  return Math.floor(number);
}

function toPositiveNumber_(value, label) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 1) throw new Error(label + ' inválido.');

  return Math.floor(number);
}

function toSafeInteger_(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function clampInt_(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampNumber_(value, min, max) {
  if (!Number.isFinite(value)) return max;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function toErrorResponse_(error) {
  return {
    ok: false,
    status: 'server_error',
    message: error && error.message ? String(error.message) : 'Error interno del ranking global.',
  };
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
