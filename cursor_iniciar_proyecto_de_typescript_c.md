# Iniciar proyecto de Typescript con Puppeteer
_Exported on 10/29/2025 at 21:33:47 GMT-3 from Cursor (2.0.34)_

---

**User**

Inicia un proyecto de Typescript e instala puppeteer como dependencia

---

**Cursor**

I'll initialize an npm project and install TypeScript and Puppeteer, then add a sensible tsconfig and useful npm scripts. Proceeding to run the setup commands.

The previous install failed due to npm trying to write to a restricted global cache location. I’ll re-run installs using a local cache directory inside the workspace to avoid permission issues, then proceed to create a tsconfig and update scripts.

I'll add a `tsconfig.json` and update `package.json` scripts to include build and dev commands.

```json
{
  "name": "fintual-apply",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "start": "node dist/index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "Edu-Maturana",
  "license": "ISC",
  "dependencies": {
    "puppeteer": "^24.27.0"
  },
  "devDependencies": {
    "@types/node": "^24.9.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  }
}

```

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "rootDir": "src",
    "outDir": "dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}


```

```typescript
import puppeteer from "puppeteer";

async function main(): Promise<void> {
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://example.com");
  const title = await page.title();
  console.log(`Page title: ${title}`);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


```

He inicializado el proyecto de TypeScript e instalado Puppeteer. También configuré `tsconfig.json`, añadí scripts útiles en `package.json` y dejé un `src/index.ts` de ejemplo para probar Puppeteer.

- Para ejecutar en desarrollo:
  - npm run dev
- Para compilar:
  - npm run build
- Para ejecutar el compilado:
  - npm start

Cambios clave:
- `package.json`: añadí scripts `build`, `dev` y `start`.
- `tsconfig.json`: configuración básica TypeScript con `rootDir` en `src` y `outDir` en `dist`.
- `src/index.ts`: ejemplo mínimo que lanza Puppeteer, abre `example.com` y muestra el título.

Si prefieres no incluir el archivo de ejemplo o quieres ESM en vez de CommonJS, lo ajusto al tiro.

---

**User**

   @stock.ts (9-10) 

@stock.ts (1-14) 
Para obtener el precio actual de la acción, haz scraping al sitio de Fintual Acciones usando puppeteer. 

Esta es la URL.
https://fintual.cl/f/acciones/{ticker}/


(BTW, el ticker va en minúscula)

Debes buscar un div que contenga el siguiente string: "LatestPriceWithVariation_webNumericInfoContainer", y luego seleccionar el contenido del elemento h2 que hay dentro del div.

El precio está en este formato: US$123,45, entonces hay que parsearlo para poder retornarlo en tipo numérico.

---

**Cursor**

I'll open `src/stock/stock.ts` to see its current structure and implement `getCurrentPrice` using Puppeteer as requested.

```typescript
import puppeteer from "puppeteer";

export default class Stock {
  constructor(
    private readonly symbol: string,
    private readonly name: string,
    private readonly shares: number,
    private readonly price: number
  ) {}

  async getCurrentPrice(): Promise<number> {
    const ticker = this.symbol.toLowerCase();
    const url = `https://fintual.cl/f/acciones/${ticker}/`;

    const browser = await puppeteer.launch();
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });

      // Find div whose className contains the magic substring, then read inner <h2>
      const priceText = await page.evaluate(() => {
        const targetSubstring = "LatestPriceWithVariation_webNumericInfoContainer";
        const divs = Array.from(document.querySelectorAll<HTMLDivElement>("div"));
        const container = divs.find((d) =>
          (d.className || "").includes(targetSubstring)
        );
        if (!container) return null;
        const h2 = container.querySelector<HTMLHeadingElement>("h2");
        return h2?.textContent?.trim() ?? null;
      });

      if (!priceText) {
        throw new Error("No se encontró el precio en la página");
      }

      // Example formats: "US$123,45" or "US$ 1.234,56"
      const normalized = priceText
        .replace(/US\$/i, "")
        .replace(/\s+/g, "")
        .replace(/\./g, "") // remove thousands separator
        .replace(",", "."); // convert decimal comma to dot

      const value = Number.parseFloat(normalized);
      if (Number.isNaN(value)) {
        throw new Error(`No se pudo parsear el precio: "${priceText}"`);
      }
      return value;
    } finally {
      await browser.close();
    }
  }
}

```

I located `src/stock/stock.ts` and implemented `getCurrentPrice` with Puppeteer to scrape the price from Fintual Acciones as specified.

- `src/stock/stock.ts`: `getCurrentPrice` is now async, launches Puppeteer, navigates to `https://fintual.cl/f/acciones/{ticker}/`, finds the div whose class includes `LatestPriceWithVariation_webNumericInfoContainer`, reads the inner `h2`, normalizes formats like `US$1.234,56` into a numeric string, and returns a `number`. It also ensures the browser is closed in a `finally`.

Ejemplo de uso rápido:
```ts
// somewhere in your code
// const s = new Stock("AAPL", "Apple", 1, 0);
// const price = await s.getCurrentPrice();
// console.log(price);
```

- Si necesitas que corra en modo no headless o con `userAgent`, lo ajusto al tiro.

```typescript
// somewhere in your code
// const s = new Stock("AAPL", "Apple", 1, 0);
// const price = await s.getCurrentPrice();
// console.log(price);
```

---

**User**

divide el metodo en partes más pequeñas porfa, el scrapeo en una y el parseo en otra, para mejorar la legibilidad. @stock.ts (1-69) 

---

**Cursor**

I'll refactor `getCurrentPrice` into smaller methods: one to scrape the raw price text and another to parse it into a number, then wire `getCurrentPrice` to use both.

```typescript
import puppeteer from "puppeteer";

export default class Stock {
  constructor(
    private readonly symbol: string,
    private readonly name: string,
    private readonly shares: number
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
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
        { timeout: 15000 }
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

```

Listo. Dividí el método en dos partes para mejorar legibilidad y responsabilidades:

- getCurrentPrice: arma la URL, obtiene el texto del precio y lo parsea.
- scrapePriceText: hace el scraping con Puppeteer y retorna el texto del h2.
- parsePrice: normaliza el formato "US$1.234,56" y devuelve un number.

