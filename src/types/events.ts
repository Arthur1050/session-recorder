export interface RecordingSession {
  id: string;
  userId?: string;
  userAgent?: string;
  startTime: Date;
  endTime: Date;
  events: Array<SessionEvent>;
  metadata?: Record<string, unknown>;
  viewport?: {
    width: number;
    height: number;
    devicePixelRatio: number;
    screenWidth: number;
    screenHeight: number;
  };
  // New fields for page URL and content
  pageUrl?: string;
  pageHtml?: string;
}

export interface SessionEvent {
  timestamp: Date;
  type: EventType;
  data:
    | MouseEventData
    | KeyboardEventData
    | NavigationEventData
    | CustomEventData;
}

export enum EventType {
  MOUSE_MOVE = "mousemove",
  MOUSE_CLICK = "mouseclick",
  MOUSE_SCROLL = "mousescroll",
  KEY_PRESS = "keypress",
  KEY_DOWN = "keydown",
  KEY_UP = "keyup",
  NAVIGATION = "navigation",
  RESIZE = "resize",
  CUSTOM = "custom",
}

export interface MouseEventData {
  x: number;
  y: number;
  target?: {
    tagName: string;
    id?: string;
    className?: string;
    path?: string;
  };
  button?: number;
  scrollDelta?: { x: number; y: number };
}

export interface KeyboardEventData {
  key: string;
  keyCode: number;
  modifiers: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
  };
  target?: {
    tagName: string;
    id?: string;
    className?: string;
    path?: string;
  };
}

export interface NavigationEventData {
  from: string;
  to: string;
  title?: string;
}

export interface CustomEventData {
  [key: string]: unknown;
  type: string;
}

export interface RecorderOptions {
  autoStart?: boolean;
  /**
   * in seconds
   */
  maxDuration?: number;
  /**
   * in seconds, interval to save session data
   */
  saveInterval?: number;
  /**
   * identifier for the user
   */
  userId?: string;
  /**
   * whether to capture all mouse movements (can be verbose)
   */
  captureMouseMove?: boolean;
  /**
   * whether to capture input values
   */
  captureInputs?: boolean;
  /**
   * throttle mouse move events in ms
   */
  throttleMouseMove?: number;
  /**
   * CSS selectors for elements to exclude from recording
   */
  excludeElements?: string[];
  /**
   * localStorage key for saving sessions
   */
  storageKey?: string;
  /**
   * whether to capture the full HTML of the page
   */
  captureHtml?: boolean;
  /**
   * how to handle scripts when capturing HTML
   * - "remove" = remove all scripts
   * - "keep-safe" = keep scripts from safe domains only
   * - "keep-all" = keep all scripts
   */
  scriptHandling?: "remove" | "keep-safe" | "keep-all";
  /**
   * domains considered safe for scripts (e.g. ['cdn.jsdelivr.net'])
   */
  safeScriptSources?: string[];
  /**
   * how to handle inline scripts
   * - "remove" = remove inline scripts
   * - "keep" = keep inline scripts
   */
  inlineScriptHandling?: "remove" | "keep";
  /**
   * Optimization level for HTML capture
   * 0 = minimal (no optimization)
   * 1 = standard (removes unused CSS, optimizes resources)
   * 2 = aggressive (also optimizes images, removes invisible elements)
   */
  optimizationLevel?: number;
  /**
   * Whether to inline CSS instead of using external references
   */
  inlineCss?: boolean;
  /**
   * Whether to inline JS instead of using external references
   */
  inlineJs?: boolean;
  /**
   * Whether to keep external resource references
   */
  keepExternalResources?: boolean;
  /**
   * Domains allowed for external resources
   */
  allowedResourceDomains?: string[];
  /**
   * Whether to remove elements that are not visible
   */
  removeInvisibleElements?: boolean;
  /**
   * Whether to use placeholder images instead of actual images
   */
  usePlaceholdersForImages?: boolean;
  /**
   * Whether to keep web fonts
   */
  keepFonts?: boolean;
  /**
   * Whether to remove iframe elements
   */
  removeIframes?: boolean;
  /**
   * Whether to remove media elements (video, audio)
   */
  removeMedia?: boolean;
}

export interface ReplayOptions {
  speed?: number; // playback speed multiplier
  loop?: boolean; // whether to loop the replay
  showCursor?: boolean; // whether to show a cursor during replay
  onEvent?: (event: SessionEvent) => void; // callback for each event during replay
  onComplete?: () => void; // callback when replay completes
  simulateRealEvents?: boolean; // whether to dispatch real DOM events on elements
  targetIframe?: HTMLIFrameElement | string; // iframe to use for replay
  originalUrl?: string; // original URL of the page
  contentHtml?: string; // HTML content to load in the iframe instead of URL
  scaleToFit?: boolean; // whether to scale the iframe to fit the container
  skipInactivity?: boolean; // whether to skip periods of inactivity
  maxInactivityDelay?: number; // maximum delay to allow between events (ms)
  customCursor?: string; // custom cursor CSS or image URL
  iframeSandbox?: boolean; // Whether to use sandbox attribute on iframe
  sandboxOptions?: string[]; // Specific sandbox options (e.g., ['allow-scripts', 'allow-same-origin'])
  allowScripts?: boolean; // Shorthand for allowing scripts in sandbox
}

export interface StorageAdapter {
  saveSession(session: RecordingSession): Promise<void>;
  getSession(id: string): Promise<RecordingSession | null>;
  getAllSessions(): Promise<RecordingSession[]>;
  deleteSession(id: string): Promise<void>;
}
