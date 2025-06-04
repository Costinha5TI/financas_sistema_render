// Funções e variáveis globais
const API_URL = '/api';

// Formatar valor monetário
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
    }).format(valor);
}

// Formatar data
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-PT');
}

// Obter data atual formatada para input date
function getDataAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Mostrar mensagem de alerta
function mostrarAlerta(mensagem, tipo = 'success') {
    const alertaDiv = document.createElement('div');
    alertaDiv.className = `alert alert-${tipo} fade-in`;
    alertaDiv.textContent = mensagem;
    
    // Inserir no topo da página
    document.body.insertBefore(alertaDiv, document.body.firstChild);
    
    // Remover após 5 segundos
    setTimeout(() => {
        alertaDiv.style.opacity = '0';
        setTimeout(() => alertaDiv.remove(), 300);
    }, 5000);
}

// Carregar empresas
async function carregarEmpresas() {
    try {
        const response = await fetch(`${API_URL}/empresas`);
        if (!response.ok) {
            throw new Error('Erro ao carregar empresas');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao carregar empresas', 'danger');
        return [];
    }
}

// Carregar clientes
async function carregarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        if (!response.ok) {
            throw new Error('Erro ao carregar clientes');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao carregar clientes', 'danger');
        return [];
    }
}

// Carregar transações
async function carregarTransacoes(params = {}) {
    try {
        let url = `${API_URL}/transacoes`;
        
        // Adicionar parâmetros de consulta se existirem
        const queryParams = new URLSearchParams();
        for (const key in params) {
            if (params[key]) {
                queryParams.append(key, params[key]);
            }
        }
        
        if (queryParams.toString()) {
            url += `?${queryParams.toString()}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro ao carregar transações');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao carregar transações', 'danger');
        return [];
    }
}

// Carregar estatísticas
async function carregarEstatisticas(params = {}) {
    try {
        let url = `${API_URL}/estatisticas`;
        
        // Adicionar parâmetros de consulta se existirem
        const queryParams = new URLSearchParams();
        for (const key in params) {
            if (params[key]) {
                queryParams.append(key, params[key]);
            }
        }
        
        if (queryParams.toString()) {
            url += `?${queryParams.toString()}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro ao carregar estatísticas');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao carregar estatísticas', 'danger');
        return {
            contribuinte: { receitas: 0, despesas: 0, saldo: 0 },
            bolso: { receitas: 0, despesas: 0, saldo: 0 },
            total_transacoes: 0
        };
    }
}

// Funções para o modal
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Configurar preview de upload de imagem
function configurarPreviewImagem() {
    const inputFile = document.getElementById('foto_fatura');
    const previewImg = document.getElementById('file-preview');
    const uploadBtn = document.getElementById('file-upload-btn');
    
    if (inputFile && previewImg) {
        inputFile.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    previewImg.style.display = 'block';
                    if (uploadBtn) {
                        uploadBtn.innerHTML = '<i class="fas fa-check"></i> Imagem selecionada';
                    }
                }
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

// Inicialização comum a todas as páginas
document.addEventListener('DOMContentLoaded', function() {
    // Configurar modais
    const modais = document.querySelectorAll('.modal');
    modais.forEach(modal => {
        const fecharBtns = modal.querySelectorAll('.close, .btn-danger');
        fecharBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', function(event) {
        modais.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Configurar preview de imagem se estiver na página de transação
    if (document.getElementById('foto_fatura')) {
        configurarPreviewImagem();
    }
});
