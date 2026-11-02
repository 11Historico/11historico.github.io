# v0.25.86 — Cartel de eliminatoria

Al jugar una carrera, la eliminación de la Copa solo aparecía como texto en una tarjeta («Eliminado en Dieciseisavos»). Ahora, al acabar un partido que decide una eliminatoria, sale un cartel grande que dice qué ha pasado. Solo es visual: no cambia ningún resultado ni regla.

## Cuándo sale

| Competición | Partido | Cartel |
| --- | --- | --- |
| Copa del Rey | Cualquier ronda, ganando | **Has clasificado** · «Sigues vivo en la Copa del Rey» (en semifinal: «Estás en la final») |
| Copa del Rey | Cualquier ronda, perdiendo | **Has sido eliminado** · «Fuera de la Copa del Rey en Octavos» |
| Copa del Rey | Final | **¡Campeón de Copa!** o **Subcampeón** |
| Europa | Último partido de la fase inicial | **Has clasificado** (pasas a semifinales) o **Has sido eliminado** |
| Europa | Semifinal | **Has clasificado** (estás en la final) o **Has sido eliminado** |
| Europa | Final | **¡Campeón de la …!** o **Subcampeón** |

- **No sale** en Liga, en la Supercopa (que ya tiene su veredicto), en partidos entre rivales ni en los primeros partidos de la fase inicial europea, porque no deciden nada.
- **Solo al final del partido:** durante el partido y en el descanso no se ve, para no adelantar el resultado. Con prórroga y penaltis, sale al acabar la tanda.
- **Colores:** verde para «Has clasificado», rojo para «Has sido eliminado» y «Subcampeón», y dorado para campeón. Son los mismos que las etiquetas de Victoria y Derrota.
- **Accesibilidad:** el cartel es `role="status"`, así que un lector de pantalla lo anuncia. Sin animación si el sistema pide reducir movimiento.

## Archivos

- `src/components/matchVerdict.ts`: qué cartel toca. En Europa usa el estado del torneo después del partido.
- `src/components/MatchVerdictBanner.tsx` y `.css`: el cartel.
- `MatchSequence.tsx` (Copa) y `EuropeanMatchEvent.tsx` (Europa) lo enseñan al final del partido.

## Comprobación

- `tests/unit/matchVerdict.test.ts`: los casos de la tabla y cuándo no sale.
- `tests/e2e/europe-supercopa.spec.ts`: en Copa no sale en el descanso y sí al final; en el primer partido europeo no sale.
- En el navegador: una victoria de Copa en la prórroga y una semifinal europea ganada en los penaltis. En los dos casos el cartel llega solo al acabar.
