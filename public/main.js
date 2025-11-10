const API = 'http://localhost:3000';
const msg = document.getElementById('msg');

const out = (text, isError = false) => {
  msg.textContent = text;
  msg.className = `msg show ${isError ? 'error' : 'success'}`;
  msg.style.display = 'block';
};


// REGISTRO
document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());

  try {
    const r = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await r.json();

    if (!r.ok) {
      // Mostrar el error que vino del backend
      out(data.error || 'Error creando usuario', true);
      return;
    }

    out('Usuario creado correctamente');
    e.target.reset(); // limpia el formulario
  } catch (err) {
    out('No se pudo contactar la API', true);
  }
});


// LOGIN
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());

  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await r.json();

  if (!r.ok) {
    out(data.error || 'Credenciales inválidas', true);
    return;
  }

  // Guardar token y redirigir
  localStorage.setItem('token', data.token);
  window.location.href = '/dashboard.html';
});

