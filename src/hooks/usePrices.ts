import { useState, useEffect, useCallback, useRef } from "react";
import { TOKENS } from "../lib/tokens";
import { Token } from "../types";
interface PriceData { [key: string]: { usd: number; usd_24h_change?: number; usd_market_cap?: number; usd_24h_vol?: number; }; }
export function useLivePrices() {
  const [prices, setPrices] = useState<PriceData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const ids = TOKENS.map((t) => t.id).join(",");
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`, { cache: "no-store" });
      if (!res.ok) throw new Error("Price fetch failed");
      const data: PriceData = await res.json();
      setPrices(data); setError(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); }
    finally { setLoading(false); }
  }, [ids]);
  useEffect(() => { fetchPrices(); intervalRef.current = setInterval(fetchPrices, 30000); return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, [fetchPrices]);
  const getPrice = useCallback((tokenId: string) => prices[tokenId]?.usd ?? 0, [prices]);
  const getChange = useCallback((tokenId: string) => prices[tokenId]?.usd_24h_change ?? 0, [prices]);
  const getMarketCap = useCallback((tokenId: string) => prices[tokenId]?.usd_market_cap ?? 0, [prices]);
  const getVolume = useCallback((tokenId: string) => prices[tokenId]?.usd_24h_vol ?? 0, [prices]);
  const enrichToken = useCallback((token: Token): Token => ({ ...token, price: getPrice(token.id), priceChange24h: getChange(token.id), marketCap: getMarketCap(token.id), volume24h: getVolume(token.id) }), [getPrice, getChange, getMarketCap, getVolume]);
  return { prices, loading, error, getPrice, getChange, enrichToken, refetchPrices: fetchPrices };
}
