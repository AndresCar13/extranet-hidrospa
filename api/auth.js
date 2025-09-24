const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const router = express.Router();

// REGISTRO
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });

    const hash = await bcrypt.hash(password, 12);
    const q = `
      INSERT INTO app_user (email, password_hash, full_name)
      VALUES ($1, $2, $3)
      RETURNING id, email, full_name, created_at
    `;
    const { rows } = await pool.query(q, [email, hash, fullName || null]);

    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      // Este código significa violación de UNIQUE en PostgreSQL
      return res.status(409).json({ error: 'Este correo ya está registrado' });
    }
    console.error(e);
    res.status(500).json({ error: 'Error registrando usuario' });
  }
});


// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query(
      'SELECT id, email, full_name, password_hash, is_active FROM app_user WHERE email=$1',
      [email]
    );
    const u = rows[0];
    if (!u || !u.is_active) return res.status(401).json({ error: 'Credenciales inválidas' });
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ sub: u.id, email: u.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, user: { id: u.id, email: u.email, fullName: u.full_name } });
  } catch {
    res.status(500).json({ error: 'Error en login' });
  }
});

// middleware
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'No autorizado' });
  }
}

// PERFIL
router.get('/me', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, email, full_name, created_at FROM app_user WHERE id=$1',
    [req.user.sub]
  );
  res.json(rows[0]);
});

module.exports = router;
