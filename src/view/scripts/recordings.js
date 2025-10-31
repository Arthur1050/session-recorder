// Usar a biblioteca SessionRecorder já compilada
const { LocalStorageAdapter } = window;
const storageAdapter = new LocalStorageAdapter();

// Estado
let allSessions = [];
let filteredSessions = [];
let currentPage = 1;
const itemsPerPage = 10;

// Função para formatar data
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Função para formatar duração
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

// Função para calcular duração da sessão
function getSessionDuration(session) {
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    return end - start;
}

// Função para carregar sessões
async function loadSessions() {
    try {
        allSessions = await apiService.getAllSessions();
        allSessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        filteredSessions = [...allSessions];
        renderTable();
        updatePagination();
    } catch (error) {
        console.error('Erro ao carregar sessões:', error);
    }
}

// Função para renderizar tabela
function renderTable() {
    const tbody = document.getElementById('recordingsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filteredSessions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
                    Nenhuma gravação encontrada
                </td>
            </tr>
        `;
        return;
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageSessions = filteredSessions.slice(start, end);
    
    pageSessions.forEach(session => {
        const row = document.createElement('tr');
        const duration = getSessionDuration(session);
        
        row.innerHTML = `
            <td>
                <code style="font-size: 11px;">${session.id.substring(0, 8)}...</code>
            </td>
            <td>${session.userId || 'anonymous'}</td>
            <td>${formatDate(session.startTime)}</td>
            <td>${formatDuration(duration)}</td>
            <td>${session.events.length}</td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="viewSession('${session.id}')">
                    👁️ Ver
                </button>
                <button class="btn btn-ghost btn-sm" onclick="playSession('${session.id}')">
                    ▶️ Reproduzir
                </button>
                <button class="btn btn-ghost btn-sm" onclick="deleteSession('${session.id}')">
                    🗑️ Deletar
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Função para atualizar paginação
function updatePagination() {
    const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
    const pagination = document.querySelector('.pagination');
    
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    // Botão anterior
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = '←';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            updatePagination();
        }
    };
    pagination.appendChild(prevBtn);
    
    // Páginas
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            renderTable();
            updatePagination();
        };
        pagination.appendChild(pageBtn);
    }
    
    // Botão próximo
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = '→';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            updatePagination();
        }
    };
    pagination.appendChild(nextBtn);
}

// Função para filtrar sessões
function filterSessions() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    
    filteredSessions = allSessions.filter(session => {
        // Filtro de busca
        const matchesSearch = !searchTerm || 
            session.id.toLowerCase().includes(searchTerm) ||
            session.userId.toLowerCase().includes(searchTerm);
        
        // Filtro de data
        let matchesDate = true;
        if (dateFilter !== 'all') {
            const sessionDate = new Date(session.startTime);
            const now = new Date();
            const diffDays = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24));
            
            switch (dateFilter) {
                case 'today':
                    matchesDate = diffDays === 0;
                    break;
                case 'week':
                    matchesDate = diffDays <= 7;
                    break;
                case 'month':
                    matchesDate = diffDays <= 30;
                    break;
            }
        }
        
        return matchesSearch && matchesDate;
    });
    
    currentPage = 1;
    renderTable();
    updatePagination();
}

// Função para ver detalhes da sessão
window.viewSession = function(sessionId) {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    alert(`Sessão: ${sessionId}\nUsuário: ${session.userId}\nEventos: ${session.events.length}\nURL: ${session.pageUrl || 'N/A'}`);
};

// Função para reproduzir sessão
window.playSession = function(sessionId) {
    // Salvar ID da sessão no sessionStorage e redirecionar para o player
    sessionStorage.setItem('selectedSessionId', sessionId);
    window.location.href = '../player/index.html';
};

// Função para deletar sessão
window.deleteSession = async function(sessionId) {
    if (!confirm('Tem certeza que deseja deletar esta gravação?')) {
        return;
    }
    
    try {
        await apiService.deleteSession(sessionId);
        await loadSessions();
        alert('Gravação deletada com sucesso!');
    } catch (error) {
        console.error('Erro ao deletar sessão:', error);
        alert('Erro ao deletar gravação');
    }
};

// Função para deletar todas as sessões
window.deleteAllSessions = async function() {
    if (!confirm('Tem certeza que deseja deletar TODAS as gravações? Esta ação não pode ser desfeita!')) {
        return;
    }
    
    try {
        const sessions = await apiService.getAllSessions();
        const sessionIds = sessions.map(s => s.id);
        await apiService.deleteSessions(sessionIds);
        await loadSessions();
        alert('Todas as gravações foram deletadas!');
    } catch (error) {
        console.error('Erro ao deletar todas as sessões:', error);
        alert('Erro ao deletar gravações');
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSessions();
    
    // Filtros
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterSessions);
    }
    
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', filterSessions);
    }
});
