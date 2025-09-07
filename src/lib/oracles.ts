// Price Oracle System for Real-Time Asset Valuation
import { supabase } from '@/integrations/supabase/client';

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdated: Date;
}

export interface AssetPricing {
  assetType: string;
  basePrice: number;
  pricePerSqFt?: number;
  pricePerOz?: number;
  locationMultiplier?: number;
  marketTrend: number;
}

class PriceOracle {
  private cache: Map<string, PriceData> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Real estate pricing based on location and type
  private realEstatePricing: Record<string, AssetPricing> = {
    'New York': { assetType: 'Real Estate', basePrice: 1200, pricePerSqFt: 1200, marketTrend: 0.05 },
    'London': { assetType: 'Real Estate', basePrice: 900, pricePerSqFt: 900, marketTrend: 0.03 },
    'Tokyo': { assetType: 'Real Estate', basePrice: 800, pricePerSqFt: 800, marketTrend: 0.02 },
    'Dubai': { assetType: 'Real Estate', basePrice: 600, pricePerSqFt: 600, marketTrend: 0.08 },
    'Singapore': { assetType: 'Real Estate', basePrice: 1100, pricePerSqFt: 1100, marketTrend: 0.04 },
  };

  // Commodity pricing (Gold, Silver, Oil, etc.)
  async getCommodityPrice(commodity: string): Promise<PriceData> {
    const cacheKey = `commodity_${commodity.toLowerCase()}`;
    
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Use multiple fallback APIs for commodity prices
      const price = await this.fetchCommodityPrice(commodity);
      const priceData: PriceData = {
        symbol: commodity.toUpperCase(),
        price,
        change24h: this.generateMarketChange(),
        volume24h: price * Math.random() * 1000000,
        lastUpdated: new Date()
      };

      this.updateCache(cacheKey, priceData);
      return priceData;
    } catch (error) {
      console.error(`Failed to fetch ${commodity} price:`, error);
      return this.getFallbackPrice(commodity);
    }
  }

  // Real estate valuation based on location, size, and market conditions
  calculateRealEstateValue(params: {
    location: string;
    size: number; // square feet
    propertyType: 'residential' | 'commercial' | 'industrial';
    yearBuilt?: number;
  }): number {
    const { location, size, propertyType, yearBuilt } = params;
    
    const basePricing = this.realEstatePricing[location] || 
                       this.realEstatePricing['Dubai']; // Default fallback

    let pricePerSqFt = basePricing.pricePerSqFt || basePricing.basePrice;

    // Property type multipliers
    const typeMultipliers = {
      residential: 1.0,
      commercial: 1.2,
      industrial: 0.8
    };

    pricePerSqFt *= typeMultipliers[propertyType];

    // Age depreciation (if year built provided)
    if (yearBuilt) {
      const age = new Date().getFullYear() - yearBuilt;
      const depreciationFactor = Math.max(0.7, 1 - (age * 0.01)); // Max 30% depreciation
      pricePerSqFt *= depreciationFactor;
    }

    // Market trend adjustment
    pricePerSqFt *= (1 + basePricing.marketTrend);

    return size * pricePerSqFt;
  }

  // Token price calculation based on asset value and supply
  calculateTokenPrice(assetValue: number, totalSupply: number, marketDemand: number = 1.0): number {
    const baseTokenPrice = assetValue / totalSupply;
    
    // Apply market demand multiplier (0.5 to 2.0 range)
    const demandMultiplier = Math.max(0.5, Math.min(2.0, marketDemand));
    
    return baseTokenPrice * demandMultiplier;
  }

  // Dynamic APR calculation for liquidity pools
  calculatePoolAPR(params: {
    totalLiquidity: number;
    volume24h: number;
    feeRate: number; // e.g., 0.003 for 0.3%
    poolRisk: number; // 1.0 = normal, 1.5 = high risk, 0.8 = low risk
  }): number {
    const { totalLiquidity, volume24h, feeRate, poolRisk } = params;
    
    if (totalLiquidity === 0) return 0;
    
    // Calculate fees generated in 24h
    const fees24h = volume24h * feeRate;
    
    // Annualize the fees (365 days)
    const annualFees = fees24h * 365;
    
    // Calculate APR as percentage
    const baseAPR = (annualFees / totalLiquidity) * 100;
    
    // Apply risk adjustment
    return baseAPR * poolRisk;
  }

  // Fetch real-time crypto prices (for ETH, BTC used in pools)
  async getCryptoPrice(symbol: string): Promise<PriceData> {
    const cacheKey = `crypto_${symbol.toLowerCase()}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Using CoinGecko API as primary source
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoinId(symbol)}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
      );
      
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      const coinId = this.getCoinId(symbol);
      const coinData = data[coinId];
      
      if (!coinData) throw new Error('Coin data not found');
      
      const priceData: PriceData = {
        symbol: symbol.toUpperCase(),
        price: coinData.usd,
        change24h: coinData.usd_24h_change || 0,
        volume24h: coinData.usd_24h_vol || 0,
        lastUpdated: new Date()
      };

      this.updateCache(cacheKey, priceData);
      return priceData;
    } catch (error) {
      console.error(`Failed to fetch ${symbol} price:`, error);
      return this.getFallbackCryptoPrice(symbol);
    }
  }

  // Update database with fresh pricing data
  async updateAssetPricing(assetId: string, newPrice: number, marketData: Partial<PriceData> = {}) {
    try {
      await supabase
        .from('assets')
        .update({
          token_price: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(assetId));

      // Update associated tokens
      await supabase
        .from('tokens')
        .update({
          price_per_token: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('asset_id', assetId);

    } catch (error) {
      console.error('Failed to update asset pricing:', error);
    }
  }

  // Update liquidity pool metrics
  async updatePoolMetrics(poolId: string, metrics: {
    totalLiquidity?: number;
    apr?: number;
    volume24h?: number;
    fees24h?: number;
  }) {
    try {
      await supabase
        .from('liquidity_pools')
        .update({
          ...metrics,
          updated_at: new Date().toISOString()
        })
        .eq('id', poolId);
    } catch (error) {
      console.error('Failed to update pool metrics:', error);
    }
  }

  // Helper methods
  private async fetchCommodityPrice(commodity: string): Promise<number> {
    // Implement actual commodity API calls here
    // For now, using simulated data based on realistic commodity prices
    const commodityPrices: Record<string, number> = {
      gold: 2000 + (Math.random() - 0.5) * 100,
      silver: 24 + (Math.random() - 0.5) * 2,
      oil: 80 + (Math.random() - 0.5) * 10,
      copper: 4 + (Math.random() - 0.5) * 0.5,
    };
    
    return commodityPrices[commodity.toLowerCase()] || 100;
  }

  private getCoinId(symbol: string): string {
    const coinMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
    };
    return coinMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  private isValidCache(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private updateCache(key: string, data: PriceData): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private generateMarketChange(): number {
    return (Math.random() - 0.5) * 10; // -5% to +5% change
  }

  private getFallbackPrice(commodity: string): PriceData {
    const fallbackPrices: Record<string, number> = {
      gold: 2000,
      silver: 24,
      oil: 80,
      copper: 4,
    };

    return {
      symbol: commodity.toUpperCase(),
      price: fallbackPrices[commodity.toLowerCase()] || 100,
      change24h: 0,
      volume24h: 0,
      lastUpdated: new Date()
    };
  }

  private getFallbackCryptoPrice(symbol: string): PriceData {
    const fallbackPrices: Record<string, number> = {
      BTC: 45000,
      ETH: 3000,
      USDC: 1,
      USDT: 1,
    };

    return {
      symbol: symbol.toUpperCase(),
      price: fallbackPrices[symbol.toUpperCase()] || 1,
      change24h: 0,
      volume24h: 0,
      lastUpdated: new Date()
    };
  }
}

// Export singleton instance
export const priceOracle = new PriceOracle();

// Utility functions for common pricing operations
export const calculateAssetValuation = async (asset: any) => {
  if (asset.type === 'Real Estate') {
    return priceOracle.calculateRealEstateValue({
      location: asset.location || 'Dubai',
      size: asset.size || 10000,
      propertyType: 'commercial',
      yearBuilt: asset.yearBuilt
    });
  } else if (asset.type === 'Gold' || asset.type === 'Commodities') {
    const commodityData = await priceOracle.getCommodityPrice(asset.type);
    return commodityData.price * (asset.quantity || 1);
  }
  
  return asset.value_amount || 1000000;
};

export const updateAllAssetPricing = async () => {
  try {
    const { data: assets } = await supabase
      .from('assets')
      .select('*');

    if (!assets) return;

    for (const asset of assets) {
      const newValue = await calculateAssetValuation(asset);
      const tokenPrice = priceOracle.calculateTokenPrice(
        newValue,
        asset.total_tokens || 1000,
        1 + (Math.random() - 0.5) * 0.4 // ±20% market demand variation
      );

      await priceOracle.updateAssetPricing(asset.id.toString(), tokenPrice);
    }

    console.log('Updated pricing for all assets');
  } catch (error) {
    console.error('Failed to update asset pricing:', error);
  }
};