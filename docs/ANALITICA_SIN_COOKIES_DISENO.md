# Diseño: analítica sin cookies

Propuesta para medir el uso del juego sin cookies y sin datos personales. No está implementada: depende de las decisiones que aparecen al final.

## Objetivo

Saber cuántas personas llegan, cuántas empiezan una carrera, cuántas llegan al Game Over y cuántas envían al ranking global o copian un reto. Sin eso, los experimentos de crecimiento no tienen línea base.

## Opciones de proveedor

| Opción | Cookies | Qué guarda según su política | Coste | Notas |
|---|---|---|---|---|
| **GoatCounter** | No | Dice no recoger IP ni datos personales. Mantiene en memoria un hash salado de IP y user-agent durante 8 horas, sin escribirlo a disco. | Gratis para uso personal | La política oficial está fechada en marzo de 2021; hay que comprobar que sigue vigente. Su página GDPR concluye que probablemente no hace falta aviso de consentimiento, pero es su propio razonamiento. |
| **Plausible** | No | Hash diario con sal que rota cada 24 horas, sin IP guardada. | De pago en la versión alojada, o autoalojado | El proveedor dice que no necesita aviso de cookies. Un competidor sostiene que, con interpretaciones estrictas del RGPD, podría hacer falta consentimiento. Es una afirmación de marketing, no un dictamen. |
| **Sin analítica** | — | — | — | Opción actual. La nota de privacidad es exacta tal como está. |

Lectura jurídica: el RGPD suele considerar datos personales los identificadores seudonimizados, y un hash salado de IP con user-agent entra en ese grupo. Que el proveedor no guarde la IP no lo saca del RGPD. Por eso la nota no debe decir "no recogemos datos personales" sin matiz. Antes de activar cualquier analítica conviene una consulta jurídica o revisar la guía de la autoridad de protección de datos.

## Eventos propuestos

Solo nombres de evento, sin propiedades. Nada de nick, puntuación, identificadores de carrera ni fechas.

| Evento | Cuándo | Por qué |
|---|---|---|
| `view` (automático) | Carga de la home, ranking, privacidad | Tráfico |
| `career_start` | Se pulsa "Jugar carrera" | Conversión a carrera |
| `game_over` | Se llega a la pantalla de Game Over | Cuántas carreras terminan |
| `season_survived` | Se supera una temporada | Retención dentro de la carrera |
| `global_ranking_submit` | Se envía una carrera al ranking global | Participación |
| `challenge_copy` | Se copia un enlace de reto | Viralidad |
| `challenge_open` | Se abre un enlace de reto | Llegada desde reto |

Sin propiedades significa que no podemos segmentar por dificultad ni por resultado. Es el precio de no guardar nada que pueda identificar una partida.

## Diseño técnico

- Un módulo `src/services/analytics.ts` con una única función `trackEvent(name)`.
- El script del proveedor solo se carga si `VITE_ANALYTICS_HOST` está definido en la compilación. Sin esa variable, `trackEvent` no hace nada. Así los tests y el build por defecto no envían nada.
- Las llamadas van con `window.goatcounter?.count(...)`, para que una carga fallida no rompa el juego.
- Ninguna escritura en `localStorage` ni en cookies para la analítica.
- Un QA verifica que el build sin variable no contiene el script del proveedor y que no hay propiedades con datos de partida.

## Cambios en la nota de privacidad

La nota actual dice "No usamos analítica ni herramientas de seguimiento de visitas". Eso deja de ser cierto cuando se active cualquier analítica. Hay que cambiarla en el mismo PR que la activa.

Propuesta de texto: ver `docs/PRIVACIDAD_REVISION_PROPUESTA.md`.

## Lo que hace falta decidir

1. ¿Analítica o no? Si no, esta propuesta queda archivada y la nota actual se mantiene.
2. ¿Qué proveedor? GoatCounter es gratis y simple; Plausible es de pago o autoalojado.
3. ¿Qué postura legal se adopta? Opción A: aviso de privacidad sin consentimiento, asumiendo el riesgo. Opción B: consultar antes de activar. Opción C: pedir consentimiento con un banner, lo que empeora la experiencia.
4. ¿Qué eventos de la lista se quieren? Se puede empezar solo con `career_start` y `game_over`.

## Validación prevista

- Build sin variable: no aparece ningún dominio del proveedor en `dist/`.
- Build con variable en local: los eventos llegan al panel del proveedor y no aparece ninguna cookie en el navegador.
- QA de la nota: el texto de privacidad menciona el proveedor, la lista de eventos y que no se usan cookies.

## Estado de las decisiones (23/10/2026)

- **1. Analítica:** sí.
- **2. Proveedor:** GoatCounter.
- **3. Postura legal:** opción A (aviso de privacidad sin consentimiento, datos mínimos y texto honesto). Consultar antes de crecer o de monetizar.
- **4. Eventos:** `career_start` y `game_over`.
- **5. Contacto para borrados:** ikeritu@hotmail.com (ya en la nota de privacidad).

## Lo que queda antes de activar

1. Código de sitio de GoatCounter (subdominio). Lo da el propietario tras crear la cuenta.
2. Verificar que la política de GoatCounter sigue vigente. No se ha podido comprobar desde el entorno de desarrollo.
3. Verificar la URL del script (`gc.zgo.at/count.js`) en la documentación del proveedor.
4. Definir `VITE_ANALYTICS_HOST` en la compilación de GitHub Pages (variable del repositorio, igual que el ranking global).
5. Cambiar la nota de privacidad en el mismo PR que la activa: sustituir "No usamos analítica" por la sección de medición de `docs/PRIVACIDAD_REVISION_PROPUESTA.md`.

El código ya está en el repositorio, desactivado: `src/services/analytics.ts`.
