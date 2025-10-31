// books.js — carga y renderiza libros para books.html
async function cargarLibrosPage() {
  try {
    const res = await fetch('/api/books');
    const libros = await res.json();
    window.__libros = libros;
    window.__librosFiltrados = [...libros];
    renderAisles(libros);
    initSearch(libros);
    initAislesNav();
  } catch (err) {
    console.error('Error al cargar libros', err);
  }
}

function renderAisles(libros) {
  const aislesEl = document.getElementById('aisles');
  aislesEl.innerHTML = '';
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
          <button class="leer-btn" data-idx="${idx}">Leer PDF</button>
        </div>
      `;
      card.querySelector('.leer-btn').addEventListener('click', (e) => { e.stopPropagation(); verPDF(idx); });
      card.addEventListener('click', () => verPDF(idx));
      shelfEl.appendChild(card);
    });
    aislesEl.appendChild(shelfEl);
  }
}

function initAislesNav() {
  const left = document.querySelector('.aisle-nav.left');
  const right = document.querySelector('.aisle-nav.right');
  const aisles = document.getElementById('aisles');
  if (!aisles) return;
  left.addEventListener('click', () => { aisles.scrollBy({ left: -520, behavior: 'smooth' }); });
  right.addEventListener('click', () => { aisles.scrollBy({ left: 520, behavior: 'smooth' }); });
}

function initSearch(libros) {
  const input = document.getElementById('busqueda-input');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      renderAisles(libros);
    } else {
      const filtered = libros.filter(l => l.titulo.toLowerCase().includes(q) || l.autor.toLowerCase().includes(q));
      renderAisles(filtered);
    }
  });
}

function verPDF(idx) {
  const libro = window.__libros && window.__libros[idx];
  if (!libro) return alert('Libro no encontrado');
  document.getElementById('visor').style.display = 'block';
  document.getElementById('visor-titulo').textContent = libro.titulo;
  document.getElementById('visor-pdf').src = libro.pdf;
  // ocultar pasillos
  document.querySelector('.libreria-sala .estante-madera').style.display = 'none';
  document.querySelector('.aisles-container').style.display = 'none';
}

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'volver') {
    document.getElementById('visor').style.display = 'none';
    document.getElementById('visor-pdf').src = '';
    document.querySelector('.libreria-sala .estante-madera').style.display = '';
    document.querySelector('.aisles-container').style.display = '';
  }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  cargarLibrosPage();
});