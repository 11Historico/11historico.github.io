import packageJson from "../../package.json";

// Fuente única: package.json. Para subir de versión, usar `npm version <x.y.z> --no-git-tag-version`.
export const APP_VERSION = `v${packageJson.version}`;
export const APP_VERSION_NAME = "Stable Public Release";
export const APP_STATUS = "Versión pública estable: Modo carrera completo (Liga, Copa y Supercopa), Europa Career (clasificación, torneo jugable con prórroga y penaltis, títulos y prestigio en el palmarés), secuencia de partido en Liga, Copa y Europa con velocidad ajustable, ruleta de temporada, ranking local y global. Liga y Copa mantienen su balance aceptado.";

// Derivados de APP_VERSION/APP_VERSION_NAME: fuente única para los scripts
// de QA que comprueban que README/CHANGELOG/docs apuntan al release actual
// (antes cada script tenía su propia copia hardcodeada de estos valores, lo
// que hacía fácil dejar alguno desactualizado al publicar una fase nueva;
// ver v0.24.7 — Europa Career Release Stabilization).
export const CURRENT_RELEASE_TAG = `${APP_VERSION}_STABLE_PUBLIC_RELEASE`;
export const CURRENT_RELEASE_DOC = "docs/v0_25_79_NO_STRIKER_FORMATION.md";
