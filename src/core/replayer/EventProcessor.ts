import {
  SessionEvent,
  EventType,
  ReplayOptions,
  NavigationEventData,
  MouseEventData,
  KeyboardEventData,
  CustomEventData,
} from "../../types/events";
import { CursorManager } from "./CursorManager";
import { EventSimulator, TargetInfo } from "./EventSimulator";
import { ViewportCoordinates } from "../../types/coordinates";

/**
 * Processa eventos de sessão e traduz para ações do reprodutor
 */
export class EventProcessor {
  private cursorManager: CursorManager;
  private eventSimulator: EventSimulator;
  private options: Required<ReplayOptions>;

  constructor(
    cursorManager: CursorManager,
    eventSimulator: EventSimulator,
    options: Required<ReplayOptions>
  ) {
    this.cursorManager = cursorManager;
    this.eventSimulator = eventSimulator;
    this.options = options;
  }

  /**
   * Processa um evento de sessão
   */
  public processEvent(event: SessionEvent): void {
    // Extrair coordenadas quando disponíveis
    const coordinates: ViewportCoordinates | undefined =
      this.extractCoordinates(event);

    // Extrair informações do alvo quando disponíveis
    const targetInfo: TargetInfo | undefined =
      "target" in event.data && event.data.target
        ? (event.data.target as TargetInfo)
        : undefined;

    switch (event.type) {
      case EventType.MOUSE_MOVE:
        this.processMouseMove(coordinates, targetInfo);
        break;

      case EventType.MOUSE_CLICK:
        this.processMouseClick(
          coordinates,
          targetInfo,
          "button" in event.data ? Number(event.data.button) : 0
        );
        break;

      case EventType.NAVIGATION:
        if (this.isNavigationEventData(event.data)) {
          this.processNavigation(event.data);
        }
        break;

      case EventType.RESIZE:
        // Implementar se necessário
        break;

      case EventType.MOUSE_SCROLL:
        // Implementar rolagem do viewport
        break;

      case EventType.KEY_DOWN:
      case EventType.KEY_UP:
        // Implementar visualização de atividade do teclado
        break;

      case EventType.CUSTOM:
        // Tratar eventos personalizados
        break;
    }
  }

  /**
   * Extract coordinates from event data safely
   */
  private extractCoordinates(
    event: SessionEvent
  ): ViewportCoordinates | undefined {
    if ("x" in event.data && "y" in event.data) {
      const x = Number(event.data.x);
      const y = Number(event.data.y);

      if (!isNaN(x) && !isNaN(y)) {
        return { x, y };
      }
    }
    return undefined;
  }

  /**
   * Check if data is NavigationEventData
   */
  private isNavigationEventData(
    data:
      | MouseEventData
      | KeyboardEventData
      | NavigationEventData
      | CustomEventData
  ): data is NavigationEventData {
    return "from" in data && "to" in data;
  }

  /**
   * Processa um evento de movimento do mouse
   */
  private processMouseMove(
    coordinates?: ViewportCoordinates,
    targetInfo?: TargetInfo
  ): void {
    if (!coordinates) return;

    // Mover cursor se visível
    if (this.options.showCursor) {
      this.cursorManager.moveCursor(coordinates);
    }

    // Simular evento real se a opção estiver ativada
    if (this.options.simulateRealEvents) {
      this.eventSimulator.simulateHoverEvent(coordinates, targetInfo);
    }
  }

  /**
   * Processa um evento de clique do mouse
   */
  private processMouseClick(
    coordinates?: ViewportCoordinates,
    targetInfo?: TargetInfo,
    button: number = 0
  ): void {
    if (!coordinates) return;

    // Mover cursor e animar clique se visível
    if (this.options.showCursor) {
      this.cursorManager.moveCursor(coordinates);
      this.cursorManager.animateClick();
    }

    // Simular evento real se a opção estiver ativada
    if (this.options.simulateRealEvents) {
      this.eventSimulator.simulateClickEvent(coordinates, targetInfo, button);
    }
  }

  /**
   * Processa um evento de navegação
   */
  private processNavigation(data: NavigationEventData): void {
    console.log(`Navigation: ${data.from} -> ${data.to}`);
  }
}
