const express = require('express');
const { Pool } = require('pg');
const client = require('prom-client');
const app = express();
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
});
client.collectDefaultMetrics();
const dur = new client.Histogram({
    name: 'http_request_duration_seconds', help: 'request duration',
    labelNames: ['route','code'], buckets: [0.01,0.05,0.1,0.3,1,3],
});

async function init() {
    await pool.query('CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, item TEXT, qty INT)');
}
app.get('/healthz', (req,res) => res.send('ok v2'));
app.get('/metrics', async (req,res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});
app.get('/orders', async (req,res) => {
    const end = dur.startTimer({ route:'/orders' });
    const { rows } = await pool.query('SELECT id,item,qty FROM orders ORDER BY id DESC LIMIT 50');
    end({ code:200 }); res.json(rows);
});
app.post('/orders', async (req,res) => {
    const end = dur.startTimer({ route:'POST /orders' });
    const { item='widget', qty=1 } = req.body || {};
    const { rows } = await pool.query('INSERT INTO orders(item,qty) VALUES($1,$2) RETURNING id',[item,qty]);
    end({ code:201 }); res.status(201).json({ id: rows[0].id });
});
init().then(() => app.listen(8080, () => console.log('orders api on :8080')));