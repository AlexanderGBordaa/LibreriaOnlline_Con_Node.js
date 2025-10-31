let libros = [];
let librosFiltrados = [];

async function cargarLibros() {
  try {
    const res = await fetch('/api/books');
    libros = await res.json();
    librosFiltrados = [...libros];
    renderLibros();
  } catch (err) {
    console.error('Error cargando libros', err);
  }
}

function renderLibros() {
  const cont = document.getElementById("libros-list");
  cont.innerHTML = "";
  librosFiltrados.forEach((libro, idx) => {
    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <div class="book-info">
        <h3 class="book-title">${libro.titulo}</h3>
        <p class="book-author"><strong>Autor:</strong> ${libro.autor}</p>
        <button onclick="verPDF(${idx})">Leer PDF</button>
      </div>
    `;
    card.onclick = function(e) {
      if (e.target.tagName === 'BUTTON') return;
      verPDF(idx);
    };
    cont.appendChild(card);
  });
}

// --- Renderizado de pasillos (agrupa libros en estantes)
function renderAisles() {
  const aislesEl = document.getElementById('aisles');
  if (!aislesEl) return;
  aislesEl.innerHTML = '';
  // Agrupar libros en grupos de 6 por estante
  const perShelf = 6;
  for (let i = 0; i < libros.length; i += perShelf) {
    const shelf = libros.slice(i, i + perShelf);
    const shelfEl = document.createElement('div');
    shelfEl.className = 'shelf';
    shelf.forEach((libro, j) => {
      const idx = i + j;
      const card = document.createElement('div');
      card.className = 'book-card aisle-card';
      card.innerHTML = `
        <div class="book-info">
          <h3 class="book-title">${libro.titulo}</h3>
          <p class="book-author"><strong>Autor:</strong> ${libro.autor}</p>
          <button onclick="verPDF(${idx})">Leer PDF</button>
        </div>
      `;
      card.onclick = function(e) { if (e.target.tagName === 'BUTTON') return; verPDF(idx); };
      shelfEl.appendChild(card);
    });
    aislesEl.appendChild(shelfEl);
  }
}

// Navegación entre pasillos
function initAislesNav() {
  const left = document.querySelector('.aisle-nav.left');
  const right = document.querySelector('.aisle-nav.right');
  const aisles = document.getElementById('aisles');
  if (!aisles) return;
  left.addEventListener('click', () => { aisles.scrollBy({ left: -520, behavior: 'smooth' }); });
  right.addEventListener('click', () => { aisles.scrollBy({ left: 520, behavior: 'smooth' }); });
}

// Búsqueda
document.addEventListener("DOMContentLoaded", function() {
  const input = document.getElementById("busqueda-input");
  if (input) {
    input.addEventListener("input", function() {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        librosFiltrados = [...libros];
      } else {
        librosFiltrados = libros.filter(l =>
          l.titulo.toLowerCase().includes(q) ||
          l.autor.toLowerCase().includes(q)
        );
      }
      renderLibros();
    });
  }
});

window.verPDF = function(idx) {
  const libro = libros[idx];
  document.getElementById("libros").style.display = "none";
  document.getElementById("visor").style.display = "block";
  document.getElementById("visor-titulo").textContent = libro.titulo;
  document.getElementById("visor-pdf").src = libro.pdf;
};

document.getElementById("volver").onclick = function() {
  document.getElementById("visor").style.display = "none";
  document.getElementById("libros").style.display = "block";
  document.getElementById("visor-pdf").src = "";
};

document.addEventListener("DOMContentLoaded", function() {
  cargarLibros();
  initAislesNav();
  cargarVideos();
  initVideoForm();
});

// --- Cliente de videos
async function cargarVideos() {
  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();
    renderVideos(videos);
  } catch (err) {
    console.error('Error cargando videos', err);
  }
}

function renderVideos(videos) {
  const list = document.getElementById('videos-list');
  list.innerHTML = '';
  videos.forEach(v => {
    const el = document.createElement('div');
    el.className = 'video-card';
    el.innerHTML = `<h4>${v.title}</h4><button data-url="${v.url}">Ver</button>`;
    el.querySelector('button').addEventListener('click', () => playVideo(v.url));
    list.appendChild(el);
  });
}

function extractYouTubeId(input) {
  // Acepta URL completa o sólo el ID
  if (!input) return '';
  const url = input.trim();
  const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  if (m) return m[1];
  if (url.length === 11) return url;
  return '';
}

function playVideo(url) {
  const id = extractYouTubeId(url);
  const frame = document.getElementById('video-frame');
  if (!id) return alert('Formato de YouTube no válido');
  frame.innerHTML = `<iframe width="800" height="450" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
  document.getElementById('video-player').style.display = 'block';
}

function initVideoForm() {
  const form = document.getElementById('video-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('video-title').value.trim();
    const url = document.getElementById('video-url').value.trim();
    if (!title || !url) return alert('Título y URL son requeridos');
    try {
      const res = await fetch('/api/videos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, url }) });
      if (!res.ok) throw new Error('No se pudo guardar');
      document.getElementById('video-title').value = '';
      document.getElementById('video-url').value = '';
      cargarVideos();
    } catch (err) {
      console.error(err);
      alert('Error guardando video');
    }
  });
  document.getElementById('close-video').addEventListener('click', () => {
    document.getElementById('video-player').style.display = 'none';
    document.getElementById('video-frame').innerHTML = '';
  });
}
