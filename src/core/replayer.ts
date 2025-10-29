import {
  RecordingSession,
  SessionEvent,
  ReplayOptions,
  EventType,
} from "../types/events";
import { CursorManager } from "./replayer/CursorManager";
import { IframeManager } from "./replayer/IframeManager";
import { EventSimulator, TargetInfo } from "./replayer/EventSimulator";
import { EventProcessor } from "./replayer/EventProcessor";
import { ReplayController } from "./replayer/ReplayController";

/**
 * Responsável pela reprodução de sessões gravadas
 * Atua como fachada para os componentes internos de reprodução
 */
export class SessionReplayer {
  private session: RecordingSession | null = null;
  private options: Required<ReplayOptions>;

  // Componentes principais
  private cursorManager: CursorManager;
  private iframeManager: IframeManager;
  private eventSimulator: EventSimulator;
  private eventProcessor: EventProcessor;
  private replayController: ReplayController;

  private readonly defaultOptions: Required<ReplayOptions> = {
    speed: 1,
    loop: false,
    showCursor: true,
    onEvent: () => {},
    onComplete: () => {},
    simulateRealEvents: true,
    targetIframe: null as any,
    originalUrl: "",
    contentHtml: "",
    scaleToFit: true,
    customCursor: "",
    maxInactivityDelay: 1000,
    skipInactivity: false,
    iframeSandbox: true,
    sandboxOptions: ["allow-scripts", "allow-same-origin"],
    allowScripts: true,
  };

  constructor(options?: ReplayOptions) {
    this.options = { ...this.defaultOptions, ...(options || {}) };

    // If allowScripts shorthand is used, update sandbox options
    if (this.options.allowScripts && this.options.iframeSandbox) {
      if (!this.options.sandboxOptions.includes("allow-scripts")) {
        this.options.sandboxOptions.push("allow-scripts");
      }
    }

    // Initialize components
    this.cursorManager = new CursorManager();
    this.iframeManager = new IframeManager(
      this.options.targetIframe,
      this.options.originalUrl,
      this.options.scaleToFit,
      this.options.contentHtml,
      this.options.iframeSandbox,
      this.options.sandboxOptions
    );
    this.eventSimulator = new EventSimulator();

    // Initialize event processor
    this.eventProcessor = new EventProcessor(
      this.cursorManager,
      this.eventSimulator,
      this.options
    );

    // Configurar controlador de reprodução
    this.replayController = new ReplayController(
      this.options.speed,
      this.options.loop,
      this.options.onComplete
    );

    this.initialize();
  }

  /**
   * Inicializa o reprodutor
   */
  private initialize(): void {
    if (this.options.showCursor) {
      this.cursorManager.createCursor();
    }

    // Configurar iframe se necessário
    if (this.options.targetIframe) {
      this.setupIframeEnvironment();
    }
  }

  /**
   * Configura o ambiente do iframe
   */
  private setupIframeEnvironment(): void {
    this.iframeManager.onIframeLoad(() => {
      // Transferir cursor para dentro do iframe
      if (this.options.showCursor) {
        this.cursorManager.destroy();
        this.cursorManager = new CursorManager(
          this.iframeManager.getDocument()
        );
        this.cursorManager.createCursor();
      }

      // Atualizar simulador e processador para usar o documento do iframe
      this.eventSimulator = new EventSimulator(
        this.iframeManager.getDocument(),
        this.iframeManager.getWindow()
      );

      this.eventProcessor = new EventProcessor(
        this.cursorManager,
        this.eventSimulator,
        this.options
      );

      console.log("Iframe loaded, ready to play session");
    });
  }

  /**
   * Carrega uma sessão para reprodução
   */
  public loadSession(session: RecordingSession): void {
    this.stop();
    this.session = session;
    this.replayController.reset();

    console.log(
      `Session loaded: ${session.id}, ${session.events.length} events`
    );

    // Determine which content to use for replay
    let useUrl = this.options.originalUrl;
    let useHtml = this.options.contentHtml;

    // If we have HTML in the session and no explicit content was provided, use it
    if (!useUrl && !useHtml && session.pageHtml) {
      useHtml = session.pageHtml;
    }

    // If we have URL in the session and no explicit content was provided, use it
    if (!useUrl && !useHtml && session.pageUrl) {
      useUrl = session.pageUrl;
    }

    // Update iframe content
    if (useHtml) {
      this.iframeManager.setContentHtml(useHtml);
    } else if (useUrl) {
      this.iframeManager.setOriginalUrl(useUrl);
    }

    // Configure iframe if necessary
    if (this.options.targetIframe && session.viewport) {
      this.iframeManager.prepareIframe(session.viewport);
    }
  }

