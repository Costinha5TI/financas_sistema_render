from flask import Blueprint, jsonify, request, current_app
from src.models import db, Transacao, Empresa, Cliente
import os
from datetime import datetime
from werkzeug.utils import secure_filename
import uuid

transacao_bp = Blueprint('transacao', __name__)

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@transacao_bp.route('/transacoes', methods=['GET'])
def get_transacoes():
    # Parâmetros de filtro opcionais
    empresa_id = request.args.get('empresa_id', type=int)
    cliente_id = request.args.get('cliente_id', type=int)
    data_inicio = request.args.get('data_inicio')
    data_fim = request.args.get('data_fim')
    tipo = request.args.get('tipo')  # receita ou despesa
    
    # Iniciar a consulta
    query = Transacao.query
    
    # Aplicar filtros se fornecidos
    if empresa_id:
        query = query.filter(Transacao.empresa_id == empresa_id)
    if cliente_id:
        query = query.filter(Transacao.cliente_id == cliente_id)
    if tipo:
        query = query.filter(Transacao.tipo == tipo)
    if data_inicio:
        data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d')
        query = query.filter(Transacao.data_transacao >= data_inicio)
    if data_fim:
        data_fim = datetime.strptime(data_fim, '%Y-%m-%d')
        query = query.filter(Transacao.data_transacao <= data_fim)
    
    # Ordenar por data, mais recente primeiro
    transacoes = query.order_by(Transacao.data_transacao.desc()).all()
    
    return jsonify([transacao.to_dict() for transacao in transacoes])

@transacao_bp.route('/transacoes/<int:transacao_id>', methods=['GET'])
def get_transacao(transacao_id):
    transacao = Transacao.query.get_or_404(transacao_id)
    return jsonify(transacao.to_dict())

@transacao_bp.route('/transacoes', methods=['POST'])
def create_transacao():
    # Verificar se é um formulário multipart (com arquivo) ou JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
        file = request.files.get('foto_fatura')
    else:
        data = request.json
        file = None
    
    # Processar o upload de foto se existir
    foto_path = None
    if file and file.filename and allowed_file(file.filename):
        # Gerar nome de arquivo único para evitar colisões
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # Salvar o arquivo
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        # Caminho relativo para armazenar no banco de dados
        foto_path = f"uploads/{unique_filename}"
    
    # Criar a transação
    transacao = Transacao(
        tipo=data['tipo'],
        valor_contribuinte=data['valor_contribuinte'],
        valor_bolso=data['valor_bolso'],
        descricao=data.get('descricao'),
        foto_fatura=foto_path,
        data_transacao=datetime.strptime(data.get('data_transacao', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d'),
        empresa_id=data['empresa_id'],
        cliente_id=data.get('cliente_id')
    )
    
    db.session.add(transacao)
    db.session.commit()
    return jsonify(transacao.to_dict()), 201

@transacao_bp.route('/transacoes/<int:transacao_id>', methods=['PUT'])
def update_transacao(transacao_id):
    transacao = Transacao.query.get_or_404(transacao_id)
    
    # Verificar se é um formulário multipart (com arquivo) ou JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
        file = request.files.get('foto_fatura')
    else:
        data = request.json
        file = None
    
    # Processar o upload de foto se existir
    if file and file.filename and allowed_file(file.filename):
        # Remover foto anterior se existir
        if transacao.foto_fatura:
            old_file_path = os.path.join(current_app.static_folder, transacao.foto_fatura)
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        # Gerar nome de arquivo único para evitar colisões
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # Salvar o arquivo
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        # Caminho relativo para armazenar no banco de dados
        transacao.foto_fatura = f"uploads/{unique_filename}"
    
    # Atualizar os campos da transação
    transacao.tipo = data.get('tipo', transacao.tipo)
    transacao.valor_contribuinte = data.get('valor_contribuinte', transacao.valor_contribuinte)
    transacao.valor_bolso = data.get('valor_bolso', transacao.valor_bolso)
    transacao.descricao = data.get('descricao', transacao.descricao)
    
    if 'data_transacao' in data:
        transacao.data_transacao = datetime.strptime(data['data_transacao'], '%Y-%m-%d')
    
    transacao.empresa_id = data.get('empresa_id', transacao.empresa_id)
    transacao.cliente_id = data.get('cliente_id', transacao.cliente_id)
    
    db.session.commit()
    return jsonify(transacao.to_dict())

@transacao_bp.route('/transacoes/<int:transacao_id>', methods=['DELETE'])
def delete_transacao(transacao_id):
    transacao = Transacao.query.get_or_404(transacao_id)
    
    # Remover foto se existir
    if transacao.foto_fatura:
        file_path = os.path.join(current_app.static_folder, transacao.foto_fatura)
        if os.path.exists(file_path):
            os.remove(file_path)
    
    db.session.delete(transacao)
    db.session.commit()
    return '', 204

@transacao_bp.route('/estatisticas', methods=['GET'])
def get_estatisticas():
    # Parâmetros de filtro opcionais
    empresa_id = request.args.get('empresa_id', type=int)
    cliente_id = request.args.get('cliente_id', type=int)
    periodo = request.args.get('periodo', 'mes')  # dia, mes, ano, total
    data_inicio = request.args.get('data_inicio')
    data_fim = request.args.get('data_fim')
    
    # Iniciar a consulta
    query = Transacao.query
    
    # Aplicar filtros se fornecidos
    if empresa_id:
        query = query.filter(Transacao.empresa_id == empresa_id)
    if cliente_id:
        query = query.filter(Transacao.cliente_id == cliente_id)
    if data_inicio:
        data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d')
        query = query.filter(Transacao.data_transacao >= data_inicio)
    if data_fim:
        data_fim = datetime.strptime(data_fim, '%Y-%m-%d')
        query = query.filter(Transacao.data_transacao <= data_fim)
    
    # Obter todas as transações filtradas
    transacoes = query.all()
    
    # Calcular estatísticas
    receitas_contribuinte = sum(float(t.valor_contribuinte) for t in transacoes if t.tipo == 'receita')
    despesas_contribuinte = sum(float(t.valor_contribuinte) for t in transacoes if t.tipo == 'despesa')
    saldo_contribuinte = receitas_contribuinte - despesas_contribuinte
    
    receitas_bolso = sum(float(t.valor_bolso) for t in transacoes if t.tipo == 'receita')
    despesas_bolso = sum(float(t.valor_bolso) for t in transacoes if t.tipo == 'despesa')
    saldo_bolso = receitas_bolso - despesas_bolso
    
    return jsonify({
        'contribuinte': {
            'receitas': receitas_contribuinte,
            'despesas': despesas_contribuinte,
            'saldo': saldo_contribuinte
        },
        'bolso': {
            'receitas': receitas_bolso,
            'despesas': despesas_bolso,
            'saldo': saldo_bolso
        },
        'total_transacoes': len(transacoes)
    })