Código relevante en `src/stock/stock.ts`:
```1:69:/Users/edu/Workspace/personal/fintual-apply/src/stock/stock.ts
import puppeteer from "puppeteer";

export default class Stock {
  constructor(
    private readonly symbol: string,
    private readonly name: string,
    private readonly shares: number
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
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
        { timeout: 15000 }
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
```

¿Quieres que agregue reintentos con backoff si el contenedor demora en aparecer, o logs opcionales para depurar?

```typescript
import puppeteer from "puppeteer";

export default class Stock {
  constructor(
    private readonly symbol: string,
    private readonly name: string,
    private readonly shares: number
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
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
        { timeout: 15000 }
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
```

---

**User**

@portfolio.ts (27-37) Haz este método mucho más legible manteniendo la funcionalidad, me refiero al cálculo del porcentaje

---

**Cursor**

I'll open `src/portfolio/portfolio.ts` to refactor the percentage calculation for clarity.

```typescript
import Stock from "../stock/stock";

interface Allocation {
  symbol: string;
  percentage: number;
}

export default class Portfolio {
  constructor(
    public readonly stocks: Stock[],
    public readonly targetAllocation: Allocation[]
  ) {}

  public getCurrentPortfolioStatus(): string {
    return this.getCurrentPortfolioAllocation()
      .map((allocation) => `${allocation.symbol}: ${allocation.percentage}%`)
      .join("\n");
  }

  private getCurrentPortfolioValue(): number {
    return this.stocks.reduce(
      (acc, stock) => acc + stock.price * stock.shares,
      0
    );
  }

  private getCurrentPortfolioAllocation(): Allocation[] {
    const totalValue = this.getCurrentPortfolioValue();

    if (totalValue === 0) {
      return this.stocks.map((stock) => ({ symbol: stock.symbol, percentage: 0 }));
    }

    return this.stocks.map((stock) => {
      const stockValue = stock.shares * stock.price;
      const percentage = Number(((stockValue / totalValue) * 100).toFixed(2));
      return { symbol: stock.symbol, percentage };
    });
  }

  public rebalancePortfolio(): void {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    for (const allocation of this.targetAllocation) {
      const desiredValue = allocation.percentage * currentPortfolioValue;

      const stock = this.stocks.find(
        (stock) => stock.symbol === allocation.symbol
      );
      if (stock) {
        const stockValue = stock.shares * stock.price;
        const difference = desiredValue - stockValue;

        stock.updateShares(stock.shares + difference / stock.price);
      }
    }
  }
}

```

Refactor aplicado para mayor legibilidad del porcentaje:

- Calcula `totalValue` una sola vez.
- Maneja el caso `totalValue === 0`.
- Usa nombres explícitos `stockValue` y `percentage`.

```27:37:/Users/edu/Workspace/personal/fintual-apply/src/portfolio/portfolio.ts
  private getCurrentPortfolioAllocation(): Allocation[] {
    const totalValue = this.getCurrentPortfolioValue();

    if (totalValue === 0) {
      return this.stocks.map((stock) => ({ symbol: stock.symbol, percentage: 0 }));
    }

    return this.stocks.map((stock) => {
      const stockValue = stock.shares * stock.price;
      const percentage = Number(((stockValue / totalValue) * 100).toFixed(2));
      return { symbol: stock.symbol, percentage };
    });
  }
```

¿Quieres que además redondee con `Math.round` a 2 decimales para evitar conversiones a string con `toFixed`, o está bien así?

```typescript
  private getCurrentPortfolioAllocation(): Allocation[] {
    const totalValue = this.getCurrentPortfolioValue();

    if (totalValue === 0) {
      return this.stocks.map((stock) => ({ symbol: stock.symbol, percentage: 0 }));
    }

    return this.stocks.map((stock) => {
      const stockValue = stock.shares * stock.price;
      const percentage = Number(((stockValue / totalValue) * 100).toFixed(2));
      return { symbol: stock.symbol, percentage };
    });
  }
```

---

**User**

@portfolio.ts (44-60) Además de rebalancear el portafolio, crea otro método que me diga qué hay que vender y qué hay que comprar (tanto en shares como en precio) para llegar al allocation deseado

---

**Cursor**

I'll add a new method in `src/portfolio/portfolio.ts` that computes a rebalance plan with buy/sell actions, including both shares and monetary amounts, without changing your existing `rebalancePortfolio`.

```typescript
import Stock from "../stock/stock";

interface Allocation {
  symbol: string;
  percentage: number;
}

export default class Portfolio {
  constructor(
    public readonly stocks: Stock[],
    public readonly targetAllocation: Allocation[]
  ) {}

  public getCurrentPortfolioStatus(): string {
    return this.getCurrentPortfolioAllocation()
      .map((allocation) => `${allocation.symbol}: ${allocation.percentage}%`)
      .join("\n");
  }

  private getCurrentPortfolioValue(): number {
    return this.stocks.reduce(
      (acc, stock) => acc + stock.price * stock.shares,
      0
    );
  }

  private getCurrentPortfolioAllocation(): Allocation[] {
    const totalValue = this.getCurrentPortfolioValue();

    if (totalValue === 0) {
      return this.stocks.map((stock) => ({
        symbol: stock.symbol,
        percentage: 0,
      }));
    }

    return this.stocks.map((stock) => {
      const stockValue = stock.shares * stock.price;
      const percentage = Number(((stockValue / totalValue) * 100).toFixed(2));
      return { symbol: stock.symbol, percentage };
    });
  }

  public rebalancePortfolio(): void {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    for (const allocation of this.targetAllocation) {
      const desiredValue = allocation.percentage * currentPortfolioValue;

      const stock = this.stocks.find(
        (stock) => stock.symbol === allocation.symbol
      );
      if (stock) {
        const stockValue = stock.shares * stock.price;
        const difference = desiredValue - stockValue;

        stock.updateShares(stock.shares + difference / stock.price);
      }
    }
  }

  public getRebalancePlan(): Array<{
    symbol: string;
    action: "buy" | "sell" | "hold";
    shares: number;
    amount: number; // en la misma moneda del price
  }> {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    return this.targetAllocation.map((allocation) => {
      const stock = this.stocks.find((s) => s.symbol === allocation.symbol);

      if (!stock) {
        return {
          symbol: allocation.symbol,
          action: "hold",
          shares: 0,
          amount: 0,
        };
      }

      const desiredValue = allocation.percentage * currentPortfolioValue;
      const currentValue = stock.shares * stock.price;
      const difference = desiredValue - currentValue; // >0 comprar, <0 vender

      if (difference === 0 || stock.price === 0) {
        return { symbol: stock.symbol, action: "hold", shares: 0, amount: 0 };
      }

      const rawShares = difference / stock.price;
      const action = difference > 0 ? "buy" : "sell";
      const shares = Number(Math.abs(rawShares).toFixed(4));
      const amount = Number(Math.abs(difference).toFixed(2));

      return { symbol: stock.symbol, action, shares, amount };
    });
  }
}

```

