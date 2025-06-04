// Funcionalidades específicas da página de listagem de transações
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const formFiltro = document.getElementById('form-filtro');
    const btnLimparFiltro = document.getElementById('btn-limpar-filtro');
    const tabelaTransacoes = document.getElementById('tabela-transacoes');
    const tbodyTransacoes = tabelaTransacoes.querySelector('tbody');
    const semTransacoes = document.getElementById('sem-transacoes');
    const modalFoto = document.getElementById('modal-foto');
    const modalFotoImg = document.getElementById('modal-foto-img');
    const modalDetalhes = document.getElementById('modal-detalhes');
    const detalhesTransacao = document.getElementById('detalhes-transacao');
    
    // Carregar empresas e clientes para os filtros
    async function preencherFiltros() {
        // Carregar empresas
        const empresas = await carregarEmpresas();
        const selectEmpresa = document.getElementById('filtro-empresa');
        selectEmpresa.innerHTML = '<option value="">Todas</option>';
        
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nome;
            selectEmpresa.appendChild(option);
        });
        
        // Carregar clientes
        const clientes = await carregarClientes();
        const selectCliente = document.getElementById('filtro-cliente');
        selectCliente.innerHTML = '<option value="">Todos</option>';
        
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = `${cliente.nome} ${cliente.tipo ? `(${cliente.tipo})` : ''}`;
            selectCliente.appendChild(option);
        });
    }
    
    // Carregar transações com base nos filtros
    async function carregarListaTransacoes() {
        // Obter valores dos filtros
        const filtros = {};
        if (formFiltro) {
            const formData = new FormData(formFiltro);
            for (const [key, value] of formData.entries()) {
                if (value) {
                    filtros[key] = value;
                }
            }
        }
        
        // Carregar transações
        const transacoes = await carregarTransacoes(filtros);
        
        // Limpar tabela
        tbodyTransacoes.innerHTML = '';
        
        // Verificar se há transações
        if (transacoes.length === 0) {
            semTransacoes.style.display = 'block';
            tabelaTransacoes.style.display = 'none';
            return;
        }
        
        // Mostrar tabela e esconder mensagem
        semTransacoes.style.display = 'none';
        tabelaTransacoes.style.display = 'table';
        
        // Preencher tabela
        transacoes.forEach(transacao => {
            const tr = document.createElement('tr');
            tr.className = transacao.tipo === 'receita' ? 'transacao-receita' : 'transacao-despesa';
            
            // Formatar data
            const data = new Date(transacao.data_transacao);
            const dataFormatada = data.toLocaleDateString('pt-PT');
            
            tr.innerHTML = `
                <td>${dataFormatada}</td>
                <td>${transacao.empresa_nome || '-'}</td>
                <td>${transacao.cliente_nome || '-'}</td>
                <td>
                    <span class="badge ${transacao.tipo === 'receita' ? 'badge-success' : 'badge-danger'}">
                        ${transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                </td>
                <td class="valor-contribuinte">${formatarMoeda(transacao.valor_contribuinte)}</td>
                <td class="valor-bolso">${formatarMoeda(transacao.valor_bolso)}</td>
                <td>
                    ${transacao.foto_fatura ? 
                        `<button class="btn btn-sm btn-ver-foto" data-foto="${transacao.foto_fatura}">
                            <i class="fas fa-image"></i>
                        </button>` : 
                        '-'
                    }
                </td>
                <td>
                    <button class="btn btn-sm btn-detalhes" data-id="${transacao.id}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            `;
            
            tbodyTransacoes.appendChild(tr);
        });
        
        // Configurar botões de ver foto
        const btnsFoto = document.querySelectorAll('.btn-ver-foto');
        btnsFoto.forEach(btn => {
            btn.addEventListener('click', function() {
                const fotoPath = this.getAttribute('data-foto');
                modalFotoImg.src = `/static/${fotoPath}`;
                abrirModal('modal-foto');
            });
        });
        
        // Configurar botões de detalhes
        const btnsDetalhes = document.querySelectorAll('.btn-detalhes');
        btnsDetalhes.forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                
                try {
                    // Carregar detalhes da transação
                    const response = await fetch(`${API_URL}/transacoes/${id}`);
                    if (!response.ok) {
                        throw new Error('Erro ao carregar detalhes da transação');
                    }
                    
                    const transacao = await response.json();
                    
                    // Formatar data
                    const data = new Date(transacao.data_transacao);
                    const dataFormatada = data.toLocaleDateString('pt-PT');
                    
                    // Preencher modal
                    detalhesTransacao.innerHTML = `
                        <div class="mb-2">
                            <strong>Tipo:</strong> 
                            <span class="badge ${transacao.tipo === 'receita' ? 'badge-success' : 'badge-danger'}">
                                ${transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                            </span>
                        </div>
                        <div class="mb-2"><strong>Data:</strong> ${dataFormatada}</div>
                        <div class="mb-2"><strong>Empresa:</strong> ${transacao.empresa_nome || '-'}</div>
                        <div class="mb-2"><strong>Cliente/Fornecedor:</strong> ${transacao.cliente_nome || '-'}</div>
                        <div class="mb-2"><strong>Valor Oficial:</strong> ${formatarMoeda(transacao.valor_contribuinte)}</div>
                        <div class="mb-2"><strong>Valor Real:</strong> ${formatarMoeda(transacao.valor_bolso)}</div>
                        ${transacao.descricao ? `<div class="mb-2"><strong>Descrição:</strong> ${transacao.descricao}</div>` : ''}
                        ${transacao.foto_fatura ? 
                            `<div class="mb-2">
                                <strong>Foto:</strong> 
                                <button class="btn btn-sm btn-ver-foto" data-foto="${transacao.foto_fatura}">
                                    <i class="fas fa-image"></i> Ver Foto
                                </button>
                            </div>` : 
                            ''
                        }
                    `;
                    
                    // Configurar botão de ver foto dentro do modal
                    const btnFotoDetalhes = detalhesTransacao.querySelector('.btn-ver-foto');
                    if (btnFotoDetalhes) {
                        btnFotoDetalhes.addEventListener('click', function() {
                            const fotoPath = this.getAttribute('data-foto');
                            modalFotoImg.src = `/static/${fotoPath}`;
                            abrirModal('modal-foto');
                        });
                    }
                    
                    // Abrir modal
                    abrirModal('modal-detalhes');
                    
                } catch (error) {
                    console.error('Erro:', error);
                    mostrarAlerta('Erro ao carregar detalhes da transação', 'danger');
                }
            });
        });
    }
    
    // Inicializar filtros
    preencherFiltros();
    
    // Carregar transações iniciais
    carregarListaTransacoes();
    
    // Configurar formulário de filtro
    if (formFiltro) {
        formFiltro.addEventListener('submit', function(e) {
            e.preventDefault();
            carregarListaTransacoes();
        });
    }
    
    // Configurar botão de limpar filtro
    if (btnLimparFiltro) {
        btnLimparFiltro.addEventListener('click', function() {
            formFiltro.reset();
            carregarListaTransacoes();
        });
    }
});
