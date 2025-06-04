// Funcionalidades específicas da página de estatísticas
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const formFiltro = document.getElementById('form-filtro-estatisticas');
    const btnLimparFiltro = document.getElementById('btn-limpar-filtro-estatisticas');
    const tabsBtn = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabelaEstatisticas = document.getElementById('tabela-estatisticas');
    const tbodyEstatisticas = tabelaEstatisticas.querySelector('tbody');
    const semDados = document.getElementById('sem-dados');
    
    // Elementos de resumo
    const estatisticasReceitas = document.getElementById('estatisticas-receitas');
    const estatisticasDespesas = document.getElementById('estatisticas-despesas');
    const estatisticasSaldo = document.getElementById('estatisticas-saldo');
    
    // Elementos de gráficos
    const graficoBarrasOficial = document.getElementById('grafico-barras-oficial');
    const graficoLinhaOficial = document.getElementById('grafico-linha-oficial');
    const graficoPizzaEmpresaOficial = document.getElementById('grafico-pizza-empresa-oficial');
    const graficoBarrasReal = document.getElementById('grafico-barras-real');
    const graficoLinhaReal = document.getElementById('grafico-linha-real');
    const graficoPizzaEmpresaReal = document.getElementById('grafico-pizza-empresa-real');
    
    // Instâncias de gráficos
    let chartBarrasOficial;
    let chartLinhaOficial;
    let chartPizzaEmpresaOficial;
    let chartBarrasReal;
    let chartLinhaReal;
    let chartPizzaEmpresaReal;
    
    // Cores para gráficos
    const coresGraficos = {
        receitas: 'rgba(46, 204, 113, 0.7)',
        receitasBorda: 'rgba(46, 204, 113, 1)',
        despesas: 'rgba(231, 76, 60, 0.7)',
        despesasBorda: 'rgba(231, 76, 60, 1)',
        saldo: 'rgba(52, 152, 219, 0.7)',
        saldoBorda: 'rgba(52, 152, 219, 1)',
        empresas: [
            'rgba(52, 152, 219, 0.7)',
            'rgba(155, 89, 182, 0.7)',
            'rgba(46, 204, 113, 0.7)',
            'rgba(241, 196, 15, 0.7)',
            'rgba(230, 126, 34, 0.7)'
        ],
        empresasBorda: [
            'rgba(52, 152, 219, 1)',
            'rgba(155, 89, 182, 1)',
            'rgba(46, 204, 113, 1)',
            'rgba(241, 196, 15, 1)',
            'rgba(230, 126, 34, 1)'
        ]
    };
    
    // Carregar empresas e clientes para os filtros
    async function preencherFiltros() {
        // Carregar empresas
        const empresas = await carregarEmpresas();
        const selectEmpresa = document.getElementById('filtro-empresa-estatisticas');
        selectEmpresa.innerHTML = '<option value="">Todas</option>';
        
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nome;
            selectEmpresa.appendChild(option);
        });
        
        // Carregar clientes
        const clientes = await carregarClientes();
        const selectCliente = document.getElementById('filtro-cliente-estatisticas');
        selectCliente.innerHTML = '<option value="">Todos</option>';
        
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = `${cliente.nome} ${cliente.tipo ? `(${cliente.tipo})` : ''}`;
            selectCliente.appendChild(option);
        });
    }
    
    // Função para obter dados de estatísticas
    async function obterDadosEstatisticas() {
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
        
        // Carregar estatísticas
        const estatisticas = await carregarEstatisticas(filtros);
        
        // Carregar transações para análise detalhada
        const transacoes = await carregarTransacoes(filtros);
        
        return { estatisticas, transacoes, filtros };
    }
    
    // Função para processar dados de transações por período
    function processarDadosPorPeriodo(transacoes, periodo) {
        const dados = {};
        
        transacoes.forEach(transacao => {
            const data = new Date(transacao.data_transacao);
            let chave;
            
            switch (periodo) {
                case 'dia':
                    chave = data.toISOString().split('T')[0]; // YYYY-MM-DD
                    break;
                case 'mes':
                    chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
                    break;
                case 'ano':
                    chave = data.getFullYear().toString(); // YYYY
                    break;
                default:
                    chave = 'total';
            }
            
            if (!dados[chave]) {
                dados[chave] = {
                    receitasContribuinte: 0,
                    despesasContribuinte: 0,
                    receitasBolso: 0,
                    despesasBolso: 0
                };
            }
            
            if (transacao.tipo === 'receita') {
                dados[chave].receitasContribuinte += parseFloat(transacao.valor_contribuinte);
                dados[chave].receitasBolso += parseFloat(transacao.valor_bolso);
            } else {
                dados[chave].despesasContribuinte += parseFloat(transacao.valor_contribuinte);
                dados[chave].despesasBolso += parseFloat(transacao.valor_bolso);
            }
        });
        
        // Calcular saldos
        Object.keys(dados).forEach(chave => {
            dados[chave].saldoContribuinte = dados[chave].receitasContribuinte - dados[chave].despesasContribuinte;
            dados[chave].saldoBolso = dados[chave].receitasBolso - dados[chave].despesasBolso;
        });
        
        return dados;
    }
    
    // Função para processar dados de transações por empresa
    function processarDadosPorEmpresa(transacoes) {
        const dados = {};
        
        transacoes.forEach(transacao => {
            const empresaId = transacao.empresa_id;
            const empresaNome = transacao.empresa_nome || `Empresa ${empresaId}`;
            
            if (!dados[empresaNome]) {
                dados[empresaNome] = {
                    receitasContribuinte: 0,
                    despesasContribuinte: 0,
                    receitasBolso: 0,
                    despesasBolso: 0
                };
            }
            
            if (transacao.tipo === 'receita') {
                dados[empresaNome].receitasContribuinte += parseFloat(transacao.valor_contribuinte);
                dados[empresaNome].receitasBolso += parseFloat(transacao.valor_bolso);
            } else {
                dados[empresaNome].despesasContribuinte += parseFloat(transacao.valor_contribuinte);
                dados[empresaNome].despesasBolso += parseFloat(transacao.valor_bolso);
            }
        });
        
        // Calcular saldos
        Object.keys(dados).forEach(empresa => {
            dados[empresa].saldoContribuinte = dados[empresa].receitasContribuinte - dados[empresa].despesasContribuinte;
            dados[empresa].saldoBolso = dados[empresa].receitasBolso - dados[empresa].despesasBolso;
        });
        
        return dados;
    }
    
    // Função para atualizar resumo
    function atualizarResumo(estatisticas) {
        estatisticasReceitas.textContent = formatarMoeda(estatisticas.contribuinte.receitas);
        estatisticasDespesas.textContent = formatarMoeda(estatisticas.contribuinte.despesas);
        estatisticasSaldo.textContent = formatarMoeda(estatisticas.contribuinte.saldo);
        
        // Aplicar cor ao saldo
        if (estatisticas.contribuinte.saldo >= 0) {
            estatisticasSaldo.classList.remove('text-danger');
            estatisticasSaldo.classList.add('text-success');
        } else {
            estatisticasSaldo.classList.remove('text-success');
            estatisticasSaldo.classList.add('text-danger');
        }
    }
    
    // Função para atualizar tabela
    function atualizarTabela(dadosPeriodo, periodo) {
        tbodyEstatisticas.innerHTML = '';
        
        // Verificar se há dados
        if (Object.keys(dadosPeriodo).length === 0) {
            semDados.style.display = 'block';
            tabelaEstatisticas.style.display = 'none';
            return;
        }
        
        // Mostrar tabela e esconder mensagem
        semDados.style.display = 'none';
        tabelaEstatisticas.style.display = 'table';
        
        // Ordenar chaves por data
        const chaves = Object.keys(dadosPeriodo).sort();
        
        // Preencher tabela
        chaves.forEach(chave => {
            const dados = dadosPeriodo[chave];
            const tr = document.createElement('tr');
            
            // Formatar período para exibição
            let periodoFormatado = chave;
            if (periodo === 'mes' && chave !== 'total') {
                const [ano, mes] = chave.split('-');
                const data = new Date(ano, mes - 1);
                periodoFormatado = data.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
            } else if (periodo === 'dia' && chave !== 'total') {
                periodoFormatado = new Date(chave).toLocaleDateString('pt-PT');
            }
            
            tr.innerHTML = `
                <td>${periodoFormatado}</td>
                <td class="text-success">${formatarMoeda(dados.receitasContribuinte)}</td>
                <td class="text-danger">${formatarMoeda(dados.despesasContribuinte)}</td>
                <td class="${dados.saldoContribuinte >= 0 ? 'text-success' : 'text-danger'}">${formatarMoeda(dados.saldoContribuinte)}</td>
                <td class="text-success">${formatarMoeda(dados.receitasBolso)}</td>
                <td class="text-danger">${formatarMoeda(dados.despesasBolso)}</td>
                <td class="${dados.saldoBolso >= 0 ? 'text-success' : 'text-danger'}">${formatarMoeda(dados.saldoBolso)}</td>
            `;
            
            tbodyEstatisticas.appendChild(tr);
        });
    }
    
    // Função para atualizar gráficos
    function atualizarGraficos(dadosPeriodo, dadosEmpresa) {
        // Destruir gráficos existentes
        if (chartBarrasOficial) chartBarrasOficial.destroy();
        if (chartLinhaOficial) chartLinhaOficial.destroy();
        if (chartPizzaEmpresaOficial) chartPizzaEmpresaOficial.destroy();
        if (chartBarrasReal) chartBarrasReal.destroy();
        if (chartLinhaReal) chartLinhaReal.destroy();
        if (chartPizzaEmpresaReal) chartPizzaEmpresaReal.destroy();
        
        // Ordenar chaves por data
        const chaves = Object.keys(dadosPeriodo).sort();
        
        // Preparar dados para gráficos
        const labels = chaves.map(chave => {
            if (chave === 'total') return 'Total';
            
            // Formatar período para exibição
            const periodo = document.getElementById('filtro-periodo').value;
            if (periodo === 'mes' && chave !== 'total') {
                const [ano, mes] = chave.split('-');
                const data = new Date(ano, mes - 1);
                return data.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
            } else if (periodo === 'dia' && chave !== 'total') {
                return new Date(chave).toLocaleDateString('pt-PT');
            }
            
            return chave;
        });
        
        const receitasContribuinte = chaves.map(chave => dadosPeriodo[chave].receitasContribuinte);
        const despesasContribuinte = chaves.map(chave => dadosPeriodo[chave].despesasContribuinte);
        const saldosContribuinte = chaves.map(chave => dadosPeriodo[chave].saldoContribuinte);
        
        const receitasBolso = chaves.map(chave => dadosPeriodo[chave].receitasBolso);
        const despesasBolso = chaves.map(chave => dadosPeriodo[chave].despesasBolso);
        const saldosBolso = chaves.map(chave => dadosPeriodo[chave].saldoBolso);
        
        // Gráfico de Barras - Oficial
        chartBarrasOficial = new Chart(graficoBarrasOficial, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Receitas',
                        data: receitasContribuinte,
                        backgroundColor: coresGraficos.receitas,
                        borderColor: coresGraficos.receitasBorda,
                        borderWidth: 1
                    },
                    {
                        label: 'Despesas',
                        data: despesasContribuinte,
                        backgroundColor: coresGraficos.despesas,
                        borderColor: coresGraficos.despesasBorda,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatarMoeda(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatarMoeda(context.raw);
                            }
                        }
                    }
                }
            }
        });
        
        // Gráfico de Linha - Oficial
        chartLinhaOficial = new Chart(graficoLinhaOficial, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Saldo',
                        data: saldosContribuinte,
                        backgroundColor: coresGraficos.saldo,
                        borderColor: coresGraficos.saldoBorda,
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return formatarMoeda(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatarMoeda(context.raw);
                            }
                        }
                    }
                }
            }
        });
        
        // Gráfico de Barras - Real
        chartBarrasReal = new Chart(graficoBarrasReal, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Receitas',
                        data: receitasBolso,
                        backgroundColor: coresGraficos.receitas,
                        borderColor: coresGraficos.receitasBorda,
                        borderWidth: 1
                    },
                    {
                        label: 'Despesas',
                        data: despesasBolso,
                        backgroundColor: coresGraficos.despesas,
                        borderColor: coresGraficos.despesasBorda,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatarMoeda(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatarMoeda(context.raw);
                            }
                        }
                    }
                }
            }
        });
        
        // Gráfico de Linha - Real
        chartLinhaReal = new Chart(graficoLinhaReal, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Saldo',
                        data: saldosBolso,
                        backgroundColor: coresGraficos.saldo,
                        borderColor: coresGraficos.saldoBorda,
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return formatarMoeda(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatarMoeda(context.raw);
                            }
                        }
                    }
                }
            }
        });
        
        // Gráficos de Pizza por Empresa
        const empresas = Object.keys(dadosEmpresa);
        const receitasEmpresaContribuinte = empresas.map(empresa => dadosEmpresa[empresa].receitasContribuinte);
        const receitasEmpresaBolso = empresas.map(empresa => dadosEmpresa[empresa].receitasBolso);
        
        // Gráfico de Pizza - Oficial
        chartPizzaEmpresaOficial = new Chart(graficoPizzaEmpresaOficial, {
            type: 'pie',
            data: {
                labels: empresas,
                datasets: [
                    {
                        data: receitasEmpresaContribuinte,
                        backgroundColor: coresGraficos.empresas,
                        borderColor: coresGraficos.empresasBorda,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = formatarMoeda(context.raw);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.raw / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Gráfico de Pizza - Real
        chartPizzaEmpresaReal = new Chart(graficoPizzaEmpresaReal, {
            type: 'pie',
            data: {
                labels: empresas,
                datasets: [
                    {
                        data: receitasEmpresaBolso,
                        backgroundColor: coresGraficos.empresas,
                        borderColor: coresGraficos.empresasBorda,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = formatarMoeda(context.raw);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.raw / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Função para atualizar estatísticas
    async function atualizarEstatisticas() {
        try {
            // Obter dados
            const { estatisticas, transacoes, filtros } = await obterDadosEstatisticas();
            
            // Atualizar resumo
            atualizarResumo(estatisticas);
            
            // Processar dados por período
            const dadosPeriodo = processarDadosPorPeriodo(transacoes, filtros.periodo || 'mes');
            
            // Processar dados por empresa
            const dadosEmpresa = processarDadosPorEmpresa(transacoes);
            
            // Atualizar tabela
            atualizarTabela(dadosPeriodo, filtros.periodo || 'mes');
            
            // Atualizar gráficos
            atualizarGraficos(dadosPeriodo, dadosEmpresa);
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar estatísticas', 'danger');
        }
    }
    
    // Inicializar filtros
    preencherFiltros();
    
    // Carregar estatísticas iniciais
    atualizarEstatisticas();
    
    // Configurar formulário de filtro
    if (formFiltro) {
        formFiltro.addEventListener('submit', function(e) {
            e.preventDefault();
            atualizarEstatisticas();
        });
    }
    
    // Configurar botão de limpar filtro
    if (btnLimparFiltro) {
        btnLimparFiltro.addEventListener('click', function() {
            formFiltro.reset();
            atualizarEstatisticas();
        });
    }
    
    // Configurar abas
    tabsBtn.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover classe active de todos os botões
            tabsBtn.forEach(b => b.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado
            this.classList.add('active');
            
            // Mostrar conteúdo da aba
            const tabId = this.getAttribute('data-tab');
            
            // Esconder todos os conteúdos
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Mostrar conteúdo selecionado
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Adicionar CSS para abas
    const style = document.createElement('style');
    style.textContent = `
        .tabs {
            display: flex;
            border-bottom: 1px solid #ddd;
            margin-bottom: 1rem;
        }
        
        .tab-btn {
            padding: 0.75rem 1.5rem;
            background: none;
            border: none;
            cursor: pointer;
            font-weight: 500;
            color: #6c757d;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }
        
        .tab-btn:hover {
            color: #2c3e50;
        }
        
        .tab-btn.active {
            color: #3498db;
            border-bottom-color: #3498db;
        }
        
        .tab-content {
            position: relative;
        }
        
        .tab-pane {
            display: none;
        }
        
        .tab-pane.active {
            display: block;
            animation: fadeIn 0.3s;
        }
    `;
    
    document.head.appendChild(style);
});
