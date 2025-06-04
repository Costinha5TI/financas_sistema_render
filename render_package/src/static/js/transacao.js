// Funcionalidades específicas da página de transações
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário
    const formTransacao = document.getElementById('form-transacao');
    const selectEmpresa = document.getElementById('empresa');
    const selectCliente = document.getElementById('cliente');
    const btnNovoCliente = document.getElementById('btn-novo-cliente');
    const formCliente = document.getElementById('form-cliente');
    const btnGuardarCliente = document.getElementById('btn-guardar-cliente');
    
    // Preencher a data atual por padrão
    const inputData = document.getElementById('data_transacao');
    if (inputData) {
        inputData.value = getDataAtual();
    }
    
    // Carregar empresas para o select
    async function preencherEmpresas() {
        const empresas = await carregarEmpresas();
        selectEmpresa.innerHTML = '<option value="">Selecione...</option>';
        
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nome;
            selectEmpresa.appendChild(option);
        });
    }
    
    // Carregar clientes para o select
    async function preencherClientes() {
        const clientes = await carregarClientes();
        selectCliente.innerHTML = '<option value="">Selecione...</option>';
        
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = `${cliente.nome} ${cliente.tipo ? `(${cliente.tipo})` : ''}`;
            selectCliente.appendChild(option);
        });
    }
    
    // Inicializar selects
    preencherEmpresas();
    preencherClientes();
    
    // Abrir modal para novo cliente
    if (btnNovoCliente) {
        btnNovoCliente.addEventListener('click', function() {
            // Limpar formulário
            formCliente.reset();
            // Abrir modal
            abrirModal('modal-novo-cliente');
        });
    }
    
    // Guardar novo cliente
    if (btnGuardarCliente) {
        btnGuardarCliente.addEventListener('click', async function() {
            // Obter dados do formulário
            const formData = new FormData(formCliente);
            const clienteData = {};
            
            for (const [key, value] of formData.entries()) {
                clienteData[key] = value;
            }
            
            try {
                // Enviar para API
                const response = await fetch(`${API_URL}/clientes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clienteData)
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao criar cliente');
                }
                
                const novoCliente = await response.json();
                
                // Fechar modal
                fecharModal('modal-novo-cliente');
                
                // Atualizar lista de clientes
                await preencherClientes();
                
                // Selecionar o novo cliente
                selectCliente.value = novoCliente.id;
                
                mostrarAlerta('Cliente criado com sucesso!', 'success');
                
            } catch (error) {
                console.error('Erro:', error);
                mostrarAlerta('Erro ao criar cliente', 'danger');
            }
        });
    }
    
    // Submeter formulário de transação
    if (formTransacao) {
        formTransacao.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Verificar se é uma receita ou despesa
            const tipo = document.getElementById('tipo').value;
            if (!tipo) {
                mostrarAlerta('Selecione o tipo de transação', 'warning');
                return;
            }
            
            // Verificar se uma empresa foi selecionada
            const empresaId = document.getElementById('empresa').value;
            if (!empresaId) {
                mostrarAlerta('Selecione uma empresa', 'warning');
                return;
            }
            
            // Obter dados do formulário
            const formData = new FormData(formTransacao);
            
            try {
                // Enviar para API
                const response = await fetch(`${API_URL}/transacoes`, {
                    method: 'POST',
                    body: formData // Enviar como FormData para suportar upload de arquivo
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao registar transação');
                }
                
                const transacao = await response.json();
                
                mostrarAlerta('Transação registada com sucesso!', 'success');
                
                // Redirecionar para a lista de transações após 1 segundo
                setTimeout(() => {
                    window.location.href = '/transacoes.html';
                }, 1000);
                
            } catch (error) {
                console.error('Erro:', error);
                mostrarAlerta('Erro ao registar transação', 'danger');
            }
        });
    }
    
    // Sincronizar valores (opcional)
    const valorContribuinte = document.getElementById('valor_contribuinte');
    const valorBolso = document.getElementById('valor_bolso');
    
    if (valorContribuinte && valorBolso) {
        valorContribuinte.addEventListener('input', function() {
            // Se o valor do bolso estiver vazio, copiar o valor do contribuinte
            if (!valorBolso.value) {
                valorBolso.value = this.value;
            }
        });
    }
});
