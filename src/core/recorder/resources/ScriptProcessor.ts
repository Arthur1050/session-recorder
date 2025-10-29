import { RecorderOptions } from "../../../types/events";
import { ResourceHelper } from "./ResourceHelper";

/**
 * Processador de scripts JavaScript
 */
export class ScriptProcessor {
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
   * Processa todos os scripts externos no documento
   */
  public async processScripts(htmlClone: HTMLElement): Promise<void> {
    const scripts = Array.from(htmlClone.querySelectorAll("script[src]"));

    console.log(`Encontrados ${scripts.length} scripts externos`);

    const scriptPromises: Promise<void>[] = [];

    scripts.forEach((script) => {
      const src = script.getAttribute("src");
      if (!src) return;

      const isAllowed = this.resourceHelper.isResourceFromAllowedDomain(src);

      if (isAllowed && this.options.inlineJs) {
        scriptPromises.push(
          this.inlineScript(script as HTMLScriptElement, htmlClone)
        );
      } else if (!this.options.keepExternalResources) {
        script.remove();
      }
    });

    await Promise.all(scriptPromises);
  }

  /**
   * Incorpora um script externo
   */
  private async inlineScript(
    script: HTMLScriptElement,
    htmlClone: HTMLElement
  ): Promise<void> {
    try {
      const src = script.getAttribute("src");
      if (!src) return;

      const tempScript = this.createTemporaryScriptPlaceholder(src, script);
      if (!tempScript) return;

      const jsContent = await this.resourceHelper.fetchResource(
        src,
        "text/javascript,application/javascript,*/*;q=0.1"
      );

      this.replacePlaceholderWithContent(src, jsContent, tempScript);
    } catch (error) {
      console.error(`Falha ao processar script: ${error}`);
    }
  }

  /**
   * Cria um elemento script temporário enquanto o JavaScript é carregado
   */
  private createTemporaryScriptPlaceholder(
    src: string,
    script: HTMLScriptElement
  ): HTMLScriptElement | null {
    const tempScript = document.createElement("script");
    tempScript.textContent = `/* Carregando ${src}... */`;
    tempScript.setAttribute("data-loading-script", src);

    // Preserva atributos importantes
    ["async", "defer", "crossorigin", "type"].forEach((attr) => {
      if (script.hasAttribute(attr)) {
        tempScript.setAttribute(attr, script.getAttribute(attr) || "");
      }
    });

    if (script.parentNode) {
      script.parentNode.replaceChild(tempScript, script);
      return tempScript;
    }

    return null;
  }

  /**
   * Substitui o placeholder pelo conteúdo JavaScript carregado
   */
  private replacePlaceholderWithContent(
    src: string,
    jsContent: string,
    placeholder: HTMLScriptElement
  ): void {
    placeholder.textContent = `/* Inlined from ${src} */\n${jsContent}`;
    placeholder.removeAttribute("src");
  }
}
