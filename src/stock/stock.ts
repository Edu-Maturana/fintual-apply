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
