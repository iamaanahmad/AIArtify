# 🚀 AIArtify Deployment Guide

## 📋 Prerequisites

### System Requirements
- Node.js 18.0 or higher
- npm 9.0 or higher
- Git 2.0 or higher
- Modern web browser with Web3 support

### Required Accounts & API Keys
- [Google AI Studio](https://aistudio.google.com/) account for Gemini API
- [ImgBB](https://imgbb.com/api) account for image hosting
- MetaMask wallet with Metis Hyperion testnet configured
- [Vercel](https://vercel.com) account for deployment (recommended)

## 🛠️ Local Development Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/iamaanahmad/AIArtify.git
cd AIArtify

# Install dependencies
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:

```bash
# Required for AI functionality
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Enhanced LazAI features
LLM_API_KEY=your_llm_api_key_here
PRIVATE_KEY=your_wallet_private_key_here

# Optional: Image hosting
IMGBB_API_KEY=your_imgbb_api_key_here

# Optional: Custom configurations
HYPERION_NODE_URL=https://custom-node-url.com
```

### 3. Start Development Server
```bash
# Start the development server
npm run dev

# The application will be available at:
# http://localhost:9002
```

### 4. Verify Setup
1. Open http://localhost:9002 in your browser
2. Connect your MetaMask wallet
3. Try generating an AI art piece
4. Test the minting functionality

## 🌐 Production Deployment

### Option 1: Vercel (Recommended)

#### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/iamaanahmad/AIArtify)

#### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add GEMINI_API_KEY
vercel env add LLM_API_KEY
vercel env add IMGBB_API_KEY
```

#### Environment Variables in Vercel
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `GEMINI_API_KEY` (Production)
   - `LLM_API_KEY` (Production, optional)
   - `IMGBB_API_KEY` (Production, optional)
   - `PRIVATE_KEY` (Production, optional)

### Option 2: Docker Deployment

#### Build Docker Image
```bash
# Create Dockerfile (already included in the project)
# Build the image
docker build -t aiartify .

# Run the container
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  -e LLM_API_KEY=your_key \
  -e IMGBB_API_KEY=your_key \
  aiartify
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  aiartify:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - LLM_API_KEY=${LLM_API_KEY}
      - IMGBB_API_KEY=${IMGBB_API_KEY}
    restart: unless-stopped

# Deploy with Docker Compose
docker-compose up -d
```

### Option 3: Traditional VPS/Server

#### Build for Production
```bash
# Build the application
npm run build

# Start the production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "aiartify" -- start
pm2 save
pm2 startup
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/aiartify
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/aiartify /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Configuration Options

### Next.js Configuration
```typescript
// next.config.ts
const nextConfig = {
  // Build output configuration
  output: 'standalone',
  
  // Image optimization
  images: {
    domains: ['i.ibb.co', 'ipfs.io'],
    formats: ['image/webp', 'image/avif']
  },
  
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/genkit']
  },
  
  // Webpack configuration
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false
    }
    return config
  }
}
```

### Environment Variables Reference
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key | `AIza...` |
| `LLM_API_KEY` | No | Alternative LLM API key | `sk-...` |
| `IMGBB_API_KEY` | No | Image hosting API key | `abc123...` |
| `PRIVATE_KEY` | No | Wallet private key for advanced features | `0x...` |
| `HYPERION_NODE_URL` | No | Custom Hyperion node endpoint | `https://...` |

## 🔒 Security Considerations

### API Key Security
```bash
# Never commit API keys to version control
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore

# Use different keys for different environments
GEMINI_API_KEY_DEV=dev_key_here
GEMINI_API_KEY_PROD=prod_key_here
```

### Wallet Security
```typescript
// Client-side wallet handling
const connectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      // Never expose private keys on client side
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }
}
```

### Content Security Policy
```typescript
// Add to next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' https:;
    `.replace(/\s{2,}/g, ' ').trim()
  }
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## 📊 Monitoring and Analytics

### Performance Monitoring
```typescript
// Add to _app.tsx or layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Error Tracking
```typescript
// lib/error-tracking.ts
export function trackError(error: Error, context: string) {
  if (process.env.NODE_ENV === 'production') {
    // Send to your error tracking service
    console.error(`[${context}]`, error)
  }
}
```

## 🧪 Testing Deployment

### Pre-deployment Checklist
- [ ] All environment variables are set correctly
- [ ] Build process completes without errors
- [ ] All pages load correctly
- [ ] Wallet connection works
- [ ] AI art generation functions
- [ ] NFT minting works on testnet
- [ ] Mobile responsiveness verified
- [ ] Error handling works as expected

### Testing Commands
```bash
# Test build locally
npm run build
npm start

# Run tests
npm test

# Check for type errors
npx tsc --noEmit

# Lint code
npm run lint

# Check bundle size
npm run build && npx @next/bundle-analyzer
```

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create load test configuration
# artillery-config.yml
config:
  target: 'https://your-app.vercel.app'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Homepage load test"
    requests:
      - get:
          url: "/"

# Run load test
artillery run artillery-config.yml
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

#### Environment Variable Issues
```bash
# Verify environment variables are loaded
npm run dev
# Check browser console for missing API key warnings
```

#### Wallet Connection Issues
```typescript
// Debug wallet connection
const debugWallet = async () => {
  console.log('Ethereum object:', window.ethereum)
  console.log('MetaMask installed:', typeof window.ethereum !== 'undefined')
  
  if (window.ethereum) {
    const accounts = await window.ethereum.request({ 
      method: 'eth_accounts' 
    })
    console.log('Connected accounts:', accounts)
  }
}
```

#### Performance Issues
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for memory leaks
node --inspect npm run dev
# Open chrome://inspect in browser
```

### Support Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [MetaMask Integration Guide](https://docs.metamask.io/guide/)
- [Ethers.js Documentation](https://docs.ethers.io/)

## 📞 Getting Help

If you encounter issues during deployment:

1. Check the [GitHub Issues](https://github.com/iamaanahmad/AIArtify/issues)
2. Review the [troubleshooting section](#🚨-troubleshooting)
3. Open a new issue with:
   - Deployment method used
   - Error messages
   - Environment details
   - Steps to reproduce

---

*This deployment guide covers the most common scenarios. For specific infrastructure needs or custom configurations, please refer to the respective platform documentation or open an issue for assistance.*
