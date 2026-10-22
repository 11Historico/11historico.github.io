# Informe de cambios y mejoras — Futbol11 v0.25.1

Análisis por rol, uno a uno, a partir del código actual de `main` (v0.25.1). Ningún punto de este informe cambia balance, ratings, probabilidades ni reglas de competición salvo que se apruebe expresamente, según `AGENTS.md`.

Prioridad: **P1** = conviene hacerlo pronto; **P2** = mejora clara; **P3** = después o si hay tiempo.

---

## 1. Desarrollador Frontend (Programador Web)

**Lo que vemos**
- `src/App.tsx` tiene 1.841 líneas y concentra estado de carrera, guardado, ruleta, Europa y pantallas. Es el cuello de botella de cualquier cambio.
- `src/components/LeagueSimulatorView.tsx` tiene 1.026 líneas.
- El bundle principal es de 485 kB tras separar los datos de plantillas (307 kB en su propio fragmento). Está cerca del aviso de 500 kB.
- No hay framework de tests unitarios ni de componentes. Los QA son scripts que leen texto del código y ejecutan funciones puras.

**Cambios propuestos**
- **P2** Partir `App.tsx` por dominio: un hook de carrera (`useCareer`), uno de guardado (`useSavedGame`) y uno de ruleta. Sin cambiar comportamiento, con los QA existentes como red de seguridad.
- **P2** Cargar en diferido las pantallas de carrera y Europa con `React.lazy`. Así el draft inicial no paga su coste.
- **P3** Sustituir gradualmente los QA de texto por pruebas de comportamiento (ver rol QA).

**Mejoras**
- **P1** Eliminar la dependencia de `.env.local` en el build de producción: documentar un único punto de configuración del endpoint.

---

## 2. Diseñador de Interfaz y Experiencia de Usuario (UI/UX)

**Lo que vemos**
- La secuencia de partido ya está en Liga, Copa y Europa, con velocidad ajustable y movimiento reducido (v0.24.9i–k).
- La accesibilidad tiene huecos: `:focus-visible` solo aparece en 2 archivos y `prefers-reduced-motion` en 4. Los botones de la interfaz principal dependen del estilo por defecto del navegador para el foco.
- Hay 52 `aria-label`, lo que es buen punto de partida.

**Cambios propuestos**
- **P1** Definir un estilo de foco visible común (`:focus-visible`) para todos los botones y enlaces, con contraste de 3:1 frente al fondo.
- **P2** Revisar el orden de tabulación y el foco al abrir la ruleta y la tarjeta europea, que son modales.
- **P2** En Game Over, explicar en una frase por qué no hay plaza europea (por ejemplo, "la plaza de Copa pasó al 6.º porque el campeón ya estaba en Europa"). Hoy solo aparece "Sin clasificación europea".
- **P3** Onboarding de 3 pasos la primera vez, con la ruleta y el Game Over explicados.

**Mejoras**
- **P2** Auditar la pantalla en móvil real con el mismo flujo de tres partidas (pendiente del propietario).

---

## 3. Diseñador de Juego (Game Designer)

**Lo que vemos**
- El balance de Liga y Copa está congelado por decisión previa. Europa tiene reglas propias y el reparto de plazas se acaba de alinear con las 7 plazas de LaLiga.
- Hay tres niveles de dificultad (Fácil, Normal, Leyenda) y una ruleta de temporada con probabilidades documentadas.

**Cambios propuestos**
- **P1** Documentar en la pantalla de reglas la regla de reasignación de la plaza de Copa. Es la regla más contraintuitiva que tiene el juego, y ya nos generó dudas.
- **P2** Revisar el peso de Europa en el palmarés frente a Liga y Copa, con datos de partidas reales (no cambiar sin aprobación).
- **P3** Modo "Retos" con condiciones semanales (por ejemplo, ganar en Europa con un once concreto) que reutilice el motor existente.

**Riesgos**
- Cualquier cambio de probabilidades de la ruleta o de Liga afecta a rankings ya publicados. Debe ir como fase nueva, no como ajuste silencioso.

---

## 4. Diseñador Gráfico 2D

