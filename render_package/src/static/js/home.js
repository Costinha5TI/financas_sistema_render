// Funcionalidades específicas da página inicial
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const receitasMes = document.getElementById('receitas-mes');
    const despesasMes = document.getElementById('despesas-mes');
    const saldoMes = document.getElementById('saldo-mes');
    const tabelaUltimasTransacoes = document.getElementById('ultimas-transacoes');
    const tbodyTransacoes = tabelaUltimasTransacoes.querySelector('tbody');
    const empresasLista = document.getElementById('empresas-lista');
    
    // Carregar resumo financeiro do mês atual
    async function carregarResumoMes() {
        try {
            // Obter data atual
            const hoje = new Date();
            const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            
            // Formatar datas para API
            const dataInicio = primeiroDiaMes.toISOString().split('T')[0];
            const dataFim = ultimoDiaMes.toISOString().split('T')[0];
            
            // Carregar estatísticas
            const estatisticas = await carregarEstatisticas({
                periodo: 'mes',
                data_inicio: dataInicio,
                data_fim: dataFim
            });
            
            // Atualizar elementos
            receitasMes.textContent = formatarMoeda(estatisticas.bolso.receitas);
            despesasMes.textContent = formatarMoeda(estatisticas.bolso.despesas);
            saldoMes.textContent = formatarMoeda(estatisticas.bolso.saldo);
            
            // Aplicar cor ao saldo
            if (estatisticas.bolso.saldo >= 0) {
                saldoMes.classList.remove('text-danger');
                saldoMes.classList.add('text-success');
            } else {
                saldoMes.classList.remove('text-success');
                saldoMes.classList.add('text-danger');
            }
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar resumo financeiro', 'danger');
        }
    }
    
    // Carregar últimas transações
    async function carregarUltimasTransacoes() {
        try {
            // Carregar transações
            const transacoes = await carregarTransacoes();
            
            // Limitar a 5 transações mais recentes
            const ultimasTransacoes = transacoes.slice(0, 5);
            
            // Limpar tabela
            tbodyTransacoes.innerHTML = '';
            
            // Preencher tabela
            ultimasTransacoes.forEach(transacao => {
                const tr = document.createElement('tr');
                
                // Formatar data
                const data = new Date(transacao.data_transacao);
                const dataFormatada = data.toLocaleDateString('pt-PT');
                
                tr.innerHTML = `
                    <td>${dataFormatada}</td>
                    <td>${transacao.empresa_nome || '-'}</td>
                    <td>
                        <span class="badge ${transacao.tipo === 'receita' ? 'badge-success' : 'badge-danger'}">
                            ${transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                    </td>
                    <td class="${transacao.tipo === 'receita' ? 'text-success' : 'text-danger'}">
                        ${formatarMoeda(transacao.valor_bolso)}
                    </td>
                `;
                
                tbodyTransacoes.appendChild(tr);
            });
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar últimas transações', 'danger');
        }
    }
    
    // Carregar lista de empresas
    async function carregarListaEmpresas() {
        try {
            // Carregar empresas
            const empresas = await carregarEmpresas();
            
            // Limpar lista
            empresasLista.innerHTML = '';
            
            // Preencher lista
            empresas.forEach(empresa => {
                const div = document.createElement('div');
                div.className = 'mb-2';
                
                div.innerHTML = `
                    <a href="/transacoes.html?empresa_id=${empresa.id}" class="d-flex justify-between align-center p-2" style="text-decoration: none; color: inherit; border: 1px solid #eee; border-radius: 4px;">
                        <div>
                            <strong>${empresa.nome}</strong>
                            ${empresa.tipo ? `<div><small>${empresa.tipo}</small></div>` : ''}
                        </div>
                        <i class="fas fa-chevron-right"></i>
                    </a>
                `;
                
                empresasLista.appendChild(div);
            });
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar lista de empresas', 'danger');
        }
    }
    
    // Inicializar
    carregarResumoMes();
    carregarUltimasTransacoes();
    carregarListaEmpresas();
});
