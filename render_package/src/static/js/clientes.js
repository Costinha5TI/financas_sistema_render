// Funcionalidades específicas da página de gestão de clientes
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const tabelaClientes = document.getElementById('tabela-clientes');
    const tbodyClientes = tabelaClientes.querySelector('tbody');
    const semClientes = document.getElementById('sem-clientes');
    const btnNovoCliente = document.getElementById('btn-novo-cliente');
    const btnNovoClienteFab = document.getElementById('btn-novo-cliente-fab');
    const modalCliente = document.getElementById('modal-cliente');
    const formCliente = document.getElementById('form-cliente');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const modalTitulo = document.getElementById('modal-cliente-titulo');
    const modalConfirmar = document.getElementById('modal-confirmar');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
    const modalDetalhesCliente = document.getElementById('modal-detalhes-cliente');
    const detalhesCliente = document.getElementById('detalhes-cliente');
    const btnFecharDetalhes = document.getElementById('btn-fechar-detalhes');
    const btnEditarDetalhes = document.getElementById('btn-editar-detalhes');
    const pesquisaCliente = document.getElementById('pesquisa-cliente');
    const filtroTipoCliente = document.getElementById('filtro-tipo-cliente');
    
    // Variável para armazenar o ID do cliente a ser eliminado
    let clienteParaEliminar = null;
    
    // Carregar clientes
    async function carregarListaClientes() {
        try {
            const clientes = await carregarClientes();
            
            // Aplicar filtros
            let clientesFiltrados = clientes;
            
            // Filtrar por tipo
            const tipoFiltro = filtroTipoCliente.value;
            if (tipoFiltro) {
                clientesFiltrados = clientesFiltrados.filter(cliente => cliente.tipo === tipoFiltro);
            }
            
            // Filtrar por pesquisa
            const termoPesquisa = pesquisaCliente.value.toLowerCase();
            if (termoPesquisa) {
                clientesFiltrados = clientesFiltrados.filter(cliente => 
                    (cliente.nome && cliente.nome.toLowerCase().includes(termoPesquisa)) ||
                    (cliente.contacto && cliente.contacto.toLowerCase().includes(termoPesquisa)) ||
                    (cliente.nif && cliente.nif.toLowerCase().includes(termoPesquisa))
                );
            }
            
            // Limpar tabela
            tbodyClientes.innerHTML = '';
            
            // Verificar se há clientes
            if (clientesFiltrados.length === 0) {
                semClientes.style.display = 'block';
                tabelaClientes.style.display = 'none';
                return;
            }
            
            // Mostrar tabela e esconder mensagem
            semClientes.style.display = 'none';
            tabelaClientes.style.display = 'table';
            
            // Preencher tabela
            clientesFiltrados.forEach(cliente => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${cliente.nome || '-'}</td>
                    <td>${cliente.tipo || '-'}</td>
                    <td>${cliente.contacto || '-'}</td>
                    <td>${cliente.nif || '-'}</td>
                    <td>
                        <a href="/transacoes.html?cliente_id=${cliente.id}" class="btn btn-sm">
                            <i class="fas fa-list"></i>
                        </a>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-detalhes" data-id="${cliente.id}">
                            <i class="fas fa-info-circle"></i>
                        </button>
                        <button class="btn btn-sm btn-editar" data-id="${cliente.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-eliminar" data-id="${cliente.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tbodyClientes.appendChild(tr);
            });
            
            // Configurar botões de detalhes
            const btnsDetalhes = document.querySelectorAll('.btn-detalhes');
            btnsDetalhes.forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.getAttribute('data-id');
                    await mostrarDetalhesCliente(id);
                });
            });
            
            // Configurar botões de editar
            const btnsEditar = document.querySelectorAll('.btn-editar');
            btnsEditar.forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.getAttribute('data-id');
                    await editarCliente(id);
                });
            });
            
            // Configurar botões de eliminar
            const btnsEliminar = document.querySelectorAll('.btn-eliminar');
            btnsEliminar.forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    confirmarEliminarCliente(id);
                });
            });
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar clientes', 'danger');
        }
    }
    
    // Mostrar detalhes do cliente
    async function mostrarDetalhesCliente(id) {
        try {
            const response = await fetch(`${API_URL}/clientes/${id}`);
            if (!response.ok) {
                throw new Error('Erro ao carregar detalhes do cliente');
            }
            
            const cliente = await response.json();
            
            // Preencher modal
            detalhesCliente.innerHTML = `
                <div class="mb-2"><strong>Nome:</strong> ${cliente.nome || '-'}</div>
                <div class="mb-2"><strong>Tipo:</strong> ${cliente.tipo || '-'}</div>
                <div class="mb-2"><strong>Contacto:</strong> ${cliente.contacto || '-'}</div>
                <div class="mb-2"><strong>Email:</strong> ${cliente.email || '-'}</div>
                <div class="mb-2"><strong>NIF:</strong> ${cliente.nif || '-'}</div>
                <div class="mb-2"><strong>Notas:</strong> ${cliente.notas || '-'}</div>
                <div class="mb-2"><strong>Data de Criação:</strong> ${formatarData(cliente.data_criacao) || '-'}</div>
            `;
            
            // Configurar botão de editar
            btnEditarDetalhes.setAttribute('data-id', id);
            
            // Abrir modal
            abrirModal('modal-detalhes-cliente');
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar detalhes do cliente', 'danger');
        }
    }
    
    // Editar cliente
    async function editarCliente(id) {
        try {
            const response = await fetch(`${API_URL}/clientes/${id}`);
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do cliente');
            }
            
            const cliente = await response.json();
            
            // Preencher formulário
            document.getElementById('cliente_id').value = cliente.id;
            document.getElementById('nome').value = cliente.nome || '';
            document.getElementById('tipo').value = cliente.tipo || 'Cliente';
            document.getElementById('contacto').value = cliente.contacto || '';
            document.getElementById('email').value = cliente.email || '';
            document.getElementById('nif').value = cliente.nif || '';
            document.getElementById('notas').value = cliente.notas || '';
            
            // Atualizar título do modal
            modalTitulo.textContent = 'Editar Cliente/Fornecedor';
            
            // Abrir modal
            abrirModal('modal-cliente');
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar dados do cliente', 'danger');
        }
    }
    
    // Confirmar eliminação de cliente
    function confirmarEliminarCliente(id) {
        clienteParaEliminar = id;
        abrirModal('modal-confirmar');
    }
    
    // Eliminar cliente
    async function eliminarCliente(id) {
        try {
            const response = await fetch(`${API_URL}/clientes/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao eliminar cliente');
            }
            
            mostrarAlerta('Cliente eliminado com sucesso!', 'success');
            
            // Recarregar lista
            await carregarListaClientes();
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao eliminar cliente', 'danger');
        }
    }
    
    // Abrir modal para novo cliente
    function novoCliente() {
        // Limpar formulário
        formCliente.reset();
        document.getElementById('cliente_id').value = '';
        
        // Atualizar título do modal
        modalTitulo.textContent = 'Novo Cliente/Fornecedor';
        
        // Abrir modal
        abrirModal('modal-cliente');
    }
    
    // Guardar cliente (novo ou editado)
    async function guardarCliente() {
        // Obter dados do formulário
        const formData = new FormData(formCliente);
        const clienteData = {};
        
        for (const [key, value] of formData.entries()) {
            clienteData[key] = value;
        }
        
        // Verificar se é novo ou edição
        const id = clienteData.id;
        delete clienteData.id; // Remover ID do objeto para não enviar na criação
        
        try {
            let response;
            
            if (id) {
                // Edição
                response = await fetch(`${API_URL}/clientes/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clienteData)
                });
            } else {
                // Novo
                response = await fetch(`${API_URL}/clientes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clienteData)
                });
            }
            
            if (!response.ok) {
                throw new Error('Erro ao guardar cliente');
            }
            
            // Fechar modal
            fecharModal('modal-cliente');
            
            mostrarAlerta(`Cliente ${id ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            
            // Recarregar lista
            await carregarListaClientes();
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao guardar cliente', 'danger');
        }
    }
    
    // Inicializar
    carregarListaClientes();
    
    // Configurar eventos
    
    // Botões para novo cliente
    if (btnNovoCliente) {
        btnNovoCliente.addEventListener('click', novoCliente);
    }
    
    if (btnNovoClienteFab) {
        btnNovoClienteFab.addEventListener('click', function(e) {
            e.preventDefault();
            novoCliente();
        });
    }
    
    // Botões do modal de cliente
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarCliente);
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            fecharModal('modal-cliente');
        });
    }
    
    // Botões do modal de confirmação
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', async function() {
            if (clienteParaEliminar) {
                await eliminarCliente(clienteParaEliminar);
                clienteParaEliminar = null;
                fecharModal('modal-confirmar');
            }
        });
    }
    
    if (btnCancelarEliminar) {
        btnCancelarEliminar.addEventListener('click', function() {
            clienteParaEliminar = null;
            fecharModal('modal-confirmar');
        });
    }
    
    // Botões do modal de detalhes
    if (btnFecharDetalhes) {
        btnFecharDetalhes.addEventListener('click', function() {
            fecharModal('modal-detalhes-cliente');
        });
    }
    
    if (btnEditarDetalhes) {
        btnEditarDetalhes.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            fecharModal('modal-detalhes-cliente');
            editarCliente(id);
        });
    }
    
    // Pesquisa e filtros
    if (pesquisaCliente) {
        pesquisaCliente.addEventListener('input', carregarListaClientes);
    }
    
    if (filtroTipoCliente) {
        filtroTipoCliente.addEventListener('change', carregarListaClientes);
    }
});