Agregué un método que te entrega el plan de rebalanceo con qué comprar/vender, en acciones y monto:

- `getRebalancePlan()`:
  - Calcula el valor objetivo por `symbol` usando `allocation.percentage * valor_portafolio_actual`.
  - Compara con el valor actual de cada acción.
  - Retorna una lista con `action` = "buy" | "sell" | "hold", más `shares` y `amount` positivos para ejecutar.

Código relevante:
```44:62:/Users/edu/Workspace/personal/fintual-apply/src/portfolio/portfolio.ts
  public rebalancePortfolio(): void {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    for (const allocation of this.targetAllocation) {
      const desiredValue = allocation.percentage * currentPortfolioValue;

      const stock = this.stocks.find(
        (stock) => stock.symbol === allocation.symbol
      );
      if (stock) {
        const stockValue = stock.shares * stock.price;
        const difference = desiredValue - stockValue;

        stock.updateShares(stock.shares + difference / stock.price);
      }
    }
  }

  public getRebalancePlan(): Array<{
    symbol: string;
    action: "buy" | "sell" | "hold";
    shares: number;
    amount: number; // en la misma moneda del price
  }> {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    return this.targetAllocation.map((allocation) => {
      const stock = this.stocks.find((s) => s.symbol === allocation.symbol);

      if (!stock) {
        return {
          symbol: allocation.symbol,
          action: "hold",
          shares: 0,
          amount: 0,
        };
      }

      const desiredValue = allocation.percentage * currentPortfolioValue;
      const currentValue = stock.shares * stock.price;
      const difference = desiredValue - currentValue; // >0 comprar, <0 vender

      if (difference === 0 || stock.price === 0) {
        return { symbol: stock.symbol, action: "hold", shares: 0, amount: 0 };
      }

      const rawShares = difference / stock.price;
      const action = difference > 0 ? "buy" : "sell";
      const shares = Number(Math.abs(rawShares).toFixed(4));
      const amount = Number(Math.abs(difference).toFixed(2));

      return { symbol: stock.symbol, action, shares, amount };
    });
  }
```

¿Quieres que filtre los `"hold"` y devuelva solo compras/ventas, o prefieres mantenerlos?

```typescript
  public rebalancePortfolio(): void {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    for (const allocation of this.targetAllocation) {
      const desiredValue = allocation.percentage * currentPortfolioValue;

      const stock = this.stocks.find(
        (stock) => stock.symbol === allocation.symbol
      );
      if (stock) {
        const stockValue = stock.shares * stock.price;
        const difference = desiredValue - stockValue;

        stock.updateShares(stock.shares + difference / stock.price);
      }
    }
  }

  public getRebalancePlan(): Array<{
    symbol: string;
    action: "buy" | "sell" | "hold";
    shares: number;
    amount: number; // en la misma moneda del price
  }> {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    return this.targetAllocation.map((allocation) => {
      const stock = this.stocks.find((s) => s.symbol === allocation.symbol);

      if (!stock) {
        return {
          symbol: allocation.symbol,
          action: "hold",
          shares: 0,
          amount: 0,
        };
      }

      const desiredValue = allocation.percentage * currentPortfolioValue;
      const currentValue = stock.shares * stock.price;
      const difference = desiredValue - currentValue; // >0 comprar, <0 vender

      if (difference === 0 || stock.price === 0) {
        return { symbol: stock.symbol, action: "hold", shares: 0, amount: 0 };
      }

      const rawShares = difference / stock.price;
      const action = difference > 0 ? "buy" : "sell";
      const shares = Number(Math.abs(rawShares).toFixed(4));
      const amount = Number(Math.abs(difference).toFixed(2));

      return { symbol: stock.symbol, action, shares, amount };
    });
  }
```

---

**User**

@portfolio.ts También necesito que getCurrentPortfolioAllocation me muestre cuánto dinero tengo en cada activo, pero sin modificar la interfaz de Allocation

---

**Cursor**

I'll update `getCurrentPortfolioStatus` to include the monetary amount per asset while keeping `Allocation` unchanged.

```typescript
import Stock from "../stock/stock";

interface Allocation {
  symbol: string;
  percentage: number;
}

export default class Portfolio {
  constructor(
    public readonly stocks: Stock[],
    public readonly targetAllocation: Allocation[]
  ) {}

  public getCurrentPortfolioStatus(): string {
    const amountsBySymbol = new Map(
      this.stocks.map((stock) => [
        stock.symbol,
        Number((stock.shares * stock.price).toFixed(2)),
      ])
    );

    return this.getCurrentPortfolioAllocation()
      .map((allocation) => {
        const amount = amountsBySymbol.get(allocation.symbol) ?? 0;
        return `${allocation.symbol}: ${allocation.percentage}% - ${amount}`;
      })
      .join("\n");
  }

  private getCurrentPortfolioValue(): number {
    return this.stocks.reduce(
      (acc, stock) => acc + stock.price * stock.shares,
      0
    );
  }

  private getCurrentPortfolioAllocation(): Allocation[] {
    const totalValue = this.getCurrentPortfolioValue();

    if (totalValue === 0) {
      return this.stocks.map((stock) => ({
        symbol: stock.symbol,
        percentage: 0,
      }));
    }

    return this.stocks.map((stock) => {
      const stockValue = stock.shares * stock.price;
      const percentage = Number(((stockValue / totalValue) * 100).toFixed(2));
      return { symbol: stock.symbol, percentage };
    });
  }

  public getRebalancePlan(): Array<{
    symbol: string;
    action: "buy" | "sell" | "hold";
    shares: number;
    amount: number;
  }> {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    return this.targetAllocation.map((allocation) => {
      const stock = this.stocks.find((s) => s.symbol === allocation.symbol);

      if (!stock) {
        return {
          symbol: allocation.symbol,
          action: "hold",
          shares: 0,
          amount: 0,
        };
      }

      const desiredValue = allocation.percentage * currentPortfolioValue;
      const currentValue = stock.shares * stock.price;
      const difference = desiredValue - currentValue;

      if (difference === 0 || stock.price === 0) {
        return { symbol: stock.symbol, action: "hold", shares: 0, amount: 0 };
      }

      const rawShares = difference / stock.price;
      const action = difference > 0 ? "buy" : "sell";
      const shares = Number(Math.abs(rawShares).toFixed(4));
      const amount = Number(Math.abs(difference).toFixed(2));

      return { symbol: stock.symbol, action, shares, amount };
    });
  }

  public rebalancePortfolio(): void {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    for (const allocation of this.targetAllocation) {
      const desiredValue = allocation.percentage * currentPortfolioValue;

      const stock = this.stocks.find(
        (stock) => stock.symbol === allocation.symbol
      );
      if (stock) {
        const stockValue = stock.shares * stock.price;
        const difference = desiredValue - stockValue;

        stock.updateShares(stock.shares + difference / stock.price);
      }
    }
  }
}

```

