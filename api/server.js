// api/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

require('dotenv').config();
require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// 👉 importante: ruta absoluta a /public (sube un nivel desde /api)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// (opcional) ruta raíz explícita
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use('/auth', require('./auth'));

app.get('/ping', (_req, res) => {
  res.json({ message: 'Servidor activo', time: new Date().toISOString() });
});

app.listen(process.env.PORT, () =>
  console.log(`API en http://localhost:${process.env.PORT}`)
);

// Obtener toda la tabla cronograma_logistico
app.get('/api/cronograma', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM cronograma_logistico ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error consultando cronograma:', error);
        res.status(500).json({ error: 'Error consultando el cronograma' });
    }
});