import { RecorderOptions } from "../../../types/events";

/**
 * Classe auxiliar para lidar com recursos externos (URLs, elementos DOM)
 */
export class ResourceHelper {
  private options: Required<RecorderOptions>;

  constructor(options: Required<RecorderOptions>) {
    this.options = options;
  }

  /**
   * Resolve uma URL relativa para absoluta
   */
  public resolveUrl(url: string): string {
    return url.startsWith("http")
      ? url
      : new URL(url, window.location.href).href;
  }

  /**
   * Verifica se uma URL é de um domínio permitido
   */
  public isResourceFromAllowedDomain(url: string): boolean {
    // URLs de dados ou URLs relativas são sempre permitidas
    if (this.isDataUrl(url) || !url.startsWith("http")) {
      return true;
    }

    if (!this.options.allowedResourceDomains?.length) {
      return false;
    }

    return this.options.allowedResourceDomains.some((domain) =>
      url.includes(domain)
    );
  }

  /**
   * Verifica se uma URL é uma URL de dados
   */
  public isDataUrl(url: string): boolean {
    return url.startsWith("data:");
  }

  /**
   * Verifica se um elemento está visível na viewport
   */
  public isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  }

  /**
   * Busca o conteúdo de um recurso externo
   */
  public async fetchResource(
    url: string,
    contentType: string
  ): Promise<string> {
    try {
      const fullUrl = this.resolveUrl(url);

      const options = {
        method: "GET",
        headers: {
          Accept: contentType,
          "User-Agent": navigator.userAgent,
        },
        mode: url.startsWith("http") ? "cors" : ("same-origin" as RequestMode),
        credentials: "same-origin" as RequestCredentials,
        cache: "no-cache" as RequestCache,
      };

      console.log(`Buscando recurso: ${fullUrl}`);
      const response = await fetch(fullUrl, options);

      if (!response.ok) {
        throw new Error(`Falha ao buscar recurso: ${response.status}`);
      }

      const content = await response.text();
      console.log(
        `Recurso carregado: ${fullUrl} (${content.length} caracteres)`
      );
      return content;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`Erro ao buscar ${url}: ${errorMsg}`);
      return `/* Erro ao buscar ${url}: ${errorMsg} */`;
    }
  }
}