He mantenido `Allocation` tal cual y ahora `getCurrentPortfolioStatus` también muestra el monto invertido por activo, calculado como `shares * price` y formateado a 2 decimales.

```14:22:/Users/edu/Workspace/personal/fintual-apply/src/portfolio/portfolio.ts
  public getCurrentPortfolioStatus(): string {
    const amountsBySymbol = new Map(
      this.stocks.map((stock) => [
        stock.symbol,
        Number((stock.shares * stock.price).toFixed(2)),
      ])
    );

    return this.getCurrentPortfolioAllocation()
      .map((allocation) => {
        const amount = amountsBySymbol.get(allocation.symbol) ?? 0;
        return `${allocation.symbol}: ${allocation.percentage}% - ${amount}`;
      })
      .join("\n");
  }
```

- No modifiqué `getCurrentPortfolioAllocation` ni la interfaz `Allocation`.
- Si prefieres, puedo devolver un string con moneda o agregar separadores de miles.

```typescript
  public getCurrentPortfolioStatus(): string {
    const amountsBySymbol = new Map(
      this.stocks.map((stock) => [
        stock.symbol,
        Number((stock.shares * stock.price).toFixed(2)),
      ])
    );

    return this.getCurrentPortfolioAllocation()
      .map((allocation) => {
        const amount = amountsBySymbol.get(allocation.symbol) ?? 0;
        return `${allocation.symbol}: ${allocation.percentage}% - ${amount}`;
      })
      .join("\n");
  }
```

---

**User**

@portfolio.ts (26-27) Plis redondea los decimales, ejemplo 59.97 debiese ser 60%

---

**Cursor**

I'll update the percentage rounding to round to the nearest integer instead of keeping 2 decimal places.


```typescript
import Stock from "../stock/stock";

interface Allocation {
  symbol: string;
  percentage: number;
}

export default class Portfolio {
  constructor(
    public readonly stocks: Stock[],
    public readonly targetAllocation: Allocation[]
  ) {}

  public getCurrentPortfolioStatus(): string {
    const amountsBySymbol = new Map(
      this.stocks.map((stock) => [
        stock.symbol,
        Number((stock.shares * stock.price).toFixed(2)),
      ])
    );

    return this.getCurrentPortfolioAllocation()
      .map((allocation) => {
        const amount = amountsBySymbol.get(allocation.symbol) ?? 0;
        return `${allocation.symbol}: ${Math.round(allocation.percentage)}% - $${amount.toFixed(2)}`;
      })
      .join("\n");
  }

  private getCurrentPortfolioAllocation(): Allocation[] {
    const totalValue = this.getCurrentPortfolioValue();

    if (totalValue === 0) {
      return this.stocks.map((stock) => ({
        symbol: stock.symbol,
        percentage: 0,
      }));
    }

    return this.stocks.map((stock) => {
      const stockValue = stock.shares * stock.price;
      const percentage = Number(((stockValue / totalValue) * 100).toFixed(2));
      return { symbol: stock.symbol, percentage };
    });
  }

  private getCurrentPortfolioValue(): number {
    return this.stocks.reduce(
      (acc, stock) => acc + stock.price * stock.shares,
      0
    );
  }

  public getRebalancePlan(): Array<{
    symbol: string;
    action: "buy" | "sell" | "hold";
    shares: number;
    amount: number;
  }> {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    return this.targetAllocation.map((allocation) => {
      const stock = this.stocks.find((s) => s.symbol === allocation.symbol);

      const desiredValue =
        (allocation.percentage / 100) * currentPortfolioValue;

      if (!stock || stock.price === 0) {
        return {
          symbol: allocation.symbol,
          action: "hold",
          shares: 0,
          amount: 0,
        };
      }

      const currentValue = stock.shares * stock.price;
      const difference = desiredValue - currentValue;

      if (Math.abs(difference) < 1) {
        return { symbol: stock.symbol, action: "hold", shares: 0, amount: 0 };
      }

      const shares = Number((difference / stock.price).toFixed(4));
      const action = shares > 0 ? "buy" : "sell";

      return {
        symbol: stock.symbol,
        action,
        shares: Math.abs(shares),
        amount: Math.abs(difference),
      };
    });
  }

  public rebalancePortfolio(): void {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    for (const allocation of this.targetAllocation) {
      const desiredValue =
        (allocation.percentage / 100) * currentPortfolioValue;

      const stock = this.stocks.find((s) => s.symbol === allocation.symbol);

      if (stock && stock.price > 0) {
        const currentValue = stock.shares * stock.price;
        const difference = desiredValue - currentValue;

        const sharesToAdjust = Number((difference / stock.price).toFixed(4));

        if (Math.abs(sharesToAdjust) > 0.0001) {
          stock.updateShares(stock.shares + sharesToAdjust);
        }
      }
    }
  }
}

```

Listo! Ahora los porcentajes se redondean al entero más cercano, así que 59.97% se mostrará como 60%.

