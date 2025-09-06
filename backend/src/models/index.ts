import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Asset Schema
const assetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assetType: { type: String, required: true },
  description: { type: String, required: true },
  estimatedValue: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['under_review', 'approved', 'rejected', 'tokenized'], 
    default: 'under_review' 
  },
  documents: [{ type: String }],
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  tokenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Token' },
  contractAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Token Schema
const tokenSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  tokenName: { type: String, required: true },
  tokenSymbol: { type: String, required: true },
  totalSupply: { type: Number, required: true },
  pricePerToken: { type: Number, required: true },
  decimals: { type: Number, default: 18 },
  fractional: { type: Boolean, default: false },
  tokenType: { type: String, default: 'ERC20' },
  contractAddress: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Activity Schema
const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'completed' 
  },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed }, // For additional data
  createdAt: { type: Date, default: Date.now }
});

// KYC Submission Schema
const kycSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  documents: [{ type: String }],
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  rejectionReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Marketplace Listing Schema
const marketplaceListingSchema = new mongoose.Schema({
  tokenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Token', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  pricePerToken: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'sold', 'cancelled'], 
    default: 'active' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['buy', 'sell', 'mint', 'transfer', 'liquidity_add', 'liquidity_remove'], 
    required: true 
  },
  tokenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Token' },
  amount: { type: Number, required: true },
  price: { type: Number },
  totalValue: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  blockchainTxHash: { type: String },
  blockchainStatus: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Liquidity Pool Schema
const liquidityPoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tokenA: { type: String, required: true },
  tokenB: { type: String, required: true },
  tokenAId: { type: mongoose.Schema.Types.ObjectId, ref: 'Token' },
  tokenBId: { type: mongoose.Schema.Types.ObjectId, ref: 'Token' },
  totalLiquidity: { type: Number, default: 0 },
  apr: { type: Number, default: 0 },
  volume24h: { type: Number, default: 0 },
  fees24h: { type: Number, default: 0 },
  contractAddress: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Liquidity Position Schema
const liquidityPositionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  poolId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiquidityPool', required: true },
  amount: { type: Number, required: true },
  lpTokens: { type: Number, required: true },
  entryPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create Models
export const User = mongoose.model('User', userSchema);
export const Asset = mongoose.model('Asset', assetSchema);
export const Token = mongoose.model('Token', tokenSchema);
export const Activity = mongoose.model('Activity', activitySchema);
export const KycSubmission = mongoose.model('KycSubmission', kycSubmissionSchema);
export const MarketplaceListing = mongoose.model('MarketplaceListing', marketplaceListingSchema);
export const Transaction = mongoose.model('Transaction', transactionSchema);
export const LiquidityPool = mongoose.model('LiquidityPool', liquidityPoolSchema);
export const LiquidityPosition = mongoose.model('LiquidityPosition', liquidityPositionSchema);

// Database connection function
export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://IME221212:MongoPass123@rwa-cluster.7mdcejd.mongodb.net/?retryWrites=true&w=majority&appName=rwa-cluster';
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
    
    // Create sample data if database is empty
    await createSampleData();
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create sample data function
const createSampleData = async () => {
  try {
    // Check if sample user already exists
    const existingUser = await User.findOne({ email: 'test@test.com' });
    
    if (!existingUser) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Create sample user
      const sampleUser = new User({
        email: 'test@test.com',
        password: hashedPassword,
        name: 'Test User'
      });
      await sampleUser.save();
      
      // Create sample assets
      const asset1 = new Asset({
        userId: sampleUser._id,
        assetType: 'Real Estate',
        description: 'Luxury apartment in downtown',
        estimatedValue: 250000,
        status: 'approved',
        submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      });
      
      const asset2 = new Asset({
        userId: sampleUser._id,
        assetType: 'Gold',
        description: '24k Gold bars - 10oz',
        estimatedValue: 18500,
        status: 'approved',
        submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      });
      
      await asset1.save();
      await asset2.save();
      
      // Create sample activities
      const activity1 = new Activity({
        userId: sampleUser._id,
        type: 'Asset Pledged',
        description: 'Pledged Real Estate asset worth $250,000',
        amount: 250000,
        status: 'completed',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      });
      
      const activity2 = new Activity({
        userId: sampleUser._id,
        type: 'Token Purchase',
        description: 'Bought 100 REI tokens',
        amount: 2500,
        status: 'completed',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });
      
      await activity1.save();
      await activity2.save();
      
      // Create sample liquidity pools
      const pool1 = new LiquidityPool({
        name: 'REI/USDC Pool',
        tokenA: 'REI',
        tokenB: 'USDC',
        apr: 12.5,
        totalLiquidity: 5000000,
        volume24h: 250000,
        fees24h: 125
      });
      
      const pool2 = new LiquidityPool({
        name: 'GOLD/ETH Pool',
        tokenA: 'GOLD',
        tokenB: 'ETH',
        apr: 8.3,
        totalLiquidity: 2500000,
        volume24h: 180000,
        fees24h: 90
      });
      
      await pool1.save();
      await pool2.save();
      
      console.log('✅ Sample data created successfully');
    } else {
      console.log('✅ Sample data already exists');
    }
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};