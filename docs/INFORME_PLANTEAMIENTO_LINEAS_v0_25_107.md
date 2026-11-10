# El planteamiento que lee las líneas del rival (idea I2, v0.25.107)

El usuario pidió «mide la I2», del informe `INFORME_IDEAS_DECISIONES_v0_25_107.md`.

La idea era que el planteamiento dejara de depender solo de la diferencia de medias:
- atacar rendiría más contra una defensa floja;
- cerrarse rendiría más contra un ataque fuerte.

Así la mejor opción cambiaría según el rival y se acabaría la regla fija.

**No cambia el juego.** La fórmula nueva solo existe dentro de la auditoría.

## Resultado en una frase

**La I2 no cumple su objetivo.** Con las líneas que hay en el juego, la mejor opción sigue saliendo de la diferencia de nivel. En la Copa, atacar sigue siendo lo mejor en el 82-85 % de los partidos. Cuanto más fuerte es la fórmula, más acierta la regla fija («ataca si tu media es mayor»), en vez de menos.

## Método

**Scripts:**
- `npm run audit:approach-lines`, en `scripts/auditApproachLines.ts`;
- `scripts/auditApproachLines.vite.ts`, que cambia la fórmula solo durante la auditoría.

**Onces:** 40, sorteados con el draft del juego.
- Cuatro estilos de draft: mejor media, al azar, ofensivo y defensivo.
- Comprimidos como en la carrera, en dificultad normal.
- La media de simulación es 82,8.

**Partidos:**

| Competición | Rivales | Partidos | Cómo se valora |
| --- | --- | --- | --- |
| Copa | Los 19 rivales de Liga, en casa y fuera | 1520 | Probabilidad de pasar: victoria en 90 minutos más la mitad de los empates |
| Europa League, fase de liga | Rivales de 80, 84, 88 y 92, cada uno con los tres estilos, en casa y fuera | 960 | Puntos por partido |

**En cada partido:**
- Se estima cada planteamiento con 300 simulaciones con semillas fijas, con el entrenador del once.
- Se apunta cuál es el mejor.
- Se apunta si aciertan dos reglas fijas:
  - **ataca si tu media es mayor** (si no, defiende);
  - **ataca si eres favorito**: en la previa, ganas más veces de las que pierdes con el planteamiento equilibrado.

**Fórmulas comparadas:**
- **Hoy:** el plus del planteamiento depende de la diferencia de medias, con un tope a 10 puntos.
- **Líneas:** lo que ganas al atacar depende de tu ataque contra su defensa. Lo que te cuesta abrirte depende de su ataque contra tu defensa. Con líneas iguales a la media es la fórmula de hoy.
- **Líneas sensibles:** lo mismo, con el tope a 5 puntos.
- **Líneas con el doble de efecto:** es solo un techo para ver hasta dónde llega, no una propuesta.

## Copa (1520 partidos)

| Fórmula | Mejor: ofensivo | Mejor: equilibrado | Mejor: defensivo | Acierta «ataca si tu media es mayor» | Acierta «ataca si eres favorito» | Decidir bien frente a equilibrado |
| --- | --- | --- | --- | --- | --- | --- |
| Hoy | 85 % | 6 % | 10 % | 88 % | 71 % | +2,4 puntos |
| Líneas | 84 % | 6 % | 11 % | 88 % | 71 % | +2,4 puntos |
| Líneas sensibles | 82 % | 4 % | 14 % | 94 % | 74 % | +2,9 puntos |
| Doble de efecto (techo) | 82 % | 1 % | 17 % | 98 % | 77 % | +5,9 puntos |

Las cifras de decidir bien son puntos de probabilidad de pasar la ronda.

**El perfil del once no cambia la respuesta.** Atacar es lo mejor en el 82-89 % de los partidos con un once ofensivo, defensivo o de mejor media. Con el draft al azar baja al 75-79 %, porque esos onces son favoritos menos veces.

## Europa League, fase de liga (960 partidos)

