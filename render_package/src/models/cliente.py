from src.models.user import db

class Cliente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50), nullable=True)  # Fornecedor, Cliente, Outro
    contacto = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    nif = db.Column(db.String(20), nullable=True)
    notas = db.Column(db.Text, nullable=True)
    data_criacao = db.Column(db.DateTime, server_default=db.func.now())
    
    # Relacionamentos
    transacoes = db.relationship('Transacao', backref='cliente', lazy=True)
    
    def __repr__(self):
        return f'<Cliente {self.nome}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'tipo': self.tipo,
            'contacto': self.contacto,
            'email': self.email,
            'nif': self.nif,
            'notas': self.notas,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }
