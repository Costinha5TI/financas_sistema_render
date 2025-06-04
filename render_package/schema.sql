-- Esquema da base de dados para o sistema de gestão financeira

-- Tabela de utilizadores
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    descricao TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de clientes/fornecedores
CREATE TABLE IF NOT EXISTS cliente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    contacto VARCHAR(50),
    email VARCHAR(100),
    nif VARCHAR(20),
    notas TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo VARCHAR(20) NOT NULL,  -- 'receita' ou 'despesa'
    valor_contribuinte DECIMAL(10, 2) NOT NULL,
    valor_bolso DECIMAL(10, 2) NOT NULL,
    descricao TEXT,
    foto_fatura VARCHAR(255),
    data_transacao DATE NOT NULL,
    empresa_id INTEGER,
    cliente_id INTEGER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresa (id),
    FOREIGN KEY (cliente_id) REFERENCES cliente (id)
);

-- Inserir empresas iniciais
INSERT INTO empresa (nome, tipo, descricao) VALUES 
('Nacional', 'Restaurante', 'Restaurante Nacional'),
('Riverside', 'Restaurante', 'Restaurante Riverside'),
('River Vibes', 'Restaurante', 'Restaurante River Vibes'),
('Segmento Mutante', 'Serviços', 'Empresa de prestação de serviços');