```25:25:/Users/edu/Workspace/personal/fintual-apply/src/portfolio/portfolio.ts
        return `${allocation.symbol}: ${Math.round(allocation.percentage)}% - $${amount.toFixed(2)}`;
```

El cambio fue simple: eliminé la división por 100 y ahora `Math.round(allocation.percentage)` redondea directamente al entero más cercano.

```typescript
        return `${allocation.symbol}: ${Math.round(allocation.percentage)}% - $${amount.toFixed(2)}`;
```

---

**User**

@portfolio.ts (1-120) Refactoriza el código haciéndolo mucho más legible, de manera que se respeten los principios SOLID y se quite el magic code. Incluso si es necesario crear helpers o métodos en el archivo de Stock, hazlo@stock.ts 

---

**Cursor**

I'll create a short task list to guide the refactor, then implement helper methods and constants to remove magic numbers, improve readability, and adhere to SOLID across `portfolio.ts` and `stock.ts`.

I'll add domain helpers to `Stock` first: `getMarketValue`, `hasPrice`, and `adjustSharesByAmount`, then refactor `Portfolio` to introduce constants and helper methods, and wire all public methods to use them.

```typescript
export default class Stock {
  constructor(
    public readonly symbol: string,
    public readonly name: string,
    private _shares: number,
    private readonly _price: number = 0
  ) {}

  public get price(): number {
    return this._price;
  }

  public get shares(): number {
    return this._shares;
  }

  public updateShares(newShares: number): void {
    this._shares = newShares;
  }

  public hasPrice(): boolean {
    return this._price > 0;
  }

  public getMarketValue(): number {
    return this._shares * this._price;
  }

  public adjustSharesByAmount(amount: number, sharesDecimals: number): number {
    if (!this.hasPrice()) return 0;
    const rawDelta = amount / this._price;
    const roundedDelta = Number(rawDelta.toFixed(sharesDecimals));
    this.updateShares(this._shares + roundedDelta);
    return roundedDelta;
  }
}

```

```typescript
import Stock from "../stock/stock";

interface Allocation {
  symbol: string;
  percentage: number;
}

export default class Portfolio {
  // Configuration constants
  private static readonly PERCENT_SCALE = 100;
  private static readonly AMOUNT_DECIMALS = 2;
  private static readonly SHARES_DECIMALS = 4;
  private static readonly MIN_TRADE_AMOUNT = 1; // currency units
  private static readonly MIN_SHARES_EPSILON = 0.0001; // shares units
  private static readonly CURRENCY_SYMBOL = "$";

  constructor(
    public readonly stocks: Stock[],
    public readonly targetAllocation: Allocation[]
  ) {}

  public getCurrentPortfolioStatus(): string {
    const amountsBySymbol = new Map(
      this.stocks.map((stock) => [
        stock.symbol,
        this.roundAmount(stock.getMarketValue()),
      ])
    );

    return this.getCurrentPortfolioAllocation()
      .map((allocation) =>
        this.formatStatusLine(
          allocation.symbol,
          this.roundPercentageToInteger(allocation.percentage),
          amountsBySymbol.get(allocation.symbol) ?? 0
        )
      )
      .join("\n");
  }

  private getCurrentPortfolioAllocation(): Allocation[] {
    const totalValue = this.getCurrentPortfolioValue();

    if (totalValue === 0) {
      return this.stocks.map((stock) => ({ symbol: stock.symbol, percentage: 0 }));
    }

    return this.stocks.map((stock) => {
      const stockValue = stock.getMarketValue();
      const percentage = this.calculatePercentage(stockValue, totalValue);
      return { symbol: stock.symbol, percentage };
    });
  }

  private getCurrentPortfolioValue(): number {
    return this.stocks.reduce((acc, stock) => acc + stock.getMarketValue(), 0);
  }

  public getRebalancePlan(): Array<{
    symbol: string;
    action: "buy" | "sell" | "hold";
    shares: number;
    amount: number;
  }> {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    return this.targetAllocation.map((allocation) => {
      const stock = this.findStock(allocation.symbol);
      const desiredValue = this.getDesiredValue(
        allocation.percentage,
        currentPortfolioValue
      );

      if (!stock || !stock.hasPrice()) {
        return {
          symbol: allocation.symbol,
          action: "hold",
          shares: 0,
          amount: 0,
        };
      }

      const currentValue = stock.getMarketValue();
      const difference = this.getDifference(desiredValue, currentValue);

      if (this.isEffectivelyZero(difference, Portfolio.MIN_TRADE_AMOUNT)) {
        return { symbol: stock.symbol, action: "hold", shares: 0, amount: 0 };
      }

      const sharesDelta = this.getSharesDelta(difference, stock.price);
      const action = sharesDelta > 0 ? "buy" : "sell";

      return {
        symbol: stock.symbol,
        action,
        shares: Math.abs(sharesDelta),
        amount: Math.abs(this.roundAmount(difference)),
      };
    });
  }

  public rebalancePortfolio(): void {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    for (const allocation of this.targetAllocation) {
      const desiredValue = this.getDesiredValue(
        allocation.percentage,
        currentPortfolioValue
      );

      const stock = this.findStock(allocation.symbol);

      if (!stock || !stock.hasPrice()) continue;

      const currentValue = stock.getMarketValue();
      const difference = this.getDifference(desiredValue, currentValue);
      const sharesToAdjust = this.getSharesDelta(difference, stock.price);

      if (Math.abs(sharesToAdjust) > Portfolio.MIN_SHARES_EPSILON) {
        stock.updateShares(stock.shares + sharesToAdjust);
      }
    }
  }

  // Helpers
  private findStock(symbol: string): Stock | undefined {
    return this.stocks.find((s) => s.symbol === symbol);
  }

  private getDesiredValue(percentage: number, total: number): number {
    return (percentage / Portfolio.PERCENT_SCALE) * total;
  }

  private getDifference(desired: number, current: number): number {
    return desired - current;
  }

  private getSharesDelta(difference: number, price: number): number {
    if (price <= 0) return 0;
    const raw = difference / price;
    return Number(raw.toFixed(Portfolio.SHARES_DECIMALS));
  }

  private calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    const ratio = (value / total) * Portfolio.PERCENT_SCALE;
    return Number(ratio.toFixed(Portfolio.AMOUNT_DECIMALS));
  }

  private roundAmount(amount: number): number {
    return Number(amount.toFixed(Portfolio.AMOUNT_DECIMALS));
  }

  private roundPercentageToInteger(percentage: number): number {
    return Math.round(percentage);
  }

  private formatStatusLine(
    symbol: string,
    percentageInteger: number,
    amount: number
  ): string {
    return `${symbol}: ${percentageInteger}% - ${Portfolio.CURRENCY_SYMBOL}${amount.toFixed(
      Portfolio.AMOUNT_DECIMALS
    )}`;
  }

  private isEffectivelyZero(value: number, threshold: number): boolean {
    return Math.abs(value) < threshold;
  }
}

```

