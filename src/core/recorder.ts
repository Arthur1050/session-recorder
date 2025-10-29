import {
  RecordingSession,
  SessionEvent,
  EventType,
  RecorderOptions,
  MouseEventData,
  KeyboardEventData,
  NavigationEventData,
  CustomEventData,
} from "../types/events";
import { generateUniqueId } from "../utils/helpers";
import { EventHandler } from "./recorder/EventHandler";
import { SessionStorage } from "./recorder/SessionStorage";
import { HtmlCaptureHelper } from "./recorder/HtmlCaptureHelper";

/**
 * Responsible for recording user sessions
 */
export class SessionRecorder {
  private isRecording: boolean = false;
  private currentSession: RecordingSession | null = null;
  private options: Required<RecorderOptions>;
  private saveIntervalId: number | null = null;
  private sessionTimeout: number | null = null;

  private eventHandler: EventHandler;
  private sessionStorage: SessionStorage;
  private htmlCaptureHelper: HtmlCaptureHelper;

  private readonly defaultOptions: typeof this.options = {
    autoStart: true,
    maxDuration: 3600, // 1 hour maximum recording
    saveInterval: 30, // save every 30 seconds
    userId: "anonymous",
    captureMouseMove: true,
    captureInputs: false,
    throttleMouseMove: 50, // throttle to 50ms
    excludeElements: [".no-record", "[data-private]"],
    storageKey: "session_recordings",
    captureHtml: false, // By default, don't capture full HTML (just URL)
    scriptHandling: "remove", // Default to removing all scripts for security
    safeScriptSources: ["cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
    inlineScriptHandling: "remove", // Default to removing inline scripts
    allowedResourceDomains: ["cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
    inlineCss: true, // Default to capturing inline CSS
    inlineJs: true, // Default to capturing inline JS
    keepExternalResources: true, // Default to not keeping external resources
    keepFonts: true, // Default to keeping web fonts
    removeInvisibleElements: true, // Default to removing invisible elements
    usePlaceholdersForImages: true, // Default to using placeholders for images
    optimizationLevel: 1, // Default to standard optimization
    removeIframes: true, // Default to removing iframes
    removeMedia: true, // Default to removing media elements
  };

  constructor(options?: RecorderOptions) {
    this.options = { ...this.defaultOptions, ...(options || {}) };

    // Initialize components
    this.sessionStorage = new SessionStorage(
      undefined,
      this.options.storageKey
    );
    this.eventHandler = new EventHandler(
      {
        captureMouseMove: this.options.captureMouseMove,
        throttleMouseMove: this.options.throttleMouseMove,
        excludeElements: this.options.excludeElements,
      },
      this.recordEvent.bind(this)
    );
    this.htmlCaptureHelper = new HtmlCaptureHelper(this.options);

    if (this.options.autoStart) {
      this.startRecording();
    }
  }

  /**
   * Starts recording the user session
   */
  public startRecording(): void {
    if (this.isRecording) {
      console.warn("Recording is already in progress.");
      return;
    }

    // Initialize session with basic information
    this.initializeSession();

    // Capture HTML content if enabled
    if (this.options.captureHtml) {
      this.capturePageHtml();
    }

    // Set up event listeners and timers
    this.startSessionEventCapture();

    console.log("Recording started. Session ID:", this.currentSession!.id);

    // Record initial navigation event
    this.recordNavigationEvent();
  }

  /**
   * Initializes a new recording session with basic information
   */
  private initializeSession(): void {
    this.currentSession = {
      id: generateUniqueId(),
      userId: this.options.userId,
      userAgent: navigator.userAgent,
      startTime: new Date(),
      endTime: new Date(), // Will be updated when stopping
      events: [],
      pageUrl: window.location.href,
      viewport: this.captureViewportInfo(),
    };
  }

  /**
   * Captures current viewport dimensions
   */
  private captureViewportInfo(): RecordingSession["viewport"] {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };
  }

  /**
   * Captures the HTML of the current page
   */
  private capturePageHtml(): void {
    try {
      this.htmlCaptureHelper.capturePageHtml().then((html) => {
        this.currentSession!.pageHtml = html;
      });
    } catch (error) {
      console.error("Failed to capture HTML:", error);
    }
  }

  /**
   * Sets up event listeners and timers for session recording
   */
  private startSessionEventCapture(): void {
    // Set up event listeners
    this.eventHandler.setupEventListeners();
    this.isRecording = true;

    // Set up auto-save interval
    this.saveIntervalId = window.setInterval(
      () => this.saveCurrentSession(),
      this.options.saveInterval * 1000
    );

    // Set up max duration timeout
    if (this.options.maxDuration > 0) {
      this.sessionTimeout = window.setTimeout(
        () => this.stopRecording(),
        this.options.maxDuration * 1000
      );
    }

    // Set up page unload handler
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  /**
   * Records the initial navigation event
   */
  private recordNavigationEvent(): void {
    this.recordEvent(EventType.NAVIGATION, {
      from: document.referrer || "direct",
      to: window.location.href,
      title: document.title,
    });
  }

  /**
   * Stops the recording session
   */
  public stopRecording(): void {
    if (!this.isRecording || !this.currentSession) {
      console.warn("No recording in progress to stop.");
      return;
    }

    // Clean up event handlers and timers
    this.cleanupSession();

    // Update session end time
    this.currentSession.endTime = new Date();

    // Save final session data
    this.saveCurrentSession();

    console.log("Recording stopped. Session ID:", this.currentSession.id);
  }

  /**
   * Cleans up event handlers and timers for the session
   */
  private cleanupSession(): void {
    // Remove event listeners
    this.eventHandler.removeEventListeners();

    // Clear auto-save interval
    if (this.saveIntervalId !== null) {
      clearInterval(this.saveIntervalId);
      this.saveIntervalId = null;
    }

    // Clear max duration timeout
    if (this.sessionTimeout !== null) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }

    // Remove page unload handler
    window.removeEventListener("beforeunload", this.handleBeforeUnload);

    this.isRecording = false;
  }

  /**
   * Obtém todas as gravações armazenadas
   */
  public async getRecordings(): Promise<RecordingSession[]> {
    return await this.sessionStorage.getAllSessions();
  }

  /**
   * Obtém uma gravação específica pelo ID
   */
  public async getRecording(id: string): Promise<RecordingSession | null> {
    return await this.sessionStorage.getSession(id);
  }

  /**
   * Exclui uma gravação pelo ID
   */
  public async deleteRecording(id: string): Promise<void> {
    return await this.sessionStorage.deleteSession(id);
  }

  /**
   * Retorna a sessão atual, se houver
   */
  public getCurrentSession(): RecordingSession | null {
    return this.currentSession;
  }

  /**
   * Salva a sessão atual no armazenamento
   */
  private async saveCurrentSession(): Promise<void> {
    if (!this.currentSession) return;
    try {
      await this.sessionStorage.saveSession(this.currentSession);
    } catch (err) {
      console.error("Failed to save session:", err);
    }
  }

  /**
   * Handler para o evento beforeunload
   */
  private handleBeforeUnload = (): void => {
    this.stopRecording();
  };

  /**
   * Registra um evento na sessão atual
   */
  private recordEvent(
    type: EventType,
    data:
      | MouseEventData
      | KeyboardEventData
      | NavigationEventData
      | CustomEventData
  ): void {
    if (!this.isRecording || !this.currentSession) return;

    const event: SessionEvent = {
      timestamp: new Date(),
      type,
      data,
    };

    this.currentSession.events.push(event);
  }
}
