# Librería Cristiana — Plataforma Web con Node.js

Plataforma web para lectura de libros cristianos, visualización de videos y panel de administración, construida con HTML, CSS, JavaScript y un backend ligero en Node.js/Express con autenticación mediante **Google Sign-In (OAuth 2.0)**.

---

## 🔑 Configurar Google Sign-In para CUALQUIER Cuenta de Google

Por defecto, los proyectos creados en Google Cloud Console inician en estado **"En pruebas" (Testing)**. En este estado, Google **bloquea a cualquier usuario** que no esté registrado manualmente como "Usuario de prueba" (generando error `403: access_denied`).

Para permitir que **cualquier persona con una cuenta de Google** pueda ingresar:

### 1. Publicar la aplicación en Google Cloud Console
1. Ingresa a [Google Cloud Console](https://console.cloud.google.com/).
2. Selecciona tu proyecto en la barra superior (el correspondiente al Client ID `947464831495-7m6276ntaetl2nstspoimql15mr7iu3m...`).
3. En el menú de la izquierda, navega a **APIs y servicios** > **Pantalla de consentimiento de OAuth** (*OAuth consent screen*).
4. Asegúrate de que el **Tipo de usuario** (*User type*) esté seleccionado como **Externo** (*External*).
5. En la sección **Estado de publicación** (*Publishing status*), haz clic en el botón **"PUBLICAR LA APLICACIÓN"** (*Publish app*) y confirma la acción en la ventana emergente.
   > **Nota importante**: Dado que esta aplicación solo solicita permisos básicos (`openid`, `email`, `profile`), Google **no requiere revisión ni verificación empresarial**. El pase a producción es **inmediato** y cualquier cuenta de Google del mundo podrá iniciar sesión.

### 2. Verificar los Orígenes de JavaScript Autorizados
1. En el menú de la izquierda, ve a **APIs y servicios** > **Credenciales**.
2. Haz clic sobre tu **ID de cliente OAuth 2.0** (*Web client*).
3. En la sección **Orígenes autorizados de JavaScript**, asegúrate de tener agregados:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - *(Si despliegas la web en internet, agrega aquí el dominio de producción, ej. `https://tu-dominio.com`)*.
4. En **URIs de redireccionamiento autorizados**, si están configurados, asegúrate de tener `http://localhost:3000` y `http://127.0.0.1:3000`.
5. Haz clic en **Guardar**.

---

## 🚀 Requisitos e Instalación

### Requisitos
- [Node.js](https://nodejs.org/) v18 o superior
- NPM

### Instalación
Clona el repositorio e instala las dependencias:

```bash
git clone https://github.com/AlexanderGBordaa/LibreriaOnlline_Con_Node.js.git
cd LibreriaOnlline_Con_Node.js
npm install
```

---

## ⚙️ Variables de Entorno

Copia el archivo de ejemplo `.env.example` a `.env`:

```powershell
cp .env.example .env
```

El archivo `.env` contendrá:

```env
PORT=3000
GOOGLE_CLIENT_ID=947464831495-7m6276ntaetl2nstspoimql15mr7iu3m.apps.googleusercontent.com
SESSION_SECRET=dev-session-secret-change-production
```

> **Nota**: El servidor ya incluye el `GOOGLE_CLIENT_ID` por defecto como respaldo en `server.js`, por lo que funcionará de inmediato incluso si no configuras el archivo `.env` manualmente.

---

## 💻 Ejecución

### Modo desarrollo (con recarga automática mediante nodemon):
```powershell
npm run dev
```

### Modo producción:
```powershell
npm start
```

La aplicación estará accesible en:
👉 **http://localhost:3000** o **http://127.0.0.1:3000**

---

## 🧭 Estructura y Navegación

- `/` o `/index.html` — Página principal con bienvenida y botón de inicio de sesión con Google.
- `/login.html` — Página dedicada para inicio de sesión.
- `/books.html` — Estantería virtual de libros con búsqueda, pasillos y visor interactivo de PDFs (protegida por autenticación).
- `/videos.html` — Sección de conferencias y predicas en video (protegida por autenticación).
- `/admin.html` — Panel de administración para agregar nuevos libros y videos (protegido).
- `/data/books.json` — Almacenamiento local de libros.
- `/data/videos.json` — Almacenamiento local de videos.

---

## 🔒 Flujo de Autenticación y Seguridad

1. **Cliente (`auth.js`)**:
   - Inicializa el SDK de Google Identity Services.
   - Procesa la respuesta JWT del usuario y guarda la sesión en el navegador (`sessionStorage`).
   - Sincroniza automáticamente la sesión con el backend (`POST /api/login`) para crear una cookie de sesión HTTP (`express-session`).
   - Muestra el nombre, avatar y botón de "Cerrar sesión" en la barra de navegación.

2. **Servidor (`server.js`)**:
   - Middleware `requireAuth`: verifica tanto la cookie de sesión como tokens JWT válidos mediante `google-auth-library`.
   - Endpoints `/api/me` y `/api/logout` para consulta y cierre de sesión seguro.
   - Endpoints protegidos para la creación de libros y videos.

---

## 🧪 Pruebas Automatizadas

Para validar el sistema de sesiones y creación de recursos sin necesidad de abrir el navegador:

```powershell
node test/session-test.js
```
