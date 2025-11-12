// ================== CONFIGURACIÓN BASE ==================
const LOCAL_IP = '192.168.0.201'; // ⚙️ IP del servidor Ubuntu
const PORT = 3000;

// Detecta si está corriendo en localhost o en red
const API =
    window.location.hostname === 'localhost'
        ? `http://localhost:${PORT}`
        : `http://${LOCAL_IP}:${PORT}`;

const msg = document.getElementById('msg');

// ================== UTILIDAD PARA MENSAJES ==================
const out = (text, isError = false) => {
    msg.textContent = text;
    msg.className = `msg show ${isError ? 'error' : 'success'}`;
    msg.style.display = 'block';
};

// ================== REGISTRO ==================
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
            out(data.error || 'Error creando usuario', true);
            return;
        }

        out('✅ Usuario creado correctamente');
        e.target.reset();
    } catch (err) {
        console.error(err);
        out('❌ No se pudo contactar la API', true);
    }
});

// ================== LOGIN ==================
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());

    try {
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

        // Guardar token y redirigir al dashboard
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard.html';
    } catch (err) {
        console.error(err);
        out('❌ No se pudo contactar la API', true);
    }
});
