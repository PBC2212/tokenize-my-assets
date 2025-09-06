# RWA Tokenization Platform - Supabase Backend

This backend is powered entirely by Supabase! 🎉

## Architecture

### 🏗️ Tech Stack
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication:** Supabase Auth with JWT tokens
- **Edge Functions:** Serverless functions for business logic
- **File Storage:** Supabase Storage for document uploads
- **Real-time:** Supabase Realtime for live updates

### ✅ Project Structure
```
backend/src/
├── server-supabase.ts     # Main Supabase-powered server ⭐
└── supabase.ts            # Supabase client configuration
```

## Quick Start

### 1. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

### 2. Configure Supabase
Add your Supabase credentials to `.env`:
```env
SUPABASE_URL=https://gmirigexmcukcbvzywtc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Run the Server
```bash
npm run dev
```

## Key Features

### 🚀 Performance
- **Direct SQL queries** with optimized performance
- **Connection pooling** handled by Supabase
- **Real-time subscriptions** available out of the box
- **Global CDN** for fast data access

### 🔒 Security  
- **Row Level Security (RLS)** policies protect user data
- **JWT token validation** through Supabase Auth
- **Service role** for secure backend operations
- **Built-in rate limiting** and DDoS protection

### 🛠 Developer Experience
- **TypeScript support** with generated types
- **Automatic API documentation** 
- **Built-in admin dashboard**
- **Real-time monitoring** and logs

## Database Schema

The Supabase database includes these main tables:
- `profiles` - User profile information
- `user_assets` - Pledged assets awaiting tokenization
- `tokens` - Minted tokens from approved assets
- `activities` - User activity tracking
- `kyc_submissions` - KYC document submissions
- `marketplace_listings` - Token marketplace listings  
- `transactions` - Buy/sell transactions
- `liquidity_pools` - Available liquidity pools
- `liquidity_positions` - User positions in pools
- `wallet_connections` - Connected crypto wallets
- `wallet_transactions` - Blockchain transaction records

All tables include proper RLS policies for data security.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Asset Management
- `POST /api/assets/pledge` - Pledge a new asset
- `GET /api/assets/mine` - Get user's assets
- `POST /api/assets/:id/mint` - Mint tokens for an asset

### KYC Management
- `POST /api/kyc/submit` - Submit KYC documents
- `GET /api/kyc/status` - Get KYC verification status

### Marketplace
- `GET /api/marketplace/listings` - Get marketplace listings
- `POST /api/marketplace/buy` - Buy tokens
- `POST /api/marketplace/sell` - Sell tokens

### Liquidity
- `GET /api/liquidity/pools` - Get liquidity pools
- `POST /api/liquidity/add` - Add liquidity
- `POST /api/liquidity/remove` - Remove liquidity

## Edge Functions

Serverless functions handle complex business logic:

- `asset-pledge` - Asset submission and validation
- `token-mint` - Token creation and blockchain integration  
- `marketplace-trade` - Buy/sell token transactions
- `liquidity-management` - DEX liquidity operations
- `kyc-management` - KYC document processing
- `wallet-verification` - Crypto wallet verification
- `wallet-transactions` - Blockchain transaction tracking

## Production Deployment

### Environment Variables
```env
SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
JWT_SECRET=your_strong_jwt_secret
PORT=5000
NODE_ENV=production
```

### Build & Deploy
```bash
npm run build
npm start
```

## Monitoring & Analytics

Monitor your application with:

- **Supabase Dashboard** for database insights
- **Edge Function logs** for serverless function monitoring  
- **Real-time database activity** tracking
- **Authentication analytics** and user metrics
- **API usage metrics** and performance monitoring

## Support & Documentation

- 📚 [Supabase Documentation](https://supabase.com/docs)
- 🎯 [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- 🔧 [Supabase Dashboard](https://supabase.com/dashboard/project/gmirigexmcukcbvzywtc)
- 📊 [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Powered by Supabase! 🚀**