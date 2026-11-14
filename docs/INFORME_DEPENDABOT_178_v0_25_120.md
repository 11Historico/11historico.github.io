# El PR de Dependabot #178 (v0.25.120)

El usuario pidió «mide el PR de Dependabot». Es el PR [#178](https://github.com/11Historico/11historico.github.io/pull/178), del grupo `minor-and-patch`, con 8 subidas.

**Es una auditoría:** no cambia el juego. El usuario fusionó el PR después (ver «Decisión»).

## Qué sube

Las 8 son herramientas de desarrollo (`devDependencies`). Ninguna dependencia del juego cambia (`react` y `react-dom` siguen igual). El PR está rebasado sobre `main` actual (`9a29d60`, la v0.25.120) y solo toca `package.json` y `package-lock.json`.

| Paquete | De | A | Tipo |
| --- | --- | --- | --- |
| `vite` | 8.0.12 | 8.3.8 | menor |
| `vitest` | 5.0.5 | 5.1.0 | menor |
| `@playwright/test` | 1.64.1 | 1.65.0 | menor |
| `@vitejs/plugin-react` | 6.1.2 | 6.3.0 | menor |
| `eslint` | 10.13.0 | 10.14.0 | menor |
| `globals` | 17.13.0 | 17.14.0 | menor |
| `typescript-eslint` | 8.72.1 | 8.72.2 | parche |
| `@types/node` | 26.6.5 | 26.6.6 | parche |

## Cómo se ha medido

- **GitHub:** las comprobaciones del PR pasan (`build`, 3 min 11 s). Incluyen `npm ci`, typecheck, `qa:ci`, lint, tests, build y e2e en Chromium con Playwright 1.65.
- **En local,** lo que GitHub no mira. Hay dos copias limpias del repo, `main` y el PR, cada una con su `npm ci`:
  - el bundle de producción, fichero a fichero;
  - auditorías de simulación con semilla fija, para ver si salen iguales;
  - `npm audit`.
- **Por qué copias limpias:** la copia de trabajo tiene configuración local que entra en el bundle. Compilarla falseaba la comparación, así que se usaron dos copias limpias. No se ha abierto ni copiado esa configuración.

## Resultados

### El bundle de producción

| | `main` | PR |
| --- | --- | --- |
| Ficheros | 39 | 39 |
| JS | 951.049 bytes | 951.147 bytes (+98) |
| CSS | 169.087 bytes | 169.087 bytes |
| Tiempo de build | 2,8 s | 2,8 s |

- **35 de los 39 ficheros son idénticos,** salvo el nombre con hash de los ficheros que importan.
- **Los 4 restantes cambian sin tocar el juego:**
  - `index.js` (+95 bytes):
    - el cargador de CSS de Vite ahora quita sus escuchadores al terminar;
    - cambia el orden del mapa de dependencias entre trozos;
    - cambian los números de versión de `package.json` (ver «Visto de paso»).
  - `LeagueSimulatorView.js` (+3 bytes), `FinalSummary.js` y `CareerSeasonOutcome.js` (+0): solo cambia el orden y el nombre corto de las importaciones entre trozos.

### La simulación

| Auditoría | Qué juega | `main` y PR |
| --- | --- | --- |
| `npm run audit:europe-tiebreak` | 45.000 fases de liga europeas | Idénticas |
| `npm run audit:europe` | Fase inicial y previa: 3 competiciones × 5 ratings × 3 formas de decidir | Idénticas |
| `npm run audit:cards` | Cartas de partido | Idénticas |
| `npm run audit:oviedo` | La media del Oviedo en la Liga (forma de temporada y progresión) | Idénticas |

- **`npm run audit:balance:100` no sirve para comparar:** en `main` sale distinta cada vez (ligas del Athletic: 14 y 8 de 100 en dos ejecuciones seguidas), porque no usa semilla fija en todo. No es cosa del PR.

### Avisos de seguridad (`npm audit`)

| | `main` | PR |
| --- | --- | --- |
| Total | 10 (9 moderados, 1 alto) | 10 (9 moderados, 1 alto) |
| En las dependencias del juego (`--omit=dev`) | 0 | 0 |

- **El PR no arregla ni añade avisos.**
- **Todos los avisos están en herramientas de desarrollo:**
  - `minimatch`, por la cadena de `eslint` y `typescript-eslint`;
  - `zod`, por `eslint-plugin-react-hooks`.
- No llegan al juego publicado.

## Visto de paso (sin tocar)

- **El bundle lleva `package.json` entero,** unos 13 KB: los scripts y las versiones de las herramientas.
  - **Por qué:** `src/config/appVersion.ts` hace `import packageJson from "../../package.json"` y solo usa `version`.
  - **Arreglo:** con `import { version } from "../../package.json"`, Vite dejaría solo la versión.
  - No es secreto, pero sobra.
- **El otro PR de Dependabot,** el [#34](https://github.com/11Historico/11historico.github.io/pull/34), sube TypeScript de 6.0 a 7.0. Es un cambio mayor y no se ha medido aquí.

## Qué propongo

- **Fusionar el #178.** Solo cambia herramientas, el juego publicado queda igual salvo detalles internos de Vite, la simulación da los mismos resultados y todas las comprobaciones pasan.
  - No necesita versión nueva del juego, porque no cambia nada que se vea al jugar.
  - Al pasar el despliegue, el bundle publicado cambia de hash.
- **Después, en local:** `npm ci` y `npx playwright install chromium`, porque Playwright 1.65 usa su propio Chromium.

## Decisión

- **Fusión:** el usuario pidió «fusiona el #178» antes de que acabara la auditoría de cartas. Se fusionó con el merge commit `1fee75a`.
- **Publicación:** el despliegue terminó bien. El bundle publicado sigue en la v0.25.120, ya con Vite 8.3.8.
- **Auditorías que faltaban:** al acabar, las de cartas y del Oviedo salieron idénticas en `main` y en el PR.
- **En local:** después se hicieron `npm ci` y `npx playwright install chromium`. Pasan `npm run typecheck`, `npx eslint src scripts`, `npm test` (272), `npm run qa:ci` y `npm run test:e2e` (22 pasan, 2 se saltan).