| Fórmula | Mejor: ofensivo | Mejor: equilibrado | Mejor: defensivo | Acierta «ataca si tu media es mayor» | Acierta «ataca si eres favorito» | Decidir bien frente a equilibrado |
| --- | --- | --- | --- | --- | --- | --- |
| Hoy | 24 % | 25 % | 51 % | 58 % | 54 % | +0,06 puntos por partido |
| Líneas | 26 % | 25 % | 49 % | 57 % | 53 % | +0,06 |
| Líneas sensibles | 23 % | 20 % | 56 % | 73 % | 58 % | +0,07 |
| Doble de efecto (techo) | 24 % | 5 % | 71 % | 92 % | 71 % | +0,16 |

**El estilo del rival apenas mueve la respuesta.** Atacar es lo mejor contra:
- un rival ofensivo: 22-27 %;
- un rival equilibrado: 15-24 %;
- un rival defensivo: 25-34 %.

**Hoy en Europa no hay regla fija, pero tampoco hay decisión.** El planteamiento vale unas 0,06 puntos por partido, unos 0,35 en toda la fase de liga. Las opciones están tan cerca que la mejor cambia casi al azar. Lo que pesa en Europa es el descanso, como ya decía el informe de cierre.

## Por qué no funciona

Las líneas casi no se distinguen entre sí:

- **Tu once:** después de la compresión de carrera, el ataque queda entre 1,1 y 3,8 puntos sobre la media, y la defensa entre 2,2 y 3,3. Un draft ofensivo y uno defensivo acaban con casi las mismas líneas: la compresión (×0,55) las aplana.
- **Rivales de Liga:** el ataque menos la defensa va de −5 a +7, y la mayoría está entre −3 y +3.
- **Rivales europeos:** el estilo mueve ±3 el ataque y la defensa (v0.25.105).

**Hay una razón más:** atacar contra un rival ofensivo te da más goles, porque defiende mal, pero también te cuesta más, porque ataca bien. Las dos cosas se compensan.

Con diferencias tan pequeñas, la fórmula que lee las líneas acaba diciendo lo mismo que la media. Al hacerla más sensible, la diferencia de nivel llega antes al tope y pesa todavía más. Por eso la regla fija acierta más, en vez de menos.

**Para que leer las líneas importe, habría que separarlas mucho más.** Eso significa tocar los perfiles de los rivales, el estilo europeo o la compresión de las líneas del usuario: ratings, plantillas y simulador, todo protegido. Además, se inflaría la carrera, como ya pasó con más peso en la v0.25.87.

## Qué propongo

1. **Descartar la I2 tal como estaba planteada.** No se toca el simulador, así que no hace falta permiso para nada.
2. **Volver a las ideas de Liga sin contar con la I2:**
   - **I3, comodines de descanso.** La decisión no depende del planteamiento: depende de cuándo gastar un recurso escaso. La regla del descanso es fija («arriesga si pierdes, cierra si ganas»), pero gastar ahora o guardar no lo es.
   - **I4, partidos marcados.** Decidir el planteamiento en Liga tendría la misma regla fija que la Copa: ataca si eres favorito.
3. **I5, la ruleta con riesgo elegido,** sigue siendo independiente.

## Limitaciones

- **La Copa usa los 19 rivales de Liga**, sin la forma del momento, sin los rivales de otras categorías y sin el +1 del entrenador en Copa.
- **Con 300 simulaciones por opción**, cuando dos opciones están muy cerca la mejor puede salir por ruido. Eso infla un poco «decidir bien» y baja el acierto de las reglas, sobre todo en Europa.
- **No se ejecutaron `audit:rating` ni `audit:europe` con la variante.** La fórmula no cumple el primer criterio, así que medir las carreras no cambiaría la conclusión. La configuración `auditApproachLines.vite.ts` permite hacerlo con `AUDIT_APPROACH_LINES='{"gap":10,"effect":0.1}'` si hiciera falta.
