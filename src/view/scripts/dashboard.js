// Dashboard.js - Analytics and data visualization

// Chart instances
let sessionsChart, eventsChart, engagementChart, performanceChart;

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/recordings');
        const recordings = await response.json();
        
        updateStats(recordings);
        updateRecentRecordingsTable(recordings.slice(0, 10));
        initializeCharts(recordings);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showEmptyState();
    }
}

class Dashboard {
    constructor() {
        this.recordings = [];
        this.eventTypeChart = null;
        this.init();
    }

    async init() {
        await this.loadRecordings();
        this.renderStats();
        this.renderEventTypeChart();
        this.renderRecordingsTimeline();
        this.renderRecentRecordings();
        this.setupRefreshButton();
    }

    async loadRecordings() {
        try {
            const storageKey = 'session_recordings';
            const data = localStorage.getItem(storageKey);
            
            if (!data) {
                this.recordings = [];
                return;
            }

            const parsedData = JSON.parse(data);
            this.recordings = Array.isArray(parsedData) ? parsedData : [];
            
            // Convert date strings to Date objects
            this.recordings = this.recordings.map(rec => ({
                ...rec,
                startTime: new Date(rec.startTime),
                endTime: new Date(rec.endTime)
            }));
        } catch (error) {
            console.error('Error loading recordings:', error);
            this.recordings = [];
        }
    }

    renderStats() {
        // Total Recordings
        const totalRecordings = this.recordings.length;
        document.getElementById('totalRecordings').textContent = totalRecordings;

        // Total Duration
        const totalDuration = this.recordings.reduce((sum, rec) => {
            const duration = rec.endTime - rec.startTime;
            return sum + duration;
        }, 0);
        document.getElementById('totalDuration').textContent = this.formatDuration(totalDuration);

        // Last Recording
        if (this.recordings.length > 0) {
            const sortedRecordings = [...this.recordings].sort((a, b) => b.startTime - a.startTime);
            const lastRecording = sortedRecordings[0];
            document.getElementById('lastRecording').textContent = this.formatDate(lastRecording.startTime);
        } else {
            document.getElementById('lastRecording').textContent = 'Nenhuma';
        }

        // Total Events
        const totalEvents = this.recordings.reduce((sum, rec) => {
            return sum + (rec.events ? rec.events.length : 0);
        }, 0);
        document.getElementById('totalEvents').textContent = totalEvents.toLocaleString();
    }

