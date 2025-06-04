from flask import Blueprint, request, jsonify, send_file
from src.models import db, Empresa, Cliente, Transacao
import io
import os
import tempfile
from datetime import datetime

exportacao_bp = Blueprint('exportacao', __name__)

@exportacao_bp.route('/exportar', methods=['GET'])
def exportar_dados():
    """
    Exporta dados para CSV.
    Parâmetros de consulta:
    - tipo: 'transacoes', 'clientes', 'empresas' ou 'tudo'
    - empresa_id: opcional, filtrar transações por empresa
    - cliente_id: opcional, filtrar transações por cliente
    - data_inicio: opcional, filtrar transações por data de início
    - data_fim: opcional, filtrar transações por data de fim
    """
    tipo = request.args.get('tipo', 'tudo')
    
    # Criar um arquivo temporário para o CSV
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
        temp_filename = temp_file.name
    
    # Exportar transações
    if tipo in ['transacoes', 'tudo']:
        # Filtros
        empresa_id = request.args.get('empresa_id', type=int)
        cliente_id = request.args.get('cliente_id', type=int)
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        # Construir consulta
        query = Transacao.query
        
        if empresa_id:
            query = query.filter(Transacao.empresa_id == empresa_id)
        if cliente_id:
            query = query.filter(Transacao.cliente_id == cliente_id)
        if data_inicio:
            query = query.filter(Transacao.data_transacao >= datetime.strptime(data_inicio, '%Y-%m-%d'))
        if data_fim:
            query = query.filter(Transacao.data_transacao <= datetime.strptime(data_fim, '%Y-%m-%d'))
        
        # Obter transações
        transacoes = query.all()
        
        # Converter para CSV
        with open(temp_filename, 'w') as f:
            # Cabeçalho
            f.write('id,tipo,valor_contribuinte,valor_bolso,descricao,foto_fatura,data_transacao,empresa_id,empresa_nome,cliente_id,cliente_nome\n')
            
            # Dados
            for t in transacoes:
                f.write(f'{t.id},{t.tipo},{float(t.valor_contribuinte)},{float(t.valor_bolso)},')
                f.write(f'"{t.descricao or ""}",{t.foto_fatura or ""},')
                f.write(f'{t.data_transacao.strftime("%Y-%m-%d")},{t.empresa_id or ""},')
                f.write(f'"{t.empresa.nome if t.empresa else ""}",{t.cliente_id or ""},')
                f.write(f'"{t.cliente.nome if t.cliente else ""}"\n')
    
    # Exportar clientes
    elif tipo == 'clientes':
        # Obter clientes
        clientes = Cliente.query.all()
        
        # Converter para CSV
        with open(temp_filename, 'w') as f:
            # Cabeçalho
            f.write('id,nome,tipo,contacto,email,nif,notas,data_criacao\n')
            
            # Dados
            for c in clientes:
                f.write(f'{c.id},"{c.nome}","{c.tipo or ""}","{c.contacto or ""}",')
                f.write(f'"{c.email or ""}","{c.nif or ""}","{c.notas or ""}",')
                f.write(f'{c.data_criacao.strftime("%Y-%m-%d %H:%M:%S") if c.data_criacao else ""}\n')
    
    # Exportar empresas
    elif tipo == 'empresas':
        # Obter empresas
        empresas = Empresa.query.all()
        
        # Converter para CSV
        with open(temp_filename, 'w') as f:
            # Cabeçalho
            f.write('id,nome,tipo,descricao,data_criacao\n')
            
            # Dados
            for e in empresas:
                f.write(f'{e.id},"{e.nome}","{e.tipo or ""}","{e.descricao or ""}",')
                f.write(f'{e.data_criacao.strftime("%Y-%m-%d %H:%M:%S") if e.data_criacao else ""}\n')
    
    # Definir o nome do arquivo para download
    data_atual = datetime.now().strftime('%Y%m%d_%H%M%S')
    download_filename = f"financas_{tipo}_{data_atual}.csv"
    
    # Enviar o arquivo
    return send_file(
        temp_filename,
        as_attachment=True,
        download_name=download_filename,
        mimetype='text/csv'
    )

