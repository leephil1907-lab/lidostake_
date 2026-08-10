import { Token } from "../types";
export const TOKENS: Token[] = [
  { id:"staked-ether", symbol:"stETH", name:"Lido Staked Ether", address:"0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", decimals:18, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/13442/small/steth_logo.png" },
  { id:"ethereum", symbol:"ETH", name:"Ethereum", address:"0x0000000000000000000000000000000000000000", decimals:18, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  { id:"usd-coin", symbol:"USDC", name:"USD Coin", address:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals:6, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png" },
  { id:"tether", symbol:"USDT", name:"Tether", address:"0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals:6, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/325/small/Tether.png" },
  { id:"dai", symbol:"DAI", name:"Dai", address:"0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals:18, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/9956/small/4943.png" },
  { id:"wrapped-bitcoin", symbol:"WBTC", name:"Wrapped Bitcoin", address:"0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals:8, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png" },
  { id:"uniswap", symbol:"UNI", name:"Uniswap", address:"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals:18, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/12504/small/uni.jpg" },
  { id:"chainlink", symbol:"LINK", name:"Chainlink", address:"0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals:18, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png" },
  { id:"aave", symbol:"AAVE", name:"Aave", address:"0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", decimals:18, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/12645/small/AAVE.png" },
  { id:"maker", symbol:"MKR", name:"Maker", address:"0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", decimals:18, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png" },
  { id:"pepe", symbol:"PEPE", name:"Pepe", address:"0x6982508145454Ce325dDbE47a25d4ec3d2311933", decimals:18, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg" },
  { id:"shiba-inu", symbol:"SHIB", name:"Shiba Inu", address:"0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", decimals:18, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/11939/small/shiba.png" },
  { id:"arbitrum", symbol:"ARB", name:"Arbitrum", address:"0x912CE59144191C1204E64559FE8253a0e49E6548", decimals:18, chainId:1, logoURI:"https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg" },
];
export function getTokenBySymbol(symbol: string): Token | undefined { return TOKENS.find((t) => t.symbol === symbol); }
