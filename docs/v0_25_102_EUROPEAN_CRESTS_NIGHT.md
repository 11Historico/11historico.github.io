# v0.25.102 — Escudos y noche europea

Son las fases 14 y 15 de la ola 6 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`, ambas solo visuales. Los rivales europeos son clubes reales y no usamos sus escudos ni marcas de la UEFA: todo es genérico, y siempre con texto además del color.

## Fase 14 — Escudos genéricos por país

**`src/europe/europeanCrest.ts`**, funciones puras:
- `getEuropeanCrestBackground(country)`: la bandera del país simplificada en CSS.
  - Franjas horizontales o verticales, cruz centrada (Inglaterra, Georgia), cruz nórdica (Islandia) o aspa (Escocia).
  - La República Checa lleva una franja azul a la izquierda para no confundirse con Polonia.
  - Un país que no esté en la lista da un gris neutro.
- `getEuropeanCrestInitials(name)`: como mucho tres iniciales de las palabras con mayúscula.
  - «Bayern München» → BM, «Paris Saint-Germain» → PSG, «Inter de Milán» → IM.
  - Una sola palabra da tres letras («Arsenal» → ARS). Las siglas de hasta cuatro letras van enteras («PAOK»).

**`src/components/EuropeanCrest.tsx`:**
- Forma de escudo con la bandera de fondo. Las iniciales van sobre una pastilla oscura, legible sobre cualquier bandera.
- Tiene `role="img"` y el país como nombre accesible; el `title` lleva el club y el país.

**Dónde sale:**

| Pantalla | Archivo | Detalle |
| --- | --- | --- |
| Previa europea | `LeagueSimulatorView.tsx` | Pegado al nombre del rival, a su lado del cruce. La cabecera añade «Rival de {país}». |
| Partido europeo | `EuropeanMatchEvent.tsx` | En la tarjeta del rival. La tuya lleva la camiseta del Athletic. |
| Clasificación europea | `EuropeanLeagueTable.tsx` | En cada fila; la tuya, con la camiseta. |
| Cuadro de fin de temporada | `SeasonBrackets.tsx` | Delante de cada cruce europeo. |

El calendario del panel europeo no cambia: ya pone el país en texto en cada partido.

## Fase 15 — Noche europea (`src/components/EuropeanMatchEvent.css`)

- **Azul noche** de fondo en las tres competiciones. Antes, Europa League y Conference tenían fondos marrón y verde. El color de cada competición queda en el resplandor de arriba y en el borde; la semifinal y la final mantienen su brillo dorado.
- **Focos:** dos luces en las esquinas de arriba, con su halo.
- **Estrellas genéricas:** un patrón SVG de estrellas de cinco puntas, sueltas y tenues, que se apaga hacia abajo. No forma ningún logotipo.
- Todo va en el `::before` de la tarjeta, detrás del contenido. Los colores del texto no cambian.
- **Tamaño fijo** de los resplandores y los focos. En el móvil la tarjeta es muy alta y, en proporción, teñían todo el fondo: la Europa League se veía marrón.

## Sin cambios

- Ningún resultado, rival ni probabilidad.
- La Liga y la Copa siguen con sus camisetas (`TeamKitIcon`).

## Comprobación

- **Tests nuevos** en `tests/unit/europeanCrest.test.ts`:
  - las iniciales;
  - que los 26 países de los rivales tienen bandera;
  - que en cada competición no hay dos clubes del mismo país con las mismas iniciales;
  - el gris para un país desconocido.
- **E2E** (`tests/e2e/europe-supercopa.spec.ts`): la clasificación europea tiene seis escudos con nombre accesible, y solo la tarjeta del rival lleva escudo.
- **Navegador:** capturas con las tres competiciones, a 1100 px y a 375 px. Sin errores y sin desbordar la página en el móvil.
- `npm run typecheck`, `npx eslint src scripts`, `npm test` y `npm run qa:ci` pasan.
