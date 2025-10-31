// videos.js — carga y renderiza videos (solo visualización)
async function cargarVideosPage() {
  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();
    renderVideos(videos);
    initVideoPlayer();
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
  // Extrae el ID de YouTube desde una URL completa o devuelve el ID si se pasó solo
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

function initVideoPlayer() {
  const close = document.getElementById('close-video');
  if (close) close.addEventListener('click', () => {
    document.getElementById('video-player').style.display = 'none';
    document.getElementById('video-frame').innerHTML = '';
  });
}

// Inicialización
window.addEventListener('DOMContentLoaded', () => cargarVideosPage());