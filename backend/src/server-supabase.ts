import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { supabase } from "./supabase";
import type { 
  UserAsset, 
  Token, 
  Activity, 
  KycSubmission, 
  MarketplaceListing, 
  LiquidityPool, 
  LiquidityPosition,
  Transaction 
} from "./supabase";

dotenv.config();

// Extend the Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

const app = express();

// Handle preflight requests first
app.options('*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:8080", 
      "https://www.imecapitaltokenization.com",
      "https://imecapitaltokenization.com",
      "https://id-preview--4eb6568c-c4c3-419d-9b8c-60467070fa3e.lovable.app"
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Manual headers as fallback
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8080", 
    "https://www.imecapitaltokenization.com",
    "https://imecapitaltokenization.com",
    "https://id-preview--4eb6568c-c4c3-419d-9b8c-60467070fa3e.lovable.app"
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// File upload setup
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";

// Authentication middleware - now validates Supabase JWT tokens
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify Supabase JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = { userId: user.id, email: user.email || '' };
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// 1. Authentication Endpoints (kept for backward compatibility)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    // Use Supabase Auth for registration
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    
    if (authError) {
      return res.status(400).json({ error: authError.message });
    }
    
    res.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        name: authData.user?.user_metadata?.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Use Supabase Auth for login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      return res.status(401).json({ error: authError.message });
    }
    
    res.json({
      success: true,
      token: authData.session?.access_token,
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        name: authData.user?.user_metadata?.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: user, error } = await supabase.auth.getUser();
    
    if (error || !user.user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.user.id,
      email: user.user.email,
      name: user.user.user_metadata?.name,
      createdAt: user.user.created_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// 2. KYC Endpoints  
app.post('/api/kyc/submit', authenticateToken, upload.array('documents'), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    const { data: submission, error } = await supabase
      .from('kyc_submissions')
      .insert({
        user_id: req.user?.userId,
        status: 'pending',
        documents: files?.map((f) => f.filename) || []
      })
      .select()
      .single();
      
    if (error) {
      console.error('KYC submission error:', error);
      return res.status(500).json({ error: 'KYC submission failed' });
    }
    
    res.json({
      success: true,
      message: "KYC documents submitted successfully",
      submissionId: submission.id
    });
  } catch (error) {
    console.error('KYC submit error:', error);
    res.status(500).json({ error: 'KYC submission failed' });
  }
});

app.post('/api/kyc/upload', authenticateToken, upload.array('documents'), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    const { data: submission, error } = await supabase
      .from('kyc_submissions')
      .insert({
        user_id: req.user?.userId,
        status: 'pending',
        documents: files?.map((f) => f.filename) || []
      })
      .select()
      .single();
      
    if (error) {
      console.error('KYC upload error:', error);
      return res.status(500).json({ error: 'KYC upload failed' });
    }
    
    res.json({
      success: true,
      message: "KYC documents uploaded successfully",
      submissionId: submission.id
    });
  } catch (error) {
    console.error('KYC upload error:', error);
    res.status(500).json({ error: 'KYC upload failed' });
  }
});

app.get('/api/kyc/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: submission, error } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('user_id', req.user?.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error('KYC status error:', error);
      return res.status(500).json({ error: 'Failed to get KYC status' });
    }
    
    if (!submission) {
      return res.json({
        status: 'pending',
        submittedAt: null,
        reviewedAt: null,
        rejectionReason: null
      });
    }
    
    res.json({
      status: submission.status,
      submittedAt: submission.submitted_at,
      reviewedAt: submission.reviewed_at,
      rejectionReason: submission.rejection_reason
    });
  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ error: 'Failed to get KYC status' });
  }
});

// 3. Asset & Tokenization Endpoints
app.post('/api/assets/pledge', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { assetType, estimatedValue, description, documents } = req.body;
    
    const { data: asset, error: assetError } = await supabase
      .from('user_assets')
      .insert({
        user_id: req.user?.userId,
        asset_type: assetType,
        estimated_value: parseFloat(estimatedValue) || 0,
        description,
        status: 'under_review',
        documents: documents || []
      })
      .select()
      .single();
      
    if (assetError) {
      console.error('Asset pledge error:', assetError);
      return res.status(500).json({ error: 'Asset pledge failed' });
    }
    
    // Add activity
    await supabase
      .from('activities')
      .insert({
        user_id: req.user?.userId,
        type: 'Asset Pledged',
        description: `Pledged ${assetType} asset worth $${(parseFloat(estimatedValue) || 0).toLocaleString()}`,
        amount: parseFloat(estimatedValue) || 0,
        status: 'completed'
      });
    
    res.json({
      success: true,
      assetId: asset.id,
      message: "Asset pledged successfully"
    });
  } catch (error) {
    console.error('Asset pledge error:', error);
    res.status(500).json({ error: 'Asset pledge failed' });
  }
});

