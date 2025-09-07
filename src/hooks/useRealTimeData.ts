// Real-time data hook for consistent pricing across components
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { calculationEngine } from '@/lib/calculations';
import { priceOracle } from '@/lib/oracles';

export interface RealTimePortfolio {
  totalValue: number;
  change24h: number;
  changeAmount: number;
  assetBreakdown: Array<{
    type: string;
    value: number;
    percentage: number;
    count: number;
  }>;
  isLoading: boolean;
  lastUpdated: Date;
}

export interface RealTimePrices {
  [tokenId: string]: {
    price: number;
    change24h: number;
    volume24h: number;
    lastUpdated: Date;
  };
}

export const useRealTimePortfolio = (userId?: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['real-time-portfolio', userId],
    queryFn: async () => {
      if (!userId) return null;
      return await calculationEngine.calculatePortfolioValue(userId);
    },
    enabled: !!userId,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    staleTime: 15 * 1000, // Consider stale after 15 seconds
  });

  return {
    portfolio: data ? {
      ...data,
      isLoading,
      lastUpdated: new Date()
    } : null,
    isLoading,
    error,
    refresh: refetch
  };
};

export const useRealTimePrices = (tokenIds: string[] = []) => {
  const [prices, setPrices] = useState<RealTimePrices>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tokenIds.length === 0) return;

    const updatePrices = async () => {
      setIsLoading(true);
      try {
        const priceUpdates: RealTimePrices = {};
        
        for (const tokenId of tokenIds) {
          const price = await calculationEngine.calculateMarketPrice(tokenId);
          priceUpdates[tokenId] = {
            price,
            change24h: (Math.random() - 0.5) * 10, // Mock for now
            volume24h: price * Math.random() * 10000,
            lastUpdated: new Date()
          };
        }
        
        setPrices(prev => ({ ...prev, ...priceUpdates }));
      } catch (error) {
        console.error('Failed to update prices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    updatePrices();

    // Set up interval for real-time updates
    const interval = setInterval(updatePrices, 30 * 1000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [tokenIds.join(',')]);

  return { prices, isLoading };
};

export const useRealTimeLiquidity = (poolIds: string[] = []) => {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['real-time-liquidity', poolIds],
    queryFn: async () => {
      const poolMetrics = [];
      for (const poolId of poolIds) {
        const metrics = await calculationEngine.calculateLiquidityMetrics(poolId);
        poolMetrics.push({ poolId, ...metrics });
      }
      return poolMetrics;
    },
    enabled: poolIds.length > 0,
    refetchInterval: 45 * 1000, // Refresh every 45 seconds
    staleTime: 20 * 1000,
  });

  const refreshMetrics = () => {
    queryClient.invalidateQueries({ queryKey: ['real-time-liquidity'] });
  };

  return { liquidityMetrics: data || [], isLoading, error, refresh: refreshMetrics };
};

// Global data synchronization hook
export const useDataSync = () => {
  const queryClient = useQueryClient();
  
  const syncAllData = async () => {
    try {
      console.log('Starting global data sync...');
      
      // Refresh all calculations
      await calculationEngine.refreshAllMetrics();
      
      // Invalidate all queries to trigger refetch with new data
      queryClient.invalidateQueries({ queryKey: ['real-time-portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['real-time-liquidity'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['liquidity-pools'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      console.log('Global data sync completed');
    } catch (error) {
      console.error('Data sync failed:', error);
    }
  };

  // Auto-sync every 5 minutes
  useEffect(() => {
    const interval = setInterval(syncAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { syncAllData };
};

// Asset valuation hook for real-time asset prices
export const useAssetValuation = (assetType: string, assetDetails: any) => {
  const [valuation, setValuation] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const calculateValue = async () => {
      setIsCalculating(true);
      try {
        let value = 0;
        
        if (assetType === 'Real Estate') {
          value = priceOracle.calculateRealEstateValue({
            location: assetDetails.location || 'Dubai',
            size: assetDetails.size || 10000,
            propertyType: assetDetails.propertyType || 'commercial',
            yearBuilt: assetDetails.yearBuilt
          });
        } else if (assetType === 'Gold' || assetType.toLowerCase().includes('gold')) {
          const goldPrice = await priceOracle.getCommodityPrice('gold');
          value = goldPrice.price * (assetDetails.quantity || 100);
        } else if (assetType === 'Oil') {
          const oilPrice = await priceOracle.getCommodityPrice('oil');
          value = oilPrice.price * (assetDetails.quantity || 1000);
        } else {
          // Fallback to estimated value
          value = assetDetails.estimatedValue || 1000000;
        }
        
        setValuation(value);
      } catch (error) {
        console.error('Asset valuation error:', error);
        setValuation(assetDetails.estimatedValue || 1000000);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateValue();
  }, [assetType, JSON.stringify(assetDetails)]);

  return { valuation, isCalculating };
};