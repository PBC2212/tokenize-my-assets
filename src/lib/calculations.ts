// Unified calculation engine for consistent data across the platform
import { supabase } from '@/integrations/supabase/client';
import { priceOracle } from './oracles';

export interface PortfolioMetrics {
  totalValue: number;
  change24h: number;
  changeAmount: number;
  assetBreakdown: AssetBreakdown[];
}

export interface AssetBreakdown {
  type: string;
  value: number;
  percentage: number;
  count: number;
}

export interface LiquidityMetrics {
  totalLiquidity: number;
  userLiquidity: number;
  apr: number;
  volume24h: number;
  fees24h: number;
  userFees24h: number;
}

class CalculationEngine {
  
  // Portfolio calculations with real-time pricing
  async calculatePortfolioValue(userId: string): Promise<PortfolioMetrics> {
    try {
      // Get user assets
      const { data: userAssets } = await supabase
        .from('user_assets')
        .select(`
          *,
          tokens (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'approved');

      // Get user liquidity positions
      const { data: positions } = await supabase
        .from('liquidity_positions')
        .select(`
          *,
          liquidity_pools (*)
        `)
        .eq('user_id', userId);

      // Get user marketplace holdings (tokens bought)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'buy')
        .eq('status', 'confirmed');

      let totalValue = 0;
      const assetBreakdownMap = new Map<string, AssetBreakdown>();

      // Calculate value from owned assets
      if (userAssets) {
        for (const asset of userAssets) {
          const currentValue = await this.getAssetCurrentValue(asset);
          totalValue += currentValue;

          const breakdown = assetBreakdownMap.get(asset.asset_type) || {
            type: asset.asset_type,
            value: 0,
            percentage: 0,
            count: 0
          };

          breakdown.value += currentValue;
          breakdown.count += 1;
          assetBreakdownMap.set(asset.asset_type, breakdown);
        }
      }

      // Calculate value from liquidity positions
      if (positions) {
        for (const position of positions) {
          const positionValue = parseFloat(position.amount.toString());
          totalValue += positionValue;

          const breakdown = assetBreakdownMap.get('Liquidity') || {
            type: 'Liquidity',
            value: 0,
            percentage: 0,
            count: 0
          };

          breakdown.value += positionValue;
          breakdown.count += 1;
          assetBreakdownMap.set('Liquidity', breakdown);
        }
      }

      // Calculate value from token holdings
      if (transactions) {
        const tokenHoldings = new Map<string, number>();
        
        // Aggregate token purchases
        for (const tx of transactions) {
          const currentHolding = tokenHoldings.get(tx.token_id) || 0;
          tokenHoldings.set(tx.token_id, currentHolding + tx.amount);
        }

        // Calculate current value of token holdings
        for (const [tokenId, amount] of tokenHoldings) {
          const currentPrice = await this.getTokenCurrentPrice(tokenId);
          const holdingValue = amount * currentPrice;
          totalValue += holdingValue;

          const breakdown = assetBreakdownMap.get('Token Holdings') || {
            type: 'Token Holdings',
            value: 0,
            percentage: 0,
            count: 0
          };

          breakdown.value += holdingValue;
          breakdown.count += 1;
          assetBreakdownMap.set('Token Holdings', breakdown);
        }
      }

      // Calculate percentages
      const assetBreakdown = Array.from(assetBreakdownMap.values()).map(item => ({
        ...item,
        percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0
      }));

      // Calculate 24h change (mock for now - would need historical data)
      const change24h = (Math.random() - 0.5) * 10; // -5% to +5%
      const changeAmount = totalValue * (change24h / 100);

      return {
        totalValue,
        change24h,
        changeAmount,
        assetBreakdown
      };

    } catch (error) {
      console.error('Portfolio calculation error:', error);
      return {
        totalValue: 0,
        change24h: 0,
        changeAmount: 0,
        assetBreakdown: []
      };
    }
  }

  // Liquidity pool calculations with dynamic metrics
  async calculateLiquidityMetrics(poolId: string, userId?: string): Promise<LiquidityMetrics> {
    try {
      const { data: pool } = await supabase
        .from('liquidity_pools')
        .select('*')
        .eq('id', poolId)
        .single();

      if (!pool) throw new Error('Pool not found');

      // Get all positions in this pool
      const { data: allPositions } = await supabase
        .from('liquidity_positions')
        .select('*')
        .eq('pool_id', poolId);

      // Calculate total liquidity
      const totalLiquidity = (allPositions || [])
        .reduce((sum, pos) => sum + parseFloat(pos.amount.toString()), 0);

      // Get user position if userId provided
      let userLiquidity = 0;
      if (userId) {
        const userPosition = (allPositions || [])
          .find(pos => pos.user_id === userId);
        if (userPosition) {
          userLiquidity = parseFloat(userPosition.amount.toString());
        }
      }

      // Calculate 24h trading volume (based on recent transactions)
      const { data: recentTrades } = await supabase
        .from('transactions')
        .select('total_value')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const volume24h = (recentTrades || [])
        .reduce((sum, tx) => sum + (tx.total_value || 0), 0);

      // Calculate APR using oracle
      const apr = priceOracle.calculatePoolAPR({
        totalLiquidity,
        volume24h,
        feeRate: 0.003, // 0.3% trading fee
        poolRisk: this.getPoolRiskMultiplier(pool.name)
      });

      // Calculate fees
      const fees24h = volume24h * 0.003; // 0.3% of volume
      const userFees24h = userLiquidity > 0 && totalLiquidity > 0 
        ? fees24h * (userLiquidity / totalLiquidity)
        : 0;

      // Update pool in database
      await priceOracle.updatePoolMetrics(poolId, {
        totalLiquidity,
        apr,
        volume24h,
        fees24h
      });

      return {
        totalLiquidity,
        userLiquidity,
        apr,
        volume24h,
        fees24h,
        userFees24h
      };

    } catch (error) {
      console.error('Liquidity metrics calculation error:', error);
      return {
        totalLiquidity: 0,
        userLiquidity: 0,
        apr: 0,
        volume24h: 0,
        fees24h: 0,
        userFees24h: 0
      };
    }
  }

  // Marketplace pricing with supply/demand
  async calculateMarketPrice(tokenId: string): Promise<number> {
    try {
      // Get recent transactions for this token
      const { data: recentTrades } = await supabase
        .from('transactions')
        .select('price, amount, created_at')
        .eq('token_id', tokenId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (!recentTrades || recentTrades.length === 0) {
        // No recent trades, use base price from token
        const { data: token } = await supabase
          .from('tokens')
          .select('price_per_token')
          .eq('id', tokenId)
          .single();

        return token?.price_per_token || 1;
      }

      // Calculate weighted average price based on volume
      let totalValue = 0;
      let totalVolume = 0;

      for (const trade of recentTrades) {
        const value = (trade.price || 0) * (trade.amount || 0);
        totalValue += value;
        totalVolume += (trade.amount || 0);
      }

      const weightedPrice = totalVolume > 0 ? totalValue / totalVolume : 1;

      // Apply supply/demand adjustment
      const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('amount, price_per_token')
        .eq('token_id', tokenId)
        .eq('status', 'active');

      const totalSupply = (listings || [])
        .reduce((sum, listing) => sum + (parseFloat(listing.amount.toString()) || 0), 0);

      // If low supply, increase price
      const supplyMultiplier = totalSupply < 100 ? 1.1 : totalSupply > 10000 ? 0.95 : 1.0;

      return weightedPrice * supplyMultiplier;

    } catch (error) {
      console.error('Market price calculation error:', error);
      return 1;
    }
  }

  // Update all calculated metrics
  async refreshAllMetrics() {
    try {
      console.log('Starting metrics refresh...');

      // Update asset pricing
      const { data: assets } = await supabase
        .from('assets')
        .select('*');

      if (assets) {
        for (const asset of assets) {
          const currentValue = await this.getAssetCurrentValue(asset);
          await priceOracle.updateAssetPricing(asset.id.toString(), currentValue);
        }
      }

      // Update liquidity pool metrics
      const { data: pools } = await supabase
        .from('liquidity_pools')
        .select('*')
        .eq('is_active', true);

      if (pools) {
        for (const pool of pools) {
          await this.calculateLiquidityMetrics(pool.id);
        }
      }

      // Update marketplace token prices
      const { data: tokens } = await supabase
        .from('tokens')
        .select('id');

      if (tokens) {
        for (const token of tokens) {
          const marketPrice = await this.calculateMarketPrice(token.id);
          await supabase
            .from('tokens')
            .update({ price_per_token: marketPrice })
            .eq('id', token.id);
        }
      }

      console.log('Metrics refresh completed');
    } catch (error) {
      console.error('Metrics refresh error:', error);
    }
  }

  // Helper methods
  private async getAssetCurrentValue(asset: any): Promise<number> {
    if (asset.asset_type === 'Real Estate') {
      return priceOracle.calculateRealEstateValue({
        location: asset.location || 'Dubai',
        size: 10000, // Default size
        propertyType: 'commercial'
      });
    } else if (asset.asset_type === 'Gold') {
      const goldPrice = await priceOracle.getCommodityPrice('gold');
      return goldPrice.price * 100; // Assuming 100 oz
    }
    
    return asset.estimated_value || 1000000;
  }

  private async getTokenCurrentPrice(tokenId: string): Promise<number> {
    const { data: token } = await supabase
      .from('tokens')
      .select('price_per_token')
      .eq('id', tokenId)
      .single();

    return token?.price_per_token || 1;
  }

  private getPoolRiskMultiplier(poolName: string): number {
    // Different pools have different risk profiles
    if (poolName.includes('USDC') || poolName.includes('USDT')) return 0.9; // Stable pools
    if (poolName.includes('BTC') || poolName.includes('ETH')) return 1.1; // Crypto pools
    return 1.0; // Default
  }
}

// Export singleton
export const calculationEngine = new CalculationEngine();

// Auto-refresh metrics every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    calculationEngine.refreshAllMetrics();
  }, 5 * 60 * 1000);
}