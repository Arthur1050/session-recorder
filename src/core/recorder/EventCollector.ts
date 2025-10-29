import { EventType } from "../../types/events";

export interface ElementInfo {
  tagName: string;
  id?: string;
  className?: string;
  path?: string;
}

/**
 * Responsável por coletar eventos do DOM e converter em formatos adequados
 * para gravação
 */
export class EventCollector {
  private excludeElements: string[];
  private throttleTimers: { [key: string]: number } = {};

  constructor(excludeElements: string[] = []) {
    this.excludeElements = excludeElements;
  }

  /**
   * Verifica se um elemento deve ser excluído da gravação
   */
  public shouldExcludeElement(element: HTMLElement): boolean {
    return this.excludeElements.some(
      (selector) =>
        element.matches(selector) || element.closest(selector) !== null
    );
  }

  /**
   * Obtém informações detalhadas sobre um elemento do DOM
   */
  public getElementInfo(element: HTMLElement): ElementInfo {
    const path = this.getElementPath(element);

    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: this.getClassNameAsString(element) || undefined,
      path: path || undefined,
    };
  }

  /**
   * Extrai className como string, lidando com elementos SVG
   */
  public getClassNameAsString(element: Element): string {
    if (!element.className) {
      return "";
    }

    // Lidar com elementos SVG onde className é SVGAnimatedString
    if (
      typeof element.className === "object" &&
      "baseVal" in element.className
    ) {
      return (element.className as SVGAnimatedString).baseVal;
    }

    // Elementos HTML padrão onde className é uma string
    return element.className.toString();
  }

  /**
   * Cria um caminho CSS para identificar o elemento com precisão
   */
  public getElementPath(element: HTMLElement): string {
    let path: string[] = [];
    let currentElement = element;

    while (
      currentElement &&
      currentElement !== document.body &&
      path.length < 5
    ) {
      let selector = currentElement.tagName.toLowerCase();

      if (currentElement.id) {
        selector += `#${currentElement.id}`;
        path.unshift(selector);
        break; // ID é único, não precisa subir mais
      } else {
        const classNameStr = this.getClassNameAsString(currentElement);
        if (classNameStr) {
          const classes = classNameStr
            .split(" ")
            .filter((cls) => cls)
            .join(".");
          if (classes) {
            selector += `.${classes}`;
          }
        }

        // Adicionar posição entre irmãos para mais especificidade
        const siblings = Array.from(
          currentElement.parentElement?.children || []
        ).filter((el) => el.tagName === currentElement.tagName);

        if (siblings.length > 1) {
          const index = siblings.indexOf(currentElement) + 1;
          selector += `:nth-of-type(${index})`;
        }

        path.unshift(selector);
        currentElement = currentElement.parentElement as HTMLElement;
      }
    }

    return path.join(" > ");
  }

  /**
   * Aplica throttling para eventos frequentes
   * @returns true se o evento deve ser processado, false se foi limitado
   */
  public throttle(eventType: string, duration: number): boolean {
    if (this.throttleTimers[eventType]) return false;

    this.throttleTimers[eventType] = window.setTimeout(() => {
      delete this.throttleTimers[eventType];
    }, duration);

    return true;
  }

  /**
   * Limpa todos os timers de throttle
   */
  public clearThrottles(): void {
    Object.keys(this.throttleTimers).forEach((key) => {
      clearTimeout(this.throttleTimers[key]);
      delete this.throttleTimers[key];
    });
  }
}
