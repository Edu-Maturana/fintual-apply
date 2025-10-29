import puppeteer from "puppeteer";

export default class Stock {
  constructor(
    public readonly symbol: string,
    public readonly name: string,
    public readonly shares: number
  ) {}

  async getCurrentPrice(): Promise<number> {
    const ticker = this.symbol.toLowerCase();
    const url = `https://fintual.cl/f/acciones/${ticker}/`;
    const priceText = await this.scrapePriceText(url);
    return this.parsePrice(priceText);
  }

  private async scrapePriceText(url: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: "networkidle2" });

      await page.waitForFunction(
        () => {
          const els = Array.from(document.querySelectorAll("div"));
          return els.some((el) =>
            (el.className ?? "").includes(
              "LatestPriceWithVariation_webNumericInfoContainer"
            )
          );
        },
        { timeout: 1000 }
      );

      const priceText = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll("div"));
        const container = els.find((el) =>
          (el.className ?? "").includes(
            "LatestPriceWithVariation_webNumericInfoContainer"
          )
        );
        const h2 = container?.querySelector<HTMLHeadingElement>("h2");
        return h2?.textContent?.trim() ?? null;
      });

      if (!priceText) {
        throw new Error("No se encontró el precio en la página");
      }
      return priceText;
    } finally {
      await browser.close();
    }
  }

  private parsePrice(priceText: string): number {
    const normalized = priceText
      .replace(/US\$/i, "")
      .replace(/\s+/g, "")
      .replace(/\.(?=\d{3})/g, "")
      .replace(",", ".");

    const value = parseFloat(normalized);
    if (isNaN(value)) {
      throw new Error(`No se pudo parsear el precio: "${priceText}"`);
    }
    return value;
  }
}
