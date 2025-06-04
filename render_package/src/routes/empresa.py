from flask import Blueprint, jsonify, request
from src.models import db, Empresa

empresa_bp = Blueprint('empresa', __name__)

@empresa_bp.route('/empresas', methods=['GET'])
def get_empresas():
    empresas = Empresa.query.all()
    return jsonify([empresa.to_dict() for empresa in empresas])

@empresa_bp.route('/empresas/<int:empresa_id>', methods=['GET'])
def get_empresa(empresa_id):
    empresa = Empresa.query.get_or_404(empresa_id)
    return jsonify(empresa.to_dict())

@empresa_bp.route('/empresas', methods=['POST'])
def create_empresa():
    data = request.json
    empresa = Empresa(
        nome=data['nome'],
        tipo=data.get('tipo'),
        descricao=data.get('descricao')
    )
    db.session.add(empresa)
    db.session.commit()
    return jsonify(empresa.to_dict()), 201

@empresa_bp.route('/empresas/<int:empresa_id>', methods=['PUT'])
def update_empresa(empresa_id):
    empresa = Empresa.query.get_or_404(empresa_id)
    data = request.json
    empresa.nome = data.get('nome', empresa.nome)
    empresa.tipo = data.get('tipo', empresa.tipo)
    empresa.descricao = data.get('descricao', empresa.descricao)
    db.session.commit()
    return jsonify(empresa.to_dict())

@empresa_bp.route('/empresas/<int:empresa_id>', methods=['DELETE'])
def delete_empresa(empresa_id):
    empresa = Empresa.query.get_or_404(empresa_id)
    db.session.delete(empresa)
    db.session.commit()
    return '', 204
