let behaviorFlowChart, eventTimelineChart, conversionFunnelChart;
let topPagesChart, retentionChart;

// Load analytics data
async function loadAnalyticsData() {
    try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        initializeCharts(data);
        updateTopEventsTable(data.topEvents || []);
    } catch (error) {
        console.error('Error loading analytics:', error);
        // Load with mock data
        initializeCharts(getMockData());
    }
}

// Initialize all charts
function initializeCharts(data) {
    initBehaviorFlowChart();
    initEventTimelineChart();
    initConversionFunnelChart();
    initTopPagesChart();
    initRetentionChart();
}

// Behavior Flow Chart
function initBehaviorFlowChart() {
    const ctx = document.getElementById('behaviorFlowChart');
    behaviorFlowChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Entrada', 'Home', 'Produtos', 'Detalhes', 'Carrinho', 'Checkout', 'Sucesso'],
            datasets: [{
                label: 'Fluxo principal',
                data: [1000, 850, 650, 480, 320, 210, 185],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.parsed.y / 1000) * 100).toFixed(1);
                            return `${context.parsed.y} usuários (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { color: '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });
}

// Event Timeline Chart
function initEventTimelineChart() {
    const ctx = document.getElementById('eventTimelineChart');
    eventTimelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            datasets: [{
                label: 'Eventos por hora',
                data: [245, 189, 276, 412, 389, 324],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { color: '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });
}

// Conversion Funnel Chart
function initConversionFunnelChart() {
    const ctx = document.getElementById('conversionFunnelChart');
    conversionFunnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Visitantes', 'Produtos', 'Carrinho', 'Checkout', 'Compra'],
            datasets: [{
                label: 'Usuários',
                data: [1000, 750, 450, 280, 185],
                backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.parsed.x / 1000) * 100).toFixed(1);
                            return `${context.parsed.x} usuários (${percentage}% do total)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { color: '#64748b' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });
}

// Top Pages Chart
function initTopPagesChart() {
    const ctx = document.getElementById('topPagesChart');
    topPagesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['/home', '/produtos', '/checkout', '/perfil', '/contato'],
            datasets: [{
                label: 'Visualizações',
                data: [2847, 1956, 1243, 892, 654],
                backgroundColor: '#2563eb',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { color: '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });
}

// Retention Chart
function initRetentionChart() {
    const ctx = document.getElementById('retentionChart');
    retentionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Dia 1', 'Dia 2', 'Dia 3', 'Dia 7', 'Dia 14', 'Dia 30'],
            datasets: [{
                label: 'Taxa de Retenção',
                data: [100, 68, 52, 38, 28, 22],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y}% dos usuários`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: '#f1f5f9' },
                    ticks: {
                        color: '#64748b',
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });
}

// Update top events table
function updateTopEventsTable(events) {
    const tbody = document.getElementById('topEventsTable');
    if (!tbody) return;

    // Mock data if no events provided
    if (!events || events.length === 0) {
        return; // Table already has sample data in HTML
    }

    tbody.innerHTML = events.map(event => `
        <tr>
            <td>${event.name}</td>
            <td><span class="event-badge ${event.type}">${formatEventType(event.type)}</span></td>
            <td>${event.count.toLocaleString()}</td>
            <td>${event.percentage}%</td>
            <td>
                <span class="stat-change ${event.trend > 0 ? 'positive' : 'negative'}">
                    <span>${event.trend > 0 ? '↑' : '↓'}</span>
                    ${Math.abs(event.trend)}%
                </span>
            </td>
        </tr>
    `).join('');
}

// Export analytics report
function exportAnalytics() {
    const period = document.getElementById('analyticsPeriod')?.value || '30';
    const data = {
        period: period,
        generatedAt: new Date().toISOString(),
        stats: {
            engagementRate: '72.4%',
            avgSessionTime: '8m 42s',
            bounceRate: '28.6%',
            pagesPerSession: '4.2'
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Get mock data
function getMockData() {
    return {
        topEvents: [
            { name: 'Clique no botão "Comprar"', type: 'mouseclick', count: 2547, percentage: 18.2, trend: 12 },
            { name: 'Navegação para /produtos', type: 'navigation', count: 1892, percentage: 13.5, trend: 8 },
            { name: 'Busca por "tênis"', type: 'keypress', count: 1456, percentage: 10.4, trend: -3 }
        ]
    };
}

// Format event type
function formatEventType(type) {
    const types = {
        mouseclick: 'Click',
        navigation: 'Navegação',
        keypress: 'Teclado',
        mousemove: 'Movimento'
    };
    return types[type] || type;
}

// Period filter change
document.getElementById('analyticsPeriod')?.addEventListener('change', (e) => {
    loadAnalyticsData();
});

// Event type filter change
document.getElementById('eventTypeFilter')?.addEventListener('change', (e) => {
    loadAnalyticsData();
});

// Initialize on load
document.addEventListener('DOMContentLoaded', loadAnalyticsData);
