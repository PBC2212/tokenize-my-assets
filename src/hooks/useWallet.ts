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
  const { user, isAuthenticated, authenticateWallet } = useAuth();
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
    if (!user || !isAuthenticated) return;
    
    const { data, error } = await supabase
      .from('wallet_connections')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error loading wallet connections:', error);
      return;
    }
    
    setConnections(data || []);
  }, [user, isAuthenticated]);

  // Connect to MetaMask and authenticate
  const connectWallet = useCallback(async () => {
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

      // Generate nonce for signature verification and authentication
      const nonce = Math.random().toString(36).substring(2, 15);
      const timestamp = Date.now();
      const message = `Welcome to RWA Tokenization Platform!\n\nPlease sign this message to authenticate your wallet:\n\nWallet: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
      
      // Request signature for authentication
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Authenticate with backend (this will create user if needed)
      const { error: authError } = await authenticateWallet(address, signature, message, nonce);
      
      if (authError) {
        console.error('Wallet authentication failed:', authError);
        throw new Error('Wallet authentication failed');
      }

      // Update wallet state
      setWallet({
        address,
        provider,
        chainId: Number(network.chainId),
        isConnected: true,
        isConnecting: false,
      });

      toast.success('Wallet connected and authenticated successfully!');
      
      // Load wallet connections after a short delay to allow authentication to complete
      setTimeout(() => {
        loadWalletConnections();
      }, 1000);

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      setWallet(prev => ({ ...prev, isConnecting: false }));
    }
  }, [authenticateWallet, loadWalletConnections]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWallet({
      address: null,
      provider: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
    });
    setConnections([]);
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

  // Load connections when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadWalletConnections();
    }
  }, [loadWalletConnections, isAuthenticated, user]);

  return {
    wallet,
    connections,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    loadWalletConnections,
  };
};