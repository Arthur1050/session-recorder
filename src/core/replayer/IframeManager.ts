import { CursorManager } from "./CursorManager";
import { ViewportDimensions } from "../../types/dimensions";

/**
 * Gerencia o iframe usado para reproduzir a sessão
 */
export class IframeManager {
  private iframe: HTMLIFrameElement | null = null;
  private cursorManager: CursorManager | null = null;
  private originalUrl: string = "";
  private contentHtml: string = "";
  private scaleToFit: boolean = true;
  private onLoadCallbacks: Array<() => void> = [];
  private iframeSandbox: boolean = false;
  private sandboxOptions: string[] = [];

  constructor(
    targetIframe: HTMLIFrameElement | string | null,
    originalUrl: string = "",
    scaleToFit: boolean = true,
    contentHtml: string = "",
    iframeSandbox: boolean = false,
    sandboxOptions: string[] = []
  ) {
    if (targetIframe) {
      this.iframe =
        typeof targetIframe === "string"
          ? (document.querySelector(targetIframe) as HTMLIFrameElement)
          : targetIframe;
    }
    this.originalUrl = originalUrl;
    this.contentHtml = contentHtml;
    this.scaleToFit = scaleToFit;
    this.iframeSandbox = iframeSandbox;
    this.sandboxOptions = sandboxOptions;
  }

  /**
   * Define o iframe a ser usado
   */
  public setIframe(iframe: HTMLIFrameElement | string): void {
    this.iframe =
      typeof iframe === "string"
        ? (document.querySelector(iframe) as HTMLIFrameElement)
        : iframe;
  }

  /**
   * Define a URL original a ser carregada no iframe
   */
  public setOriginalUrl(url: string): void {
    this.originalUrl = url;
  }

  /**
   * Define o conteúdo HTML a ser carregado no iframe
   */
  public setContentHtml(html: string): void {
    this.contentHtml = html;
  }

  /**
   * Prepara o iframe para reprodução, definindo dimensões e URL ou HTML
   */
  public prepareIframe(dimensions?: ViewportDimensions): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.iframe) {
        resolve();
        return;
      }

      // Adicionar callback para notificar quando o iframe estiver carregado
      const handleLoad = () => {
        this.iframe?.removeEventListener("load", handleLoad);

        // Se um gerenciador de cursor foi fornecido, recriá-lo no iframe
        if (this.cursorManager) {
          this.setupCursorInIframe();
        }

        // Executar callbacks registrados
        this.onLoadCallbacks.forEach((callback) => callback());
        resolve();
      };

      // Definir dimensões do iframe se fornecidas
      if (dimensions) {
        this.setIframeDimensions(dimensions);
      }

      // Se temos HTML, carregamos diretamente no iframe
      if (this.contentHtml) {
        this.iframe.addEventListener("load", handleLoad);
        this.loadHtmlContent(this.contentHtml);
      }
      // Senão, carregamos a URL
      else if (this.originalUrl && this.iframe.src !== this.originalUrl) {
        this.iframe.addEventListener("load", handleLoad);
        this.iframe.src = this.originalUrl;
      } else {
        // Se não temos HTML nem URL nova, resolvemos imediatamente
        resolve();
      }
    });
  }

  /**
   * Loads HTML content directly into the iframe with security considerations
   */
  private loadHtmlContent(html: string): void {
    if (!this.iframe) return;

    try {
      // If sandbox is enabled, set it up before loading content
      if (this.iframeSandbox) {
        // Default sandbox completely restricts everything
        const sandboxAttr =
          this.sandboxOptions.length > 0 ? this.sandboxOptions.join(" ") : "";

        this.iframe.setAttribute("sandbox", sandboxAttr);
      } else {
        // Remove sandbox if previously set
        this.iframe.removeAttribute("sandbox");
      }

      // Acessa o documento do iframe
      const doc =
        this.iframe.contentDocument ||
        (this.iframe.contentWindow && this.iframe.contentWindow.document);

      if (doc) {
        // Abre o documento, escreve o HTML e fecha
        doc.open();
        doc.write(html);
        doc.close();
      } else {
        // Fallback usando srcdoc para browsers modernos
        this.iframe.srcdoc = html;
      }
    } catch (error) {
      console.error("Failed to load HTML content into iframe:", error);
      // Fallback usando srcdoc
      this.iframe.srcdoc = html;
    }
  }

  /**
   * Loads HTML content with optional script restoration
   */
  public loadHtmlWithScripts(
    html: string,
    scripts?: Array<{ src?: string; content?: string; type?: string }>,
    restoreScripts: boolean = false
  ): void {
    if (!this.iframe) return;

    try {
      // Load the base HTML first
      this.loadHtmlContent(html);

      // If script restoration is enabled and we have scripts to restore
      if (restoreScripts && scripts && scripts.length > 0) {
        // Give the iframe content a moment to initialize
        setTimeout(() => {
          const doc =
            this.iframe?.contentDocument ||
            (this.iframe?.contentWindow && this.iframe.contentWindow.document);

          if (doc) {
            // Restore scripts in the iframe
            scripts.forEach((scriptInfo) => {
              const scriptEl = doc.createElement("script");

              // Set script type if available
              if (scriptInfo.type) {
                scriptEl.type = scriptInfo.type;
              }

              // Either set src or inline content
              if (scriptInfo.src) {
                scriptEl.src = scriptInfo.src;
              } else if (scriptInfo.content) {
                scriptEl.textContent = scriptInfo.content;
              }

              // Append to document
              doc.head.appendChild(scriptEl);
            });
          }
        }, 100); // Small delay to ensure the document is ready
      }
    } catch (error) {
      console.error("Failed to load HTML with scripts into iframe:", error);
    }
  }

  /**
   * Define as dimensões do iframe com base nas dimensões originais
   */
  private setIframeDimensions(dimensions: ViewportDimensions): void {
    if (!this.iframe) return;

    // Definir dimensões do iframe
    this.iframe.style.width = `${dimensions.width}px`;
    this.iframe.style.height = `${dimensions.height}px`;

    // Escalar para caber no container se a opção estiver ativada
    if (this.scaleToFit) {
      const container = this.iframe.parentElement;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const scaleX = containerWidth / dimensions.width;
        const scaleY = containerHeight / dimensions.height;
        const scale = Math.min(scaleX, scaleY);

        this.iframe.style.transform = `scale(${scale})`;
        this.iframe.style.transformOrigin = "top left";
      }
    }
  }

  /**
   * Registra um callback a ser executado quando o iframe for carregado
   */
  public onIframeLoad(callback: () => void): void {
    this.onLoadCallbacks.push(callback);
  }

  /**
   * Configura o cursor dentro do iframe
   */
  private setupCursorInIframe(): void {
    if (!this.iframe?.contentDocument || !this.cursorManager) return;

    // Criar novo gerenciador de cursor no contexto do iframe
    this.cursorManager = new CursorManager(this.iframe.contentDocument);
    this.cursorManager.createCursor();
  }

  /**
   * Define um gerenciador de cursor para o iframe
   */
  public setCursorManager(cursorManager: CursorManager): void {
    this.cursorManager = cursorManager;
  }

  /**
   * Retorna o documento do iframe ou o documento principal
   */
  public getDocument(): Document {
    return this.iframe?.contentDocument || document;
  }

  /**
   * Retorna a janela do iframe ou a janela principal
   */
  public getWindow(): Window {
    return this.iframe?.contentWindow || window;
  }

  /**
   * Limpa recursos
   */
  public destroy(): void {
    this.onLoadCallbacks = [];
    this.cursorManager = null;
    this.iframe = null;
  }
}
