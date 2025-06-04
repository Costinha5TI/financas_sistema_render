from flask import Blueprint, jsonify, request
from src.models import db, Cliente

cliente_bp = Blueprint('cliente', __name__)

@cliente_bp.route('/clientes', methods=['GET'])
def get_clientes():
    clientes = Cliente.query.all()
    return jsonify([cliente.to_dict() for cliente in clientes])

@cliente_bp.route('/clientes/<int:cliente_id>', methods=['GET'])
def get_cliente(cliente_id):
    cliente = Cliente.query.get_or_404(cliente_id)
    return jsonify(cliente.to_dict())

@cliente_bp.route('/clientes', methods=['POST'])
def create_cliente():
    data = request.json
    cliente = Cliente(
        nome=data['nome'],
        tipo=data.get('tipo'),
        contacto=data.get('contacto'),
        email=data.get('email'),
        nif=data.get('nif'),
        notas=data.get('notas')
    )
    db.session.add(cliente)
    db.session.commit()
    return jsonify(cliente.to_dict()), 201

@cliente_bp.route('/clientes/<int:cliente_id>', methods=['PUT'])
def update_cliente(cliente_id):
    cliente = Cliente.query.get_or_404(cliente_id)
    data = request.json
    cliente.nome = data.get('nome', cliente.nome)
    cliente.tipo = data.get('tipo', cliente.tipo)
    cliente.contacto = data.get('contacto', cliente.contacto)
    cliente.email = data.get('email', cliente.email)
    cliente.nif = data.get('nif', cliente.nif)
    cliente.notas = data.get('notas', cliente.notas)
    db.session.commit()
    return jsonify(cliente.to_dict())

@cliente_bp.route('/clientes/<int:cliente_id>', methods=['DELETE'])
def delete_cliente(cliente_id):
    cliente = Cliente.query.get_or_404(cliente_id)
    db.session.delete(cliente)
    db.session.commit()
    return '', 204
