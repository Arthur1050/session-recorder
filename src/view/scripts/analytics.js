
// Usar a biblioteca SessionRecorder já compilada e serviço de API
const { EventType } = window;
// const apiService é importado via script tag// Estado
let allSessions = [];
let charts = {};

// Função para analisar eventos por tipo
function analyzeEventsByType(sessions) {
    const eventCounts = {};
    
    sessions.forEach(session => {
        session.events.forEach(event => {
            eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
        });
    });
    
    return eventCounts;
}

// Função para criar gráfico de comportamento
function createBehaviorFlowChart(sessions) {
    const ctx = document.getElementById('behaviorFlowChart');
    if (!ctx) return;
    
    const eventsByType = analyzeEventsByType(sessions);
    
    if (charts.behaviorFlow) {
        charts.behaviorFlow.destroy();
    }
    
    charts.behaviorFlow = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(eventsByType),
            datasets: [{
                label: 'Eventos por Tipo',
                data: Object.values(eventsByType),
                backgroundColor: [
                    'rgba(37, 99, 235, 0.6)',
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(245, 158, 11, 0.6)',
                    'rgba(239, 68, 68, 0.6)',
                    'rgba(139, 92, 246, 0.6)'
                ],
                borderColor: [
                    'rgb(37, 99, 235)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 158, 11)',
                    'rgb(239, 68, 68)',
                    'rgb(139, 92, 246)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Função para criar gráfico de timeline
function createEventTimelineChart(sessions) {
    const ctx = document.getElementById('eventTimelineChart');
    if (!ctx) return;
    
    // Agrupar eventos por hora do dia
    const hourCounts = new Array(24).fill(0);
    
    sessions.forEach(session => {
        session.events.forEach(event => {
            const hour = new Date(event.timestamp).getHours();
            hourCounts[hour]++;
        });
    });
    
    if (charts.eventTimeline) {
        charts.eventTimeline.destroy();
    }
    
    charts.eventTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Eventos por Hora',
                data: hourCounts,
                borderColor: 'rgb(37, 99, 235)',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Função para criar gráfico de páginas mais visitadas
function createTopPagesChart(sessions) {
    const ctx = document.getElementById('topPagesChart');
    if (!ctx) return;
    
    const pageCounts = {};
    
    sessions.forEach(session => {
        const url = session.pageUrl || 'Desconhecido';
        const path = new URL(url, 'http://localhost').pathname;
        pageCounts[path] = (pageCounts[path] || 0) + 1;
    });
    
    const sortedPages = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (charts.topPages) {
        charts.topPages.destroy();
    }
    
    charts.topPages = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sortedPages.map(([page]) => page),
            datasets: [{
                data: sortedPages.map(([, count]) => count),
                backgroundColor: [
                    'rgba(37, 99, 235, 0.6)',
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(245, 158, 11, 0.6)',
                    'rgba(239, 68, 68, 0.6)',
                    'rgba(139, 92, 246, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Função para criar gráfico de funil de conversão
function createConversionFunnelChart(sessions) {
    const ctx = document.getElementById('conversionFunnelChart');
    if (!ctx) return;
    
    const totalSessions = sessions.length;
    const clickEvents = sessions.filter(s => s.events.some(e => e.type === 'mouseclick')).length;
    const navigationEvents = sessions.filter(s => s.events.some(e => e.type === 'navigation')).length;
    
    if (charts.conversionFunnel) {
        charts.conversionFunnel.destroy();
    }
    
    charts.conversionFunnel = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Sessões Iniciadas', 'Com Cliques', 'Com Navegação'],
            datasets: [{
                label: 'Conversão',
                data: [totalSessions, clickEvents, navigationEvents],
                backgroundColor: 'rgba(37, 99, 235, 0.6)',
                borderColor: 'rgb(37, 99, 235)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Função para criar gráfico de retenção
function createRetentionChart(sessions) {
    const ctx = document.getElementById('retentionChart');
    if (!ctx) return;
    
    // Simular dados de retenção
    const retentionData = [100, 85, 72, 65, 58, 52, 48];
    
    if (charts.retention) {
        charts.retention.destroy();
    }
    
    charts.retention = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Dia 1', 'Dia 2', 'Dia 3', 'Dia 4', 'Dia 5', 'Dia 6', 'Dia 7'],
            datasets: [{
                label: 'Retenção (%)',
                data: retentionData,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Função para atualizar tabela de eventos
function updateTopEventsTable(sessions) {
    const tbody = document.getElementById('topEventsTable');
    if (!tbody) return;
    
    const eventsByType = analyzeEventsByType(sessions);
    const totalEvents = Object.values(eventsByType).reduce((sum, count) => sum + count, 0);
    
    const sortedEvents = Object.entries(eventsByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    tbody.innerHTML = '';
    
    sortedEvents.forEach(([type, count]) => {
        const percentage = ((count / totalEvents) * 100).toFixed(1);
        const trend = Math.random() > 0.5 ? 'positive' : 'negative';
        const trendValue = (Math.random() * 20).toFixed(0);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Evento de ${type}</td>
            <td><span class="event-badge ${type}">${type}</span></td>
            <td>${count.toLocaleString()}</td>
            <td>${percentage}%</td>
            <td>
                <span class="stat-change ${trend}">
                    <span>${trend === 'positive' ? '↑' : '↓'}</span> ${trendValue}%
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Função para carregar e analisar dados
async function loadAnalyticsData() {
    try {
        allSessions = await apiService.getAllSessions();
        
        if (allSessions.length === 0) {
            console.warn('Nenhuma sessão disponível para análise');
            return;
        }
        
        // Criar todos os gráficos
        createBehaviorFlowChart(allSessions);
        createEventTimelineChart(allSessions);
        createTopPagesChart(allSessions);
        createConversionFunnelChart(allSessions);
        createRetentionChart(allSessions);
        
        // Atualizar tabela
        updateTopEventsTable(allSessions);
        
    } catch (error) {
        console.error('Erro ao carregar dados de analytics:', error);
    }
}

// Função para exportar relatório
window.exportAnalytics = function() {
    if (allSessions.length === 0) {
        alert('Nenhum dado disponível para exportar');
        return;
    }
    
    const report = {
        generatedAt: new Date().toISOString(),
        totalSessions: allSessions.length,
        totalEvents: allSessions.reduce((sum, s) => sum + s.events.length, 0),
        eventsByType: analyzeEventsByType(allSessions),
        sessions: allSessions.map(s => ({
            id: s.id,
            userId: s.userId,
            startTime: s.startTime,
            endTime: s.endTime,
            eventCount: s.events.length,
            pageUrl: s.pageUrl
        }))
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadAnalyticsData();
    
    // Filtros de período
    const periodSelect = document.getElementById('analyticsPeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', () => {
            // Filtrar por período (implementação futura)
            loadAnalyticsData();
        });
    }
    
    // Filtro de tipo de evento
    const eventTypeFilter = document.getElementById('eventTypeFilter');
    if (eventTypeFilter) {
        eventTypeFilter.addEventListener('change', () => {
            // Filtrar por tipo (implementação futura)
            loadAnalyticsData();
        });
    }
});
