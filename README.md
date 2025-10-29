# Session Recorder 🎥

Uma biblioteca JavaScript completa para gravação e reprodução de sessões de usuário em websites. Capture interações do mouse, teclado, navegação entre páginas e até mesmo o HTML completo da página para análise detalhada de comportamento do usuário.

## 📋 Índice

- [Recursos](#-recursos)
- [Instalação](#-instalação)
- [Uso Rápido](#-uso-rápido)
- [Componentes Principais](#-componentes-principais)
- [Configuração Detalhada](#-configuração-detalhada)
- [API Completa](#-api-completa)
- [Desenvolvimento](#-desenvolvimento)
- [Exemplos Práticos](#-exemplos-práticos)
- [Arquitetura](#-arquitetura)
- [Segurança e Privacidade](#-segurança-e-privacidade)

## ✨ Recursos

### Gravação de Eventos
- ✅ **Movimentos do mouse** com throttling configurável
- ✅ **Cliques do mouse** com informações do elemento-alvo
- ✅ **Scroll** com deltas X e Y
- ✅ **Eventos de teclado** (keypress, keydown, keyup)
- ✅ **Navegação entre páginas** com histórico de URLs
- ✅ **Redimensionamento de janela** e viewport
- ✅ **Eventos customizados** para tracking específico

### Captura de HTML
- 📸 **Snapshot completo da página** com HTML, CSS e recursos
- 🎨 **Processamento de CSS** (inline ou externo)
- 🔧 **Gerenciamento de scripts** com políticas de segurança
- 🖼️ **Otimização de recursos** (imagens, fontes, media)
- 🗜️ **Níveis de otimização** configuráveis (0-2)
- 🔒 **Remoção de elementos sensíveis** (data-private, .no-record)

### Reprodução
- ▶️ **Player visual completo** com controles UI
- ⏯️ **Play/Pause, velocidade ajustável** (0.5x - 4x)
- 📊 **Timeline interativa** com progresso
- 🎯 **Cursor virtual** personalizável
- 🔄 **Loop automático** opcional
- 📱 **Responsivo** com scale-to-fit
- 🖼️ **Reprodução em iframe** isolado e seguro

### Armazenamento
- 💾 **LocalStorage** por padrão
- 🔌 **Interface StorageAdapter** para implementações customizadas
- 💿 **Auto-save** com intervalo configurável
- 📦 **Serialização/deserialização** automática

## 📦 Instalação

### Via NPM/PNPM (recomendado)

```bash
npm install session-recorder
# ou
pnpm add session-recorder
```

### Via CDN

```html
<script src="https://unpkg.com/session-recorder@latest/dist/session-recorder.js"></script>
```

### Desenvolvimento Local

```bash
# Clone o repositório
git clone <repository-url>
cd session-recorder

# Instale dependências
pnpm install

# Build para desenvolvimento
pnpm run build:dev

# Ou watch mode
pnpm run watch

# Servir a biblioteca
pnpm run serve
```

## 🚀 Uso Rápido

### Exemplo Básico - Gravação

```html
<!DOCTYPE html>
<html>
<head>
  <title>Gravação de Sessão</title>
</head>
<body>
  <h1>Minha Aplicação</h1>
  <button id="start">Iniciar Gravação</button>
  <button id="stop">Parar Gravação</button>

  <script src="session-recorder.js"></script>
  <script>
    const recorder = new SessionRecorder({
      userId: 'user-123',
      captureMouseMove: true,
      captureHtml: true,
      saveInterval: 30, // salvar a cada 30 segundos
    });

    document.getElementById('start').addEventListener('click', () => {
      recorder.startRecording();
      console.log('Gravação iniciada!');
    });

    document.getElementById('stop').addEventListener('click', () => {
      const session = recorder.stopRecording();
      console.log('Sessão gravada:', session);
    });
  </script>
</body>
</html>
```

### Exemplo Básico - Reprodução

```html
<!DOCTYPE html>
<html>
<head>
  <title>Reprodução de Sessão</title>
</head>
<body>
  <div id="player-container"></div>

  <script src="session-recorder.js"></script>
  <script>
    // Carregar sessão gravada
    const savedSession = localStorage.getItem('session_recordings');
    const sessions = JSON.parse(savedSession);
    const lastSession = sessions[sessions.length - 1];

    // Criar player com UI
    const player = new SessionPlayer('#player-container', {
      theme: 'dark',
      showControls: true,
      showTimeline: true,
      autoplay: true,
      width: '100%',
      height: '800px'
    });

    // Carregar e reproduzir sessão
    player.loadSession(lastSession);
  </script>
</body>
</html>
```

## 🧩 Componentes Principais

### 1. SessionRecorder

O gravador principal que captura eventos e gerencia a sessão.

```javascript
import { SessionRecorder } from 'session-recorder';

const recorder = new SessionRecorder({
  autoStart: false,          // Não inicia automaticamente
  maxDuration: 3600,         // Máx 1 hora
  saveInterval: 30,          // Salvar a cada 30s
  userId: 'user-123',
  captureMouseMove: true,
  throttleMouseMove: 50,     // Throttle de 50ms
  captureHtml: true,
  optimizationLevel: 2,      // Otimização agressiva
});

// Iniciar gravação
recorder.startRecording();

// Gravar evento customizado
recorder.recordCustomEvent({
  type: 'purchase',
  productId: '123',
  value: 99.99
});

// Pausar gravação
recorder.pauseRecording();

// Retomar gravação
recorder.resumeRecording();

// Parar e obter sessão
const session = recorder.stopRecording();
```

### 2. SessionReplayer

Reprodutor de baixo nível para controle programático.

```javascript
import { SessionReplayer } from 'session-recorder';

const replayer = new SessionReplayer({
  speed: 1.5,                // 1.5x velocidade
  loop: false,
  showCursor: true,
  targetIframe: myIframe,
  onEvent: (event) => {
    console.log('Evento reproduzido:', event);
  },
  onComplete: () => {
    console.log('Reprodução concluída!');
  }
});

// Carregar sessão
replayer.loadSession(recordedSession);

// Controles
replayer.play();
replayer.pause();
replayer.stop();
replayer.seekTo(30000); // Ir para 30 segundos
replayer.setSpeed(2);   // 2x velocidade
```

### 3. SessionPlayer

Player visual completo com interface de usuário.

```javascript
import { SessionPlayer } from 'session-recorder';

const player = new SessionPlayer(
  '#player-container',
  {
    theme: 'dark',           // 'light' ou 'dark'
    showControls: true,
    showTimeline: true,
    showSpeedControl: true,
    autoplay: false,
    loop: true,
    width: '100%',
    height: '600px'
  },
  {
    // ReplayOptions aqui
    skipInactivity: true,
    maxInactivityDelay: 1000
  }
);

player.loadSession(session);
```

### 4. LocalStorageAdapter

Adaptador padrão para armazenamento local.

```javascript
import { LocalStorageAdapter } from 'session-recorder';

const storage = new LocalStorageAdapter(
  null,                      // localStorage padrão
  'my_custom_key'           // chave customizada
);

// Salvar sessão
storage.saveSession(session);

// Listar todas
const sessions = storage.listSessions();

// Carregar específica
const session = storage.getSession('session-id-123');

// Deletar
storage.deleteSession('session-id-123');
```

## ⚙️ Configuração Detalhada

### RecorderOptions

```typescript
interface RecorderOptions {
  // Controle de Gravação
  autoStart?: boolean;              // Iniciar automaticamente (default: true)
  maxDuration?: number;             // Duração máxima em segundos (default: 3600)
  saveInterval?: number;            // Intervalo de auto-save em segundos (default: 30)
  userId?: string;                  // ID do usuário (default: 'anonymous')

  // Captura de Eventos
  captureMouseMove?: boolean;       // Capturar movimentos do mouse (default: true)
  captureInputs?: boolean;          // Capturar valores de inputs (default: false)
  throttleMouseMove?: number;       // Throttle de mousemove em ms (default: 50)
  excludeElements?: string[];       // Seletores CSS para excluir (default: ['.no-record', '[data-private]'])

  // Captura de HTML
  captureHtml?: boolean;            // Capturar HTML completo (default: false)
  scriptHandling?: 'remove' | 'keep-safe' | 'keep-all';  // (default: 'remove')
  safeScriptSources?: string[];     // Domínios seguros para scripts
  inlineScriptHandling?: 'remove' | 'keep';  // (default: 'remove')
  
  // Otimização
  optimizationLevel?: 0 | 1 | 2;    // Nível de otimização (default: 1)
  inlineCss?: boolean;              // Inline CSS externo (default: true)
  keepExternalResources?: boolean;  // Manter recursos externos (default: true)
  keepFonts?: boolean;              // Manter web fonts (default: true)
  removeInvisibleElements?: boolean; // Remover elementos invisíveis (default: true)
  usePlaceholdersForImages?: boolean; // Placeholders para imagens (default: true)
  removeIframes?: boolean;          // Remover iframes (default: true)
  removeMedia?: boolean;            // Remover media (video/audio) (default: true)

  // Armazenamento
  storageKey?: string;              // Chave do localStorage (default: 'session_recordings')
}
```

### ReplayOptions

```typescript
interface ReplayOptions {
  // Controle de Reprodução
  speed?: number;                   // Velocidade (0.5 - 4) (default: 1)
  loop?: boolean;                   // Loop automático (default: false)
  
  // Visual
  showCursor?: boolean;             // Mostrar cursor virtual (default: true)
  customCursor?: string;            // URL ou CSS para cursor customizado
  scaleToFit?: boolean;             // Escalar para caber no container (default: true)
  
  // Comportamento
  simulateRealEvents?: boolean;     // Simular eventos reais (default: true)
  skipInactivity?: boolean;         // Pular períodos de inatividade (default: false)
  maxInactivityDelay?: number;      // Delay máximo de inatividade em ms (default: 1000)
  
  // Segurança
  iframeSandbox?: boolean;          // Usar sandbox no iframe (default: true)
  sandboxOptions?: string[];        // Opções de sandbox (default: ['allow-scripts', 'allow-same-origin'])
  allowScripts?: boolean;           // Permitir scripts (default: true)
  
  // Callbacks
  onEvent?: (event: SessionEvent) => void;
  onComplete?: () => void;
  
  // Avançado
  targetIframe?: HTMLIFrameElement; // Iframe específico
  originalUrl?: string;             // URL original da página
  contentHtml?: string;             // HTML customizado
}
```

## 📚 API Completa

### SessionRecorder

#### Métodos

```typescript
// Controle de Gravação
startRecording(): void
stopRecording(): RecordingSession
pauseRecording(): void
resumeRecording(): void

// Eventos Customizados
recordCustomEvent(data: CustomEventData): void

// Estado
isRecording(): boolean
getCurrentSession(): RecordingSession | null
getSessionDuration(): number

// Armazenamento
saveCurrentSession(): void
```

#### Eventos Capturados

| Tipo | Dados Capturados |
|------|------------------|
| `MOUSE_MOVE` | x, y, target, timestamp |
| `MOUSE_CLICK` | x, y, button, target, timestamp |
| `MOUSE_SCROLL` | scrollDelta (x, y), timestamp |
| `KEY_PRESS` | key, keyCode, modifiers, target |
| `KEY_DOWN` | key, keyCode, modifiers, target |
| `KEY_UP` | key, keyCode, modifiers, target |
| `NAVIGATION` | from, to, title |
| `RESIZE` | viewport dimensions |
| `CUSTOM` | user-defined data |

### SessionReplayer

#### Métodos

```typescript
// Controle
loadSession(session: RecordingSession): void
play(): void
pause(): void
stop(): void
seekTo(timestamp: number): void

// Configuração
setSpeed(speed: number): void
setLoop(loop: boolean): void

// Estado
isPlaying(): boolean
getCurrentTime(): number
getDuration(): number
```

### SessionPlayer

#### Métodos

```typescript
// Sessão
loadSession(session: RecordingSession): void

// Controle (delegados ao replayer)
play(): void
pause(): void
stop(): void
seekTo(time: number): void

// UI
setTheme(theme: 'light' | 'dark'): void
destroy(): void
```

### LocalStorageAdapter

#### Métodos

```typescript
saveSession(session: RecordingSession): void
getSession(sessionId: string): RecordingSession | null
listSessions(): RecordingSession[]
deleteSession(sessionId: string): void
clear(): void
```

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
session-recorder/
├── src/
│   ├── core/
│   │   ├── recorder.ts              # SessionRecorder principal
│   │   ├── replayer.ts              # SessionReplayer principal
│   │   ├── player.ts                # SessionPlayer com UI
│   │   ├── recorder/
│   │   │   ├── EventCollector.ts    # Coleta de eventos
│   │   │   ├── EventHandler.ts      # Gerenciamento de listeners
│   │   │   ├── HtmlCaptureHelper.ts # Captura de HTML
│   │   │   ├── SessionStorage.ts    # Armazenamento
│   │   │   └── resources/
│   │   │       ├── ResourceHelper.ts      # Processamento de recursos
│   │   │       ├── ScriptProcessor.ts     # Processamento de scripts
│   │   │       └── StylesheetProcessor.ts # Processamento de CSS
│   │   └── replayer/
│   │       ├── CursorManager.ts     # Gerenciamento do cursor virtual
│   │       ├── EventProcessor.ts    # Processamento de eventos
│   │       ├── EventSimulator.ts    # Simulação de eventos
│   │       ├── IframeManager.ts     # Gerenciamento de iframe
│   │       └── ReplayController.ts  # Controle de reprodução
│   ├── storage/
│   │   └── local-storage.ts         # Adapter de LocalStorage
│   ├── types/
│   │   ├── coordinates.ts           # Tipos de coordenadas
│   │   ├── dimensions.ts            # Tipos de dimensões
│   │   └── events.ts                # Tipos de eventos e sessões
│   ├── utils/
│   │   └── helpers.ts               # Funções auxiliares
│   └── index.ts                     # Entry point
├── dist/                            # Build output
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

### Scripts Disponíveis

```bash
# Build de produção (minificado)
pnpm run build

# Build de desenvolvimento (com sourcemaps)
pnpm run build:dev

# Watch mode (rebuild automático)
pnpm run watch

# Servir a biblioteca (http://localhost:4000)
pnpm run serve
```

### DevContainer Setup

1. Instale a extensão **Remote - Containers** no VS Code
2. Abra o projeto no VS Code
3. Quando solicitado, clique em **Reopen in Container**
4. O container irá:
   - Construir o ambiente
   - Instalar dependências (pnpm install)
   - Iniciar o servidor de desenvolvimento
5. Acesse a biblioteca em `http://localhost:3000/session-recorder.js`

## 💡 Exemplos Práticos

### 1. Gravação com Captura de HTML Otimizada

```javascript
const recorder = new SessionRecorder({
  userId: 'user-456',
  captureHtml: true,
  optimizationLevel: 2,        // Otimização agressiva
  scriptHandling: 'remove',    // Remover todos os scripts
  removeInvisibleElements: true,
  usePlaceholdersForImages: true,
  removeIframes: true,
  inlineCss: true,
  excludeElements: [
    '.sensitive-data',
    '[data-private]',
    '.password-field'
  ]
});

recorder.startRecording();
```

### 2. Análise de Comportamento do Usuário

```javascript
const recorder = new SessionRecorder({
  captureMouseMove: true,
  throttleMouseMove: 100,      // Menos granular = menos dados
  captureInputs: false,        // Privacidade
  saveInterval: 60,
});

// Rastrear eventos importantes
recorder.recordCustomEvent({
  type: 'add_to_cart',
  productId: 'prod-123',
  price: 49.99,
  timestamp: new Date()
});

recorder.recordCustomEvent({
  type: 'checkout_started',
  cartValue: 149.97
});
```

### 3. Player com Controles Customizados

```javascript
const player = new SessionPlayer('#player', {
  theme: 'dark',
  showControls: true,
  showSpeedControl: true,
  width: '1200px',
  height: '800px',
  containerStyles: {
    border: '2px solid #333',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }
}, {
  speed: 1,
  loop: false,
  skipInactivity: true,
  maxInactivityDelay: 2000,
  onEvent: (event) => {
    if (event.type === 'CUSTOM') {
      console.log('Evento customizado:', event.data);
    }
  }
});

player.loadSession(session);
```

### 4. Storage Customizado (Backend)

```javascript
// Implementar interface StorageAdapter
class ApiStorageAdapter {
  async saveSession(session) {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
  }

  async getSession(sessionId) {
    const response = await fetch(`/api/sessions/${sessionId}`);
    return await response.json();
  }

  async listSessions() {
    const response = await fetch('/api/sessions');
    return await response.json();
  }

  async deleteSession(sessionId) {
    await fetch(`/api/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }
}

// Usar adapter customizado
const recorder = new SessionRecorder({
  storageAdapter: new ApiStorageAdapter()
});
```

### 5. Reprodução com Análise de Heatmap

```javascript
const heatmapData = [];

const replayer = new SessionReplayer({
  onEvent: (event) => {
    if (event.type === 'MOUSE_MOVE') {
      heatmapData.push({
        x: event.data.x,
        y: event.data.y
      });
    }
  },
  onComplete: () => {
    // Gerar heatmap com os dados coletados
    generateHeatmap(heatmapData);
  }
});

replayer.loadSession(session);
replayer.play();
```

## 🏗️ Arquitetura

### Padrões de Design Utilizados

1. **Facade Pattern**: `SessionPlayer` atua como facade para `SessionReplayer`
2. **Strategy Pattern**: Diferentes strategies para processamento de recursos (scripts, CSS)
3. **Adapter Pattern**: `StorageAdapter` para diferentes backends de armazenamento
4. **Observer Pattern**: Callbacks `onEvent` e `onComplete`
5. **Builder Pattern**: Construção configurável de `SessionRecorder` e `SessionReplayer`

### Fluxo de Dados

#### Gravação
```
User Interaction → EventHandler → EventCollector → RecordingSession → SessionStorage
                                                  ↓
                                            HtmlCaptureHelper
                                                  ↓
                                          ResourceProcessor
```

#### Reprodução
```
RecordingSession → ReplayController → EventProcessor → EventSimulator → DOM
                                                     ↓
                                               CursorManager
                                                     ↓
                                               IframeManager
```

## 🔒 Segurança e Privacidade

### Práticas Recomendadas

1. **Nunca grave senhas ou dados sensíveis**
   ```javascript
   excludeElements: [
     'input[type="password"]',
     '.credit-card',
     '[data-sensitive]'
   ]
   ```

2. **Remova scripts por padrão**
   ```javascript
   scriptHandling: 'remove',
   inlineScriptHandling: 'remove'
   ```

3. **Use sandbox em iframes**
   ```javascript
   iframeSandbox: true,
   sandboxOptions: ['allow-scripts', 'allow-same-origin']
   ```

4. **Não capture inputs por padrão**
   ```javascript
   captureInputs: false  // Evita capturar valores de formulários
   ```

5. **Implemente consentimento do usuário**
   ```javascript
   // Só inicie após consentimento
   if (userConsented) {
     recorder.startRecording();
   }
   ```

### Compliance (GDPR, LGPD)

- ✅ Obtenha consentimento antes de gravar
- ✅ Permita que usuários solicitem exclusão de dados
- ✅ Anonimize dados pessoais quando possível
- ✅ Implemente retenção de dados com auto-exclusão
- ✅ Documente o que está sendo gravado

## 📄 Licença

MIT License - Veja o arquivo LICENSE para detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para problemas ou dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação completa
- Verifique os exemplos práticos acima

---

**Desenvolvido com ❤️ usando TypeScript e Webpack**