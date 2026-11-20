# El PR de Dependabot #191 (v0.25.120)

El usuario pidió «mide el #191». Es el PR [#191](https://github.com/11Historico/11historico.github.io/pull/191), del grupo `minor-and-patch`, con 4 subidas.

**Es solo una auditoría:** no fusiona, cierra ni comenta el PR, y no cambia el juego.

## Qué sube

Las 4 son herramientas de desarrollo (`devDependencies`). Ninguna dependencia del juego cambia, y tampoco Vite, Vitest ni TypeScript. El PR está sobre `main` actual (`a27b334`) y solo toca `package.json` y `package-lock.json`.

| Paquete | De | A | Tipo |
| --- | --- | --- | --- |
| `@playwright/test` | 1.65.0 | 1.65.1 | parche |
| `eslint` | 10.14.0 | 10.15.0 | menor |
| `eslint-plugin-react-refresh` | 0.5.7 | 0.5.8 | parche |
| `typescript-eslint` | 8.72.2 | 8.73.0 | menor |

En el `package-lock.json` cambian además, por arrastre:
- `minimatch`, de 10.2.6 a 11.0.8;
- `@eslint/config-array`, de 0.23.5 a 0.23.6;
- el resto de paquetes de `typescript-eslint` y `playwright`;
- uno nuevo, `@isaacs/nonrecursive-glob-match`.

`typescript-eslint` 8.73.0 sigue pidiendo `typescript <6.1.0`, así que el [#34](https://github.com/11Historico/11historico.github.io/pull/34) (TypeScript 7) sigue bloqueado. Ver `docs/INFORME_DEPENDABOT_34_v0_25_120.md`.

## Cómo se ha medido

- **GitHub:** las comprobaciones del PR pasan (`build`). Incluyen `npm ci`, typecheck, `qa:ci`, lint, tests, build y e2e en Chromium.
- **En local,** con dos copias limpias del repo, `main` y el PR, cada una con su `npm ci`:
  - el bundle de producción, fichero a fichero;
  - las comprobaciones de siempre;
  - auditorías de simulación con semilla fija;
  - `npm audit`.
- **Por qué copias limpias:** la copia de trabajo tiene configuración local que entra en el bundle. No se ha abierto ni copiado esa configuración.

## Resultados

### El bundle de producción

| | `main` | PR |
| --- | --- | --- |
| Ficheros | 48 | 48 |
| JS | 951.147 bytes | 951.147 bytes |
| CSS | 169.087 bytes | 169.087 bytes |

- **47 de los 48 ficheros son idénticos,** salvo el nombre con hash.
- **El único que cambia es `index.js`,** y mide los mismos bytes. Solo cambian los números de versión de las herramientas, porque el bundle lleva `package.json` entero (ver el informe del #178).

### Las comprobaciones

En la copia del PR pasan:
- `npm run typecheck`;
- `npx eslint src scripts`;
- `npm run lint`: las versiones nuevas de `eslint` y sus plugins no sacan avisos nuevos;
- `npm test` (272);
- `npm run qa:ci` (30 scripts).

**Los e2e no se han pasado en local:** Playwright 1.65.1 usa otro Chromium (revisión 1255, Chromium 159) y habría que descargarlo. En GitHub pasan con ese Chromium: 22 pasan y 2 se saltan, como en `main`.

### La simulación

| Auditoría | Qué juega | `main` y PR |
| --- | --- | --- |
| `npm run audit:europe-tiebreak` | 45.000 fases de liga europeas | Idénticas |
| `npm run audit:europe` | Fase inicial y previa: 3 competiciones × 5 ratings × 3 formas de decidir | Idénticas |
| `npm run audit:oviedo` | La media del Oviedo en la Liga (forma de temporada y progresión) | Idénticas |

- **No se ha repetido `npm run audit:cards`,** que tarda unos 33 minutos. El PR no toca nada de lo que compila o ejecuta la simulación (Vite, Vitest, TypeScript ni React), así que no puede cambiar. Las tres de arriba lo confirman.
- **`npm run audit:balance:100` no sirve para comparar,** porque no es determinista (ver el informe del #178).

### Avisos de seguridad (`npm audit`)

| | `main` | PR |
| --- | --- | --- |
| Total | 10 (9 moderados, 1 alto) | 1 (alto) |
| En las dependencias del juego (`--omit=dev`) | 0 | 0 |

- **El PR arregla los 9 moderados.** Venían de `minimatch` por la cadena de `eslint` y `typescript-eslint`, y `minimatch` 11.0.8 ya está corregido.
- **Queda el alto:** `zod` 4.4.3, por `eslint-plugin-react-hooks` 7.1.1. El aviso es que puede agotar la memoria al validar colecciones enormes; está arreglado en `zod` 4.6.6.
  - Solo está en una herramienta de lint y no llega al juego publicado.
  - `npm audit` dice que se puede arreglar, pero no es parte de este PR.

## Qué propongo

- **Fusionar el #191.** Solo cambia herramientas, el juego publicado queda igual, la simulación da los mismos resultados, todas las comprobaciones pasan y quita 9 de los 10 avisos de `npm audit`.
  - No necesita versión nueva del juego.
  - Al pasar el despliegue, el bundle publicado cambia de hash.
- **Después, en local:** `npm ci` y `npx playwright install chromium`, porque Playwright 1.65.1 usa un Chromium nuevo.