He refactorizado `Portfolio` y `Stock` para quitar magic numbers, mejorar legibilidad y separar responsabilidades conforme a SOLID:

- En `Stock`:
  - **hasPrice**: valida precio > 0.
  - **getMarketValue**: retorna `shares * price`.
  - **adjustSharesByAmount(amount, sharesDecimals)**: ajusta acciones por un monto, redondeando a N decimales y devolviendo el delta aplicado.

- En `Portfolio`:
  - Constantes: `PERCENT_SCALE`, `AMOUNT_DECIMALS`, `SHARES_DECIMALS`, `MIN_TRADE_AMOUNT`, `MIN_SHARES_EPSILON`, `CURRENCY_SYMBOL`.
  - Helpers: `findStock`, `getDesiredValue`, `getDifference`, `getSharesDelta`, `calculatePercentage`, `roundAmount`, `roundPercentageToInteger`, `formatStatusLine`, `isEffectivelyZero`.
  - Métodos públicos ahora usan helpers:
    - `getCurrentPortfolioStatus`: compone líneas formateadas con porcentaje entero y monto por símbolo.
    - `getCurrentPortfolioAllocation`: calcula porcentajes limpios por símbolo.
    - `getRebalancePlan`: aplica umbrales y redondeos, devolviendo acciones y montos positivos.
    - `rebalancePortfolio`: reutiliza cálculos y thresholds para ajustar acciones con seguridad.

Cambios clave visibles:
```1:120:/Users/edu/Workspace/personal/fintual-apply/src/portfolio/portfolio.ts
// ... constantes al inicio de la clase ...

public getCurrentPortfolioStatus(): string {
  const amountsBySymbol = new Map(
    this.stocks.map((stock) => [stock.symbol, this.roundAmount(stock.getMarketValue())])
  );

  return this.getCurrentPortfolioAllocation()
    .map((a) => this.formatStatusLine(
      a.symbol,
      this.roundPercentageToInteger(a.percentage),
      amountsBySymbol.get(a.symbol) ?? 0
    ))
    .join("\n");
}

private getCurrentPortfolioAllocation(): Allocation[] {
  const totalValue = this.getCurrentPortfolioValue();
  if (totalValue === 0) return this.stocks.map((s) => ({ symbol: s.symbol, percentage: 0 }));

  return this.stocks.map((stock) => {
    const stockValue = stock.getMarketValue();
    const percentage = this.calculatePercentage(stockValue, totalValue);
    return { symbol: stock.symbol, percentage };
  });
}

// ... getRebalancePlan y rebalancePortfolio usan getDesiredValue, getDifference, getSharesDelta ...
```

```1:20:/Users/edu/Workspace/personal/fintual-apply/src/stock/stock.ts
export default class Stock {
  // ...
  public hasPrice(): boolean {
    return this._price > 0;
  }

  public getMarketValue(): number {
    return this._shares * this._price;
  }

  public adjustSharesByAmount(amount: number, sharesDecimals: number): number {
    if (!this.hasPrice()) return 0;
    const rawDelta = amount / this._price;
    const roundedDelta = Number(rawDelta.toFixed(sharesDecimals));
    this.updateShares(this._shares + roundedDelta);
    return roundedDelta;
  }
}
```

- Cálculos y formateos están centralizados en helpers.
- No se modificó la interfaz `Allocation`.
- Se mantienen umbrales explícitos y decimales configurables para montos y acciones.

```typescript
// ... constantes al inicio de la clase ...

public getCurrentPortfolioStatus(): string {
  const amountsBySymbol = new Map(
    this.stocks.map((stock) => [stock.symbol, this.roundAmount(stock.getMarketValue())])
  );

  return this.getCurrentPortfolioAllocation()
    .map((a) => this.formatStatusLine(
      a.symbol,
      this.roundPercentageToInteger(a.percentage),
      amountsBySymbol.get(a.symbol) ?? 0
    ))
    .join("\n");
}

private getCurrentPortfolioAllocation(): Allocation[] {
  const totalValue = this.getCurrentPortfolioValue();
  if (totalValue === 0) return this.stocks.map((s) => ({ symbol: s.symbol, percentage: 0 }));

  return this.stocks.map((stock) => {
    const stockValue = stock.getMarketValue();
    const percentage = this.calculatePercentage(stockValue, totalValue);
    return { symbol: stock.symbol, percentage };
  });
}

// ... getRebalancePlan y rebalancePortfolio usan getDesiredValue, getDifference, getSharesDelta ...
```

```typescript
export default class Stock {
  // ...
  public hasPrice(): boolean {
    return this._price > 0;
  }

  public getMarketValue(): number {
    return this._shares * this._price;
  }

  public adjustSharesByAmount(amount: number, sharesDecimals: number): number {
    if (!this.hasPrice()) return 0;
    const rawDelta = amount / this._price;
    const roundedDelta = Number(rawDelta.toFixed(sharesDecimals));
    this.updateShares(this._shares + roundedDelta);
    return roundedDelta;
  }
}
```

---

**User**

@portfolio.ts (60-90) Mejora la legibilidad de este metodo

---

**Cursor**

I'll refactor the `getRebalancePlan` method to improve readability by extracting helper methods and making the logic clearer.


