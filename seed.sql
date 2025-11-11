CREATE DATABASE pizzaria;
\c pizzaria;

-- Criação das tabelas
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(50) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'comum'
);

CREATE TABLE pizzas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    preco DECIMAL(10,2) NOT NULL,
    estoque INTEGER DEFAULT 0
);

CREATE TABLE vendas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    pizza_id INTEGER REFERENCES pizzas(id),
    quantidade INTEGER NOT NULL,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios (nome, email, senha, tipo) VALUES
('Admin', 'admin@pizzaria.com', '123', 'admin'),
('Fulano', 'fulano@pizzaria.com', '223', 'comum');

INSERT INTO pizzas (name, preco, estoque) VALUES
('Margherita', 25.00, 10),
('Pepperoni', 30.00, 15),
('Quatro Queijos', 35.00, 5),
('Calabresa', 28.00, 8),
('Frango com Catupiry', 32.00, 12);

INSERT INTO vendas (usuario_id, pizza_id, quantidade) VALUES
(2, 1, 2),
(2, 3, 1),
(2, 2, 3);

    UPDATE pizzas SET estoque = estoque - (SELECT COALESCE(SUM(quantidade), 0)
    FROM vendas
    WHERE pizza_id = pizzas.id);
    );

    