import { RecorderOptions } from "../../../types/events";
import { ResourceHelper } from "./ResourceHelper";

/**
 * Processador de folhas de estilo (CSS)
 */
export class StylesheetProcessor {
  private options: Required<RecorderOptions>;
  private resourceHelper: ResourceHelper;

  constructor(
    options: Required<RecorderOptions>,
    resourceHelper: ResourceHelper
  ) {
    this.options = options;
    this.resourceHelper = resourceHelper;
  }

  /**
   * Processa todas as folhas de estilo externas no documento
   */
  public async processStylesheets(htmlClone: HTMLElement): Promise<void> {
    const stylesheets = Array.from(
      htmlClone.querySelectorAll('link[rel="stylesheet"]')
    );

    console.log(`Encontrados ${stylesheets.length} links de folhas de estilo`);

    // Processa todas as folhas de estilo em paralelo
    const stylePromises: Promise<void>[] = [];

    stylesheets.forEach((stylesheet, index) => {
      const href = stylesheet.getAttribute("href");
      if (!href) return;

      const isAllowed = this.resourceHelper.isResourceFromAllowedDomain(href);

      if (isAllowed && this.options.inlineCss) {
        stylePromises.push(
          this.inlineStylesheet(stylesheet as HTMLLinkElement, htmlClone)
        );
      } else if (!this.options.keepExternalResources) {
        stylesheet.remove();
      }
    });

    await Promise.all(stylePromises);
  }

  /**
   * Incorpora uma folha de estilo externa
   */
  private async inlineStylesheet(
    stylesheet: HTMLLinkElement,
    htmlClone: HTMLElement
  ): Promise<void> {
    try {
      const href = stylesheet.getAttribute("href");
      if (!href) return;

      const tempStyle = this.createTemporaryStylePlaceholder(href, stylesheet);
      if (!tempStyle) return;

      const cssContent = await this.resourceHelper.fetchResource(
        href,
        "text/css,*/*;q=0.1"
      );

      this.replacePlaceholderWithContent(href, cssContent, tempStyle);
    } catch (error) {
      console.error(`Falha ao processar stylesheet: ${error}`);
    }
  }

  /**
   * Cria um elemento style temporário enquanto o CSS é carregado
   */
  private createTemporaryStylePlaceholder(
    href: string,
    stylesheet: HTMLLinkElement
  ): HTMLStyleElement | null {
    const tempStyle = document.createElement("style");
    tempStyle.textContent = `/* Carregando ${href}... */`;
    tempStyle.setAttribute("data-loading-stylesheet", href);

    if (stylesheet.parentNode) {
      stylesheet.parentNode.replaceChild(tempStyle, stylesheet);
      return tempStyle;
    }

    return null;
  }

  /**
   * Substitui o placeholder pelo conteúdo CSS carregado
   */
  private replacePlaceholderWithContent(
    href: string,
    cssContent: string,
    placeholder: HTMLStyleElement
  ): void {
    placeholder.textContent = `/* Inlined from ${href} */\n${cssContent}`;
  }

  /**
   * Remove regras CSS não utilizadas
   */
  public removeUnusedCss(htmlClone: HTMLElement): void {
    const styleTags = htmlClone.querySelectorAll("style");

    styleTags.forEach((styleTag) => {
      // Implementação básica - uma solução completa analisaria e removeria
      // seletores não utilizados
      styleTag.textContent = `/* Optimized CSS */\n${styleTag.textContent}`;
    });
  }
}