app.get('/api/assets/mine', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: assets, error } = await supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', req.user?.userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Get assets error:', error);
      return res.status(500).json({ error: 'Failed to get assets' });
    }
    
    res.json(assets || []);
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ error: 'Failed to get assets' });
  }
});

app.get('/api/assets/pledged', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: assets, error } = await supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', req.user?.userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Get pledged assets error:', error);
      return res.status(500).json({ error: 'Failed to get pledged assets' });
    }
    
    res.json(assets || []);
  } catch (error) {
    console.error('Get pledged assets error:', error);
    res.status(500).json({ error: 'Failed to get pledged assets' });
  }
});

app.get('/api/assets/my-assets', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: assets, error } = await supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', req.user?.userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Get my assets error:', error);
      return res.status(500).json({ error: 'Failed to get assets' });
    }
    
    res.json(assets || []);
  } catch (error) {
    console.error('Get my assets error:', error);
    res.status(500).json({ error: 'Failed to get assets' });
  }
});

app.post('/api/assets/:id/mint', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tokenName, tokenSymbol, totalSupply, pricePerToken, decimals, fractional, tokenType } = req.body;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid asset ID provided' });
    }
    
    // Check if user owns the asset
    const { data: asset, error: assetError } = await supabase
      .from('user_assets')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user?.userId)
      .single();
      
    if (assetError || !asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    if (asset.status !== 'approved') {
      return res.status(400).json({ error: 'Asset must be approved before minting' });
    }
    
    const contractAddress = '0x' + Math.random().toString(16).substr(2, 40);
    
    // Insert token
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .insert({
        asset_id: id,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        total_supply: parseInt(totalSupply) || 0,
        price_per_token: parseFloat(pricePerToken) || 0,
        decimals: parseInt(decimals) || 18,
        fractional: fractional || false,
        token_type: tokenType || 'ERC20',
        contract_address: contractAddress
      })
      .select()
      .single();
      
    if (tokenError) {
      console.error('Token creation error:', tokenError);
      return res.status(500).json({ error: 'Token minting failed' });
    }
    
    // Update asset status
    await supabase
      .from('user_assets')
      .update({ 
        status: 'tokenized',
        token_id: token.id,
        contract_address: contractAddress
      })
      .eq('id', id);
    
    // Add activity
    await supabase
      .from('activities')
      .insert({
        user_id: req.user?.userId,
        type: 'Token Minted',
        description: `Minted ${totalSupply} ${tokenSymbol} tokens for ${asset.asset_type}`,
        amount: parseFloat(pricePerToken) * parseInt(totalSupply),
        status: 'completed'
      });
    
    res.json({
      success: true,
      tokenId: token.id,
      contractAddress,
      token,
      message: "Token minted successfully"
    });
  } catch (error) {
    console.error('Token mint error:', error);
    res.status(500).json({ error: 'Token minting failed' });
  }
});

app.get('/api/assets/marketplace', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Get all tokenized assets with their token information
    const { data: assets, error } = await supabase
      .from('user_assets')
      .select(`
        *,
        tokens (*)
      `)
      .eq('status', 'tokenized')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Get marketplace assets error:', error);
      return res.status(500).json({ error: 'Failed to get marketplace assets' });
    }
    
    const marketplaceAssets = (assets || []).map((asset: any) => ({
      id: asset.id,
      tokenId: asset.tokens?.id,
      tokenSymbol: asset.tokens?.token_symbol || 'TKN',
      assetName: asset.description,
      assetType: asset.asset_type,
      price: asset.tokens?.price_per_token || 25,
      change24h: (Math.random() - 0.5) * 10, // Random change for demo
      availableTokens: Math.floor((asset.tokens?.total_supply || 1000) * 0.25),
      totalSupply: asset.tokens?.total_supply || 1000,
      contractAddress: asset.tokens?.contract_address
    }));
    
    res.json(marketplaceAssets);
  } catch (error) {
    console.error('Get marketplace assets error:', error);
    res.status(500).json({ error: 'Failed to get marketplace assets' });
  }
});

