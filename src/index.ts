import Stock from "./stock/stock";

async function main() {
  const stock = new Stock("MCD", "McDonald's Corporation", 100);
  const price = await stock.getCurrentPrice();
  console.log(`El precio de ${stock.name} (${stock.symbol}) es: ${price}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
