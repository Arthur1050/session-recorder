import { ViewportCoordinates } from "../../types/coordinates";

/**
 * Interface for target element information
 */
export interface TargetInfo {
  tagName: string;
  id?: string;
  className?: string;
  path?: string;
}

/**
 * Responsible for simulating user interaction events
 */
export class EventSimulator {
  private lastHoveredElement: HTMLElement | null = null;
  private document: Document;
  private window: Window;

  constructor(doc: Document = document, win: Window = window) {
    this.document = doc;
    this.window = win;
  }

  /**
   * Simula um evento de clique nas coordenadas especificadas
   */
  public simulateClickEvent(
    position: ViewportCoordinates,
    targetInfo?: TargetInfo,
    button: number = 0
  ): void {
    const element = this.findElementAtCoordinates(position, targetInfo);
    if (!element) return;

    this.dispatchMouseEvent("mousedown", element, position, button);
    this.dispatchMouseEvent("mouseup", element, position, button);
    this.dispatchMouseEvent("click", element, position, button);

    this.handleSpecialElements(element);
  }

  /**
   * Simula um evento de hover nas coordenadas especificadas
   */
  public simulateHoverEvent(
    position: ViewportCoordinates,
    targetInfo?: TargetInfo
  ): void {
    const element = this.findElementAtCoordinates(position, targetInfo);

    // Limpar estado de hover anterior se necessário
    if (
      this.lastHoveredElement &&
      (!element || this.lastHoveredElement !== element)
    ) {
      this.clearHoverState();
    }

    if (!element) return;

    this.dispatchMouseEvent("mouseover", element, position);
    this.dispatchMouseEvent("mousemove", element, position);

    element.setAttribute("data-simulated-hover", "true");
    this.lastHoveredElement = element;
  }

  /**
   * Limpa o estado de hover atual
   */
  public clearHoverState(): void {
    if (!this.lastHoveredElement) return;

    this.lastHoveredElement.removeAttribute("data-simulated-hover");

    const mouseoutEvent = new MouseEvent("mouseout", {
      bubbles: true,
      cancelable: true,
      view: this.window,
    });
    this.lastHoveredElement.dispatchEvent(mouseoutEvent);
    this.lastHoveredElement = null;
  }

  /**
   * Despacha um evento de mouse para um elemento
   */
  private dispatchMouseEvent(
    type: string,
    element: HTMLElement,
    position: ViewportCoordinates,
    button: number = 0
  ): void {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: this.window,
      clientX: position.x,
      clientY: position.y,
      button: button,
    });
    element.dispatchEvent(event);
  }

  /**
   * Lida com comportamentos especiais de elementos
   */
  private handleSpecialElements(element: HTMLElement): void {
    const tagName = element.tagName.toUpperCase();

    if (tagName === "BUTTON") {
      // Lidar com botões de formulário
      if (element.getAttribute("type") === "submit") {
        const form = element.closest("form");
        if (form) {
          form.dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true })
          );
        }
      }
    } else if (tagName === "INPUT") {
      const input = element as HTMLInputElement;
      // Lidar com checkboxes e radios
      if (input.type === "checkbox" || input.type === "radio") {
        input.checked = !input.checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (input.type === "submit") {
        const form = input.closest("form");
        if (form) {
          form.dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true })
          );
        }
      }
    } else if (tagName === "A") {
      // Lidar com links
      const anchor = element as HTMLAnchorElement;
      if (anchor.href && !anchor.href.startsWith("javascript:")) {
        console.log(
          `Link click simulated: ${anchor.href} (navigation prevented)`
        );
      }
    }
  }

  /**
   * Localiza um elemento nas coordenadas especificadas
   */
  private findElementAtCoordinates(
    position: ViewportCoordinates,
    targetInfo?: TargetInfo
  ): HTMLElement | null {
    if (targetInfo) {
      // Tentar encontrar por path
      if (targetInfo.path) {
        try {
          const element = this.document.querySelector(targetInfo.path);
          if (element) return element as HTMLElement;
        } catch (e) {
          /* Seletor inválido */
        }
      }

      // Tentar criar seletor com informações disponíveis
      let selector = targetInfo.tagName;

      if (targetInfo.id) selector += `#${targetInfo.id}`;

      if (targetInfo.className) {
        const classes = targetInfo.className
          .split(" ")
          .filter((c) => c)
          .map((c) => `.${c}`)
          .join("");
        selector += classes;
      }

      try {
        const element = this.document.querySelector(selector);
        if (element) return element as HTMLElement;
      } catch (e) {
        /* Seletor inválido */
      }
    }

    // Alternativa: usar coordenadas
    return this.document.elementFromPoint(
      position.x,
      position.y
    ) as HTMLElement;
  }

  /**
   * Libera recursos
   */
  public destroy(): void {
    this.clearHoverState();
  }
}
