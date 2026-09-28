/**
 * src/lib/omega/browserUseEngine.ts
 * =============================================================================
 * Omega Kernel Autonomous "Browser Use" & Native Web Scraping Engine
 * =============================================================================
 *
 * Allows Omega Kernel itself to search, browse, extract, and parse web pages directly:
 *  - Native HTML/DOM Parser & Search Scraper (DuckDuckGo, Wikipedia, Direct Fetch, RSS)
 *  - Browser Actions: Navigate, Search, ExtractText, ParseLinks, FilterRelevance
 *  - Works autonomously inside Omega Kernel even when external API servers are offline or rate-limited.
 */

export interface BrowserPage {
  url: string;
  title: string;
  content: string;
  links: Array<{ text: string; href: string }>;
  snippet: string;
  fetchedAt: number;
}

export interface BrowserSearchResult {
  query: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
  }>;
  scrapedPages: BrowserPage[];
  timestamp: number;
}

export class BrowserUseEngine {
  private userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (OmegaKernel/2.5)";

  /**
   * Cleans raw HTML strings into readable structured plain text
   */
  public cleanHtmlToText(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
      .replace(/<code\b[^<]*(?:(?!<\/code>)<[^<]*)*<\/code>/gi, "[code block]")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Fetches and parses a single web page directly from the network
   */
  public async fetchWebPage(url: string, timeoutMs = 8000): Promise<BrowserPage> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract Page Title
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : url;

      // Extract Links
      const links: Array<{ text: string; href: string }> = [];
      const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match: RegExpExecArray | null;

      while ((match = linkRegex.exec(html)) !== null && links.length < 30) {
        const href = match[1];
        const text = this.cleanHtmlToText(match[2]);
        if (href && href.startsWith("http") && text.length > 2) {
          links.push({ text, href });
        }
      }

      const cleanText = this.cleanHtmlToText(html);
      const snippet = cleanText.slice(0, 500);

      return {
        url,
        title,
        content: cleanText.slice(0, 15000), // Cap at 15k chars for prompt economy
        links,
        snippet,
        fetchedAt: Date.now(),
      };
    } catch (err: any) {
      clearTimeout(timeout);
      return {
        url,
        title: `Failed to fetch: ${url}`,
        content: `Browser Use Engine Fetch Exception: ${err.message}`,
        links: [],
        snippet: `Error fetching URL: ${err.message}`,
        fetchedAt: Date.now(),
      };
    }
  }

  /**
   * Performs direct Wikipedia REST Search (reliable, open, CORS/server-friendly)
   */
  public async searchWikipedia(query: string, lang = "ar"): Promise<Array<{ title: string; url: string; snippet: string; source: string }>> {
    try {
      const wikiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const res = await fetch(wikiUrl);
      if (!res.ok) return [];
      const data = await res.json();
      const searchItems = data?.query?.search || [];

      return searchItems.map((item: any) => ({
        title: item.title,
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
        snippet: this.cleanHtmlToText(item.snippet || ""),
        source: `Wikipedia (${lang.toUpperCase()})`,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Performs direct DuckDuckGo HTML scraping
   */
  public async searchDuckDuckGo(query: string): Promise<Array<{ title: string; url: string; snippet: string; source: string }>> {
    try {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const page = await this.fetchWebPage(ddgUrl, 7000);
      if (!page.content || page.content.includes("Failed to fetch")) return [];

      const results: Array<{ title: string; url: string; snippet: string; source: string }> = [];

      // Parse DuckDuckGo html links
      page.links.forEach((link) => {
        if (link.href.includes("duckduckgo.com/l/?uddg=")) {
          const actualUrlMatch = link.href.match(/uddg=([^&]+)/);
          const actualUrl = actualUrlMatch ? decodeURIComponent(actualUrlMatch[1]) : link.href;
          results.push({
            title: link.text,
            url: actualUrl,
            snippet: `Direct DDG Result: ${link.text}`,
            source: "DuckDuckGo Web Scraper",
          });
        }
      });

      return results.slice(0, 10);
    } catch {
      return [];
    }
  }

  /**
   * Full Native Omega Autonomous Search Workflow
   */
  public async executeAutonomousSearch(
    query: string,
    options?: { maxPagesToScrape?: number; lang?: string }
  ): Promise<BrowserSearchResult> {
    const lang = options?.lang || "ar";
    const maxScrape = options?.maxPagesToScrape || 2;

    // 1. Gather Search Results from Wikipedia + DuckDuckGo
    const [wikiResults, ddgResults] = await Promise.all([
      this.searchWikipedia(query, lang),
      this.searchDuckDuckGo(query),
    ]);

    const combinedResults = [...wikiResults, ...ddgResults];

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueResults = combinedResults.filter((r) => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    // 2. Scrape top candidate pages directly
    const scrapedPages: BrowserPage[] = [];
    const topUrls = uniqueResults.slice(0, maxScrape).map((r) => r.url);

    for (const targetUrl of topUrls) {
      try {
        const page = await this.fetchWebPage(targetUrl, 6000);
        if (page.content && !page.title.startsWith("Failed to fetch")) {
          scrapedPages.push(page);
        }
      } catch {
        // Continue loop on individual page failure
      }
    }

    return {
      query,
      results: uniqueResults,
      scrapedPages,
      timestamp: Date.now(),
    };
  }
}

export const globalBrowserUseEngine = new BrowserUseEngine();
