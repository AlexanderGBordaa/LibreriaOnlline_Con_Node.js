const express = require('express');
const path = require('path');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Configurar sesión (DESARROLLO). En producción, ajustar secure, store, y secret en env.
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret-change',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // en producción habilitar true con HTTPS
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

// API simple para devolver la lista de libros
app.get('/api/books', (req, res) => {
  try {
    const books = require('./data/books.json');
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer la lista de libros' });
  }
});

// API de videos (almacenamiento simple en archivo)
app.get('/api/videos', (req, res) => {
  try {
    const videos = require('./data/videos.json');
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer la lista de videos' });
  }
});

const fs = require('fs');
const videosPath = path.join(__dirname, 'data', 'videos.json');

// Helper: verifica ID token usando google-auth-library (verifica firma y claims)
let oauthClient = null;
function getOAuthClient() {
  if (!oauthClient) {
    if (!process.env.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID no configurado');
    oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return oauthClient;
}

async function verifyIdToken(idToken) {
  const client = getOAuthClient();
  const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  // payload contiene sub, email, aud, exp, iat, name, picture, etc.
  return payload;
}

// Middleware para proteger endpoints: primero comprueba la sesión, luego Authorization header/token
async function requireAuth(req, res, next) {
  try {
    // 1) Si existe sesión con usuario, usarla
    if (req.session && req.session.user) {
      req.user = req.session.user;
      return next();
    }

    // 2) Intentar verificar Authorization: Bearer <token> o id_token en body
    const auth = req.headers.authorization || '';
    const token = (auth.startsWith('Bearer ') && auth.slice(7)) || (req.body && req.body.id_token);
    if (!token) return res.status(401).json({ error: 'No autorizado: falta sesión o token' });
    try {
      const info = await verifyIdToken(token);
      req.auth = info; // payload del token
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido', detail: err.message });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error verificando credenciales' });
  }
}

// Ruta para iniciar sesión por token y crear una sesión en servidor
app.post('/api/login', async (req, res) => {
  const { id_token } = req.body || {};
  if (!id_token) return res.status(400).json({ error: 'id_token requerido' });
  try {
    const payload = await verifyIdToken(id_token);
    // Guardar datos mínimos en sesión
    req.session.user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
    res.json({ ok: true, user: req.session.user });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido', detail: err.message });
  }
});

// Endpoint de desarrollo: permitir crear una sesión de prueba localmente sin verificar tokens.
// SOLO EN DESARROLLO. No usar en producción.
if (process.env.NODE_ENV !== 'production') {
  app.post('/__dev/login', (req, res) => {
    const { sub, email, name } = req.body || {};
    req.session.user = {
      sub: sub || 'dev-sub',
      email: email || 'dev@local',
      name: name || 'Desarrollador'
    };
    res.json({ ok: true, user: req.session.user });
  });
}

app.post('/api/videos', requireAuth, (req, res) => {
  const { title, url } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: 'title y url son requeridos' });
  try {
    const raw = fs.readFileSync(videosPath, 'utf8');
    const arr = JSON.parse(raw || '[]');
    const id = Date.now();
    arr.push({ id, title, url });
    fs.writeFileSync(videosPath, JSON.stringify(arr, null, 2), 'utf8');
    res.status(201).json({ id, title, url });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar el video' });
  }
});

// Endpoint protegido para agregar libros (solo users verificados pueden crear)
app.post('/api/books', requireAuth, (req, res) => {
  const { titulo, autor, pdf } = req.body || {};
  if (!titulo || !autor || !pdf) return res.status(400).json({ error: 'titulo, autor y pdf son requeridos' });
  try {
    const booksPath = path.join(__dirname, 'data', 'books.json');
    const raw = fs.readFileSync(booksPath, 'utf8');
    const arr = JSON.parse(raw || '[]');
    const id = Date.now();
    arr.push({ id, titulo, autor, pdf });
    fs.writeFileSync(booksPath, JSON.stringify(arr, null, 2), 'utf8');
    res.status(201).json({ id, titulo, autor, pdf });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar el libro' });
  }
});

// Escuchar en 0.0.0.0 para aceptar conexiones IPv4 e IPv6 en desarrollo
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${port} (puedes usar http://localhost:${port} o http://127.0.0.1:${port})`);
});