**Lo que vemos**
- La identidad por competición ya existe en la tarjeta europea (azul Champions, naranja Europa League, verde Conference) y en la secuencia de partido.
- Los escudos de Liga y Copa son texto y colores; no hay iconografía propia por competición.
- Los trofeos del palmarés son gráficos vectoriales y ya diferencian títulos.

**Cambios propuestos**
- **P2** Un icono propio por competición (Liga, Copa, Supercopa, Champions, Europa League, Conference) usado en la cabecera de cada partido y en el palmarés, sin usar logos oficiales de UEFA ni LaLiga.
- **P2** Un fondo de estadio de 2D sutil para la pantalla de resultado, con modo de bajo contraste.
- **P3** Un trofeo animado para el momento de la victoria en la final de Copa, respetando `prefers-reduced-motion`.

**Riesgo**
- Usar símbolos o marcas de UEFA, LaLiga o clubes sin licencia. Los iconos deben ser originales.

---

## 5. Desarrollador Backend / Redes

**Lo que vemos (Apps Script)**
- El servidor recalcula `arcadeScore` y `palmaresScore` a partir de la carrera. No confía en lo que envía el cliente. Eso es correcto.
- Usa `LockService` para escrituras concurrentes y limita el nick a 24 caracteres.
- La duplicidad se comprueba con `careerId`, que genera el cliente y puede falsificarse.
- No hay autenticación ni límite de envíos por origen. Cualquiera que conozca el endpoint puede escribir en la hoja.
- `doGet` devuelve las entradas del ranking, incluidos los nicks, sin política de privacidad visible en el proyecto.

**Cambios propuestos**
- **P1** Añadir una columna "oculto" en la hoja y filtrar esas filas en `getTopEntries_`, para poder retirar entradas abusivas sin borrar datos.
- **P1** Redactar una nota de privacidad breve (qué se guarda: nick, puntuación y palmarés; cómo borrarlo; contacto) y enlazarla desde el ranking global.
- **P2** Rechazar envíos con `careerId` ya usado y con puntuaciones que no encajen con las temporadas declaradas (límites ya presentes en `MAX_*`, revisar que cubren todo).
- **P3** Una verificación ligera contra abuso (por ejemplo, un token de un solo uso emitido por el servidor antes de cada envío). No es seguridad fuerte, pero reduce el spam automatizado.

---

## 6. QA / Tester

**Lo que vemos**
- Hay 40 scripts `qa*`. Muchos comprueban texto del código con `includes()`.
- Esta sesión lo demostró: un QA de dependencias de un efecto y un QA de versión fallaron por cambios correctos de código, no por errores reales.
- No hay pruebas de componentes ni de extremo a extremo. La comprobación de la app en vivo se hace a mano en el navegador.

**Cambios propuestos**
- **P1** Añadir Vitest para las funciones puras (ya están bien separadas: `matchSequenceTimeline`, `europeanQualification`, `resolveEuropeanQualification`, etc.). Sería la red de seguridad real de la lógica.
- **P1** Añadir una prueba de humo con Playwright: draft → simular liga → Game Over, en CI. Detectaría roturas de flujo que los QA de texto no ven.
- **P2** Sustituir gradualmente los QA de texto que fijan código literal (dependencias de efectos, cadenas de versión) por comprobaciones de comportamiento o de configuración.
- **P2** Derivar la versión de `package.json` en lugar de repetirla en 8 archivos.

---

## 7. Especialista en Marketing Digital / Redes Sociales

**Lo que vemos**
- `index.html` declara `<html lang="en">` en una aplicación en español. Afecta a lectores de pantalla, traducción automática y SEO.
- Solo hay `description` y `title`. No hay Open Graph ni Twitter Cards: compartir el enlace en redes muestra una tarjeta vacía.
- Hay botón de compartir juego y de compartir carrera, pero no imagen de vista previa.
- No hay analítica de ningún tipo, así que no sabemos cuánta gente llega ni cuánta juega una carrera completa.

