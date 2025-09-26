// api/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const router = express.Router();

// ---------- Helpers ----------
function ensureJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no configurado');
  }
}

// ---------- REGISTRO ----------
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    const hash = await bcrypt.hash(password, 12);
    const q = `
      INSERT INTO app_user (email, password_hash, full_name)
      VALUES ($1, $2, $3)
      RETURNING id, email, full_name, created_at
    `;
    const { rows } = await pool.query(q, [email, hash, fullName || null]);
    return res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Este correo ya está registrado' });
    }
    console.error('Error /register:', e);
    return res.status(500).json({ error: 'Error registrando usuario' });
  }
});

// ---------- LOGIN ----------
router.post('/login', async (req, res) => {
  try {
    ensureJwtSecret();
    const { email, password } = req.body;

    const { rows } = await pool.query(
      'SELECT id, email, full_name, password_hash, is_active FROM app_user WHERE email=$1',
      [email]
    );
    const u = rows[0];
    if (!u || u.is_active === false) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { sub: u.id, email: u.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      token,
      user: { id: u.id, email: u.email, fullName: u.full_name }
    });
  } catch (e) {
    console.error('Error /login:', e);
    return res.status(500).json({ error: 'Error en login' });
  }
});

// ---------- Middleware auth ----------
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const token = h.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'No autorizado' });
  }
}

// ---------- PERFIL ----------
router.get('/me', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, email, full_name, created_at FROM app_user WHERE id=$1',
    [req.user.sub]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  return res.json(rows[0]);
});

// ---------- CAMBIAR CONTRASEÑA ----------
router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPass, newPass } = req.body;
    if (!oldPass || !newPass || newPass.length < 6) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const { rows } = await pool.query(
      'SELECT id, password_hash FROM app_user WHERE id=$1',
      [req.user.sub]
    );
    const u = rows[0];
    if (!u) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const ok = await bcrypt.compare(oldPass, u.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const newHash = await bcrypt.hash(newPass, 12);
    await pool.query(
      'UPDATE app_user SET password_hash=$1 WHERE id=$2',
      [newHash, req.user.sub]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error('Error /change-password:', e);
    return res.status(500).json({ error: 'No se pudo cambiar la contraseña' });
  }
});

module.exports = router;
