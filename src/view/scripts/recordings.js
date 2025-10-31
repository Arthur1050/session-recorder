// Recordings.js - Recordings list management

let allRecordings = [];
let filteredRecordings = [];
let currentPage = 1;
const recordingsPerPage = 12;
let recordingToDelete = null;

class RecordingsManager {
    constructor() {
        this.recordings = [];
        this.filteredRecordings = [];
        this.currentPage = 1;
        this.perPage = 10;
        this.sortBy = 'date-desc';
        this.searchQuery = '';
        this.deleteModalId = null;
        
        this.init();
    }

    async init() {
        await this.loadRecordings();
        this.setupEventListeners();
        this.render();
    }

    async loadRecordings() {
        try {
            const response = await fetch('/api/recordings');
            allRecordings = await response.json();
            filteredRecordings = [...allRecordings];
            this.applyFilters();
            this.renderRecordings();
            this.renderPagination();
        } catch (error) {
            console.error('Error loading recordings:', error);
            this.showEmptyState();
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.currentPage = 1;
                this.applyFilters();
                this.render();
            });
        }

        // Sort by dropdown
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyFilters();
                this.render();
            });
        }

        // Per page dropdown
        const perPage = document.getElementById('perPage');
        if (perPage) {
            perPage.addEventListener('change', (e) => {
                this.perPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.render();
            });
        }

        // Clear all button
        const clearAllBtn = document.querySelector('.btn-danger');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.showDeleteModal('all');
            });
        }

        // Modal close buttons
        const closeModalBtns = document.querySelectorAll('.close-modal, .cancel-delete');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideDeleteModal();
            });
        });

        // Modal confirm delete
        const confirmDeleteBtn = document.querySelector('.confirm-delete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.confirmDelete();
            });
        }

        // Modal backdrop click
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideDeleteModal();
                }
            });
        }
    }

    applyFilters() {
        let filtered = [...allRecordings];

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(rec => {
                const id = rec.id.toLowerCase();
                const url = (rec.pageUrl || '').toLowerCase();
                const date = this.formatDateTime(rec.startTime).toLowerCase();
                
                return id.includes(this.searchQuery) ||
                       url.includes(this.searchQuery) ||
                       date.includes(this.searchQuery);
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'date-desc':
                    return b.startTime - a.startTime;
                case 'date-asc':
                    return a.startTime - b.startTime;
                case 'duration-desc':
                    return (b.endTime - b.startTime) - (a.endTime - a.startTime);
                case 'duration-asc':
                    return (a.endTime - a.startTime) - (b.endTime - b.startTime);
                case 'events-desc':
                    return (b.events?.length || 0) - (a.events?.length || 0);
                case 'events-asc':
                    return (a.events?.length || 0) - (b.events?.length || 0);
                default:
                    return 0;
            }
        });

        this.filteredRecordings = filtered;
    }

    render() {
        this.updateInfoBanner();
        this.renderRecordings();
        this.renderPagination();
    }

    updateInfoBanner() {
        const recordingsCount = document.getElementById('recordingsCount');
        const selectedCount = document.getElementById('selectedCount');

        if (recordingsCount) {
            recordingsCount.textContent = this.recordings.length;
        }
        if (selectedCount) {
            selectedCount.textContent = this.filteredRecordings.length;
        }
    }

    renderRecordings() {
        const grid = document.getElementById('recordingsGrid');
        const emptyState = document.getElementById('emptyState');

        if (!grid || !emptyState) return;

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.perPage;
        const endIndex = startIndex + this.perPage;
        const pageRecordings = this.filteredRecordings.slice(startIndex, endIndex);

        if (pageRecordings.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            
            if (this.recordings.length === 0) {
                emptyState.querySelector('p').textContent = 'Nenhuma gravação registrada ainda.';
            } else {
                emptyState.querySelector('p').textContent = 'Nenhuma gravação encontrada com os filtros aplicados.';
            }
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        grid.innerHTML = '';

        pageRecordings.forEach(rec => {
            const duration = rec.endTime - rec.startTime;
            const eventCount = rec.events ? rec.events.length : 0;
            const pageUrl = rec.pageUrl || 'N/A';

            const card = document.createElement('div');
            card.className = 'recording-card';
            card.innerHTML = `
                <div class="recording-header">
                    <span class="recording-id">#${rec.id.substring(0, 8)}</span>
                    <span class="recording-date">${this.formatDate(rec.startTime)}</span>
                </div>
                <div class="recording-url" title="${pageUrl}">${pageUrl}</div>
                <div class="recording-stats">
                    <div class="recording-stat">
                        <div class="stat-label">Duração</div>
                        <div class="stat-value">${this.formatDuration(duration)}</div>
                    </div>
                    <div class="recording-stat">
                        <div class="stat-label">Eventos</div>
                        <div class="stat-value">${eventCount}</div>
                    </div>
                    <div class="recording-stat">
                        <div class="stat-label">Data/Hora</div>
                        <div class="stat-value">${this.formatTime(rec.startTime)}</div>
                    </div>
                    <div class="recording-stat">
                        <div class="stat-label">User Agent</div>
                        <div class="stat-value" title="${rec.userAgent || 'N/A'}">${this.truncate(rec.userAgent || 'N/A', 20)}</div>
                    </div>
                </div>
                <div class="recording-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewRecording('${rec.id}')">
                        <span>▶️</span> Reproduzir
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecording('${rec.id}')">
                        <span>🗑️</span> Excluir
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredRecordings.length / this.perPage);

        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        pagination.innerHTML = '';

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = '← Anterior';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.render();
            }
        });
        pagination.appendChild(prevBtn);

        // Page numbers
        const maxPages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(totalPages, startPage + maxPages - 1);

        if (endPage - startPage < maxPages - 1) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-btn';
            if (i === this.currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.render();
            });
            pagination.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = 'Próximo →';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.render();
            }
        });
        pagination.appendChild(nextBtn);
    }

    showDeleteModal(id) {
        this.deleteModalId = id;
        const modal = document.getElementById('deleteModal');
        const message = modal.querySelector('.modal-content p');
        
        if (id === 'all') {
            message.textContent = `Tem certeza que deseja excluir TODAS as ${this.recordings.length} gravações? Esta ação não pode ser desfeita.`;
        } else {
            message.textContent = 'Tem certeza que deseja excluir esta gravação? Esta ação não pode ser desfeita.';
        }
        
        modal.classList.add('active');
    }

    hideDeleteModal() {
        const modal = document.getElementById('deleteModal');
        modal.classList.remove('active');
        this.deleteModalId = null;
    }

    async confirmDelete() {
        if (!this.deleteModalId) return;

        try {
            const storageKey = 'session_recordings';
            
            if (this.deleteModalId === 'all') {
                // Delete all recordings
                localStorage.removeItem(storageKey);
                this.recordings = [];
                this.filteredRecordings = [];
            } else {
                // Delete specific recording
                this.recordings = this.recordings.filter(rec => rec.id !== this.deleteModalId);
                localStorage.setItem(storageKey, JSON.stringify(this.recordings));
                this.applyFilters();
            }

            this.hideDeleteModal();
            this.currentPage = 1;
            this.render();
        } catch (error) {
            console.error('Error deleting recording:', error);
            alert('Erro ao excluir gravação. Tente novamente.');
        }
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    formatDate(date) {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
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

    truncate(str, length) {
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    }

    // Render recordings grid
    renderRecordings() {
        const grid = document.getElementById('recordingsGrid');
        const start = (this.currentPage - 1) * recordingsPerPage;
        const end = start + recordingsPerPage;
        const pageRecordings = filteredRecordings.slice(start, end);

        if (pageRecordings.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-icon">🎬</div>
                    <h2>Nenhuma gravação encontrada</h2>
                    <p>Ajuste os filtros ou inicie uma nova gravação</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = pageRecordings.map(recording => `
            <div class="recording-card">
                <div class="recording-header">
                    <div class="recording-id">${recording.sessionId?.substring(0, 10) || 'N/A'}</div>
                    <div class="recording-date">${this.formatDate(recording.startTime)}</div>
                </div>
                <div class="recording-stats">
                    <div class="recording-stat">
                        <div class="recording-stat-label">Duração</div>
                        <div class="recording-stat-value">${this.formatDuration(recording.duration || 0)}</div>
                    </div>
                    <div class="recording-stat">
                        <div class="recording-stat-label">Eventos</div>
                        <div class="recording-stat-value">${(recording.events?.length || 0).toLocaleString()}</div>
                    </div>
                </div>
                <div class="recording-url" title="${recording.url || 'N/A'}">${recording.url || 'N/A'}</div>
                <div class="recording-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewRecording('${recording.sessionId}')">
                        <span>▶️</span> Assistir
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="downloadRecording('${recording.sessionId}')">
                        <span>⬇️</span>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${recording.sessionId}')">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Render pagination
    renderPagination() {
        const totalPages = Math.ceil(filteredRecordings.length / recordingsPerPage);
        const pagination = document.getElementById('pagination');

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = `
            <button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="changePage(${this.currentPage - 1})">
                ‹ Anterior
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="changePage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span style="padding:0 0.5rem">...</span>';
            }
        }

        html += `
            <button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${this.currentPage + 1})">
                Próxima ›
            </button>
        `;

        pagination.innerHTML = html;
    }

    showDeleteModal(id) {
        this.deleteModalId = id;
        const modal = document.getElementById('deleteModal');
        const message = modal.querySelector('.modal-content p');
        
        if (id === 'all') {
            message.textContent = `Tem certeza que deseja excluir TODAS as ${this.recordings.length} gravações? Esta ação não pode ser desfeita.`;
        } else {
            message.textContent = 'Tem certeza que deseja excluir esta gravação? Esta ação não pode ser desfeita.';
        }
        
        modal.classList.add('active');
    }

    hideDeleteModal() {
        const modal = document.getElementById('deleteModal');
        modal.classList.remove('active');
        this.deleteModalId = null;
    }

    async confirmDelete() {
        if (!this.deleteModalId) return;

        try {
            await fetch(`/api/recordings/${this.deleteModalId}`, { method: 'DELETE' });
            this.hideDeleteModal();
            await this.loadRecordings();
        } catch (error) {
            console.error('Error deleting recording:', error);
            alert('Erro ao excluir gravação');
        }
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    formatDate(date) {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
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

    truncate(str, length) {
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    }

    // Helper functions
    showEmptyState() {
        document.getElementById('recordingsGrid').innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">🎬</div>
                <h2>Nenhuma gravação disponível</h2>
                <p>Suas gravações aparecerão aqui</p>
            </div>
        `;
    }
}

// Global functions
function viewRecording(id) {
    window.location.href = `player.html?id=${id}`;
}

function deleteRecording(id) {
    window.recordingsManager.showDeleteModal(id);
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredRecordings.length / recordingsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderRecordings();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('periodFilter').value = 'all';
    document.getElementById('durationFilter').value = 'all';
    document.getElementById('sortFilter').value = 'recent';
    applyFilters();
    renderRecordings();
    renderPagination();
}

// Download recording
async function downloadRecording(sessionId) {
    try {
        const response = await fetch(`/api/recordings/${sessionId}`);
        const data = await response.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${sessionId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading recording:', error);
        alert('Erro ao baixar gravação');
    }
}

// Delete modal
function openDeleteModal(sessionId) {
    recordingToDelete = sessionId;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    recordingToDelete = null;
    document.getElementById('deleteModal').classList.remove('active');
}

async function confirmDelete() {
    if (!recordingToDelete) return;

    try {
        await fetch(`/api/recordings/${recordingToDelete}`, { method: 'DELETE' });
        closeDeleteModal();
        await loadRecordings();
    } catch (error) {
        console.error('Error deleting recording:', error);
        alert('Erro ao excluir gravação');
    }
}

// Event listeners
document.getElementById('searchInput')?.addEventListener('input', () => {
    applyFilters();
    renderRecordings();
    renderPagination();
});

document.getElementById('periodFilter')?.addEventListener('change', () => {
    applyFilters();
    renderRecordings();
    renderPagination();
});

document.getElementById('durationFilter')?.addEventListener('change', () => {
    applyFilters();
    renderRecordings();
    renderPagination();
});

document.getElementById('sortFilter')?.addEventListener('change', () => {
    applyFilters();
    renderRecordings();
    renderPagination();
});

// Close modal on outside click
document.getElementById('deleteModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'deleteModal') {
        closeDeleteModal();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.recordingsManager = new RecordingsManager();
    loadRecordings();
});