```typescript
import Stock from "../stock/stock";

interface Allocation {
  symbol: string;
  percentage: number;
}

export default class Portfolio {
  private static readonly PERCENT_SCALE = 100;
  private static readonly AMOUNT_DECIMALS = 2;
  private static readonly MIN_TRADE_AMOUNT = 1;
  private static readonly MIN_SHARES_EPSILON = 0.0001;
  private static readonly CURRENCY_SYMBOL = "$";

  constructor(
    public readonly stocks: Stock[],
    public readonly targetAllocation: Allocation[]
  ) {}

  public getCurrentPortfolioStatus(): string {
    const amountsBySymbol = new Map(
      this.stocks.map((stock) => [
        stock.symbol,
        this.roundAmount(stock.getMarketValue()),
      ])
    );

    return this.getCurrentPortfolioAllocation()
      .map((allocation) =>
        this.formatStatusLine(
          allocation.symbol,
          this.roundPercentageToInteger(allocation.percentage),
          amountsBySymbol.get(allocation.symbol) ?? 0
        )
      )
      .join("\n");
  }

  private getCurrentPortfolioAllocation(): Allocation[] {
    const totalValue = this.getCurrentPortfolioValue();

    if (totalValue === 0) {
      return this.stocks.map((stock) => ({
        symbol: stock.symbol,
        percentage: 0,
      }));
    }

    return this.stocks.map((stock) => {
      const stockValue = stock.getMarketValue();
      const percentage = this.calculatePercentage(stockValue, totalValue);
      return { symbol: stock.symbol, percentage };
    });
  }

  private getCurrentPortfolioValue(): number {
    return this.stocks.reduce((acc, stock) => acc + stock.getMarketValue(), 0);
  }

  public getRebalancePlan(): string {
    const currentPortfolioValue = this.getCurrentPortfolioValue();
    const planLines = this.targetAllocation.map((allocation) =>
      this.buildRebalanceLine(allocation, currentPortfolioValue)
    );
    return planLines.join("\n");
  }

  private buildRebalanceLine(
    allocation: Allocation,
    currentPortfolioValue: number
  ): string {
    const stock = this.findStock(allocation.symbol);
    
    if (!stock || !stock.hasPrice()) {
      return `${allocation.symbol}: No hacer nada`;
    }

    const desiredValue = this.getDesiredValue(allocation.percentage, currentPortfolioValue);
    const currentValue = stock.getMarketValue();
    const difference = this.getDifference(desiredValue, currentValue);
    const sharesDelta = this.getSharesDelta(difference, stock.price);

    if (this.isEffectivelyZero(sharesDelta, Portfolio.MIN_SHARES_EPSILON)) {
      return `${allocation.symbol}: No hacer nada`;
    }

    return this.formatRebalanceAction(allocation.symbol, sharesDelta, difference);
  }

  private formatRebalanceAction(symbol: string, sharesDelta: number, difference: number): string {
    const action = sharesDelta > 0 ? "Comprar" : "Vender";
    const shares = Math.abs(sharesDelta);
    const amount = this.roundAmount(difference);
    
    return `${action} ${shares} shares de ${symbol} o bien $${amount}`;
  }

  private isEffectivelyZero(value: number, threshold: number): boolean {
    return Math.abs(value) < threshold;
  }

  public rebalancePortfolio(): void {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    for (const allocation of this.targetAllocation) {
      const desiredValue = this.getDesiredValue(
        allocation.percentage,
        currentPortfolioValue
      );

      const stock = this.findStock(allocation.symbol);

      if (!stock || !stock.hasPrice()) continue;

      const currentValue = stock.getMarketValue();
      const difference = this.getDifference(desiredValue, currentValue);
      const sharesToAdjust = this.getSharesDelta(difference, stock.price);

      if (Math.abs(sharesToAdjust) > Portfolio.MIN_SHARES_EPSILON) {
        stock.updateShares(stock.shares + sharesToAdjust);
      }
    }
  }

  // Helpers
  private findStock(symbol: string): Stock | undefined {
    return this.stocks.find((s) => s.symbol === symbol);
  }

  private getDesiredValue(percentage: number, total: number): number {
    return (percentage / Portfolio.PERCENT_SCALE) * total;
  }

  private getDifference(desired: number, current: number): number {
    return desired - current;
  }

  private getSharesDelta(difference: number, price: number): number {
    if (price <= 0) return 0;
    const raw = difference / price;
    return raw;
  }

  private calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    const ratio = (value / total) * Portfolio.PERCENT_SCALE;
    return Number(ratio.toFixed(Portfolio.AMOUNT_DECIMALS));
  }

  private roundAmount(amount: number): number {
    return Math.abs(Number(amount.toFixed(Portfolio.AMOUNT_DECIMALS)));
  }

  private roundPercentageToInteger(percentage: number): number {
    return Math.round(percentage);
  }

  private formatStatusLine(
    symbol: string,
    percentageInteger: number,
    amount: number
  ): string {
    return `${symbol}: ${percentageInteger}% - ${
      Portfolio.CURRENCY_SYMBOL
    }${amount.toFixed(Portfolio.AMOUNT_DECIMALS)}`;
  }
}

```

He mejorado la legibilidad del método `getRebalancePlan` dividiéndolo en funciones más pequeñas y claras:

**Cambios principales:**

1. **`getRebalancePlan()`**: Ahora es más conciso, usa `map` en lugar de `forEach` y `join` para construir el resultado.

2. **`buildRebalanceLine()`**: Maneja la lógica para una sola asignación, incluyendo validaciones y cálculos.

3. **`formatRebalanceAction()`**: Se encarga únicamente del formateo del texto de compra/venta.

4. **`isEffectivelyZero()`**: Helper reutilizable para comparar con umbrales.

**Beneficios:**
- Cada método tiene una responsabilidad única (Single Responsibility Principle)
- Eliminé la concatenación manual de strings con `+=`
- La lógica está más clara y es más fácil de testear
- Reutilicé `isEffectivelyZero` que ya existía antes
- El flujo es más funcional y declarativo

El código ahora es más mantenible y fácil de entender, siguiendo los principios SOLID.

---

**User**

@portfolio.ts (19-37) Mejora la legibilidad de este método

---

**Cursor**

I'll refactor the `getCurrentPortfolioStatus` method to improve readability by extracting helper methods and making the logic clearer.


