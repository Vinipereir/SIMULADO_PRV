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
    database:"cantina",
    password:"amods",
    port:7777
});

// configurações 
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'cantina2025',
    resave: false,
    saveUninitialized: true
}));
app.set('views', path.join(__dirname, 'views'));
// configurar o motor de views (EJS)
app.set('view engine', 'ejs');

function proteger (req, res, next) {
    if (!req.session.usuario ) 
        return res.redirect('/');
    next();
}

function protegerAdmin (req, res, next) {
    if (!req.session.usuario || req.session.usuario.tipo !== 'admin') 
        return res.status(403).send('Acesso negado: apenas administradores');
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
        'SELECT * FROM foods WHERE name ILIKE $1 ORDER BY id' :
        'SELECT * FROM foods ORDER BY name';
    const foods = await pool.query(query, busca ? [`%${busca}%`] : []);
    const pedidos = await pool.query(`
        SELECT p.id, u.nome AS usuario, f.name AS comida, ip.quantidade,
        TO_CHAR(p.data_pedido, 'DD/MM/YYYY HH24:MI') AS data 
        FROM pedidos p
        JOIN usuarios u ON p.usuario_id = u.id 
        JOIN itens_pedido ip ON ip.pedido_id = p.id
        JOIN foods f ON ip.food_id = f.id 
        ORDER BY p.data_pedido DESC LIMIT 5
    `);
    res.render('dashboard', { usuario: req.session.usuario, foods: foods.rows, pedidos: pedidos.rows, busca });
});

// página de cadastro de produto
app.get('/cadastro-produto', protegerAdmin, async (req, res) => {
    const foods = await pool.query('SELECT * FROM foods ORDER BY id');
    res.render('cadastro-produto', { foods: foods.rows, error: null, success: null });
});

// cadastro via página específica
app.post('/cadastro-produto', protegerAdmin, async (req, res) => {
    const { name, descricao, preco, estoque } = req.body;
    if (!name || !preco) {
        const foods = await pool.query('SELECT * FROM foods ORDER BY id');
        return res.render('cadastro-produto', { foods: foods.rows, error: 'Preencha os campos obrigatórios!', success: null });
    }
    await pool.query('INSERT INTO foods (name, descricao, preco, estoque) VALUES ($1, $2, $3, $4)', [name, descricao, preco, estoque || 0]);
    const foods = await pool.query('SELECT * FROM foods ORDER BY id');
    res.render('cadastro-produto', { foods: foods.rows, error: null, success: 'Produto cadastrado com sucesso!' });
});

// página de gestão de estoque
app.get('/gestao-estoque', protegerAdmin, async (req, res) => {
    const foods = await pool.query('SELECT * FROM foods ORDER BY id');
    const pedidos = await pool.query(`
        SELECT p.id, u.nome AS usuario, f.name AS comida, ip.quantidade,
        TO_CHAR(p.data_pedido, 'DD/MM/YYYY HH24:MI') AS data 
        FROM pedidos p
        JOIN usuarios u ON p.usuario_id = u.id 
        JOIN itens_pedido ip ON ip.pedido_id = p.id
        JOIN foods f ON ip.food_id = f.id 
        ORDER BY p.data_pedido DESC
    `);
    res.render('gestao-estoque', { foods: foods.rows, pedidos: pedidos.rows, error: null, success: null });
});

// cadastro de foods (apenas admin)
app.post('/foods', protegerAdmin, async (req, res) => {
    const { name, descricao, preco, estoque } = req.body;
   if (!name || !preco) return res.send (" prencha os campos obrigatórios ");
   await pool.query('INSERT INTO foods (name, descricao, preco, estoque) VALUES ($1, $2, $3, $4)', [name, descricao, preco, estoque || 0]);
   res.redirect('/dashboard');
});

// atualizar food (apenas admin)
app.post("/foods/update/:id", protegerAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, descricao, preco, estoque } = req.body;
    await pool.query('UPDATE foods SET name=$1, descricao=$2, preco=$3, estoque=$4 WHERE id=$5', [name, descricao, preco, estoque, id]);
    const referer = req.get('Referer') || '/dashboard';
    res.redirect(referer.includes('gestao-estoque') ? '/gestao-estoque' : '/dashboard');
});

// deletar food (apenas admin)
app.post("/foods/delete/:id", protegerAdmin, async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM foods WHERE id=$1', [id]);
    const referer = req.get('Referer') || '/dashboard';
    res.redirect(referer.includes('cadastro-produto') ? '/cadastro-produto' : '/dashboard');
});     

//registrar pedido (users podem pedir)
app.post('/pedidos', proteger, async (req, res) => {
    const { food_id, quantidade } = req.body;
    const usuario_id = req.session.usuario.id;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Busca preço da comida
        const food = await client.query('SELECT preco, estoque FROM foods WHERE id=$1', [food_id]);
        if (food.rows.length === 0) throw new Error('Comida não encontrada');
        
        const preco = food.rows[0].preco;
        const estoqueAtual = food.rows[0].estoque;
        
        if (estoqueAtual < quantidade) {
            await client.query('ROLLBACK');
            return res.send('Estoque insuficiente!');
        }
        
        const subtotal = preco * quantidade;
        
        // Cria pedido
        const pedido = await client.query('INSERT INTO pedidos (usuario_id, status, total) VALUES ($1, $2, $3) RETURNING id', [usuario_id, 'pendente', subtotal]);
        const pedido_id = pedido.rows[0].id;
        
        // Adiciona item ao pedido
        await client.query('INSERT INTO itens_pedido (pedido_id, food_id, quantidade, preco_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)', [pedido_id, food_id, quantidade, preco, subtotal]);
        
        // Atualiza estoque
        await client.query('UPDATE foods SET estoque = estoque - $1 WHERE id = $2', [quantidade, food_id]);
        
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
    
    res.redirect('/dashboard');
});

//servidor
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});