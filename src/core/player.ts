import { SessionReplayer } from "./replayer";
import { RecordingSession, ReplayOptions } from "../types/events";

/**
 * Options for the SessionPlayer UI
 */
export interface PlayerOptions {
  theme?: "light" | "dark"; // Color theme for the player UI
  showControls?: boolean; // Whether to show control buttons
  showTimeline?: boolean; // Whether to show the timeline/progress bar
  showSpeedControl?: boolean; // Whether to show playback speed controls
  autoplay?: boolean; // Whether to start playback automatically
  loop?: boolean; // Whether to loop the playback
  width?: string; // Width of the player (CSS value)
  height?: string; // Height of the player (CSS value)
  iframeStyles?: Record<string, string>; // Additional styles for the iframe
  containerStyles?: Record<string, string>; // Additional styles for the container
}

/**
 * A UI player that wraps SessionReplayer to provide playback controls
 * for recorded sessions in a specified HTML element
 */
export class SessionPlayer {
  private container: HTMLElement;
  private playerOptions: Required<PlayerOptions>;
  private replayOptions: ReplayOptions;
  private replayer: SessionReplayer;
  private session: RecordingSession | null = null;

  // UI Elements
  private playerContainer!: HTMLDivElement;
  private iframeContainer!: HTMLDivElement;
  private iframe!: HTMLIFrameElement;
  private controlsContainer!: HTMLDivElement;
  private timeline!: HTMLDivElement;
  private timelineProgress!: HTMLDivElement;
  private timeDisplay!: HTMLDivElement;
  private playButton!: HTMLButtonElement;
  private speedSelector!: HTMLSelectElement;

  // State
  private duration: number = 0;
  private currentTime: number = 0;
  private timelineIsDragging: boolean = false;

  // Default options
  private defaultPlayerOptions: Required<PlayerOptions> = {
    theme: "light",
    showControls: true,
    showTimeline: true,
    showSpeedControl: true,
    autoplay: false,
    loop: false,
    width: "100%",
    height: "600px",
    iframeStyles: {},
    containerStyles: {},
  };

