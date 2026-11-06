# Informe: la media con la que juegas la Supercopa (v0.25.100)

Fase 11 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`. Es solo una auditoría: no cambia el juego ni tiene versión.

Reproducible con `npm run audit:supercopa` (`scripts/auditSupercopaRating.ts`), que juega 10.000 Supercopas por casilla con las funciones reales del juego y semillas fijas.

## Lo que hace el juego hoy

El roadmap decía que la Supercopa usa la media visible. El código lo confirma y añade una segunda diferencia:

| | Liga, Copa y Europa | Supercopa |
| --- | --- | --- |
| Tu media | `applyDifficultyToTeamRating`: compresión de carrera (80 + (media − 80) × 0,55) y la dificultad (Fácil +2, Normal 0, Leyenda −4). En `LeagueSimulatorView.tsx`. | `teamRating` tal cual, la media visible con el premio de entrenador, sin compresión ni dificultad. En `App.tsx`, `handleSimulateCareerSupercopa`. |
| Rivales de LaLiga | Con la progresión de carrera: +0,5 por temporada superada al principio, hasta +3 | Sin progresión: `careerLeagueRivals` tal cual |

Las dos medias, con el once de la partida de prueba movido a cada media visible:

| Media visible | Supercopa hoy | Liga en Fácil | Liga en Normal | Liga en Leyenda |
| --- | --- | --- | --- | --- |
| 84 | 84 | 84,2 | 82,2 | 78,2 |
| 86 | 86 | 85,3 | 83,3 | 79,3 |
| 88 | 88 | 86,4 | 84,4 | 80,4 |
| 90 | 90 | 87,5 | 85,5 | 81,5 |

## Medición

La Supercopa con los tres rivales más fuertes de LaLiga: Barça 91, Real Madrid 91 y Atlético 87. Tu equipo pasa por los cuatro puestos de entrada, que cambian el rival de semifinal y el campo, y juega con planteamiento equilibrado.

Cada casilla da la probabilidad de ganar la Supercopa y, entre paréntesis, la de llegar a la final. Columnas:
- **Hoy:** la media visible.
- **Solo la dificultad:** la media visible con +2, 0 o −4, sin compresión.
- **Media como la Liga:** compresión y dificultad.
- **Todo como la Liga:** además, los rivales con la progresión de carrera.

### 1.ª Supercopa (1 temporada superada)

| Dificultad | Media visible | Hoy | Solo la dificultad | Media como la Liga | Todo como la Liga |
| --- | --- | --- | --- | --- | --- |
| Fácil | 84 | 16 % (39 %) | 20 % (44 %) | 14 % (36 %) | 13 % (35 %) |
| Fácil | 88 | 22 % (47 %) | 29 % (53 %) | 17 % (40 %) | 17 % (40 %) |
| Normal | 84 | 16 % (39 %) | 16 % (39 %) | 11 % (32 %) | 11 % (32 %) |
| Normal | 88 | 22 % (47 %) | 22 % (47 %) | 14 % (37 %) | 13 % (36 %) |
| Leyenda | 84 | 16 % (39 %) | 11 % (32 %) | 7 % (24 %) | 7 % (23 %) |
| Leyenda | 88 | 22 % (47 %) | 16 % (39 %) | 9 % (28 %) | 8 % (27 %) |

### Más adelante en la carrera (Normal, media visible 88)

| Temporadas superadas | Hoy | Todo como la Liga |
| --- | --- | --- |
| 1 | 22 % (47 %) | 13 % (36 %) |
| 3 | 22 % (47 %) | 11 % (33 %) |
| 6 | 22 % (47 %) | 10 % (30 %) |

Las tablas completas, con medias de 84, 86, 88 y 90 y con 1, 3 y 6 temporadas, salen con `npm run audit:supercopa`.

## Lo que dicen los números

1. **La dificultad no cuenta en la Supercopa.** En Fácil, Normal y Leyenda la probabilidad es la misma: el 22 % con 88 de media. Es la incoherencia más clara, porque quien elige Leyenda juega la Supercopa como en Fácil.
2. **En Normal, la Supercopa es una vez y media más fácil que si se jugara como la Liga** (22 % frente al 13-14 %), y en Leyenda, más del doble (22 % frente al 8-9 %).
3. **La progresión de los rivales pesa menos que la media:** entre 0 y 6 puntos menos, más cuanto más avanza la carrera.
4. **Aun así, hoy no es un regalo.** Con cuatro equipos, el reparto a ciegas sería del 25 %. Hoy se gana entre el 16 % y el 29 % de las veces, porque el Barça y el Madrid (91) son más fuertes que casi cualquier once.
5. **Pesa poco en la carrera.** Ganarla da 2 puntos de palmarés, el título que menos da (la Copa da 5 y la Liga 8). No salva la temporada. Solo desbloquea el cambio de formación si además te clasificas para Europa.

## Opciones

| Opción | Qué cambia | Normal con 88 | Riesgo |
| --- | --- | --- | --- |
| **A. Dejarla como está** | Nada. Se documenta que la Supercopa se juega con la media visible. | 22 % | La dificultad sigue sin contar en la Supercopa. |
| **B. Solo la dificultad** | Se suma o resta la dificultad a la media visible, como en la Liga, pero sin la compresión ni la progresión. | 22 %, igual | Fácil sube (29 %) y Leyenda baja (16 %). Normal no cambia. |
| **C. Todo como la Liga** | La misma media y los mismos rivales que la Liga y la Copa. | 13 % | Las Supercopas bajan un 40 % en Normal (del 22 % al 13 %) y a un tercio en Leyenda. |

**Recomendación: B.** Arregla la incoherencia más clara, que la dificultad elegida no cuente, y deja Normal exactamente igual. Además, la previa de la Supercopa seguiría enseñando las medias que ve el jugador.

C es lo más coherente con la Liga, pero quita cuatro de cada diez Supercopas en Normal, y más cuanto más avanza la carrera. Es justo lo contrario de lo que pedía el usuario al empezar el roadmap, que es sentir que puede ganar algo.

Cualquier cambio toca el equilibrio de la carrera, así que necesita permiso explícito y va en su propia fase y versión, con la medición de carreras completas (`audit:rating`).

## Archivos

- `scripts/auditSupercopaRating.ts`, nuevo, y `npm run audit:supercopa` en `package.json`.
- Este informe.
