# Setup — Ranking global con Google Sheets + Apps Script

## 1. Crear Google Sheet

1. Crea una hoja de cálculo nueva.
2. Ponle un nombre reconocible, por ejemplo `Futbol11 Global Ranking`.
3. No hace falta crear columnas manualmente: el script crea la pestaña `RankingGlobal` y sus cabeceras.

## 2. Abrir Apps Script

1. En la hoja, abre `Extensiones` → `Apps Script`.
2. Borra el contenido inicial.
3. Copia el contenido de:

```text
apps-script/globalRankingBackend.gs
```

4. Guarda el proyecto.

## 3. Desplegar como Web App

1. Pulsa `Implementar` → `Nueva implementación`.
2. Tipo: `Aplicación web`.
3. Ejecutar como: `Yo`.
4. Acceso: `Cualquier usuario`.
5. Copia la URL terminada en `/exec`.

## 4. Configurar Futbol11

Opción A — `.env.local` local:

```env
VITE_GLOBAL_RANKING_ENDPOINT=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
```

Reinicia el servidor local o reconstruye:

```powershell
cmd /c "npm run dev"
```

Para producción, la variable debe existir antes de ejecutar:

```powershell
cmd /c "npm run build"
```

Opción B — configuración desde la UI:

1. Abre `Ranking global`.
2. Pega la URL `/exec` en `URL Apps Script /exec`.
3. Pulsa `Guardar endpoint`.
4. Pulsa `Recargar ranking`.

Esta opción guarda el endpoint solo en `localStorage` del navegador. No modifica `.env.local` ni se sube a GitHub.

Opción C — web publicada en GitHub Pages:

1. En el repositorio: `Settings` → `Secrets and variables` → `Actions` → pestaña `Variables` → `New repository variable`.
2. Nombre: `VITE_GLOBAL_RANKING_ENDPOINT`. Valor: la URL `/exec`.
3. El workflow `deploy.yml` la pasa solo al paso `Build`. Si la variable no existe, el sitio publicado muestra "Conecta el ranking global".
4. Es una variable y no un secreto porque la URL acaba en el JavaScript público de todos modos; el backend se protege recalculando puntuaciones, con límites y bloqueando duplicados.

Nunca hagas `npm run build` en local con el endpoint en `.env.local` y publiques esa carpeta `dist`: la URL queda incrustada en los archivos generados.

## 5. Prueba rápida

En el navegador:

1. Llega a Game Over.
2. Introduce nick válido.
3. Pulsa `Enviar al ranking global`.
4. Abre `Ranking global`.
5. Comprueba que aparece la carrera.
6. Reintenta enviar la misma carrera: debe aparecer aviso de duplicado.

## 6. Endpoints útiles

Health check:

```text
https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec?action=health
```

Top 100:

```text
https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec?action=top&limit=100
```

## 7. QA automática real

Con `.env.local` creado y Vite/QA leyendo `VITE_GLOBAL_RANKING_ENDPOINT`, puedes validar health y Top 100 sin escribir en la hoja:

```powershell
cmd /c "npm run qa:global-ranking-real"
```

Para hacer una prueba real de escritura controlada:

```powershell
$env:FUTBOL11_GLOBAL_RANKING_WRITE_QA = "1"
cmd /c "npm run qa:global-ranking-real"
Remove-Item Env:FUTBOL11_GLOBAL_RANKING_WRITE_QA
```

Esta prueba crea una entrada real con nick `QA-Futbol11`, comprueba que aparece en el Top global y verifica que reenviar el mismo `careerId` queda bloqueado como duplicado.

> Seguridad: .env.local no se debe subir al repositorio. Mantén VITE_GLOBAL_RANKING_ENDPOINT solo en local o configúralo desde la UI.
