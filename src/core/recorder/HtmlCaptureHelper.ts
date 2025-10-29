import { RecorderOptions } from "../../types/events";
import { StylesheetProcessor } from "./resources/StylesheetProcessor";
import { ScriptProcessor } from "./resources/ScriptProcessor";
import { ResourceHelper } from "./resources/ResourceHelper";

/**
 * Helper class para captura e processamento de conteúdo HTML
 *
 * Esta classe realiza os seguintes tratamentos no HTML capturado:
 *
 * 1. Processamento de Scripts:
 *    - Remoção completa de scripts ("remove")
 *    - Manutenção apenas de scripts de fontes seguras ("keep-safe")
 *    - Manutenção de todos os scripts ("keep-all")
 *    - Tratamento específico para scripts inline
 *    - Tratamento específico para scripts inline
 *
 * 2. Remoção de Elementos:
 *    - Exclusão de elementos baseada em seletores configurados
 *    - Remoção opcional de elementos invisíveis
 *    - Remoção de iframes (configurável)
 *    - Remoção de elementos de mídia como vídeo e áudio (configurável)
 *
 * 3. Otimização de Recursos Externos:
 *    - Tratamento de folhas de estilo (CSS)
 *    - Inline de CSS em vez de referências externas
 *    - Remoção de CSS não utilizado
 *    - Filtro de recursos baseado em domínios permitidos
 *
 * 4. Otimização de Imagens:
 *    - Substituição por placeholders
 *    - Definição explícita de dimensões
 *    - Adição de atributo loading="lazy" para carregamento tardio
 *    - Remoção de imagens invisíveis
 *
 * 5. Outros Recursos:
 *    - Tratamento de fontes web externas
 *    - Otimização baseada em níveis configuráveis
 *
 * 6. Metadados:
 *    - Adição de metadados sobre a captura
 *    - Inclusão de timestamp da captura
 */
export class HtmlCaptureHelper {
  private options: Required<RecorderOptions>;
  private resourceHelper: ResourceHelper;
  private styleProcessor: StylesheetProcessor;
  private scriptProcessor: ScriptProcessor;

  constructor(options: typeof this.options) {
    this.options = options;
    this.resourceHelper = new ResourceHelper(options);
    this.styleProcessor = new StylesheetProcessor(options, this.resourceHelper);
    this.scriptProcessor = new ScriptProcessor(options, this.resourceHelper);
  }

  /**
   * Captures the current page's HTML with appropriate processing
   */
  public async capturePageHtml(): Promise<string> {
    // Clone the document to avoid modifying the actual page
    const htmlClone = document.documentElement.cloneNode(true) as HTMLElement;

    // Process scripts according to options
    this.processScripts(htmlClone);

    // Remove excluded elements
    this.removeExcludedElements(htmlClone);

    // Optimize external resources
    await this.optimizeExternalResources(htmlClone);

    // Clean up unused CSS if enabled
    if (this.options.optimizationLevel > 0) {
      this.styleProcessor.removeUnusedCss(htmlClone);
    }

    // Optimize images if set to aggressive optimization
    if (this.options.optimizationLevel > 1) {
      this.optimizeImages(htmlClone);
    }

    // Add metadata
    this.addCaptureMetadata(htmlClone);

    return htmlClone.outerHTML;
  }

  /**
   * Processes script tags according to configured options
   */
  private processScripts(htmlClone: HTMLElement): void {
    const scripts = htmlClone.querySelectorAll("script");

    switch (this.options.scriptHandling) {
      case "remove":
        scripts.forEach((script) => script.remove());
        break;
      case "keep-safe":
        this.processSafeScripts(scripts);
        break;
      case "keep-all":
        break; // No action needed
    }
  }

  /**
   * Processes scripts to keep only those from safe sources
   */
  private processSafeScripts(scripts: NodeListOf<HTMLScriptElement>): void {
    scripts.forEach((script) => {
      const src = script.getAttribute("src");

      // Handle inline scripts
      if (!src) {
        if (this.options.inlineScriptHandling === "remove") {
          script.remove();
        }
        return;
      }

      // Check if external script is from a safe source
      if (!this.resourceHelper.isResourceFromAllowedDomain(src)) {
        script.remove();
      }
    });
  }

