# Revisión propuesta de la nota de privacidad

Revisión de `public/privacidad.html`. El texto actual es exacto para el estado actual del juego (sin analítica). Esta propuesta solo se aplica si se decide activar la analítica sin cookies (ver `docs/ANALITICA_SIN_COOKIES_DISENO.md`).

## Revisión del texto actual

Revisé cada afirmación de la nota contra el código:

| Afirmación actual | Estado | Comentario |
|---|---|---|
| Guardamos en el navegador la partida, el ranking local, la velocidad de la secuencia y el historial | Correcto | Claves `localStorage` en `localGameStorage.ts`, `careerLocalRankingStorage.ts`, `matchPlaybackSpeed.ts` y `gameHistoryStorage.ts`. |
| El nick para el ranking global se guarda en el navegador | Correcto | `careerGlobalRankingStorage.ts`, clave `…career_global_nick_v1`. |
| Al enviar al ranking global se transmiten nick, puntuación, temporadas, palmarés, última posición, versión y fecha | Correcto | Así lo construye `buildCareerGlobalRankingPayload`. |
| No pedimos correo, nombre real ni datos de contacto | Correcto | No hay campos de ese tipo en el formulario. |
| Las entradas se guardan en una hoja privada del autor | Correcto | Hoja de Google Sheets del backend de Apps Script. |
| No usamos analítica ni herramientas de seguimiento | Correcto hoy | Deja de ser cierto si se activa cualquier analítica. |
| No usamos cookies propias ni publicidad | Correcto | No hay escrituras de cookies en el código. |
| Servicios de terceros: GitHub Pages, Apps Script, Google Forms, Ko-fi y PayPal | Correcto | Ko-fi y PayPal solo si se pulsa el botón de apoyo. |
| Retirada de entradas: formulario de feedback con nick y fecha | Sin verificar | No he podido comprobar los campos del formulario de Google. Hay que confirmar que pide el nick, o la nota debe decir que se incluya el nick en el mensaje. |

Hay dos cosas que la nota no dice y debería decir:
- Que Google Apps Script procesa las peticiones y que sus registros técnicos siguen las políticas de Google. Ya lo dice de forma general; conviene que sea explícito.
- Quién es el responsable de contacto. Hoy es "el autor, ikeritu, en GitHub". Para una petición formal de borrado, un canal directo sería mejor que el formulario.

## Propuesta: versión con analítica sin cookies

Añadir una sección nueva y cambiar la frase de analítica. Sustituye el párrafo "No usamos analítica…" por:

> **Medición de uso.** Usamos un servicio de estadísticas sin cookies, [NOMBRE DEL PROVEEDOR], para contar visitas y algunas acciones del juego (empezar una carrera, llegar al Game Over, enviar al ranking global y copiar o abrir un enlace de reto). Las estadísticas se muestran en agregado y no incluyen nick, puntuación ni identificadores de partida. El servicio no guarda cookies en tu navegador. Tu dirección IP no se almacena: [TEXTO DEL PROVEEDOR SOBRE EL HASH]. Si prefieres que no se cuente tu visita, puedes [MÉTODO DE OPT-OUT SI EXISTE].

Y en "Servicios de terceros", añadir:

> - **[NOMBRE DEL PROVEEDOR]**, solo para estadísticas de uso. [ENLACE A SU POLÍTICA DE PRIVACIDAD].

## Lo que no puede decir la nota

- "No recogemos datos personales", sin matiz. El RGPD suele tratar un hash salado de IP y user-agent como dato personal seudonimizado.
- "No necesitamos consentimiento", como afirmación propia. Es una postura jurídica que hay que decidir con asesoría.
- Cualquier cifra de visitas o de usuarios.

## Decisiones antes de publicar

1. Si se activa la analítica, ¿qué proveedor y con qué fecha? La nota solo se cambia en el mismo PR que la activa.
2. ¿Qué postura legal se adopta? Ver las opciones A, B y C en el diseño.
3. Nombre o canal de contacto para peticiones de borrado (el autor, o un correo dedicado).
4. Revisión final de la nota por el propietario. Esta propuesta no es asesoramiento jurídico.

## Decisiones tomadas (23/10/2026)

- El canal de borrados es **ikeritu@hotmail.com**. Ya está en la nota publicada, en el apartado de retirada de entradas.
- La analítica es la opción A. El texto de la sección "Medición de uso" se añade solo cuando se active.