// 4. Marketplace Endpoints
app.get('/api/marketplace/listings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: listings, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        tokens (*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Get marketplace listings error:', error);
      return res.status(500).json({ error: 'Failed to get marketplace listings' });
    }
    
    res.json(listings || []);
  } catch (error) {
    console.error('Get marketplace listings error:', error);
    res.status(500).json({ error: 'Failed to get marketplace listings' });
  }
});

app.post('/api/marketplace/buy', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { tokenId, amount } = req.body;
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user?.userId,
        type: 'buy',
        token_id: tokenId,
        amount,
        total_value: amount,
        status: 'completed'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Marketplace buy error:', error);
      return res.status(500).json({ error: 'Purchase failed' });
    }
    
    // Add activity
    await supabase
      .from('activities')
      .insert({
        user_id: req.user?.userId,
        type: 'Token Purchase',
        description: `Bought ${amount} tokens`,
        amount,
        status: 'completed'
      });
    
    res.json({
      success: true,
      transactionId: transaction.id,
      message: "Purchase successful"
    });
  } catch (error) {
    console.error('Marketplace buy error:', error);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

app.post('/api/marketplace/buy/:tokenId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params;
    const { amount } = req.body;
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user?.userId,
        type: 'buy',
        token_id: tokenId,
        amount,
        total_value: amount,
        status: 'completed'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Marketplace buy by ID error:', error);
      return res.status(500).json({ error: 'Purchase failed' });
    }
    
    // Add activity
    await supabase
      .from('activities')
      .insert({
        user_id: req.user?.userId,
        type: 'Token Purchase',
        description: `Bought ${amount} tokens (${tokenId})`,
        amount,
        status: 'completed'
      });
    
    res.json({
      success: true,
      transactionId: transaction.id,
      message: "Purchase successful"
    });
  } catch (error) {
    console.error('Marketplace buy by ID error:', error);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

app.post('/api/marketplace/sell', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { tokenId, amount, price } = req.body;
    
    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .insert({
        token_id: tokenId,
        seller_id: req.user?.userId,
        amount,
        price_per_token: price,
        total_price: amount * price,
        status: 'active'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Marketplace sell error:', error);
      return res.status(500).json({ error: 'Listing failed' });
    }
    
    // Add activity
    await supabase
      .from('activities')
      .insert({
        user_id: req.user?.userId,
        type: 'Token Sale',
        description: `Listed ${amount} tokens for sale at ${price}`,
        amount,
        status: 'completed'
      });
    
    res.json({
      success: true,
      listingId: listing.id,
      message: "Asset listed for sale"
    });
  } catch (error) {
    console.error('Marketplace sell error:', error);
    res.status(500).json({ error: 'Listing failed' });
  }
});

app.post('/api/marketplace/sell/:tokenId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params;
    const { amount, price } = req.body;
    
    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .insert({
        token_id: tokenId,
        seller_id: req.user?.userId,
        amount,
        price_per_token: price,
        total_price: amount * price,
        status: 'active'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Marketplace sell by ID error:', error);
      return res.status(500).json({ error: 'Listing failed' });
    }
    
    // Add activity
    await supabase
      .from('activities')
      .insert({
        user_id: req.user?.userId,
        type: 'Token Sale',
        description: `Listed ${amount} tokens for sale at ${price} (${tokenId})`,
        amount,
        status: 'completed'
      });
    
    res.json({
      success: true,
      listingId: listing.id,
      message: "Asset listed for sale"
    });
  } catch (error) {
    console.error('Marketplace sell by ID error:', error);
    res.status(500).json({ error: 'Listing failed' });
  }
});

// 5. Liquidity Pool Endpoints
app.get('/api/liquidity/pools', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: pools, error } = await supabase
      .from('liquidity_pools')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Get liquidity pools error:', error);
      return res.status(500).json({ error: 'Failed to get liquidity pools' });
    }
    
    // Add user's liquidity positions
    const poolsWithUserData = await Promise.all((pools || []).map(async (pool) => {
      const { data: userPosition } = await supabase
        .from('liquidity_positions')
        .select('*')
        .eq('user_id', req.user?.userId)
        .eq('pool_id', pool.id)
        .maybeSingle();
      
      return {
        id: pool.id,
        name: pool.name,
        tokenA: pool.token_a,
        tokenB: pool.token_b,
        apr: pool.apr,
        totalLiquidity: pool.total_liquidity,
        myLiquidity: userPosition?.amount || 0,
        volume24h: pool.volume_24h,
        fees24h: pool.fees_24h
      };
    }));
    
    res.json(poolsWithUserData);
  } catch (error) {
    console.error('Get liquidity pools error:', error);
    res.status(500).json({ error: 'Failed to get liquidity pools' });
  }
});