  /**
   * Removes elements that should be excluded from recording
   */
  private removeExcludedElements(htmlClone: HTMLElement): void {
    this.options.excludeElements.forEach((selector) => {
      try {
        const elements = htmlClone.querySelectorAll(selector);
        elements.forEach((el) => el.remove());
      } catch (e) {
        // Invalid selector, skip
      }
    });
  }

  /**
   * Adds metadata to indicate this is a captured page
   */
  private addCaptureMetadata(htmlClone: HTMLElement): void {
    const head = htmlClone.querySelector("head");
    if (!head) return;

    const metaTag = document.createElement("meta");
    metaTag.setAttribute("name", "session-recorder-capture");
    metaTag.setAttribute("content", "true");

    const timeStamp = document.createElement("meta");
    timeStamp.setAttribute("name", "session-recorder-timestamp");
    timeStamp.setAttribute("content", new Date().toISOString());

    head.appendChild(metaTag);
    head.appendChild(timeStamp);
  }

  /**
   * Optimizes external resource references
   */
  private async optimizeExternalResources(
    htmlClone: HTMLElement
  ): Promise<void> {
    // Process stylesheets
    await this.styleProcessor.processStylesheets(htmlClone);

    // Process scripts
    await this.scriptProcessor.processScripts(htmlClone);

    // Process images
    this.processImages(htmlClone);

    // Handle other resources (fonts, etc)
    this.optimizeOtherResources(htmlClone);
  }

  /**
   * Process images based on visibility and configuration
   */
  private processImages(htmlClone: HTMLElement): void {
    const images = htmlClone.querySelectorAll("img");

    images.forEach((img) => {
      const src = img.getAttribute("src");
      if (!src || this.resourceHelper.isResourceFromAllowedDomain(src)) return;

      // Remove invisible images if configured to do so
      if (
        !this.resourceHelper.isElementVisible(img) &&
        this.options.removeInvisibleElements
      ) {
        img.remove();
      } else if (
        !this.options.keepExternalResources &&
        !this.resourceHelper.isDataUrl(src)
      ) {
        this.optimizeImageSource(img);
      }
    });
  }

  /**
   * Optimizes image sources (compress, resize, or replace with placeholders)
   */
  private optimizeImageSource(img: HTMLImageElement): void {
    img.setAttribute("data-optimized", "true");

    if (this.options.usePlaceholdersForImages) {
      const originalSrc = img.src;
      img.setAttribute(
        "src",
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
      );
      img.setAttribute("data-original-src", originalSrc);
    }
  }

  /**
   * Optimizes images in the document by reducing quality or dimensions
   */
  private optimizeImages(htmlClone: HTMLElement): void {
    const images = htmlClone.querySelectorAll("img");

    images.forEach((img) => {
      // Set explicit dimensions if available
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      if (width && height) {
        img.setAttribute("width", width.toString());
        img.setAttribute("height", height.toString());
      }

      // Add loading="lazy" for images outside viewport
      if (!this.resourceHelper.isElementVisible(img)) {
        img.setAttribute("loading", "lazy");
      }
    });
  }

  /**
   * Optimize other resources like fonts, videos, etc.
   */
  private optimizeOtherResources(htmlClone: HTMLElement): void {
    // Remove font links if configured
    if (!this.options.keepFonts) {
      htmlClone
        .querySelectorAll('link[rel="stylesheet"][href*="fonts"]')
        .forEach((link) => link.remove());
    }

    // Remove iframes if configured
    if (this.options.removeIframes) {
      htmlClone.querySelectorAll("iframe").forEach((iframe) => iframe.remove());
    }

    // Remove media elements if configured
    if (this.options.removeMedia) {
      htmlClone
        .querySelectorAll("video, audio")
        .forEach((media) => media.remove());
    }
  }
}
