let recording = null;
let isPlaying = false;
let currentTime = 0;
let totalDuration = 0;
let playbackSpeed = 1;
let animationFrameId = null;
let currentEventIndex = 0;

// Load recording data
async function loadRecording() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');

    if (!sessionId) {
        showError('ID da sessão não fornecido');
        return;
    }

    try {
        const response = await fetch(`/api/recordings/${sessionId}`);
        recording = await response.json();
        
        totalDuration = recording.duration || 0;
        
        renderRecordingInfo();
        renderEventsTable();
        hideLoading();
    } catch (error) {
        console.error('Error loading recording:', error);
        showError('Erro ao carregar gravação');
    }
}

// Render recording info
function renderRecordingInfo() {
    const infoGrid = document.getElementById('recordingInfo');
    if (!infoGrid) return;

    infoGrid.innerHTML = `
        <div class="info-item">
            <div class="info-label">ID da Sessão</div>
            <div class="info-value">${recording.sessionId}</div>
        </div>
        <div class="info-item">
            <div class="info-label">URL</div>
            <div class="info-value">${recording.url || 'N/A'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Data/Hora</div>
            <div class="info-value">${formatDate(recording.startTime)}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Duração</div>
            <div class="info-value">${formatDuration(recording.duration || 0)}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Total de Eventos</div>
            <div class="info-value">${(recording.events?.length || 0).toLocaleString()}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Navegador</div>
            <div class="info-value">${recording.userAgent || 'N/A'}</div>
        </div>
    `;

    document.getElementById('totalTime').textContent = formatDuration(totalDuration);
}

// Render events table
function renderEventsTable() {
    const tbody = document.getElementById('eventsTable');
    if (!tbody || !recording.events) return;

    const events = recording.events.slice(0, 50); // Show first 50 events

    tbody.innerHTML = events.map((event, index) => {
        const eventTime = event.timestamp - recording.startTime;
        return `
            <tr>
                <td>${formatDuration(eventTime)}</td>
                <td><span class="event-badge ${getEventClass(event.type)}">${formatEventType(event.type)}</span></td>
                <td>${getEventDetails(event)}</td>
                <td>
                    <button class="btn btn-ghost btn-sm" onclick="seekToEvent(${index})">
                        <span>⏭️</span> Ir
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Play/Pause toggle
function togglePlayPause() {
    if (isPlaying) {
        pause();
    } else {
        play();
    }
}

// Play
function play() {
    if (!recording) return;

    isPlaying = true;
    document.getElementById('playIcon').textContent = '⏸️';
    playbackLoop();
}

// Pause
function pause() {
    isPlaying = false;
    document.getElementById('playIcon').textContent = '▶️';
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

// Playback loop
function playbackLoop() {
    if (!isPlaying) return;

    currentTime += (16 * playbackSpeed); // 16ms per frame

    if (currentTime >= totalDuration) {
        currentTime = totalDuration;
        pause();
        return;
    }

    updateTimeDisplay();
    updateTimeline();
    processEvents();

    animationFrameId = requestAnimationFrame(playbackLoop);
}

// Process events at current time
function processEvents() {
    if (!recording.events) return;

    while (currentEventIndex < recording.events.length) {
        const event = recording.events[currentEventIndex];
        const eventTime = event.timestamp - recording.startTime;

        if (eventTime <= currentTime) {
            simulateEvent(event);
            currentEventIndex++;
        } else {
            break;
        }
    }
}

// Simulate event
function simulateEvent(event) {
    if (event.type === 'mousemove' && event.data?.x && event.data?.y) {
        updateCursor(event.data.x, event.data.y);
    }
}

// Update cursor position
function updateCursor(x, y) {
    const cursor = document.getElementById('playerCursor');
    if (cursor) {
        cursor.style.display = 'block';
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
    }
}

// Skip backward
function skipBackward() {
    currentTime = Math.max(0, currentTime - 10000);
    updateTimeDisplay();
    updateTimeline();
}

// Skip forward
function skipForward() {
    currentTime = Math.min(totalDuration, currentTime + 10000);
    updateTimeDisplay();
    updateTimeline();
}

// Change speed
function changeSpeed() {
    const select = document.getElementById('speedSelect');
    playbackSpeed = parseFloat(select.value);
}

// Seek to event
function seekToEvent(index) {
    if (!recording.events || index >= recording.events.length) return;

    const event = recording.events[index];
    currentTime = event.timestamp - recording.startTime;
    currentEventIndex = index;

    updateTimeDisplay();
    updateTimeline();
}

// Update time display
function updateTimeDisplay() {
    const currentTimeEl = document.getElementById('currentTime');
    if (currentTimeEl) {
        currentTimeEl.textContent = formatDuration(currentTime);
    }
}

// Update timeline
function updateTimeline() {
    const timeline = document.getElementById('timeline');
    if (timeline && totalDuration > 0) {
        timeline.value = (currentTime / totalDuration) * 100;
    }
}

// Filter events
function filterEvents(type) {
    // Update active button
    document.querySelectorAll('.table-actions .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    const tbody = document.getElementById('eventsTable');
    if (!tbody || !recording.events) return;

    let filteredEvents = recording.events;
    
    if (type !== 'all') {
        filteredEvents = recording.events.filter(e => {
            if (type === 'click') return e.type.includes('click');
            if (type === 'key') return e.type.includes('key');
            if (type === 'nav') return e.type.includes('navigation');
            return false;
        });
    }

    tbody.innerHTML = filteredEvents.slice(0, 50).map((event, index) => {
        const eventTime = event.timestamp - recording.startTime;
        return `
            <tr>
                <td>${formatDuration(eventTime)}</td>
                <td><span class="event-badge ${getEventClass(event.type)}">${formatEventType(event.type)}</span></td>
                <td>${getEventDetails(event)}</td>
                <td>
                    <button class="btn btn-ghost btn-sm" onclick="seekToEvent(${index})">
                        <span>⏭️</span> Ir
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Download recording
async function downloadRecording() {
    if (!recording) return;

    const blob = new Blob([JSON.stringify(recording, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${recording.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Helper functions
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

function formatEventType(type) {
    const types = {
        mousemove: 'Movimento',
        mouseclick: 'Clique',
        keypress: 'Tecla',
        navigation: 'Navegação',
        scroll: 'Scroll'
    };
    return types[type] || type;
}

function getEventClass(type) {
    if (type.includes('mouse')) return 'mousemove';
    if (type.includes('click')) return 'mouseclick';
    if (type.includes('key')) return 'keypress';
    if (type.includes('nav')) return 'navigation';
    return 'mousemove';
}

function getEventDetails(event) {
    if (event.data?.x && event.data?.y) {
        return `x: ${event.data.x}, y: ${event.data.y}`;
    }
    if (event.data?.key) {
        return `Tecla: ${event.data.key}`;
    }
    if (event.data?.url) {
        return event.data.url;
    }
    return JSON.stringify(event.data).substring(0, 50);
}

function showError(message) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.innerHTML = `
            <div style="color: var(--danger-color);">
                <div style="font-size: 48px; margin-bottom: 1rem;">❌</div>
                <div>${message}</div>
            </div>
        `;
    }
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// Timeline click handler
document.getElementById('timeline')?.addEventListener('input', (e) => {
    const percentage = e.target.value / 100;
    currentTime = totalDuration * percentage;
    currentEventIndex = 0;
    updateTimeDisplay();
});

// Initialize
document.addEventListener('DOMContentLoaded', loadRecording);