  /**
   * Creates a new SessionPlayer instance
   *
   * @param containerElement - HTML element or selector where the player will be rendered
   * @param playerOptions - Options for the player UI
   * @param replayOptions - Options for the session replayer
   */
  constructor(
    containerElement: HTMLElement | string,
    playerOptions: PlayerOptions = {},
    replayOptions: ReplayOptions = {}
  ) {
    // Get container element
    if (typeof containerElement === "string") {
      const element = document.querySelector(containerElement);
      if (!element) {
        throw new Error(`Container element not found: ${containerElement}`);
      }
      this.container = element as HTMLElement;
    } else {
      this.container = containerElement;
    }

    // Merge options with defaults
    this.playerOptions = { ...this.defaultPlayerOptions, ...playerOptions };

    // Set replay options
    this.replayOptions = {
      ...replayOptions,
      loop: this.playerOptions.loop,
      onEvent: this.handleEvent.bind(this),
      onComplete: this.handlePlaybackComplete.bind(this),
      showCursor: true,
    };

    // Create UI elements
    this.createPlayerElements();

    // Initialize SessionReplayer
    this.iframe = this.createIframe();
    this.replayer = new SessionReplayer({
      ...this.replayOptions,
      targetIframe: this.iframe,
    });

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Creates the player UI elements
   */
  private createPlayerElements(): void {
    // Clear container
    this.container.innerHTML = "";

    // Create player container with theme
    this.playerContainer = document.createElement("div");
    this.playerContainer.className = `session-player theme-${this.playerOptions.theme}`;
    this.playerContainer.style.width = this.playerOptions.width;
    this.playerContainer.style.height = this.playerOptions.height;
    this.playerContainer.style.position = "relative";
    this.playerContainer.style.display = "flex";
    this.playerContainer.style.flexDirection = "column";
    this.playerContainer.style.overflow = "hidden";
    this.playerContainer.style.border = "1px solid #ccc";
    this.playerContainer.style.borderRadius = "4px";
    this.playerContainer.style.backgroundColor =
      this.playerOptions.theme === "dark" ? "#222" : "#fff";

    // Apply custom container styles
    Object.entries(this.playerOptions.containerStyles).forEach(
      ([key, value]) => {
        (this.playerContainer.style as any)[key] = value;
      }
    );

    // Create iframe container
    this.iframeContainer = document.createElement("div");
    this.iframeContainer.className = "session-player-content";
    this.iframeContainer.style.flex = "1";
    this.iframeContainer.style.position = "relative";
    this.iframeContainer.style.overflow = "hidden";

    // Create controls container
    this.controlsContainer = document.createElement("div");
    this.controlsContainer.className = "session-player-controls";
    this.controlsContainer.style.height = "40px";
    this.controlsContainer.style.display = "flex";
    this.controlsContainer.style.alignItems = "center";
    this.controlsContainer.style.padding = "0 10px";
    this.controlsContainer.style.backgroundColor =
      this.playerOptions.theme === "dark" ? "#333" : "#f0f0f0";
    this.controlsContainer.style.borderTop =
      this.playerOptions.theme === "dark" ? "1px solid #444" : "1px solid #ddd";

    if (this.playerOptions.showControls) {
      // Create play button
      this.playButton = document.createElement("button");
      this.playButton.className = "session-player-play-btn";
      this.playButton.innerHTML = "▶️";
      this.playButton.style.width = "30px";
      this.playButton.style.height = "30px";
      this.playButton.style.border = "none";
      this.playButton.style.background = "transparent";
      this.playButton.style.cursor = "pointer";
      this.playButton.style.fontSize = "16px";
      this.playButton.title = "Play";

      // Create time display
      this.timeDisplay = document.createElement("div");
      this.timeDisplay.className = "session-player-time";
      this.timeDisplay.textContent = "0:00 / 0:00";
      this.timeDisplay.style.fontSize = "12px";
      this.timeDisplay.style.marginLeft = "10px";
      this.timeDisplay.style.color =
        this.playerOptions.theme === "dark" ? "#ccc" : "#666";

      // Add controls to container
      this.controlsContainer.appendChild(this.playButton);
      this.controlsContainer.appendChild(this.timeDisplay);
    }

    if (this.playerOptions.showTimeline) {
      // Create timeline container
      this.timeline = document.createElement("div");
      this.timeline.className = "session-player-timeline";
      this.timeline.style.flex = "1";
      this.timeline.style.height = "6px";
      this.timeline.style.margin = "0 10px";
      this.timeline.style.backgroundColor =
        this.playerOptions.theme === "dark" ? "#555" : "#ccc";
      this.timeline.style.borderRadius = "3px";
      this.timeline.style.position = "relative";
      this.timeline.style.cursor = "pointer";

      // Create timeline progress
      this.timelineProgress = document.createElement("div");
      this.timelineProgress.className = "session-player-progress";
      this.timelineProgress.style.position = "absolute";
      this.timelineProgress.style.left = "0";
      this.timelineProgress.style.top = "0";
      this.timelineProgress.style.height = "100%";
      this.timelineProgress.style.backgroundColor =
        this.playerOptions.theme === "dark" ? "#3498db" : "#2980b9";
      this.timelineProgress.style.borderRadius = "3px";
      this.timelineProgress.style.width = "0%";

      this.timeline.appendChild(this.timelineProgress);
      this.controlsContainer.appendChild(this.timeline);
    }

    if (this.playerOptions.showSpeedControl) {
      // Create speed selector
      this.speedSelector = document.createElement("select");
      this.speedSelector.className = "session-player-speed";
      this.speedSelector.style.marginLeft = "10px";
      this.speedSelector.style.border =
        this.playerOptions.theme === "dark"
          ? "1px solid #555"
          : "1px solid #ccc";
      this.speedSelector.style.borderRadius = "3px";
      this.speedSelector.style.backgroundColor =
        this.playerOptions.theme === "dark" ? "#444" : "#fff";
      this.speedSelector.style.color =
        this.playerOptions.theme === "dark" ? "#ccc" : "#333";
      this.speedSelector.style.fontSize = "12px";
      this.speedSelector.style.padding = "2px 5px";

      // Add speed options
      const speeds = [0.25, 0.5, 1, 1.5, 2];
      speeds.forEach((speed) => {
        const option = document.createElement("option");
        option.value = String(speed);
        option.textContent = `${speed}x`;
        if (speed === 1) option.selected = true;
        this.speedSelector.appendChild(option);
      });

      this.controlsContainer.appendChild(this.speedSelector);
    }

    // Assemble player
    this.playerContainer.appendChild(this.iframeContainer);
    this.playerContainer.appendChild(this.controlsContainer);

    // Add player to container
    this.container.appendChild(this.playerContainer);
  }

  /**
   * Creates the iframe for session replay
   */
  private createIframe(): HTMLIFrameElement {
    const iframe = document.createElement("iframe");
    iframe.className = "session-player-iframe";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.pointerEvents = "none";

    // Apply custom iframe styles
    Object.entries(this.playerOptions.iframeStyles).forEach(([key, value]) => {
      (iframe.style as any)[key] = value;
    });

    this.iframeContainer.appendChild(iframe);
    return iframe;
  }

  /**
   * Sets up event listeners for the player controls
   */
  private setupEventListeners(): void {
    if (this.playerOptions.showControls) {
      // Play button event
      this.playButton.addEventListener("click", () => {
        if (this.replayer && this.session) {
          if (this.playButton.innerHTML === "▶️") {
            this.play();
          } else {
            this.pause();
          }
        }
      });
    }

    if (this.playerOptions.showTimeline) {
      // Timeline seek events
      this.timeline.addEventListener("mousedown", (e) => {
        this.timelineIsDragging = true;
        this.handleTimelineSeek(e);
      });

      document.addEventListener("mouseup", () => {
        this.timelineIsDragging = false;
      });

      document.addEventListener("mousemove", (e) => {
        if (this.timelineIsDragging) {
          this.handleTimelineSeek(e);
        }
      });
    }

    if (this.playerOptions.showSpeedControl) {
      // Speed change event
      this.speedSelector.addEventListener("change", () => {
        const speed = parseFloat(this.speedSelector.value);
        this.setPlaybackSpeed(speed);
      });
    }
  }

  /**
   * Handles seeking in the timeline
   */
  private handleTimelineSeek(e: MouseEvent): void {
    if (!this.session || !this.timeline) return;

    const rect = this.timeline.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    const seekTime = this.duration * percentage;

    this.currentTime = seekTime;
    this.updateTimelineProgress();
    this.updateTimeDisplay();

    this.replayer.seekTo(seekTime);
  }

  /**
   * Handles playback events
   */
  private handleEvent(event: any): void {
    if (!this.session) return;

    const sessionStartTime = new Date(this.session.startTime).getTime();
    const eventTime = new Date(event.timestamp).getTime();
    this.currentTime = eventTime - sessionStartTime;

    this.updateTimelineProgress();
    this.updateTimeDisplay();
  }

  /**
   * Handles completion of playback
   */
  private handlePlaybackComplete(): void {
    this.playButton.innerHTML = "▶️";
    this.playButton.title = "Play";
    this.currentTime = 0;
    this.updateTimelineProgress();
    this.updateTimeDisplay();
  }

  /**
   * Updates the timeline progress based on current time
   */
  private updateTimelineProgress(): void {
    if (!this.timelineProgress) return;

    const percentage =
      this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    this.timelineProgress.style.width = `${percentage}%`;
  }

  /**
   * Updates the time display
   */
  private updateTimeDisplay(): void {
    if (!this.timeDisplay) return;

    const formatTime = (ms: number): string => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const currentTimeFormatted = formatTime(this.currentTime);
    const durationFormatted = formatTime(this.duration);

    this.timeDisplay.textContent = `${currentTimeFormatted} / ${durationFormatted}`;
  }

  /**
   * Loads a session for playback
   *
   * @param session - The recording session to load
   * @param originalUrl - Optional URL to load in the iframe (overrides session.pageUrl)
   * @param contentHtml - Optional HTML content to load in the iframe (overrides session.pageHtml)
   */
  public loadSession(
    session: RecordingSession,
    originalUrl?: string,
    contentHtml?: string
  ): void {
    this.session = session;

    // Calculate session duration
    if (session.startTime && session.endTime) {
      this.session.startTime = new Date(session.startTime);
      this.session.endTime = new Date(session.endTime);

      this.duration = this.session.startTime.getTime() - this.session.endTime.getTime();
    } else if (session.events.length > 1) {
      const firstEvent = session.events[0];
      const lastEvent = session.events[session.events.length - 1];
      this.duration =
        new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime();
    } else {
      this.duration = 0;
    }

    // Reset state
    this.currentTime = 0;
    this.updateTimelineProgress();
    this.updateTimeDisplay();

    // Set content in the replayer with priority order:
    // 1. Explicitly provided HTML content
    // 2. Explicitly provided URL
    // 3. Session's recorded HTML
    // 4. Session's recorded URL
    if (contentHtml) {
      this.replayer.setContentHtml(contentHtml);
    } else if (originalUrl) {
      this.replayer.setOriginalUrl(originalUrl);
    } else if (session.pageHtml) {
      this.replayer.setContentHtml(session.pageHtml);
    } else if (session.pageUrl) {
      this.replayer.setOriginalUrl(session.pageUrl);
    }

    // Load session into replayer
    this.replayer.loadSession(session);

    // Autoplay if enabled
    if (this.playerOptions.autoplay) {
      this.play();
    }
  }

  /**
   * Starts playback
   */
  public play(): void {
    if (!this.session) return;

    this.replayer.play();
    this.playButton.innerHTML = "⏸️";
    this.playButton.title = "Pause";
  }

  /**
   * Pauses playback
   */
  public pause(): void {
    this.replayer.pause();
    this.playButton.innerHTML = "▶️";
    this.playButton.title = "Play";
  }

  /**
   * Stops playback
   */
  public stop(): void {
    this.replayer.stop();
    this.playButton.innerHTML = "▶️";
    this.playButton.title = "Play";
    this.currentTime = 0;
    this.updateTimelineProgress();
    this.updateTimeDisplay();
  }

  /**
   * Sets the playback speed
   */
  public setPlaybackSpeed(speed: number): void {
    this.replayer.setSpeed(speed);
  }

  /**
   * Seeks to a specific time in the session
   */
  public seekTo(timeMs: number): void {
    if (!this.session) return;

    this.currentTime = timeMs;
    this.updateTimelineProgress();
    this.updateTimeDisplay();
    this.replayer.seekTo(timeMs);
  }

  /**
   * Cleans up resources
   */
  public destroy(): void {
    if (this.replayer) {
      this.replayer.destroy();
    }

    // Remove event listeners
    if (this.timeline) {
      this.timeline.removeEventListener("mousedown", this.handleTimelineSeek);
    }

    document.removeEventListener("mouseup", () => {
      this.timelineIsDragging = false;
    });

    document.removeEventListener("mousemove", (e) => {
      if (this.timelineIsDragging) {
        this.handleTimelineSeek(e);
      }
    });

    // Clear container
    this.container.innerHTML = "";
  }
}
