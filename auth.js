// Helper de autenticación con Google Identity Services (GSI)
// Client ID de OAuth 2.0 configurado en Google Cloud Console
const CLIENT_ID = '947464831495-7m6276ntaetl2nstspoimql15mr7iu3m.apps.googleusercontent.com';

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch (e) {
    console.error('Error al decodificar JWT:', e);
    return null;
  }
}

function getUserSession() {
  try {
    const raw = sessionStorage.getItem('g_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function handleCredentialResponse(response) {
  console.log('Google Sign-In: Respuesta de credencial recibida');
  try {
    const payload = decodeJwt(response.credential);
    if (!payload) {
      console.error('Error: No se pudo decodificar el token de Google');
      return;
    }

    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture
    };

    // Guardar en sessionStorage para acceso rápido en cliente
    sessionStorage.setItem('g_user', JSON.stringify(user));
    sessionStorage.setItem('g_id_token', response.credential);

    // Sincronizar con el servidor Node para establecer cookie de sesión express-session
    try {
      await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential }),
        credentials: 'same-origin'
      });
    } catch (err) {
      console.warn('Advertencia al sincronizar sesión con backend:', err);
    }

    renderAuthState();

    // Redirigir si está en login.html
    const pathname = window.location.pathname;
    if (pathname.endsWith('/login.html') || pathname.endsWith('login.html')) {
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('Error en handleCredentialResponse:', error);
  }
}

async function signOut() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
  } catch (e) {
    // ignorar error de red al salir
  }

  sessionStorage.removeItem('g_user');
  sessionStorage.removeItem('g_id_token');

  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }

  // Si está en una página protegida, volver a index.html
  if (document.body.dataset.protected === 'true') {
    window.location.href = 'index.html';
  } else {
    window.location.reload();
  }
}

function renderAuthState() {
  const user = getUserSession();
  const gsiButton = document.getElementById('gsi-button');
  const authSlots = document.querySelectorAll('.auth-nav-slot, #auth-status');

  if (user) {
    // Si hay usuario logueado, actualizar el botón principal si existe
    if (gsiButton) {
      gsiButton.innerHTML = `
        <div class="user-badge" style="background: rgba(255,255,255,0.25); color: #fff; padding: 8px 16px; border-radius: 24px; display: inline-flex; align-items: center; gap: 10px;">
          ${user.picture ? `<img src="${user.picture}" alt="${user.name}" class="user-avatar" style="width:32px; height:32px; border-radius:50%;">` : ''}
          <span>Conectado como <strong>${user.name || user.email}</strong></span>
          <button id="signout-btn" class="btn-logout" type="button">Cerrar sesión</button>
        </div>
      `;
      const btn = document.getElementById('signout-btn');
      if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); signOut(); });
    }

    // Actualizar barras de navegación o slots en páginas protegidas
    authSlots.forEach(slot => {
      slot.innerHTML = `
        <div class="user-badge">
          ${user.picture ? `<img src="${user.picture}" alt="${user.name}" class="user-avatar">` : ''}
          <span>${user.name || user.email}</span>
          <button class="btn-logout" type="button" onclick="signOut()">Salir</button>
        </div>
      `;
    });
  } else {
    // Si no hay usuario en página protegida, redirigir
    if (document.body.dataset.protected === 'true') {
      alert('Debes iniciar sesión con tu cuenta de Google para acceder a este contenido.');
      window.location.href = 'index.html';
    }
  }
}

// Inicializar en el cliente
function initAuth() {
  // Si el usuario abrió el archivo con doble clic (protocolo file://)
  if (window.location.protocol === 'file:') {
    const fileWarning = document.createElement('div');
    fileWarning.style.cssText = 'background: #fff3cd; color: #856404; padding: 16px; margin: 16px auto; max-width: 800px; border-radius: 8px; border: 2px solid #ffeeba; text-align: center; font-family: sans-serif; font-size: 0.95em; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 9999; position: relative;';
    fileWarning.innerHTML = `
      <strong>⚠️ Atención: Estás abriendo este archivo directamente desde tu disco (file://)</strong><br>
      Google Sign-In bloquea el inicio de sesión desde archivos locales. Para que funcione correctamente:<br>
      1. Abre tu terminal en esta carpeta y ejecuta: <code>npm run dev</code> o <code>npm start</code><br>
      2. Abre tu navegador en: <a href="http://localhost:3000" style="color:#0056b3; font-weight:bold;">http://localhost:3000</a>
    `;
    document.body.prepend(fileWarning);
  }

  renderAuthState();

  const user = getUserSession();
  const gsiButton = document.getElementById('gsi-button');

  // Solo inicializamos el botón de Google si no hay usuario ya conectado
  if (!user && gsiButton) {
    if (!CLIENT_ID || CLIENT_ID.includes('REPLACE')) {
      gsiButton.innerHTML = `<div style="color:#fff;">Configurar CLIENT_ID en <code>auth.js</code></div>`;
      return;
    }

    const tryInit = () => {
      if (window.google && google.accounts && google.accounts.id) {
        try {
          google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          google.accounts.id.renderButton(gsiButton, {
            theme: 'filled_blue',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });

          google.accounts.id.prompt();
          return true;
        } catch (e) {
          console.error('Error al inicializar Google Sign-In:', e);
          return false;
        }
      }
      return false;
    };

    if (!tryInit()) {
      gsiButton.innerHTML = `<div style="color:#fff;">Cargando Google Sign-In...</div>`;
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (tryInit() || attempts > 30) {
          clearInterval(interval);
          if (attempts > 30 && !getUserSession()) {
            gsiButton.innerHTML = `<div style="color:#fff;">No se pudo cargar el botón de Google Sign-In. Comprueba tu conexión o abre en http://localhost:3000</div>`;
          }
        }
      }, 200);
    }
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
}

