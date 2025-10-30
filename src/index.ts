import Stock from "./stock/stock";
import Portfolio from "./portfolio/portfolio";

// Voy a simularlo con lo mismo que tengo en Fintual🫶
const myStocks = [
  {
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
    shares: 5.248567795,
    price: 631.93,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    shares: 0.01392148,
    price: 110748.67,
  },
  {
    symbol: "IAUM",
    name: "IShares Gold Trust Micro",
    shares: 14.444292189,
    price: 39.32,
  },
];

// Y acá mi distribución objetivo
const targetAllocation = [
  { symbol: "VOO", percentage: 60 },
  { symbol: "BTC", percentage: 30 },
  { symbol: "IAUM", percentage: 10 },
];

async function main() {
  const stocks = myStocks.map(
    (stock) => new Stock(stock.symbol, stock.name, stock.shares, stock.price)
  );
  const portfolio = new Portfolio(stocks, targetAllocation);

  console.log(
    `Estado actual del portafolio:\n${portfolio.getCurrentPortfolioStatus()}\n`
  );

  console.log(
    `Plan de rebalanceo:\n${portfolio
      .getRebalancePlan()
      .split("\n")
      .join("\n")}\n`
  );

  portfolio.rebalancePortfolio();

  console.log(
    `Estado del portafolio después de rebalancear:\n${portfolio.getCurrentPortfolioStatus()}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