    renderEventTypeChart() {
        const canvas = document.getElementById('eventTypeChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Count events by type
        const eventCounts = {};
        this.recordings.forEach(rec => {
            if (rec.events) {
                rec.events.forEach(event => {
                    const type = event.type || 'UNKNOWN';
                    eventCounts[type] = (eventCounts[type] || 0) + 1;
                });
            }
        });

        // Sort by count
        const sortedEvents = Object.entries(eventCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 9); // Top 9 events

        if (sortedEvents.length === 0) {
            ctx.fillStyle = '#a0aec0';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhum evento registrado', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Draw chart
        const colors = [
            '#667eea', '#764ba2', '#f5576c', '#43e97b', '#ffc107',
            '#4facfe', '#00f2fe', '#f093fb', '#4facfe'
        ];

        const total = sortedEvents.reduce((sum, [, count]) => sum + count, 0);
        let startAngle = -Math.PI / 2;

        sortedEvents.forEach(([type, count], index) => {
            const sliceAngle = (count / total) * 2 * Math.PI;
            
            ctx.fillStyle = colors[index % colors.length];
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, canvas.height / 2);
            ctx.arc(
                canvas.width / 2,
                canvas.height / 2,
                Math.min(canvas.width, canvas.height) / 2 - 10,
                startAngle,
                startAngle + sliceAngle
            );
            ctx.closePath();
            ctx.fill();
            
            startAngle += sliceAngle;
        });

        // Render legend
        this.renderEventTypeLegend(sortedEvents, colors);
    }

    renderEventTypeLegend(events, colors) {
        const chartCard = document.querySelector('.chart-card');
        const existingList = chartCard.querySelector('.event-type-list');
        
        if (existingList) {
            existingList.remove();
        }

        const list = document.createElement('div');
        list.className = 'event-type-list';

        events.forEach(([type, count], index) => {
            const item = document.createElement('div');
            item.className = 'event-type-item';
            item.innerHTML = `
                <div class="event-type-name">
                    <div class="event-type-color" style="background: ${colors[index % colors.length]}"></div>
                    <span>${this.formatEventType(type)}</span>
                </div>
                <span class="event-type-count">${count.toLocaleString()}</span>
            `;
            list.appendChild(item);
        });

        chartCard.appendChild(list);
    }

    renderRecordingsTimeline() {
        const container = document.getElementById('recordingsTimeline');
        if (!container) return;

        container.innerHTML = '';

        if (this.recordings.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 2rem;">Nenhuma gravação registrada</p>';
            return;
        }

        // Sort recordings by date (most recent first)
        const sortedRecordings = [...this.recordings]
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, 10); // Show last 10 recordings

        sortedRecordings.forEach(rec => {
            const duration = rec.endTime - rec.startTime;
            const eventCount = rec.events ? rec.events.length : 0;

            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-time">${this.formatDate(rec.startTime)}</div>
                <div class="timeline-content">
                    <div class="timeline-title">Gravação #${rec.id.substring(0, 8)}</div>
                    <div class="timeline-desc">${this.formatDuration(duration)} • ${eventCount} eventos</div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    renderRecentRecordings() {
        const tbody = document.querySelector('#recentRecordingsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.recordings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #a0aec0;">Nenhuma gravação registrada</td></tr>';
            return;
        }

        // Sort recordings by date (most recent first)
        const sortedRecordings = [...this.recordings]
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, 5); // Show last 5 recordings

        sortedRecordings.forEach(rec => {
            const duration = rec.endTime - rec.startTime;
            const eventCount = rec.events ? rec.events.length : 0;
            const pageUrl = rec.pageUrl || 'N/A';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><code>#${rec.id.substring(0, 8)}</code></td>
                <td>${this.formatDateTime(rec.startTime)}</td>
                <td>${this.formatDuration(duration)}</td>
                <td>${eventCount}</td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${pageUrl}">${pageUrl}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewRecording('${rec.id}')">
                        <span>▶️</span> Ver
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    setupRefreshButton() {
        const refreshBtn = document.querySelector('.header-actions .btn-primary');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.init();
            });
        }
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Hoje';
        } else if (days === 1) {
            return 'Ontem';
        } else if (days < 7) {
            return `${days} dias atrás`;
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    }

    formatDateTime(date) {
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatEventType(type) {
        const typeMap = {
            'MOUSE_MOVE': 'Movimento do Mouse',
            'MOUSE_CLICK': 'Clique do Mouse',
            'MOUSE_SCROLL': 'Scroll do Mouse',
            'KEY_PRESS': 'Tecla Pressionada',
            'KEY_DOWN': 'Tecla Descida',
            'KEY_UP': 'Tecla Solta',
            'NAVIGATION': 'Navegação',
            'RESIZE': 'Redimensionamento',
            'CUSTOM': 'Customizado'
        };
        return typeMap[type] || type;
    }
}

// Global function to view recording
function viewRecording(id) {
    window.location.href = `player.html?id=${id}`;
}

// Helper functions
function generateSessionsData(recordings, days) {
    const labels = [];
    const values = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(formatDateShort(date));
        
        const count = recordings.filter(r => {
            const recordingDate = new Date(r.startTime);
            return recordingDate.toDateString() === date.toDateString();
        }).length;
        
        values.push(count);
    }

    return { labels, values };
}

function aggregateEventTypes(recordings) {
    const types = {};
    recordings.forEach(recording => {
        recording.events?.forEach(event => {
            const type = event.type || 'unknown';
            types[type] = (types[type] || 0) + 1;
        });
    });
    return types;
}

function calculateDurationBuckets(recordings) {
    const buckets = [0, 0, 0, 0, 0]; // 0-2, 2-5, 5-10, 10-20, 20+
    
    recordings.forEach(r => {
        const minutes = (r.duration || 0) / 60000;
        if (minutes <= 2) buckets[0]++;
        else if (minutes <= 5) buckets[1]++;
        else if (minutes <= 10) buckets[2]++;
        else if (minutes <= 20) buckets[3]++;
        else buckets[4]++;
    });
    
    return buckets;
}

function calculatePerformanceMetrics(recordings) {
    // Mock metrics - replace with real calculations
    return [
        Math.floor(Math.random() * 30) + 70, // Velocidade
        Math.floor(Math.random() * 30) + 60, // Interação
        Math.floor(Math.random() * 20) + 75, // Navegação
        Math.floor(Math.random() * 40) + 50, // Engajamento
        Math.floor(Math.random() * 30) + 65  // Conversão
    ];
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('pt-BR');
}

function formatDateShort(date) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
    // Load dashboard data
    loadDashboardData();
});