**Cambios propuestos**
- **P1** Corregir `lang="es"` en `index.html`.
- **P1** Añadir Open Graph y Twitter Cards con título, descripción y una imagen de 1200×630 (la imagen la puedo preparar cuando quieras).
- **P2** Analítica sin cookies y sin datos personales (por ejemplo, GoatCounter o Plausible) con aviso en la nota de privacidad. Sin analítica no hay forma de medir nada de lo demás.
- **P3** Plan de contenido: un clip o captura por noche europea y por título, con el hashtag del juego.

---

## 8. Gestor de Patrocinios (Monetización)

**Lo que vemos**
- Hay botón de apoyo con Ko-fi y PayPal, sin anuncios.
- El juego usa el nombre "Athletic Club" y referencias a sus camisetas, que son un activo de marca de terceros.

**Cambios propuestos**
- **P2** Mantener el apoyo voluntario (Ko-fi/PayPal) como fuente principal. Es coherente con un proyecto independiente.
- **P2** Revisar el riesgo de marca antes de cualquier patrocinio: nombre del club, escudo y camisetas. Un patrocinador o una tienda de merchandising necesitan esa revisión primero.
- **P3** Si se busca ingreso, valorar un formato no intrusivo y sin publicidad en la pantalla de juego (por ejemplo, una página de agradecimiento con enlaces de apoyo).

**Riesgo**
- Monetizar sin licencia sobre marcas de terceros. No avanzar sin asesoría.

---

## 9. CTO (Chief Technology Officer)

**Lo que vemos**
- Arquitectura: front-end sin backend propio; guardado en `localStorage`; ranking global en Apps Script.
- Dependencias de producción: solo `react` y `react-dom`. `npm audit` reporta 0 vulnerabilidades tras v0.25.1.
- CI: el workflow de despliegue ejecuta typecheck, lint, todos los QA y el build antes de publicar. Esta sesión, la cola de GitHub Actions tardó más de 30 minutos en varias ocasiones.
- Versiones: la versión se escribe a mano en 8 archivos. Ha provocado al menos dos fallos de QA en esta sesión.
- No hay Dependabot ni revisión automática de dependencias.

**Cambios propuestos**
- **P1** Activar Dependabot para npm y GitHub Actions.
- **P1** Derivar `APP_VERSION` desde `package.json` en build (una sola fuente de verdad).
- **P2** Reducir el tamaño de `App.tsx` con hooks por dominio (ver rol Frontend).
- **P2** Documentar el proceso de release en un solo lugar (tag, versión, CHANGELOG, docs de fase, QA), ya que hoy está repartido.
- **P3** Ampliar el CI con un paso de Playwright cuando exista (ver rol QA).

---

## 10. Growth Hacker (Indie Hacking)

**Lo que vemos**
- Hay ranking local y global, compartir partida y compartir carrera. Son buenos motores de retorno.
- No hay medición (ver rol Marketing), así que los experimentos no tienen línea base.
- La carrera completa dura muchas partidas. Sin atajos ni objetivos cortos, la primera sesión puede ser larga.

**Cambios propuestos**
- **P1** Medir primero: analítica sin cookies con tres eventos (inicio de carrera, Game Over, envío al ranking global).
- **P2** Enlace de reto: "supera mi puntuación" con la carrera codificada en la URL (sin datos personales en la URL, según las reglas del proyecto).
- **P2** Resumen de fin de temporada con una tarjeta compartible (puntos, palmarés y clasificación), que ya existe en parte: ampliarla con imagen.
- **P3** Ranking semanal con reinicio, que da una razón para volver sin cambiar el ranking histórico.

---

## Orden recomendado

1. **Esta semana (P1 de bajo coste):** `lang="es"`, Open Graph, Dependabot, columna "oculto" en la hoja, nota de privacidad, foco visible.
2. **Después (P1 de mayor coste):** Vitest para lógica pura, prueba de humo con Playwright, medición sin cookies.
3. **Siguiente fase (P2):** partir `App.tsx`, reglas explicadas en Game Over, iconos de competición, enlace de reto.
4. **Según decisiones tuyas:** cualquier cambio de balance, probabilidades o reglas, y cualquier movimiento de monetización con marcas de terceros.
