import express from "express";
import session from "express-session";
import { Pool } from "pg";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// banco PostgreSQL
const pool = new Pool({
    user:"postgres",
    host:"localhost",
    database:"pizzaria",
    password:"amods",
    port:7777
});

// configurações 
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'pizzaria2025',
    resave: false,
    saveUninitialized: true
}));
app.set('views', path.join(__dirname, 'views'));

function proteger (req, res, next) {
    if (!req.session.usuario ) 
        return res.redirect('/');
    next();
}

//login
app.get('/', (req, res) => res.render("login", { error: null }));

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND senha = $2', [email, senha]);
    if (result.rows.length > 0) {
        req.session.usuario = result.rows[0];
        res.redirect('/dashboard');
    } else {
        res.render('login', { error: 'Email ou senha inválidos!' });
    }
});

// logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// dashboard
app.get('/dashboard', proteger, async (req, res) => {
    const busca = req.query.busca || '';
    const query = busca ?
        'SELECT * FROM pizzas WHERE nome ILIKE $1 ORDER BY id' :
        'SELECT * FROM pizzas ORDER BY nome';
    const pizzas = await pool.query(query, busca ? [`%${busca}%`] : []);
    const vendas = await pool.query(`
        SELECT v.id, u.nome AS usuario, p.nome AS pizza, v.quantidade,
        TO_CHAR(v.data_venda, 'DD/MM/YYYY HH24:MI') AS data 
        FROM vendas v
        JOIN usuarios u ON v.usuario_id = u.id 
        JOIN pizzas p ON v.pizza_id = p.id 
        ORDER BY v.data_venda DESC LIMIT 5
    `);
    res.render('dashboard', { usuario: req.session.usuario, pizzas: pizzas.rows, vendas: vendas.rows, busca });
});

// cadastro de pizzas
app.post('/pizzas', proteger, async (req, res) => {
    const { nome, preco, estoque } = req.body;
   if (!nome || !preco) return res.send (" prencha os campos obrigatórios ");
   await pool.query('INSERT INTO pizzas (nome, preco, estoque) VALUES ($1, $2, $3)', [nome, preco, estoque]);
   res.redirect('/dashboard');
});

// atualizar pizza
app.post("/pizzas/update/:id", proteger, async (req, res) => {
    const { id } = req.params;
    const { nome, preco, estoque } = req.body;
    await pool.query('UPDATE pizzas SET nome=$1, preco=$2, estoque=$3 WHERE id=$4', [nome, preco, estoque, id]);
    res.redirect('/dashboard');
});

// deletar pizza
app.post("/pizzas/delete/:id", proteger, async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM pizzas WHERE id=$1', [id]);
    res.redirect('/dashboard');
});     

//registrar venda
app.post('/vendas', proteger, async (req, res) => {
    const { pizza_id, quantidade } = req.body;
    const usuario_id = req.session.usuario.id;
    await pool.query('INSERT INTO vendas (usuario_id, pizza_id, quantidade, data_venda) VALUES ($1, $2, $3, NOW())', [usuario_id, pizza_id, quantidade]);
    await pool.query('UPDATE pizzas SET estoque = estoque - $1 WHERE id = $2', [quantidade, pizza_id]);
    res.redirect('/dashboard');
});

//servidor
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});