
// Usar a biblioteca SessionRecorder já compilada e serviço de API
const { SessionPlayer } = window;
// const apiService é importado via script tag// Estado
let sessionPlayer = null;
let currentSession = null;
let allSessions = [];

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

// Função para carregar lista de sessões
async function loadSessionsList() {
    try {
        allSessions = await apiService.getAllSessions();
        allSessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        
        const sessionSelect = document.getElementById('sessionSelect');
        if (!sessionSelect) return;
        
        sessionSelect.innerHTML = '<option value="">Selecione uma gravação...</option>';
        
        allSessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.id;
            option.textContent = `${formatDate(session.startTime)} - ${session.userId} (${session.events.length} eventos)`;
            sessionSelect.appendChild(option);
        });
        
        // Verificar se há uma sessão selecionada no sessionStorage
        const selectedSessionId = sessionStorage.getItem('selectedSessionId');
        if (selectedSessionId) {
            sessionSelect.value = selectedSessionId;
            sessionStorage.removeItem('selectedSessionId');
            loadSelectedSession();
        }
        
    } catch (error) {
        console.error('Erro ao carregar lista de sessões:', error);
    }
}

// Função para carregar sessão selecionada
async function loadSelectedSession() {
    const sessionSelect = document.getElementById('sessionSelect');
    if (!sessionSelect || !sessionSelect.value) return;
    
    const sessionId = sessionSelect.value;
    
    try {
        currentSession = await apiService.getSession(sessionId);
        
        if (!currentSession) {
            alert('Sessão não encontrada');
            return;
        }
        
        // Atualizar informações da sessão
        updateSessionInfo(currentSession);
        
        // Criar player se não existir
        if (!sessionPlayer) {
            createPlayer();
        }
        
        // Carregar sessão no player
        sessionPlayer.loadSession(currentSession);
        
    } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        alert('Erro ao carregar sessão');
    }
}

// Função para criar o player
function createPlayer() {
    const playerContainer = document.getElementById('playerContainer');
    if (!playerContainer) return;
    
    const theme = document.getElementById('themeSelect')?.value || 'light';
    
    sessionPlayer = new SessionPlayer(
        '#playerContainer',
        {
            theme: theme,
            showControls: true,
            showTimeline: true,
            showSpeedControl: true,
            autoplay: false,
            loop: false,
            width: '100%',
            height: '600px'
        },
        {
            skipInactivity: false,
            showCursor: true,
            simulateRealEvents: true
        }
    );
}

// Função para atualizar informações da sessão
function updateSessionInfo(session) {
    const sessionInfo = document.getElementById('sessionInfo');
    if (!sessionInfo) return;
    
    const duration = new Date(session.endTime) - new Date(session.startTime);
    const durationText = Math.floor(duration / 1000);
    
    sessionInfo.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
            <div>
                <strong>ID:</strong> <code>${session.id.substring(0, 8)}...</code>
            </div>
            <div>
                <strong>Usuário:</strong> ${session.userId || 'anonymous'}
            </div>
            <div>
                <strong>Data:</strong> ${formatDate(session.startTime)}
            </div>
            <div>
                <strong>Duração:</strong> ${Math.floor(durationText / 60)}m ${durationText % 60}s
            </div>
            <div>
                <strong>Eventos:</strong> ${session.events.length}
            </div>
            <div>
                <strong>URL:</strong> ${session.pageUrl || 'N/A'}
            </div>
        </div>
    `;
}

// Função para mudar tema
function changeTheme() {
    if (sessionPlayer && currentSession) {
        const theme = document.getElementById('themeSelect')?.value || 'light';
        sessionPlayer.destroy();
        sessionPlayer = null;
        createPlayer();
        sessionPlayer.loadSession(currentSession);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSessionsList();
    
    // Select de sessão
    const sessionSelect = document.getElementById('sessionSelect');
    if (sessionSelect) {
        sessionSelect.addEventListener('change', loadSelectedSession);
    }
    
    // Select de tema
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', changeTheme);
    }
});
