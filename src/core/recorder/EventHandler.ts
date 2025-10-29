import {
  EventType,
  MouseEventData,
  KeyboardEventData,
  NavigationEventData,
  CustomEventData,
} from "../../types/events";
import { EventCollector, ElementInfo } from "./EventCollector";

export interface EventHandlerOptions {
  captureMouseMove: boolean;
  throttleMouseMove: number;
  excludeElements: string[];
}

type EventCallback = (
  type: EventType,
  data:
    | MouseEventData
    | KeyboardEventData
    | NavigationEventData
    | CustomEventData
) => void;

/**
 * Responsável por lidar com diferentes tipos de eventos do navegador
 * e convertê-los em eventos de gravação
 */
export class EventHandler {
  private collector: EventCollector;
  private eventCallback: EventCallback;
  private options: EventHandlerOptions;
  private eventHandlers: { [key: string]: EventListener } = {};

  constructor(options: EventHandlerOptions, callback: EventCallback) {
    this.options = options;
    this.eventCallback = callback;
    this.collector = new EventCollector(options.excludeElements);
  }

  /**
   * Configura todos os event listeners necessários
   */
  public setupEventListeners(): void {
    // Eventos do mouse
    this.addEventHandler("click", this.handleMouseClick);
    this.addEventHandler("scroll", this.handleScroll);

    if (this.options.captureMouseMove) {
      this.addEventHandler("mousemove", this.handleMouseMove);
    }

    // Eventos do teclado
    this.addEventHandler("keydown", this.handleKeyDown);
    this.addEventHandler("keyup", this.handleKeyUp);

    // Eventos de navegação
    this.addEventHandler("popstate", this.handleNavigation);

    // Eventos de formulário
    this.addEventHandler("submit", this.handleFormSubmit);

    // Eventos de redimensionamento
    this.addEventHandler("resize", this.handleResize);

    // Eventos para rastreamento de hover
    this.addEventHandler("mouseover", this.handleMouseOver);
    this.addEventHandler("mouseout", this.handleMouseOut);
  }

  /**
   * Remove todos os event listeners
   */
  public removeEventListeners(): void {
    Object.keys(this.eventHandlers).forEach((eventType) => {
      document.removeEventListener(eventType, this.eventHandlers[eventType]);
    });
    this.eventHandlers = {};
    this.collector.clearThrottles();
  }

  /**
   * Adiciona um event handler com contexto vinculado
   */
  private addEventHandler(eventType: string, handler: (e: any) => void): void {
    const boundHandler = handler.bind(this);
    this.eventHandlers[eventType] = boundHandler;
    document.addEventListener(eventType, boundHandler, { passive: true });
  }

  // Handlers de eventos específicos

  private handleMouseClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    if (target && this.collector.shouldExcludeElement(target)) return;

    this.eventCallback(EventType.MOUSE_CLICK, {
      x: e.clientX,
      y: e.clientY,
      target: target ? this.collector.getElementInfo(target) : undefined,
      button: e.button,
    });
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.collector.throttle("mousemove", this.options.throttleMouseMove))
      return;

    const target = e.target as HTMLElement;
    if (target && this.collector.shouldExcludeElement(target)) return;

    this.eventCallback(EventType.MOUSE_MOVE, {
      x: e.clientX,
      y: e.clientY,
      target: target ? this.collector.getElementInfo(target) : undefined,
    });
  };

  private handleScroll = (): void => {
    if (!this.collector.throttle("scroll", 100)) return;

    this.eventCallback(EventType.MOUSE_SCROLL, {
      x: window.scrollX,
      y: window.scrollY,
      scrollDelta: {
        x: window.scrollX,
        y: window.scrollY,
      },
    });
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement;
    if (target && this.collector.shouldExcludeElement(target)) return;

    // Não gravar valores reais de campos de senha
    if (
      target.tagName === "INPUT" &&
      (target as HTMLInputElement).type === "password"
    ) {
      this.eventCallback(EventType.KEY_DOWN, {
        key: "*",
        keyCode: 0,
        modifiers: {
          ctrl: e.ctrlKey,
          alt: e.altKey,
          shift: e.shiftKey,
          meta: e.metaKey,
        },
        target: this.collector.getElementInfo(target),
      });
      return;
    }

    this.eventCallback(EventType.KEY_DOWN, {
      key: e.key,
      keyCode: e.keyCode,
      modifiers: {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
      },
      target: target ? this.collector.getElementInfo(target) : undefined,
    });
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement;
    if (target && this.collector.shouldExcludeElement(target)) return;

    // Não gravar valores reais de campos de senha
    if (
      target.tagName === "INPUT" &&
      (target as HTMLInputElement).type === "password"
    ) {
      return;
    }

    this.eventCallback(EventType.KEY_UP, {
      key: e.key,
      keyCode: e.keyCode,
      modifiers: {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
      },
      target: target ? this.collector.getElementInfo(target) : undefined,
    });
  };

  private handleNavigation = (): void => {
    this.eventCallback(EventType.NAVIGATION, {
      from: document.referrer,
      to: window.location.href,
      title: document.title,
    });
  };

  private handleFormSubmit = (e: Event): void => {
    const form = e.target as HTMLFormElement;
    if (form && !this.collector.shouldExcludeElement(form)) {
      this.eventCallback(EventType.CUSTOM, {
        type: "form_submit",
        formId: form.id,
        formAction: form.action,
      });
    }
  };

  private handleResize = (): void => {
    if (!this.collector.throttle("resize", 100)) return;

    this.eventCallback(EventType.RESIZE, {
      type: "viewport_resize", // Add type property to make it compatible with CustomEventData
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    });
  };

  private handleMouseOver = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    if (target && this.collector.shouldExcludeElement(target)) return;

    this.eventCallback(EventType.CUSTOM, {
      type: "mouseover",
      x: e.clientX,
      y: e.clientY,
      target: target ? this.collector.getElementInfo(target) : undefined,
    });
  };

  private handleMouseOut = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    if (target && this.collector.shouldExcludeElement(target)) return;

    this.eventCallback(EventType.CUSTOM, {
      type: "mouseout",
      x: e.clientX,
      y: e.clientY,
      target: target ? this.collector.getElementInfo(target) : undefined,
    });
  };
}
