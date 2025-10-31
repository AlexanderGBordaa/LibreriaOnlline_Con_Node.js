// Helper mínimo de Google Sign-In (cliente)
// IMPORTANTE: Reemplaza CLIENT_ID con tu OAuth 2.0 Client ID desde Google Cloud Console
const CLIENT_ID = '947464831495-7m6276ntaetl2nstspoimql15mr7iu3m.apps.googleusercontent.com';

function decodeJwt (token) {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch (e) {
    return null;
  }
}

function handleCredentialResponse(response) {
  // Procesa la respuesta JWT enviada por Google y guarda el perfil en sessionStorage
  const payload = decodeJwt(response.credential);
  if (!payload) return;
  const user = { id: payload.sub, name: payload.name, email: payload.email, picture: payload.picture };
  sessionStorage.setItem('g_user', JSON.stringify(user));
  // Guardar también el id_token (JWT) para enviarlo al servidor en llamadas protegidas
  sessionStorage.setItem('g_id_token', response.credential);
  // Mostrar estado de sesión en el área de botón si existe
  const gsiButton = document.getElementById('gsi-button');
  if (gsiButton) {
    gsiButton.innerHTML = `<div class="signed">Sesión: ${user.name} (<a id='signout-link' href='#'>Cerrar sesión</a>)</div>`;
    const link = document.getElementById('signout-link');
    link.addEventListener('click', (e) => { e.preventDefault(); signOut(); });
  }
  // Si estamos en la página de login, redirigir al home automáticamente
  if (location.pathname.endsWith('/login.html') || location.pathname.endsWith('login.html')) {
    location.href = 'index.html';
  }
}

function signOut() {
  // Cierra la sesión en el cliente (eliminar datos locales)
  sessionStorage.removeItem('g_user');
  sessionStorage.removeItem('g_id_token');
  // Intentar limpiar UI de Google si está disponible (no hay signOut directo)
  if (window.google && google.accounts && google.accounts.id) {
    // no hay método signOut en la librería de GSI; solo eliminamos credencial local
  }
  // Recargar para actualizar la interfaz
  location.reload();
}

// Inicializar en el cliente: renderizar el botón de Google y comprobar protección de páginas
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Si CLIENT_ID no está configurado, mostrar un aviso en el área del botón
    const gsiButton = document.getElementById('gsi-button');
    if (!CLIENT_ID || CLIENT_ID.includes('REPLACE')) {
      if (gsiButton) gsiButton.innerHTML = `<div style="color:#fff;">Configurar CLIENT_ID en <code>auth.js</code></div>`;
    } else {
      // Intentar inicializar Google Identity; el script de Google puede cargarse de forma asíncrona,
      // por eso probamos varias veces hasta que `google.accounts.id` esté disponible.
      const tryInit = () => {
        if (window.google && google.accounts && google.accounts.id) {
          try {
            google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredentialResponse });
            if (gsiButton) google.accounts.id.renderButton(gsiButton, { theme: 'outline', size: 'large' });
            google.accounts.id.prompt();
            return true;
          } catch (e) {
            console.error('Error inicializando Google Sign-In:', e);
            return false;
          }
        }
        return false;
      };

      if (!tryInit()) {
        if (gsiButton) gsiButton.innerHTML = `<div style="color:#fff;">Cargando Google Sign-In...</div>`;
        let attempts = 0;
        const iv = setInterval(() => {
          attempts++;
          if (tryInit() || attempts > 30) {
            clearInterval(iv);
            if (attempts > 30 && gsiButton) gsiButton.innerHTML = `<div style="color:#fff;">No se pudo cargar Google Sign-In</div>`;
          }
        }, 200);
      }
    }

    // En páginas protegidas, forzar inicio de sesión
    const protect = document.body.dataset.protected;
    if (protect === 'true') {
      const user = sessionStorage.getItem('g_user');
      if (!user) {
        // Si no hay sesión, redirigir a la página de inicio (login)
        location.href = 'index.html';
      }
    }
  });
}
