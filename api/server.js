// api/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { router: authRouter, auth } = require('./auth');



require('dotenv').config();
require('./db');

const app = express();

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://192.168.0.201:3000',
        'http://intranethidrospa.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/auth', authRouter);

// 👉 importante: ruta absoluta a /public (sube un nivel desde /api)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// (opcional) ruta raíz explícita
app.get('/', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/ping', (_req, res) => {
    res.json({message: 'Servidor activo', time: new Date().toISOString()});
});

app.listen(process.env.PORT, '0.0.0.0', () =>
    console.log(`🌐 API disponible en http://0.0.0.0:${process.env.PORT}`)
);

// Obtener toda la tabla cronograma_logistico
app.get('/api/cronograma', async (req, res) => {
    const {id} = req.query;
    try {
        if (id) {
            const result = await db.query('SELECT * FROM cronograma_logistico WHERE id=$1', [id]);
            return res.json(result.rows[0]);
        }

        const result = await db.query('SELECT * FROM cronograma_logistico ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error consultando cronograma:', error);
        res.status(500).json({error: 'Error consultando el cronograma'});
    }
});

app.put("/api/cronograma/:id", auth, async (req, res) => {
    const id = req.params.id;
    const body = req.body;

    try {
        const sql = `
            UPDATE cronograma_logistico SET
                comercial = $1,
                rem_req = $2,
                cliente = $3,
                producto = $4,
                adicionales = $5,
                fecha_cargue = $6,
                fecha_entrega = $7,
                confirmacion = $8,
                reprogramado = $9,
                pago_100 = $10,
                fecha_limite_asesoria = $11,
                fecha_programacion_asesoria = $12,
                transportador = $13,
                direccion_envio = $14,
                costo_flete = $15,
                observaciones = $16,
                comentarios = $17,
                entregas_a_tiempo = $18,
                fecha_entrega_original = COALESCE(fecha_entrega_original, $19)
            WHERE id = $20
        `;

        await db.query(sql, [
            body.comercial,
            body.rem_req,
            body.cliente,
            body.producto,
            body.adicionales,
            body.fecha_cargue,
            body.fecha_entrega,
            body.confirmacion,
            body.reprogramado,
            body.pago_100,
            body.fecha_limite_asesoria,
            body.fecha_programacion_asesoria,
            body.transportador,
            body.direccion_envio,
            body.costo_flete,
            body.observaciones,
            body.comentarios,
            body.entregas_a_tiempo,
            body.fecha_entrega, // se guarda solo si nunca se había guardado antes
            id
        ]);

        res.json({ success: true });

    } catch (error) {
        console.error("Error actualizando despacho:", error);
        res.status(500).json({ error: "Error actualizando el despacho" });
    }
});