```typescript
import Stock from "../stock/stock";

interface Allocation {
  symbol: string;
  percentage: number;
}

export default class Portfolio {
  private static readonly PERCENT_SCALE = 100;
  private static readonly AMOUNT_DECIMALS = 2;
  private static readonly MIN_SHARES_EPSILON = 0.0001;
  private static readonly CURRENCY_SYMBOL = "$";

  constructor(
    public readonly stocks: Stock[],
    public readonly targetAllocation: Allocation[]
  ) {}

  public getCurrentPortfolioStatus(): string {
    const amountsBySymbol = this.buildAmountsMap();
    const allocations = this.getCurrentPortfolioAllocation();
    
    return allocations
      .map((allocation) => this.buildStatusLine(allocation, amountsBySymbol))
      .join("\n");
  }

  private buildAmountsMap(): Map<string, number> {
    return new Map(
      this.stocks.map((stock) => [
        stock.symbol,
        this.roundAmount(stock.getMarketValue()),
      ])
    );
  }

  private buildStatusLine(
    allocation: Allocation,
    amountsBySymbol: Map<string, number>
  ): string {
    const amount = amountsBySymbol.get(allocation.symbol) ?? 0;
    const percentageInteger = this.roundPercentageToInteger(allocation.percentage);
    
    return this.formatStatusLine(allocation.symbol, percentageInteger, amount);
  }

  private getCurrentPortfolioAllocation(): Allocation[] {
    const totalValue = this.getCurrentPortfolioValue();

    if (totalValue === 0) {
      return this.stocks.map((stock) => ({
        symbol: stock.symbol,
        percentage: 0,
      }));
    }

    return this.stocks.map((stock) => {
      const stockValue = stock.getMarketValue();
      const percentage = this.calculatePercentage(stockValue, totalValue);
      return { symbol: stock.symbol, percentage };
    });
  }

  private getCurrentPortfolioValue(): number {
    return this.stocks.reduce((acc, stock) => acc + stock.getMarketValue(), 0);
  }

  public getRebalancePlan(): string {
    const currentPortfolioValue = this.getCurrentPortfolioValue();
    const planLines = this.targetAllocation.map((allocation) =>
      this.buildRebalanceLine(allocation, currentPortfolioValue)
    );
    return planLines.join("\n");
  }

  private buildRebalanceLine(
    allocation: Allocation,
    currentPortfolioValue: number
  ): string {
    const stock = this.findStock(allocation.symbol);

    if (!stock || !stock.hasPrice()) {
      return `${allocation.symbol}: No hacer nada`;
    }

    const desiredValue = this.getDesiredValue(
      allocation.percentage,
      currentPortfolioValue
    );
    const currentValue = stock.getMarketValue();
    const difference = this.getDifference(desiredValue, currentValue);
    const sharesDelta = this.getSharesDelta(difference, stock.price);

    if (this.isEffectivelyZero(sharesDelta, Portfolio.MIN_SHARES_EPSILON)) {
      return `${allocation.symbol}: No hacer nada`;
    }

    return this.formatRebalanceAction(
      allocation.symbol,
      sharesDelta,
      difference
    );
  }

  private formatRebalanceAction(
    symbol: string,
    sharesDelta: number,
    difference: number
  ): string {
    const action = sharesDelta > 0 ? "Comprar" : "Vender";
    const shares = Math.abs(sharesDelta);
    const amount = this.roundAmount(difference);

    return `${action} ${shares} shares de ${symbol} o bien $${amount}`;
  }

  private isEffectivelyZero(value: number, threshold: number): boolean {
    return Math.abs(value) < threshold;
  }

  public rebalancePortfolio(): void {
    const currentPortfolioValue = this.getCurrentPortfolioValue();

    for (const allocation of this.targetAllocation) {
      const desiredValue = this.getDesiredValue(
        allocation.percentage,
        currentPortfolioValue
      );

      const stock = this.findStock(allocation.symbol);

      if (!stock || !stock.hasPrice()) continue;

      const currentValue = stock.getMarketValue();
      const difference = this.getDifference(desiredValue, currentValue);
      const sharesToAdjust = this.getSharesDelta(difference, stock.price);

      if (Math.abs(sharesToAdjust) > Portfolio.MIN_SHARES_EPSILON) {
        stock.updateShares(stock.shares + sharesToAdjust);
      }
    }
  }

  // Helpers
  private findStock(symbol: string): Stock | undefined {
    return this.stocks.find((s) => s.symbol === symbol);
  }

  private getDesiredValue(percentage: number, total: number): number {
    return (percentage / Portfolio.PERCENT_SCALE) * total;
  }

  private getDifference(desired: number, current: number): number {
    return desired - current;
  }

  private getSharesDelta(difference: number, price: number): number {
    if (price <= 0) return 0;
    const raw = difference / price;
    return raw;
  }

  private calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    const ratio = (value / total) * Portfolio.PERCENT_SCALE;
    return Number(ratio.toFixed(Portfolio.AMOUNT_DECIMALS));
  }

  private roundAmount(amount: number): number {
    return Math.abs(Number(amount.toFixed(Portfolio.AMOUNT_DECIMALS)));
  }

  private roundPercentageToInteger(percentage: number): number {
    return Math.round(percentage);
  }

  private formatStatusLine(
    symbol: string,
    percentageInteger: number,
    amount: number
  ): string {
    return `${symbol}: ${percentageInteger}% - ${
      Portfolio.CURRENCY_SYMBOL
    }${amount.toFixed(Portfolio.AMOUNT_DECIMALS)}`;
  }
}

```

He mejorado la legibilidad del método `getCurrentPortfolioStatus` dividiéndolo en funciones más pequeñas y claras:

**Cambios principales:**

1. **`getCurrentPortfolioStatus()`**: Ahora es más conciso y declarativo, separando claramente la construcción del mapa de montos y el procesamiento de asignaciones.

2. **`buildAmountsMap()`**: Se encarga únicamente de crear el mapa de símbolos a montos, con responsabilidad única.

3. **`buildStatusLine()`**: Maneja la construcción de una línea individual del status, extrayendo los valores necesarios y delegando el formateo.

**Beneficios:**
- **Single Responsibility**: Cada método tiene una función específica
- **Mejor legibilidad**: El flujo principal es más claro y fácil de seguir
- **Reutilización**: Los helpers pueden ser reutilizados en otros contextos
- **Testabilidad**: Cada función puede ser testeada independientemente
- **Mantenibilidad**: Cambios en la lógica de formateo o mapeo están aislados

El código ahora sigue mejor los principios SOLID y es más fácil de entender y mantener.