app.post('/api/liquidity/provide', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { poolId, amount } = req.body;
    
    // Get pool info
    const { data: pool, error: poolError } = await supabase
      .from('liquidity_pools')
      .select('*')
      .eq('id', poolId)
      .single();
      
    if (poolError || !pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    const lpTokens = Math.floor(amount * 0.1);
    
    // Check if user already has a position
    const { data: existingPosition } = await supabase
      .from('liquidity_positions')
      .select('*')
      .eq('user_id', req.user?.userId)
      .eq('pool_id', poolId)
      .maybeSingle();
    
    if (existingPosition) {
      // Update existing position
      await supabase
        .from('liquidity_positions')
        .update({
          amount: existingPosition.amount + amount,
          lp_tokens: existingPosition.lp_tokens + lpTokens
        })
        .eq('id', existingPosition.id);
    } else {
      // Create new position
      await supabase
        .from('liquidity_positions')
        .insert({
          user_id: req.user?.userId,
          pool_id: poolId,
          amount,
          lp_tokens: lpTokens,
          entry_price: amount / lpTokens
        });
    }
    
    // Update pool liquidity
    await supabase
      .from('liquidity_pools')
      .update({
        total_liquidity: pool.total_liquidity + amount
      })
      .eq('id', poolId);
    
    // Add activity
    const { data: activity } = await supabase
      .from('activities')
      .insert({
        user_id: req.user?.userId,
        type: 'Liquidity Provided',
        description: `Provided ${amount?.toLocaleString()} to liquidity pool`,
        amount,
        status: 'completed'
      })
      .select()
      .single();
    
    res.json({
      success: true,
      transactionId: activity?.id,
      lpTokens,
      message: "Liquidity provided successfully"
    });
  } catch (error) {
    console.error('Liquidity provide error:', error);
    res.status(500).json({ error: 'Liquidity provision failed' });
  }
});

app.post('/api/liquidity/add', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { poolId, amount } = req.body;
    
    // Get pool info
    const { data: pool, error: poolError } = await supabase
      .from('liquidity_pools')
      .select('*')
      .eq('id', poolId)
      .single();
      
    if (poolError || !pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    const lpTokens = Math.floor(amount * 0.1);
    
    // Check if user already has a position
    const { data: existingPosition } = await supabase
      .from('liquidity_positions')
      .select('*')
      .eq('user_id', req.user?.userId)
      .eq('pool_id', poolId)
      .maybeSingle();
    
    if (existingPosition) {
      // Update existing position
      await supabase
        .from('liquidity_positions')
        .update({
          amount: existingPosition.amount + amount,
          lp_tokens: existingPosition.lp_tokens + lpTokens
        })
        .eq('id', existingPosition.id);
    } else {
      // Create new position
      await supabase
        .from('liquidity_positions')
        .insert({
          user_id: req.user?.userId,
          pool_id: poolId,
          amount,
          lp_tokens: lpTokens,
          entry_price: amount / lpTokens
        });
    }
    
    // Update pool liquidity
    await supabase
      .from('liquidity_pools')
      .update({
        total_liquidity: pool.total_liquidity + amount
      })
      .eq('id', poolId);
    
    // Add activity
    const { data: activity } = await supabase
      .from('activities')
      .insert({
        user_id: req.user?.userId,
        type: 'Liquidity Added',
        description: `Added ${amount?.toLocaleString()} to liquidity pool`,
        amount,
        status: 'completed'
      })
      .select()
      .single();
    
    res.json({
      success: true,
      transactionId: activity?.id,
      lpTokens,
      message: "Liquidity added successfully"
    });
  } catch (error) {
    console.error('Liquidity add error:', error);
    res.status(500).json({ error: 'Liquidity addition failed' });
  }
});