@exportacao_bp.route('/importar', methods=['POST'])
def importar_dados():
    """
    Importa dados de um arquivo CSV.
    Parâmetros:
    - tipo: 'transacoes', 'clientes', 'empresas' ou 'tudo'
    - arquivo: arquivo CSV
    - substituir: 'true' ou 'false', se deve substituir dados existentes
    """
    if 'arquivo' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado'}), 400
    
    arquivo = request.files['arquivo']
    
    if arquivo.filename == '':
        return jsonify({'erro': 'Nome de arquivo inválido'}), 400
    
    tipo = request.form.get('tipo', 'tudo')
    substituir = request.form.get('substituir', 'false').lower() == 'true'
    
    # Verificar extensão do arquivo
    if arquivo.filename.endswith('.csv'):
        # Salvar arquivo temporariamente
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
            arquivo.save(temp_file.name)
            temp_filename = temp_file.name
        
        # Importar dados
        if tipo == 'transacoes':
            importar_transacoes_csv(temp_filename, substituir)
        elif tipo == 'clientes':
            importar_clientes_csv(temp_filename, substituir)
        elif tipo == 'empresas':
            importar_empresas_csv(temp_filename, substituir)
        else:
            return jsonify({'erro': 'Tipo de dados não suportado'}), 400
        
        # Remover arquivo temporário
        os.unlink(temp_filename)
    else:
        return jsonify({'erro': 'Formato de arquivo não suportado. Use CSV'}), 400
    
    return jsonify({'mensagem': 'Importação concluída com sucesso'})

def importar_transacoes_csv(filename, substituir):
    """Importa transações de um arquivo CSV"""
    # Se substituir, remover todas as transações
    if substituir:
        Transacao.query.delete()
        db.session.commit()
    
    # Importar transações
    with open(filename, 'r') as f:
        # Pular cabeçalho
        next(f)
        
        # Processar linhas
        for line in f:
            # Dividir linha por vírgulas, respeitando aspas
            parts = []
            in_quotes = False
            current_part = ''
            
            for char in line:
                if char == '"':
                    in_quotes = not in_quotes
                elif char == ',' and not in_quotes:
                    parts.append(current_part)
                    current_part = ''
                else:
                    current_part += char
            
            # Adicionar última parte
            parts.append(current_part)
            
            # Verificar se tem partes suficientes
            if len(parts) < 11:
                continue
            
            # Extrair dados
            id_str = parts[0].strip()
            tipo = parts[1].strip()
            valor_contribuinte = float(parts[2].strip())
            valor_bolso = float(parts[3].strip())
            descricao = parts[4].strip().strip('"') or None
            foto_fatura = parts[5].strip() or None
            data_transacao = datetime.strptime(parts[6].strip(), '%Y-%m-%d')
            empresa_id_str = parts[7].strip()
            empresa_id = int(empresa_id_str) if empresa_id_str.isdigit() else None
            cliente_id_str = parts[9].strip()
            cliente_id = int(cliente_id_str) if cliente_id_str.isdigit() else None
            
            # Verificar se já existe
            if id_str.isdigit():
                transacao = Transacao.query.get(int(id_str))
                if transacao and not substituir:
                    # Atualizar transação existente
                    transacao.tipo = tipo
                    transacao.valor_contribuinte = valor_contribuinte
                    transacao.valor_bolso = valor_bolso
                    transacao.descricao = descricao
                    transacao.foto_fatura = foto_fatura
                    transacao.data_transacao = data_transacao
                    transacao.empresa_id = empresa_id
                    transacao.cliente_id = cliente_id
                else:
                    # Criar nova transação
                    transacao = Transacao(
                        id=int(id_str) if id_str.isdigit() else None,
                        tipo=tipo,
                        valor_contribuinte=valor_contribuinte,
                        valor_bolso=valor_bolso,
                        descricao=descricao,
                        foto_fatura=foto_fatura,
                        data_transacao=data_transacao,
                        empresa_id=empresa_id,
                        cliente_id=cliente_id
                    )
                    db.session.add(transacao)
            else:
                # Criar nova transação sem ID
                transacao = Transacao(
                    tipo=tipo,
                    valor_contribuinte=valor_contribuinte,
                    valor_bolso=valor_bolso,
                    descricao=descricao,
                    foto_fatura=foto_fatura,
                    data_transacao=data_transacao,
                    empresa_id=empresa_id,
                    cliente_id=cliente_id
                )
                db.session.add(transacao)
    
    db.session.commit()

