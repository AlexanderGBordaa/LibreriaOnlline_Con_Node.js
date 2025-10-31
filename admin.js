// admin.js — UI para agregar libros y videos (requiere id_token en sessionStorage)
function getIdToken() {
  return sessionStorage.getItem('g_id_token');
}

// Enfoque: primero enviar el id_token a /api/login para que el servidor cree una sesión.
// Luego las llamadas POST usarán la cookie de sesión (same-origin).
async function ensureSession() {
  const token = getIdToken();
  if (!token) throw new Error('No hay id_token en sessionStorage. Inicia sesión.');
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: token }),
    credentials: 'same-origin'
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Error iniciando sesión');
  }
  return await res.json();
}

async function postWithAuth(url, body) {
  // Asegurar sesión en el servidor (crea cookie) y luego enviar POST con credentials
  await ensureSession();
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Error en servidor');
  }
  return await res.json();
}

document.addEventListener('DOMContentLoaded', () => {
  const bookForm = document.getElementById('book-form');
  const bookMsg = document.getElementById('book-msg');
  if (bookForm) {
    bookForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      bookMsg.textContent = '';
      const titulo = document.getElementById('book-titulo').value.trim();
      const autor = document.getElementById('book-autor').value.trim();
      const pdf = document.getElementById('book-pdf').value.trim();
      try {
        await postWithAuth('/api/books', { titulo, autor, pdf });
        bookMsg.textContent = 'Libro agregado correctamente.';
        bookForm.reset();
      } catch (err) {
        bookMsg.textContent = 'Error: ' + err.message;
      }
    });
  }

  const videoForm = document.getElementById('admin-video-form');
  const videoMsg = document.getElementById('video-msg');
  if (videoForm) {
    videoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      videoMsg.textContent = '';
      const title = document.getElementById('admin-video-title').value.trim();
      const url = document.getElementById('admin-video-url').value.trim();
      try {
        await postWithAuth('/api/videos', { title, url });
        videoMsg.textContent = 'Video agregado correctamente.';
        videoForm.reset();
      } catch (err) {
        videoMsg.textContent = 'Error: ' + err.message;
      }
    });
  }
});