import Stock from "../stock/stock";

interface Allocation {
  symbol: string;
  percentage: number;
}

export default class Portfolio {
  private static readonly PERCENT_SCALE = 100;
  private static readonly AMOUNT_DECIMALS = 2;
  private static readonly MIN_SHARES_EPSILON = 0.0001; // Como 10 lucas en BTC;
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
    const percentageInteger = this.roundPercentageToInteger(
      allocation.percentage
    );

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
    const action = sharesDelta > 0 ? "🤑 Comprar" : "💸 Vender";
    const shares = Math.abs(sharesDelta);
    const amount = this.roundAmount(difference);

    return `${action} ${shares} unidades de ${symbol}\n(que equivalen a ${Portfolio.CURRENCY_SYMBOL}${amount})\n`;
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