def importar_clientes_csv(filename, substituir):
    """Importa clientes de um arquivo CSV"""
    # Se substituir, remover todos os clientes
    if substituir:
        Cliente.query.delete()
        db.session.commit()
    
    # Importar clientes
    with open(filename, 'r') as f:
        # Pular cabeçalho
        next(f)
        
        # Processar linhas
        for line in f:
            # Dividir linha por vírgulas, respeitando aspas
            parts = []
            in_quotes = False
            current_part = ''
            
            for char in line:
                if char == '"':
                    in_quotes = not in_quotes
                elif char == ',' and not in_quotes:
                    parts.append(current_part)
                    current_part = ''
                else:
                    current_part += char
            
            # Adicionar última parte
            parts.append(current_part)
            
            # Verificar se tem partes suficientes
            if len(parts) < 8:
                continue
            
            # Extrair dados
            id_str = parts[0].strip()
            nome = parts[1].strip().strip('"')
            tipo = parts[2].strip().strip('"') or None
            contacto = parts[3].strip().strip('"') or None
            email = parts[4].strip().strip('"') or None
            nif = parts[5].strip().strip('"') or None
            notas = parts[6].strip().strip('"') or None
            
            # Verificar se já existe
            if id_str.isdigit():
                cliente = Cliente.query.get(int(id_str))
                if cliente and not substituir:
                    # Atualizar cliente existente
                    cliente.nome = nome
                    cliente.tipo = tipo
                    cliente.contacto = contacto
                    cliente.email = email
                    cliente.nif = nif
                    cliente.notas = notas
                else:
                    # Criar novo cliente
                    cliente = Cliente(
                        id=int(id_str) if id_str.isdigit() else None,
                        nome=nome,
                        tipo=tipo,
                        contacto=contacto,
                        email=email,
                        nif=nif,
                        notas=notas
                    )
                    db.session.add(cliente)
            else:
                # Criar novo cliente sem ID
                cliente = Cliente(
                    nome=nome,
                    tipo=tipo,
                    contacto=contacto,
                    email=email,
                    nif=nif,
                    notas=notas
                )
                db.session.add(cliente)
    
    db.session.commit()

def importar_empresas_csv(filename, substituir):
    """Importa empresas de um arquivo CSV"""
    # Se substituir, remover todas as empresas
    if substituir:
        Empresa.query.delete()
        db.session.commit()
    
    # Importar empresas
    with open(filename, 'r') as f:
        # Pular cabeçalho
        next(f)
        
        # Processar linhas
        for line in f:
            # Dividir linha por vírgulas, respeitando aspas
            parts = []
            in_quotes = False
            current_part = ''
            
            for char in line:
                if char == '"':
                    in_quotes = not in_quotes
                elif char == ',' and not in_quotes:
                    parts.append(current_part)
                    current_part = ''
                else:
                    current_part += char
            
            # Adicionar última parte
            parts.append(current_part)
            
            # Verificar se tem partes suficientes
            if len(parts) < 5:
                continue
            
            # Extrair dados
            id_str = parts[0].strip()
            nome = parts[1].strip().strip('"')
            tipo = parts[2].strip().strip('"') or None
            descricao = parts[3].strip().strip('"') or None
            
            # Verificar se já existe
            if id_str.isdigit():
                empresa = Empresa.query.get(int(id_str))
                if empresa and not substituir:
                    # Atualizar empresa existente
                    empresa.nome = nome
                    empresa.tipo = tipo
                    empresa.descricao = descricao
                else:
                    # Criar nova empresa
                    empresa = Empresa(
                        id=int(id_str) if id_str.isdigit() else None,
                        nome=nome,
                        tipo=tipo,
                        descricao=descricao
                    )
                    db.session.add(empresa)
            else:
                # Criar nova empresa sem ID
                empresa = Empresa(
                    nome=nome,
                    tipo=tipo,
                    descricao=descricao
                )
                db.session.add(empresa)
    
    db.session.commit()
