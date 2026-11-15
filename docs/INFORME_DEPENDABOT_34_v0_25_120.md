# El PR de Dependabot #34: TypeScript 7 (v0.25.120)

El usuario pidió medir el PR [#34](https://github.com/11Historico/11historico.github.io/pull/34), que sube `typescript` de 6.0.3 a 7.0.2. TypeScript 7 es el compilador reescrito en Go.

**Es solo una auditoría:** no fusiona, cierra ni comenta el PR, y no cambia el juego.

## Cómo se ha medido

- **GitHub:** se ha leído el registro de la comprobación del PR.
- **En una copia limpia del repo,** con la rama del PR, de dos formas:
  - tal como está, saltándose el bloqueo de instalación con `--legacy-peer-deps`;
  - con la configuración que Microsoft recomienda para convivir con la 6.0: `tsc` es la 7 y las herramientas usan la 6.
- **Fuentes:**
  - el anuncio de TypeScript 7.0, en su sección «Running side by side with TypeScript 6.0»;
  - el issue [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940).

## Resultados

### 1. Tal como está, el PR no se puede fusionar

- **En GitHub falla a los 10 segundos, en `npm ci`.** `typescript-eslint` 8.72.2 pide `typescript` `>=4.8.4 <6.1.0`, y npm se niega a instalar la 7.
- **Ninguna versión publicada lo admite todavía:** ni la estable (8.72.2) ni la de pruebas (`canary`, 8.72.3-alpha.8).
- **Si se fuerza la instalación,** ESLint ni arranca: `typescript-eslint does not support TS 7.0`.
- **Motivo:** TypeScript 7.0 no trae todavía la interfaz que usan herramientas como ESLint. El anuncio dice que llegará, distinta, en la 7.1. El issue #10940 sigue abierto; en la última actualización (29-09-2026) estaban preparando el soporte para TypeScript 7.1.

### 2. El código del juego ya compila con TypeScript 7

| | TypeScript 6.0.3 (`main`) | TypeScript 7.0.2 |
| --- | --- | --- |
| `npm run typecheck`, sin caché | 5,9 s | 1,1-1,2 s |
| Errores | 0 | 0 |

- **Ninguna opción del `tsconfig` choca con los cambios de la 7.0,** que convierte en error varias opciones antiguas.
- **Detecta errores de verdad:** un error de tipos metido a propósito sale igual que con la 6.

### 3. La configuración oficial de convivencia funciona

Son dos alias en `devDependencies`, como recomienda el anuncio:

```json
"@typescript/native": "npm:typescript@~7.0.2",
"typescript": "npm:@typescript/typescript6@~6.0.2",
```

Con ellos:
- **La instalación es limpia,** sin saltarse ningún bloqueo. `tsc` es la 7.0.2 y `tsc6` la 6.0.3. Las herramientas que importan `typescript`, como ESLint, ven la 6.0.3.
- **Pasan todas las comprobaciones:**
  - `npm run typecheck` (con `tsc` 7, 1,2 s);
  - `npx eslint src scripts`;
  - `npm run lint`;
  - `npm test` (272);
  - `npm run qa:ci`.
- **El bundle de producción es idéntico al de `main`:** son los mismos 39 ficheros. Solo cambia el texto de `package.json` que va dentro (ver el informe del #178).
- **La simulación no puede cambiar:** Vite y Vitest no usan `tsc` para compilar, así que no se han repetido las auditorías ni los e2e.

## Opciones

- **A. Esperar** a que `typescript-eslint` admita TypeScript 7.1, y entonces subir directamente.
  - El #34 seguirá fallando mientras tanto.
  - Se puede cerrar el PR o pedir a Dependabot que no proponga esta versión mayor. Las dos cosas son acciones en GitHub, así que necesitan tu permiso.
- **B. Usar ya las dos versiones,** con la configuración del punto 3.
  - El typecheck pasa de unos 6 s a poco más de 1 s, en local y en GitHub.
  - A cambio, `package.json` lleva dos alias que habrá que deshacer cuando llegue el soporte. Además, Dependabot puede proponer subidas raras de los alias.
  - El #34 no sirve como está: habría que hacer el cambio en una rama propia.

## Qué propongo

**A.** Lo único que se gana con la B son unos segundos de typecheck, que no se ven al jugar. A cambio, la configuración queda más rara. Es mejor esperar a la 7.1 con soporte en `typescript-eslint` y subir entonces de una vez: el código ya compila con la 7, así que el cambio será pequeño.
