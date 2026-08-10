export interface Token {
  id: string;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  logoURI: string;
  price?: number;
  priceChange24h?: number;
  marketCap?: number;
  volume24h?: number;
}
