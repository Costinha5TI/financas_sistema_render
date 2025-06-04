// Funcionalidades específicas da página de exportação/importação
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const formExportar = document.getElementById('form-exportar');
    const formImportar = document.getElementById('form-importar');
    const tipoExportar = document.getElementById('tipo-exportar');
    const filtrosExportar = document.getElementById('filtros-exportar');
    const empresaExportar = document.getElementById('empresa-exportar');
    const clienteExportar = document.getElementById('cliente-exportar');
    const arquivoImportar = document.getElementById('arquivo-importar');
    const arquivoNome = document.getElementById('arquivo-nome');
    const fileUploadBtn = document.getElementById('file-upload-btn-importar');
    
    // Mostrar/esconder filtros de exportação com base no tipo selecionado
    tipoExportar.addEventListener('change', function() {
        if (this.value === 'transacoes' || this.value === 'tudo') {
            filtrosExportar.style.display = 'block';
        } else {
            filtrosExportar.style.display = 'none';
        }
    });
    
    // Carregar empresas e clientes para os filtros de exportação
    async function preencherFiltros() {
        // Carregar empresas
        const empresas = await carregarEmpresas();
        empresaExportar.innerHTML = '<option value="">Todas</option>';
        
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nome;
            empresaExportar.appendChild(option);
        });
        
        // Carregar clientes
        const clientes = await carregarClientes();
        clienteExportar.innerHTML = '<option value="">Todos</option>';
        
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = `${cliente.nome} ${cliente.tipo ? `(${cliente.tipo})` : ''}`;
            clienteExportar.appendChild(option);
        });
    }
    
    // Inicializar filtros
    preencherFiltros();
    
    // Configurar formulário de exportação
    if (formExportar) {
        formExportar.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Construir URL de exportação
            const formData = new FormData(formExportar);
            const params = new URLSearchParams();
            
            for (const [key, value] of formData.entries()) {
                if (value) {
                    params.append(key, value);
                }
            }
            
            // Redirecionar para o endpoint de exportação
            window.location.href = `/api/exportar?${params.toString()}`;
        });
    }
    
    // Configurar visualização do nome do arquivo selecionado
    if (arquivoImportar) {
        arquivoImportar.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const fileName = this.files[0].name;
                arquivoNome.textContent = `Arquivo selecionado: ${fileName}`;
                arquivoNome.style.display = 'block';
                
                // Atualizar botão de upload
                if (fileUploadBtn) {
                    fileUploadBtn.innerHTML = '<i class="fas fa-check"></i> Arquivo selecionado';
                }
            }
        });
    }
    
    // Configurar formulário de importação
    if (formImportar) {
        formImportar.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Verificar se um arquivo foi selecionado
            if (!arquivoImportar.files || !arquivoImportar.files[0]) {
                mostrarAlerta('Por favor, selecione um arquivo para importar', 'warning');
                return;
            }
            
            // Confirmar se o usuário selecionou a opção de substituir
            const substituir = document.getElementById('substituir-importar').checked;
            if (substituir) {
                if (!confirm('Tem certeza que deseja substituir os dados existentes? Esta ação não pode ser desfeita.')) {
                    return;
                }
            }
            
            // Enviar formulário via AJAX
            const formData = new FormData(formImportar);
            
            try {
                mostrarAlerta('A importar dados, por favor aguarde...', 'info');
                
                const response = await fetch('/api/importar', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao importar dados');
                }
                
                const result = await response.json();
                
                // Mostrar mensagem de sucesso
                mostrarAlerta(result.mensagem || 'Importação concluída com sucesso!', 'success');
                
                // Limpar formulário
                formImportar.reset();
                arquivoNome.style.display = 'none';
                
                // Restaurar botão de upload
                if (fileUploadBtn) {
                    fileUploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><p>Clique ou arraste o arquivo aqui</p>';
                }
                
            } catch (error) {
                console.error('Erro:', error);
                mostrarAlerta('Erro ao importar dados. Verifique o formato do arquivo.', 'danger');
            }
        });
    }
    
    // Adicionar links para exportação no menu
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        // Verificar se já existe um link para exportação
        const existingLink = Array.from(bottomNav.querySelectorAll('a')).find(a => a.href.includes('/exportacao.html'));
        
        if (!existingLink) {
            // Adicionar link para exportação no menu inferior
            const exportLink = document.createElement('a');
            exportLink.href = '/exportacao.html';
            exportLink.innerHTML = '<i class="fas fa-file-export"></i><span>Exportar</span>';
            
            // Adicionar após o link de estatísticas
            const statsLink = Array.from(bottomNav.querySelectorAll('a')).find(a => a.href.includes('/estatisticas.html'));
            if (statsLink) {
                bottomNav.insertBefore(exportLink, statsLink.nextSibling);
            } else {
                bottomNav.appendChild(exportLink);
            }
        }
    }
    
    // Adicionar link no menu principal também
    const mainNav = document.querySelector('.main-nav ul');
    if (mainNav) {
        // Verificar se já existe um link para exportação
        const existingLink = Array.from(mainNav.querySelectorAll('a')).find(a => a.href.includes('/exportacao.html'));
        
        if (!existingLink) {
            // Criar novo item de menu
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '/exportacao.html';
            a.textContent = 'Exportar/Importar';
            
            // Verificar se estamos na página de exportação
            if (window.location.pathname.includes('/exportacao.html')) {
                a.className = 'active';
            }
            
            li.appendChild(a);
            
            // Adicionar após o link de estatísticas
            const statsLi = Array.from(mainNav.querySelectorAll('li')).find(li => li.querySelector('a').href.includes('/estatisticas.html'));
            if (statsLi) {
                mainNav.insertBefore(li, statsLi.nextSibling);
            } else {
                mainNav.appendChild(li);
            }
        }
    }
});