  /**
   * Define o iframe a ser usado para reprodução
   */
  public setIframe(iframe: HTMLIFrameElement | string): void {
    this.iframeManager.setIframe(iframe);

    if (this.session) {
      this.iframeManager.prepareIframe(this.session.viewport);
    }
  }

  /**
   * Define a URL original da página
   */
  public setOriginalUrl(url: string): void {
    this.options.originalUrl = url;
    this.options.contentHtml = ""; // Clear HTML content if URL is set
    this.iframeManager.setOriginalUrl(url);
    this.iframeManager.setContentHtml("");

    if (this.session) {
      this.iframeManager.prepareIframe(this.session.viewport);
    }
  }

  /**
   * Define o conteúdo HTML para reprodução
   */
  public setContentHtml(html: string): void {
    this.options.contentHtml = html;
    this.options.originalUrl = ""; // Clear URL if HTML content is set
    this.iframeManager.setContentHtml(html);
    this.iframeManager.setOriginalUrl("");

    if (this.session) {
      this.iframeManager.prepareIframe(this.session.viewport);
    }
  }

  /**
   * Inicia a reprodução
   */
  public play(): void {
    if (!this.session) {
      console.error("No session loaded");
      return;
    }

    if (this.replayController.isPlaying()) {
      console.warn("Already playing");
      return;
    }

    this.replayController.play();
    this.processNextEvent();
  }

  /**
   * Pausa a reprodução
   */
  public pause(): void {
    this.replayController.pause();
  }

  /**
   * Para a reprodução e redefine a posição
   */
  public stop(): void {
    this.replayController.stop();
    this.cursorManager.hideCursor();
    this.eventSimulator.clearHoverState();
  }

  /**
   * Salta para um tempo específico na sessão
   */
  public seekTo(timeInMs: number): void {
    if (!this.session) return;

    const wasPlaying = this.replayController.isPlaying();
    this.stop();

    // Encontrar o evento mais próximo do tempo especificado
    const startTime = this.session.startTime.getTime();
    const targetTime = startTime + timeInMs;

    const eventIndex = this.findClosestEventIndex(targetTime);
    this.replayController.setCurrentIndex(eventIndex);

    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * Encontra o índice do evento mais próximo do tempo especificado
   */
  private findClosestEventIndex(targetTime: number): number {
    if (!this.session) return 0;

    let index = 0;
    for (let i = 0; i < this.session.events.length; i++) {
      if (this.session.events[i].timestamp.getTime() <= targetTime) {
        index = i;
      } else {
        break;
      }
    }

    return index;
  }

  /**
   * Define a velocidade de reprodução
   */
  public setSpeed(speed: number): void {
    this.replayController.setSpeed(speed);
  }

  /**
   * Libera recursos
   */
  public destroy(): void {
    this.stop();
    this.cursorManager.destroy();
    this.iframeManager.destroy();
    this.eventSimulator.destroy();
    this.session = null;
  }

  /**
   * Processa o próximo evento na sequência
   */
  private processNextEvent(): void {
    if (!this.replayController.isPlaying() || !this.session) return;

    const currentIndex = this.replayController.getCurrentIndex();

    if (currentIndex >= this.session.events.length) {
      if (this.options.loop) {
        this.replayController.reset();
        this.processNextEvent();
      } else {
        this.replayController.complete();
      }
      return;
    }

    const currentEvent = this.session.events[currentIndex];
    const nextEvent = this.session.events[currentIndex + 1];

    // Processar o evento atual
    this.options.onEvent(currentEvent);
    this.eventProcessor.processEvent(currentEvent);

    // Programar o próximo evento
    if (nextEvent) {
      const delayMs = this.calculateDelay(currentEvent, nextEvent);

      this.replayController.scheduleNext(() => {
        this.replayController.incrementIndex();
        this.processNextEvent();
      }, delayMs);
    } else {
      this.replayController.incrementIndex();
      this.processNextEvent();
    }
  }

  /**
   * Calcula o atraso entre eventos considerando a velocidade
   */
  private calculateDelay(
    currentEvent: SessionEvent,
    nextEvent: SessionEvent
  ): number {
    const currentTime = currentEvent.timestamp.getTime();
    const nextTime = nextEvent.timestamp.getTime();
    return (nextTime - currentTime) / this.replayController.getSpeed();
  }
}
