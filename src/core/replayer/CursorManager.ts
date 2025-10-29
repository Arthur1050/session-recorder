import { ViewportCoordinates } from "../../types/coordinates";

/**
 * Gerencia a exibição e animação do cursor durante a reprodução
 */
export class CursorManager {
  private cursor: HTMLElement | null = null;
  private container: Document;
  private styleOptions: {};

  constructor(
    container: Document = document,
    styleOptions = {
      position: "absolute",
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      backgroundColor: "rgba(255,0,0,0.5)",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      zIndex: "9999",
      display: "none",
      transition: "transform 0.2s ease, background-color 0.2s ease",
      opacity: 1,
    }
  ) {
    this.container = container;
    this.styleOptions = styleOptions;
  }

  /**
   * Cria um cursor virtual para visualização durante a reprodução
   */
  public createCursor(): void {
    if (this.cursor) return;

    this.cursor = this.container.createElement("div");
    Object.assign(this.cursor.style, this.styleOptions);
    this.container.body.appendChild(this.cursor);
  }

  /**
   * Move o cursor para uma posição específica
   */
  public moveCursor(position: ViewportCoordinates): void {
    if (!this.cursor) return;

    this.cursor.style.display = "block";
    this.cursor.style.left = `${position.x}px`;
    this.cursor.style.top = `${position.y}px`;
  }

  /**
   * Anima um clique do cursor
   */
  public animateClick(): void {
    if (!this.cursor) return;

    // Animação de clique
    this.cursor.style.transform = "translate(-50%, -50%) scale(0.8)";
    this.cursor.style.backgroundColor = "rgba(255,0,0,0.8)";

    // Restaurar após a animação
    setTimeout(() => {
      if (this.cursor) {
        this.cursor.style.transform = "translate(-50%, -50%) scale(1)";
        this.cursor.style.backgroundColor = "rgba(255,0,0,0.5)";
      }
    }, 200);
  }

  /**
   * Esconde o cursor
   */
  public hideCursor(): void {
    if (this.cursor) {
      this.cursor.style.display = "none";
    }
  }

  /**
   * Remove o cursor do DOM
   */
  public destroy(): void {
    if (this.cursor && this.cursor.parentNode) {
      this.cursor.parentNode.removeChild(this.cursor);
      this.cursor = null;
    }
  }
}
