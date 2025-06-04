from src.models.user import db

class Empresa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50), nullable=True)  # Restaurante ou Serviços
    descricao = db.Column(db.Text, nullable=True)
    data_criacao = db.Column(db.DateTime, server_default=db.func.now())
    
    # Relacionamentos
    transacoes = db.relationship('Transacao', backref='empresa', lazy=True)
    
    def __repr__(self):
        return f'<Empresa {self.nome}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'tipo': self.tipo,
            'descricao': self.descricao,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }
