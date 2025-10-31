
// Usar o serviço de API para gerenciar sessões
// const apiService é importado via script tag// Estado da aplicação
let currentRecorder = null;
let recordingIntervalId = null;
let recordingDuration = 0;

// Função para formatar duração
function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
        return `${hrs}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

// Função para atualizar estatísticas do dashboard
async function updateDashboardStats() {
    try {
        const sessions = await apiService.getAllSessions();
        
        // Total de sessões
        document.getElementById('totalSessions').textContent = sessions.length;
        
        // Total de eventos
        const totalEvents = sessions.reduce((sum, session) => sum + session.events.length, 0);
        document.getElementById('totalEvents').textContent = totalEvents.toLocaleString();
        
        // Duração média
        if (sessions.length > 0) {
            const totalDuration = sessions.reduce((sum, session) => {
                const start = new Date(session.startTime).getTime();
                const end = new Date(session.endTime).getTime();
                return sum + (end - start);
            }, 0);
            const avgDuration = Math.floor(totalDuration / sessions.length / 1000);
            document.getElementById('avgDuration').textContent = formatDuration(avgDuration);
        } else {
            document.getElementById('avgDuration').textContent = '0s';
        }
        
        // Última gravação
        if (sessions.length > 0) {
            const lastSession = sessions[sessions.length - 1];
            const lastDate = new Date(lastSession.startTime);
            const now = new Date();
            const diffMs = now - lastDate;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 60) {
                document.getElementById('lastRecording').textContent = `Há ${diffMins} min`;
            } else if (diffMins < 1440) {
                document.getElementById('lastRecording').textContent = `Há ${Math.floor(diffMins / 60)} horas`;
            } else {
                document.getElementById('lastRecording').textContent = lastDate.toLocaleDateString('pt-BR');
            }
        } else {
            document.getElementById('lastRecording').textContent = 'Nunca';
        }
        
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

// Função para iniciar gravação
function startRecording() {
    if (currentRecorder) {
        console.warn('Já existe uma gravação em andamento');
        return;
    }
    
    const userId = document.getElementById('userIdInput')?.value || 'anonymous';
    const captureHtml = document.getElementById('captureHtmlCheckbox')?.checked || false;
    const captureMouseMove = document.getElementById('captureMouseCheckbox')?.checked !== false;
    
    currentRecorder = new window.SessionRecorder({
        userId: userId,
        captureHtml: captureHtml,
        captureMouseMove: captureMouseMove,
        autoStart: false,
        saveInterval: 10,
        throttleMouseMove: 50
    });
    
    currentRecorder.startRecording();
    
    // Atualizar UI
    document.getElementById('startRecordingBtn').disabled = true;
    document.getElementById('stopRecordingBtn').disabled = false;
    document.getElementById('recordingStatus').textContent = 'Gravando...';
    document.getElementById('recordingStatus').classList.add('recording');
    
    // Iniciar contador de duração
    recordingDuration = 0;
    recordingIntervalId = setInterval(() => {
        recordingDuration++;
        document.getElementById('recordingDuration').textContent = formatDuration(recordingDuration);
    }, 1000);
}

// Função para parar gravação
function stopRecording() {
    if (!currentRecorder) {
        console.warn('Nenhuma gravação em andamento');
        return;
    }
    
    currentRecorder.stopRecording();
    currentRecorder = null;
    
    // Parar contador
    if (recordingIntervalId) {
        clearInterval(recordingIntervalId);
        recordingIntervalId = null;
    }
    
    // Atualizar UI
    document.getElementById('startRecordingBtn').disabled = false;
    document.getElementById('stopRecordingBtn').disabled = true;
    document.getElementById('recordingStatus').textContent = 'Parado';
    document.getElementById('recordingStatus').classList.remove('recording');
    document.getElementById('recordingDuration').textContent = '0s';
    
    // Atualizar estatísticas
    updateDashboardStats();
    
    alert('Gravação finalizada e salva com sucesso!');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Atualizar estatísticas ao carregar
    updateDashboardStats();
    
    // Botões de gravação
    const startBtn = document.getElementById('startRecordingBtn');
    const stopBtn = document.getElementById('stopRecordingBtn');
    
    if (startBtn) {
        startBtn.addEventListener('click', startRecording);
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopRecording);
        stopBtn.disabled = true;
    }
    
    // Atualizar estatísticas periodicamente
    setInterval(updateDashboardStats, 30000); // A cada 30 segundos
});
