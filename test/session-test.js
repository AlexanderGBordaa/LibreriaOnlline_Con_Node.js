// Pequeño script de prueba E2E (Node) para crear sesión dev, agregar libro y listar libros
// Ejecutar: node test/session-test.js

const fetch = global.fetch;
const base = 'http://127.0.0.1:3000';

async function main() {
  try {
    console.log('-> POST /__dev/login');
    const loginRes = await fetch(base + '/__dev/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sub: 'dev-node', email: 'dev-node@local', name: 'Dev Node' })
    });
    console.log('login status', loginRes.status);
    const setCookie = loginRes.headers.get('set-cookie') || loginRes.headers.get('Set-Cookie');
    if (!setCookie) {
      console.error('No se recibió cookie de sesión en la respuesta. Headers:');
      for (const [k,v] of loginRes.headers) console.log(k, v);
      process.exit(1);
    }
    const cookie = setCookie.split(';')[0];
    console.log('cookie:', cookie);

    console.log('\n-> POST /api/books (usando cookie)');
    const book = { titulo: 'Libro Test Node', autor: 'Node Tester', pdf: 'https://example.com/node-test.pdf' };
    const addRes = await fetch(base + '/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify(book)
    });
    console.log('add status', addRes.status);
    const addJson = await addRes.text();
    console.log('add response:', addJson);

    console.log('\n-> GET /api/books (usando cookie)');
    const getRes = await fetch(base + '/api/books', { headers: { 'Cookie': cookie } });
    console.log('get status', getRes.status);
    const books = await getRes.json();
    console.log('books count:', Array.isArray(books) ? books.length : (books.Count || 'unknown'));
    console.log(JSON.stringify(books, null, 2));
  } catch (err) {
    console.error('Error en test:', err);
    process.exit(1);
  }
}

main();
