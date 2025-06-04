from src.models.user import db
from datetime import datetime

class Transacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(20), nullable=False)  # 'receita' ou 'despesa'
    valor_contribuinte = db.Column(db.Numeric(10, 2), nullable=False)  # Valor oficial/declarado
    valor_bolso = db.Column(db.Numeric(10, 2), nullable=False)  # Valor real/não declarado
    descricao = db.Column(db.Text, nullable=True)
    foto_fatura = db.Column(db.String(255), nullable=True)  # Caminho para a foto
    data_transacao = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    data_criacao = db.Column(db.DateTime, server_default=db.func.now())
    
    # Chaves estrangeiras
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresa.id'), nullable=False)
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=True)
    
    def __repr__(self):
        return f'<Transacao {self.tipo} - {self.valor_bolso}€>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'tipo': self.tipo,
            'valor_contribuinte': float(self.valor_contribuinte) if self.valor_contribuinte else 0,
            'valor_bolso': float(self.valor_bolso) if self.valor_bolso else 0,
            'descricao': self.descricao,
            'foto_fatura': self.foto_fatura,
            'data_transacao': self.data_transacao.isoformat() if self.data_transacao else None,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'empresa_id': self.empresa_id,
            'cliente_id': self.cliente_id,
            'empresa_nome': self.empresa.nome if self.empresa else None,
            'cliente_nome': self.cliente.nome if self.cliente else None
        }