app.post('/api/liquidity/withdraw', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { poolId, amount } = req.body;
    
    // Get user's position
    const { data: position, error: positionError } = await supabase
      .from('liquidity_positions')
      .select('*')
      .eq('user_id', req.user?.userId)
      .eq('pool_id', poolId)
      .single();
      
    if (positionError || !position || position.amount < amount) {
      return res.status(400).json({ error: 'Insufficient liquidity position' });
    }
    
    // Get pool info
    const { data: pool, error: poolError } = await supabase
      .from('liquidity_pools')
      .select('*')
      .eq('id', poolId)
      .single();
      
    if (poolError || !pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    // Update position
    const newAmount = position.amount - amount;
    const newLpTokens = position.lp_tokens - Math.floor(amount * 0.1);
    
    if (newAmount <= 0) {
      // Remove position entirely
      await supabase
        .from('liquidity_positions')
        .delete()
        .eq('id', position.id);
    } else {
      // Update position
      await supabase
        .from('liquidity_positions')
        .update({
          amount: newAmount,
          lp_tokens: newLpTokens
        })
        .eq('id', position.id);
    }
    
    // Update pool liquidity
    await supabase
      .from('liquidity_pools')
      .update({
        total_liquidity: pool.total_liquidity - amount
      })
      .eq('id', poolId);
    
    // Add activity
    const { data: activity } = await supabase
      .from('activities')
      .insert({
        user_id: req.user?.userId,
        type: 'Liquidity Withdrawn',
        description: `Withdrew ${amount?.toLocaleString()} from liquidity pool`,
        amount,
        status: 'completed'
      })
      .select()
      .single();
    
    res.json({
      success: true,
      transactionId: activity?.id,
      message: "Liquidity withdrawn successfully"
    });
  } catch (error) {
    console.error('Liquidity withdraw error:', error);
    res.status(500).json({ error: 'Liquidity withdrawal failed' });
  }
});

app.post('/api/liquidity/remove', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { poolId, amount } = req.body;
    
    // Get user's position
    const { data: position, error: positionError } = await supabase
      .from('liquidity_positions')
      .select('*')
      .eq('user_id', req.user?.userId)
      .eq('pool_id', poolId)
      .single();
      
    if (positionError || !position || position.amount < amount) {
      return res.status(400).json({ error: 'Insufficient liquidity position' });
    }
    
    // Get pool info
    const { data: pool, error: poolError } = await supabase
      .from('liquidity_pools')
      .select('*')
      .eq('id', poolId)
      .single();
      
    if (poolError || !pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    // Update position
    const newAmount = position.amount - amount;
    const newLpTokens = position.lp_tokens - Math.floor(amount * 0.1);
    
    if (newAmount <= 0) {
      // Remove position entirely
      await supabase
        .from('liquidity_positions')
        .delete()
        .eq('id', position.id);
    } else {
      // Update position
      await supabase
        .from('liquidity_positions')
        .update({
          amount: newAmount,
          lp_tokens: newLpTokens
        })
        .eq('id', position.id);
    }
    
    // Update pool liquidity
    await supabase
      .from('liquidity_pools')
      .update({
        total_liquidity: pool.total_liquidity - amount
      })
      .eq('id', poolId);
    
    // Add activity
    const { data: activity } = await supabase
      .from('activities')
      .insert({
        user_id: req.user?.userId,
        type: 'Liquidity Removed',
        description: `Removed ${amount?.toLocaleString()} from liquidity pool`,
        amount,
        status: 'completed'
      })
      .select()
      .single();
    
    res.json({
      success: true,
      transactionId: activity?.id,
      message: "Liquidity removed successfully"
    });
  } catch (error) {
    console.error('Liquidity remove error:', error);
    res.status(500).json({ error: 'Liquidity removal failed' });
  }
});

// 6. Activity Endpoints
app.get('/api/activity/mine', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', req.user?.userId)
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error('Get activities error:', error);
      return res.status(500).json({ error: 'Failed to get activities' });
    }
    
    res.json(activities || []);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

