# 🍽️ Sistema de Gestão de Cantina

Sistema completo de gerenciamento de cantina desenvolvido com Node.js, Express e PostgreSQL. Permite controle de produtos, estoque, pedidos e usuários com diferentes níveis de acesso.

## 📋 Sobre o Projeto

Este sistema foi desenvolvido para facilitar a gestão de uma cantina, oferecendo funcionalidades distintas para administradores e usuários comuns. Administradores podem gerenciar produtos e estoque, enquanto usuários podem visualizar o cardápio e fazer pedidos.

## ✨ Funcionalidades

### 👤 Para Usuários
- Login e autenticação segura
- Visualização do cardápio de produtos
- Busca de produtos por nome
- Realização de pedidos
- Visualização do histórico de pedidos recentes

### 🔐 Para Administradores
- Todas as funcionalidades de usuário comum
- Cadastro de novos produtos
- Edição de produtos existentes
- Exclusão de produtos
- Gestão completa de estoque
- Visualização de todos os pedidos
- Atualização de quantidade em estoque

## 🚀 Tecnologias Utilizadas

- **Node.js** - Ambiente de execução JavaScript
- **Express** - Framework web para Node.js
- **PostgreSQL** - Banco de dados relacional
- **EJS** - Template engine para renderização de views
- **Express Session** - Gerenciamento de sessões
- **pg** - Cliente PostgreSQL para Node.js

## 📦 Instalação

### Pré-requisitos

- Node.js (v14 ou superior)
- PostgreSQL (v12 ou superior)
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/Vinipereir/SIMULADO_PRV.git
cd SIMULADO_PRV
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados**

Edite o arquivo `server.js` com suas credenciais do PostgreSQL:
```javascript
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "cantina",
    password: "sua_senha",
    port: 7777
});
```

4. **Execute o script de inicialização do banco**
```bash
psql -U postgres -f seed.sql
```

5. **Inicie o servidor**
```bash
node server.js
```

6. **Acesse o sistema**
```
http://localhost:3000
```



## 🗂️ Estrutura do Projeto

```
SIMULADO_PRV/
├── public/
│   └── style.css              # Estilos CSS
├── views/
│   ├── cadastro-produto.ejs   # Página de cadastro de produtos
│   ├── dashboard.ejs          # Dashboard principal
│   ├── gestao-estoque.ejs     # Gestão de estoque
│   └── login.ejs              # Página de login
├── package.json               # Dependências do projeto
├── README.md                  # Documentação
├── seed.sql                   # Script de inicialização do banco
└── server.js                  # Servidor principal
```

## 🗃️ Estrutura do Banco de Dados

### Tabelas

- **usuarios** - Armazena informações dos usuários
- **foods** - Catálogo de produtos da cantina
- **pedidos** - Registro de todos os pedidos
- **itens_pedido** - Itens individuais de cada pedido

## 🔒 Sistema de Autenticação

O sistema possui dois níveis de acesso:

- **Usuário Comum (user)**: Pode visualizar produtos e fazer pedidos
- **Administrador (admin)**: Acesso completo ao sistema

## 🛣️ Rotas da Aplicação

### Rotas Públicas
- `GET /` - Página de login
- `POST /login` - Autenticação de usuário

### Rotas Protegidas (Usuário Autenticado)
- `GET /dashboard` - Dashboard principal
- `POST /pedidos` - Criar novo pedido
- `GET /logout` - Sair do sistema

### Rotas Protegidas (Apenas Administrador)
- `GET /cadastro-produto` - Página de cadastro de produtos
- `POST /cadastro-produto` - Cadastrar novo produto
- `GET /gestao-estoque` - Gestão de estoque
- `POST /foods` - Criar produto
- `POST /foods/update/:id` - Atualizar produto
- `POST /foods/delete/:id` - Deletar produto

## 🔄 Fluxo de Pedidos

1. Usuário seleciona produto e quantidade
2. Sistema verifica disponibilidade em estoque
3. Pedido é criado com status "pendente"
4. Estoque é automaticamente atualizado
5. Pedido aparece no histórico

---

## 👨‍💻 Autor

**Vinicius Pereira**
- GitHub: [@Vinipereir](https://github.com/Vinipereir)

---

Desenvolvido com ❤️ para facilitar a gestão de cantinas
