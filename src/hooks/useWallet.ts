import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WalletState {
  address: string | null;
  provider: BrowserProvider | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
}

interface WalletConnection {
  id: string;
  wallet_address: string;
  wallet_type: string;
  chain_id: number;
  is_verified: boolean;
}

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    provider: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
  });
  
  const [connections, setConnections] = useState<WalletConnection[]>([]);

  // Load existing wallet connections from database
  const loadWalletConnections = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('wallet_connections')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error loading wallet connections:', error);
      return;
    }
    
    setConnections(data || []);
  }, [user]);

  // Connect to MetaMask
  const connectWallet = useCallback(async () => {
    if (!user) {
      toast.error('Please login first to connect wallet');
      return;
    }

    if (!window.ethereum) {
      toast.error('MetaMask not detected. Please install MetaMask.');
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const address = accounts[0];

      // Generate nonce for signature verification
      const nonce = Math.random().toString(36).substring(7);
      const message = `Connect wallet to TokenizeRWA\nNonce: ${nonce}`;
      
      // Request signature
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Store wallet connection in database
      const { error } = await supabase
        .from('wallet_connections')
        .upsert({
          user_id: user.id,
          wallet_address: address,
          wallet_type: 'metamask',
          chain_id: Number(network.chainId),
          is_verified: true,
          signature: signature,
          nonce: nonce,
          last_activity: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      setWallet({
        address,
        provider,
        chainId: Number(network.chainId),
        isConnected: true,
        isConnecting: false,
      });

      toast.success('Wallet connected successfully!');
      loadWalletConnections();

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      setWallet(prev => ({ ...prev, isConnecting: false }));
    }
  }, [user, loadWalletConnections]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWallet({
      address: null,
      provider: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
    });
    toast.success('Wallet disconnected');
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        toast.error('Network not added to MetaMask');
      } else {
        toast.error('Failed to switch network');
      }
    }
  }, []);

  // Listen to account and network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== wallet.address) {
        // Account changed, reconnect
        connectWallet();
      }
    };

    const handleChainChanged = (chainId: string) => {
      setWallet(prev => ({
        ...prev,
        chainId: parseInt(chainId, 16),
      }));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [wallet.address, connectWallet, disconnectWallet]);

  // Load connections on user change
  useEffect(() => {
    loadWalletConnections();
  }, [loadWalletConnections]);

  return {
    wallet,
    connections,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    loadWalletConnections,
  };
};