app.get('/api/activity/my-activity', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', req.user?.userId)
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error('Get my activities error:', error);
      return res.status(500).json({ error: 'Failed to get activities' });
    }
    
    res.json(activities || []);
  } catch (error) {
    console.error('Get my activities error:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

// 7. Dashboard Analytics Endpoints
app.get('/api/dashboard/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get user's assets
    const { data: userAssets } = await supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', userId);

    // Get user's tokens
    const { data: userTokens } = await supabase
      .from('tokens')
      .select('*')
      .in('asset_id', (userAssets || []).map(a => a.id));

    // Get user's transactions  
    const { data: userTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    // Get user's liquidity positions
    const { data: userLiquidityPositions } = await supabase
      .from('liquidity_positions')
      .select('*')
      .eq('user_id', userId);

    // Calculate total portfolio value
    const portfolioValue = (userAssets || []).reduce((sum, asset) => sum + (asset.estimated_value || 0), 0);
    
    // Calculate total invested (from transactions)
    const totalInvested = (userTransactions || [])
      .filter(t => t.type === 'buy')
      .reduce((sum, t) => sum + (t.total_value || 0), 0);

    // Calculate total liquidity provided
    const totalLiquidity = (userLiquidityPositions || []).reduce((sum, pos) => sum + (pos.amount || 0), 0);

    // Calculate 24h change (simulated)
    const change24h = (Math.random() - 0.5) * 10; // Random change for demo
    const changeAmount = portfolioValue * (change24h / 100);

    // Count assets by status
    const activeAssets = (userAssets || []).filter(a => a.status === 'tokenized').length;
    const pendingAssets = (userAssets || []).filter(a => a.status === 'under_review').length;

    res.json({
      portfolioValue,
      totalInvested,
      totalLiquidity,
      change24h,
      changeAmount,
      totalAssets: (userAssets || []).length,
      activeAssets,
      pendingAssets,
      totalTokens: (userTokens || []).length,
      totalTransactions: (userTransactions || []).length
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

app.get('/api/dashboard/portfolio-breakdown', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    const { data: userAssets, error } = await supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Portfolio breakdown error:', error);
      return res.status(500).json({ error: 'Failed to get portfolio breakdown' });
    }

    // Group assets by type and calculate values
    const breakdown = (userAssets || []).reduce((acc: any, asset) => {
      const type = asset.asset_type;
      const value = asset.estimated_value || 0;
      
      if (!acc[type]) {
        acc[type] = {
          type,
          value: 0,
          count: 0,
          percentage: 0
        };
      }
      
      acc[type].value += value;
      acc[type].count += 1;
      
      return acc;
    }, {});

    // Calculate total value for percentages
    const totalValue = Object.values(breakdown).reduce((sum: number, item: any) => sum + item.value, 0);

    // Calculate percentages and convert to array
    const portfolioBreakdown = Object.values(breakdown).map((item: any) => ({
      ...item,
      percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0
    }));

    res.json(portfolioBreakdown);
  } catch (error) {
    console.error('Portfolio breakdown error:', error);
    res.status(500).json({ error: 'Failed to get portfolio breakdown' });
  }
});

// 8. Health Check Endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Test Supabase connection
    const { error } = await supabase
      .from('liquidity_pools')
      .select('count')
      .limit(1);
      
    if (error) {
      return res.status(500).json({ 
        status: 'error', 
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      });
    }
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(), 
      version: '2.0.0',
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'error',
      error: 'Health check failed'
    });
  }
});

// Root endpoint with API documentation
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'RWA Tokenization Platform API - Now powered by Supabase!',
    version: '2.0.0',
    database: 'Supabase',
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login', 
        'GET /api/auth/me'
      ],
      kyc: [
        'POST /api/kyc/submit',
        'POST /api/kyc/upload',
        'GET /api/kyc/status'
      ],
      assets: [
        'POST /api/assets/pledge',
        'GET /api/assets/mine',
        'GET /api/assets/pledged',
        'GET /api/assets/my-assets',
        'POST /api/assets/:id/mint',
        'GET /api/assets/marketplace'
      ],
      marketplace: [
        'GET /api/marketplace/listings',
        'POST /api/marketplace/buy',
        'POST /api/marketplace/buy/:tokenId',
        'POST /api/marketplace/sell',
        'POST /api/marketplace/sell/:tokenId'
      ],
      liquidity: [
        'GET /api/liquidity/pools',
        'POST /api/liquidity/provide',
        'POST /api/liquidity/add',
        'POST /api/liquidity/withdraw',
        'POST /api/liquidity/remove'
      ],
      activity: [
        'GET /api/activity/mine',
        'GET /api/activity/my-activity'
      ],
      dashboard: [
        'GET /api/dashboard/stats',
        'GET /api/dashboard/portfolio-breakdown'
      ],
      system: [
        'GET /api/health'
      ]
    },
    documentation: 'All endpoints now use Supabase for data persistence and authentication.',
    note: 'Make sure to include Authorization: Bearer <token> header for protected endpoints'
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: Supabase`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}`);
  console.log(`💻 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;