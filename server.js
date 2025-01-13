const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const session = require('express-session');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Importação do JWT

const app = express();
const port = 3000;

// Middleware: Body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/index.html')));

// Middleware: Sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersegredo123',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Altere para true se estiver usando HTTPS
}));

// Banco de dados MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '!Dudubr123',
    database: 'promodb',
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
        return;
    }
    console.log('Conectado ao banco!');
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Chave secreta para tokens (use variáveis de ambiente em produção)
const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta';

// Função para gerar tokens JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id_usuario, email: user.ds_email },
        JWT_SECRET,
        { expiresIn: '1h' } // Token válido por 1 hora
    );
};

// Middleware para autenticar o token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
        req.user = user; // Salva os dados do usuário no objeto req
        next();
    });
};

// Cadastro de usuário
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    const id_acesso = 1;
    const dt_criacao = new Date();

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO T_USUARIO (nm_usuario, ds_email, ds_senha, id_acesso, dt_criacao) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [username, email, hashedPassword, id_acesso, dt_criacao], (err) => {
            if (err) return res.status(400).json({ error: err.message });
            res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});

// Login de usuário
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const sql = 'SELECT * FROM T_USUARIO WHERE ds_email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao procurar usuário' });
        if (results.length === 0) return res.status(400).json({ error: 'Usuário não encontrado' });

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.ds_senha);

        if (!validPassword) {
            return res.status(400).json({ error: 'Senha incorreta' });
        }

        const token = generateToken(user);
        res.status(200).json({ message: 'Login bem-sucedido!', token });
    });
});

// Rota para executar scripts de web scraping
app.post('/api/scrape', (req, res) => {
    const { categories } = req.body;
    if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({ error: 'Nenhuma categoria informada' });
    }

    const scriptPaths = {
        cpu: 'src/webscraping/KaBuM/kabumCpu.py',
        mobo: 'src/webscraping/KaBuM/kabumMobo.py',
        gpu: 'src/webscraping/KaBuM/kabumGpu.py',
        ram: 'src/webscraping/KaBuM/kabumRam.py',
        ssd: 'src/webscraping/KaBuM/kabumSsd.py',
        hdd: 'src/webscraping/KaBuM/kabumHdd.py',
        psu: 'src/webscraping/KaBuM/kabumPsu.py',
        cooling: 'src/webscraping/KaBuM/kabumCooler.py',
        case: 'src/webscraping/KaBuM/kabumGabinete.py',
    };

    categories.forEach((category) => {
        const scriptPath = scriptPaths[category];
        if (!scriptPath) return;

        exec(`python ${scriptPath}`, (err, stdout, stderr) => {
            if (err) console.error(`Erro ao executar o script para ${category}:`, err);
            if (stderr) console.error(`Erro padrão: ${stderr}`);
            console.log(`Saída: ${stdout}`);
        });
    });

    res.status(200).json({ message: 'Scripts executados!' });
});

// Rota para obter produtos por categoria
app.post('/api/getProducts', (req, res) => {
    const { category } = req.body;

    // Mapeamento de categorias para arquivos JSON
    const fileMap = {
        cpu: 'cpu.json',
        mobo: 'mobo.json',
        gpu: 'gpu.json',
        ram: 'ram.json',
        ssd: 'ssd.json',
        hdd: 'hdd.json',
        psu: 'psu.json',
        cooling: 'cooling.json',
        case: 'case.json',
    };

    const filename = fileMap[category];

    // Se a categoria não for válida, retorna erro
    if (!filename) {
        return res.status(400).json({ error: 'Categoria não suportada' });
    }

    // Caminho para o diretório onde os arquivos JSON estão salvos (pasta 'public/data')
    const filePath = path.join(__dirname, 'public', 'data', filename);

    // Função para carregar arquivos JSON
    const readJsonFile = (filename, res) => {
        fs.readFile(filename, 'utf-8', (err, data) => {
            if (err) {
                console.error(`Erro ao ler o arquivo ${filename}:`, err.message);
                return res.status(500).send('Erro ao carregar os dados');
            }
            res.json(JSON.parse(data));
        });
    };

    // Chama a função para ler o arquivo JSON correspondente à categoria
    readJsonFile(filePath, res);
});

// Exemplo de rota protegida
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Acesso autorizado!', user: req.user });
});

// Inicializar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em: http://localhost:${port}`);
});
