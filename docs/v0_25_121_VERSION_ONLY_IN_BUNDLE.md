# v0.25.121 — Solo la versión, en el juego publicado

Sale de lo que se vio de paso en `docs/INFORME_DEPENDABOT_178_v0_25_120.md`: el bundle llevaba `package.json` entero. El usuario pidió «haz la 1» y aprobó el plan con «adelante». **No cambia nada que se vea al jugar.**

## El cambio

- **`src/config/appVersion.ts`** hacía `import packageJson from "../../package.json"` y solo usaba `packageJson.version`. Con el import por defecto, Vite mete el fichero entero en el bundle: los scripts, las dependencias y las versiones de las herramientas de desarrollo.
- **Ahora hace `import { version } from "../../package.json"`.** Vite deja solo la versión.
- **La versión sigue saliendo de `package.json`:** `APP_VERSION` no cambia de valor y se sube igual, con `npm version`.

## Lo que se gana

- **Unos 13 KB menos** en el JS principal del juego publicado.
- **Las subidas de herramientas ya no cambian el juego publicado.** Antes, cada PR de Dependabot cambiaba `index.js` aunque el juego fuera el mismo, porque llevaba sus versiones dentro (ver los informes del #178 y del #191).

## Qué no se toca

- **Los scripts de QA** que importan `package.json` entero se quedan igual: se ejecutan en Node y no entran en el bundle.

## Comprobación

- **El bundle de producción,** comparado con el de `main` en dos copias limpias del repo:

  | | `main` (v0.25.120) | v0.25.121 |
  | --- | --- | --- |
  | Ficheros | 48 | 48 |
  | JS | 951.147 bytes | 938.389 bytes (−12.758) |
  | CSS | 169.087 bytes | 169.087 bytes |

  - **47 de los 48 ficheros son idénticos,** salvo el nombre con hash.
  - **`index.js` solo cambia en la versión:** antes llevaba el objeto entero de `package.json`, y ahora lleva el texto ``za=`v0.25.121` `` y nada más del fichero. Ya no van ni `scripts` ni `devDependencies`.
- **En el navegador:** la portada enseña «v0.25.121: Stable Public Release» y no hay errores en la consola.
- Pasan `npm run typecheck`, `npx eslint src scripts`, `npm test` (272), `npm run qa:ci` (30 scripts) y `npm run test:e2e` (22 pasan, 2 se saltan).
