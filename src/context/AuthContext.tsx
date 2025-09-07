import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WalletUser {
  id: string;
  wallet_address: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: WalletUser | null;
  walletAddress: string | null;
  sessionToken: string | null;
  authenticateWallet: (walletAddress: string, signature: string, message: string, nonce: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<WalletUser | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing wallet session
    const storedUser = localStorage.getItem('wallet_user');
    const storedToken = localStorage.getItem('wallet_session_token');
    const storedAddress = localStorage.getItem('wallet_address');
    
    if (storedUser && storedToken && storedAddress) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setSessionToken(storedToken);
        setWalletAddress(storedAddress);
        
        // Set wallet address in Supabase session for RLS policies (best effort)
        supabase.rpc('set_current_wallet_address', { wallet_addr: storedAddress });
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('wallet_user');
        localStorage.removeItem('wallet_session_token');
        localStorage.removeItem('wallet_address');
      }
    }
    
    setLoading(false);
  }, []);

  const authenticateWallet = async (walletAddress: string, signature: string, message: string, nonce: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('wallet-auth', {
        body: {
          walletAddress,
          signature,
          message,
          nonce
        }
      });

      if (error) {
        console.error('Wallet authentication error:', error);
        return { error };
      }

      if (data?.success && data?.user && data?.sessionToken) {
        const walletUser: WalletUser = data.user;
        
        // Store session data
        localStorage.setItem('wallet_user', JSON.stringify(walletUser));
        localStorage.setItem('wallet_session_token', data.sessionToken);
        localStorage.setItem('wallet_address', walletAddress);
        
        // Set wallet address in Supabase session for RLS policies
        await supabase.rpc('set_current_wallet_address', { wallet_addr: walletAddress });
        
        // Update state
        setUser(walletUser);
        setSessionToken(data.sessionToken);
        setWalletAddress(walletAddress);
        
        return { error: null };
      }

      return { error: { message: 'Authentication failed' } };
    } catch (error) {
      console.error('Wallet authentication error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    // Clear wallet address from Supabase session
    try {
      await supabase.rpc('set_current_wallet_address', { wallet_addr: '' });
    } catch (error) {
      console.error('Error clearing wallet session:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('wallet_user');
    localStorage.removeItem('wallet_session_token');
    localStorage.removeItem('wallet_address');
    
    // Clear state
    setUser(null);
    setSessionToken(null);
    setWalletAddress(null);
  };

  const value = {
    user,
    walletAddress,
    sessionToken,
    authenticateWallet,
    signOut,
    loading,
    isAuthenticated: !!user && !!sessionToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};