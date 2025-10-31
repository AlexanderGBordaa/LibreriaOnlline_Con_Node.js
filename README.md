# Librería Cristiana — Desarrollo local

Este repositorio es una pequeña aplicación estática servida con Node/Express pensada para desarrollo local. Incluye una UI para navegar libros, ver PDFs y una sección de videos. También contiene un pequeño admin protegido con Google Sign-In para agregar libros y videos durante el desarrollo.

Requisitos
- Node.js 18+ (o superior)
- NPM

Variables importantes
- `GOOGLE_CLIENT_ID` — Client ID de OAuth 2.0 (Google Cloud Console). Necesario para validar tokens en el servidor.
- `SESSION_SECRET` — Secreto para firmar sesiones. En producción debe ser una frase larga aleatoria.

Instalación

```powershell
cd "c:\Users\alebo\OneDrive\Escritorio\Libreria Cristiana"
npm install
```

Ejecución (desarrollo)

Configura las variables de entorno en PowerShell (temporal para la sesión actual):

```powershell
$env:GOOGLE_CLIENT_ID = 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
$env:SESSION_SECRET = 'una_frase_larga_y_segura'
npm run dev
```

La app quedará disponible en: http://localhost:3000

Páginas útiles
- `/` — Home
- `/login.html` — Página con el botón de Google Sign-In (cliente)
- `/books.html` — Interfaz principal de libros
- `/videos.html` — Interfaz de videos
- `/admin.html` — UI de administración (agregar libros/videos) — requiere sesión

Flujo de autenticación (cliente + servidor)

1. Cliente: `auth.js` inicializa Google Identity Services con tu `CLIENT_ID` y, tras hacer sign-in, guarda `g_id_token` y `g_user` en `sessionStorage`.
2. Admin: `admin.js` envía `POST /api/login` con `{ id_token }`. El servidor valida el token con `google-auth-library` y crea `req.session.user` (cookie de sesión con `express-session`).
3. A partir de ahí las llamadas protegidas (ej. `POST /api/books`) usan la cookie de sesión (same-origin). El cliente debe enviar `credentials: 'same-origin'` si hace fetch directamente.

Pruebas rápidas (desarrollo)

1) Probar login con Google (recomendado):

```powershell
# Asume que has puesto tu CLIENT_ID en auth.js y exportado GOOGLE_CLIENT_ID
Start-Process "http://localhost:3000/login.html"
```

Haz sign-in con Google en la página que se abre. Tras un login exitoso verás `g_id_token` y `g_user` en `sessionStorage` (DevTools → Application).

2) Probar admin con sesión (servidor validando el token):

- Abre `http://localhost:3000/admin.html` (después del sign-in). Al enviar formularios, `admin.js` hará `POST /api/login` internamente y luego `POST /api/books`/`/api/videos` usando la cookie de sesión.

3) Prueba rápida sin Google (solo desarrollo):

Si quieres probar sin usar Google, hay un endpoint de desarrollo que crea una sesión sin validar tokens (`/__dev/login`). Úsalo solo en local:

```powershell
# Crear una sesión de desarrollo y mantener la cookie en $session
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Uri http://127.0.0.1:3000/__dev/login -Method Post -Body (@{ sub='dev'; email='dev@local'; name='Dev' } | ConvertTo-Json) -ContentType 'application/json' -WebSession $session

# Crear un libro usando la sesión guardada en $session
Invoke-RestMethod -Uri http://127.0.0.1:3000/api/books -Method Post -Body (@{ titulo='Libro Test'; autor='Tester'; pdf='https://example.com/test.pdf' } | ConvertTo-Json) -ContentType 'application/json' -WebSession $session

# Listar libros
Invoke-RestMethod http://127.0.0.1:3000/api/books -UseBasicParsing
```

Archivo de datos
- `data/books.json` — lista canónica de libros (el servidor lee y escribe en este archivo para persistencia simple en desarrollo).

Limpieza / notas de seguridad
- El endpoint `/__dev/login` es solo para desarrollo. No lo dejes habilitado en producción.
- En producción recomienda:
	- Usar `cookie.secure = true` y HTTPS
	- Usar un store de sesiones persistente (Redis, DB)
	- Proteger y auditar las credenciales y secretos

Test automatizado incluido
- `test/session-test.js` — script Node que crea una sesión dev, agrega un libro y lista libros (útil para CI o pruebas locales).

¿Quieres que quite el endpoint dev después de tus pruebas o que lo deje para desarrollo continuo? 

Librería Cristiana

Development notes

Install dependencies:

```powershell
npm install
```

Start dev server (nodemon):

```powershell
npm run dev
```

Start production server:

```powershell
npm start
```

Visit http://localhost:3000 to open the library. The client fetches `/api/books` to populate the catalog from `data/books.json`.

Notes:
- PDFs are embedded in an iframe. Some hosts block embedding — test the PDF URLs separately if they don't load.
- To add/remove books, edit `data/books.json` and refresh the page.
 
Additional pages:
- `index.html` — Home (sign-in button + navigation)
- `books.html` — Books interface (aisles, search, viewer). Protected by Google sign-in.
- `videos.html` — Videos interface (view-only). Protected by Google sign-in.

Google Sign-In:
- Open `auth.js` and replace `<REPLACE_WITH_GOOGLE_CLIENT_ID>` with your OAuth 2.0 Client ID.
- The Home page shows the Google Sign-In button. Books and Videos pages redirect to Home if not signed in.

Server-side verification & Admin
- To enable server-side verification of Google ID tokens set the environment variable `GOOGLE_CLIENT_ID` to the same client ID used in `auth.js` when running the server.
- Protected endpoints that create content (POST `/api/books`, POST `/api/videos`) require a valid ID token sent in the Authorization header as `Bearer <id_token>`.
- Admin UI: `admin.html` + `admin.js` let you add books and videos from the browser; they call the protected endpoints and send the ID token from sessionStorage.

Example (PowerShell) to run with env var:
```powershell
setx GOOGLE_CLIENT_ID "your-client-id.apps.googleusercontent.com"
npm run dev
```

Security note: The server verifies tokens using Google's tokeninfo endpoint. This is suitable for development; for production consider using Google's official libraries and/or caching verification results.

Video management:
- Video creation is intentionally removed from the public UI. To add videos during development, edit `data/videos.json` or POST to `/api/videos` while the server is running.

If you want a server-side verified login flow (recommended for production), we can add proper OAuth token verification on the server.
