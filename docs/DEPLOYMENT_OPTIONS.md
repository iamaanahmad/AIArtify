# 🚀 LazAI Testnet Deployment Guide - Multiple Options

## 📋 Network Information (OFFICIAL LazAI Testnet)

```
Chain ID: 133718
Currency: LAZAI
RPC URL: https://testnet.lazai.network
Block Explorer: https://testnet-explorer.lazai.network
```

## 🛠️ Deployment Options

### Option 1: Remix IDE Deployment (Recommended for Demo)

**Perfect for live demonstration during judging!**

#### Step 1: Add LazAI Testnet to MetaMask
```javascript
// Network Details to Add:
Network Name: LazAI Testnet
RPC URL: https://testnet.lazai.network
Chain ID: 133718
Currency Symbol: LAZAI
Block Explorer: https://testnet-explorer.lazai.network
```

#### Step 2: Get LAZAI Testnet Tokens
- Visit LazAI testnet faucet (if available)
- Or use bridge from other testnet
- Need some LAZAI for gas fees

#### Step 3: Deploy via Remix
1. **Open Remix**: https://remix.ethereum.org
2. **Create Contract**: Copy `contracts/AIArtifyVerification.sol` content
3. **Compile**: 
   - Solidity version: 0.8.19+
   - Compile the contract
4. **Deploy**:
   - Environment: "Injected Provider - MetaMask"
   - Ensure MetaMask is on LazAI Testnet
   - Deploy contract
5. **Copy Address**: Save the deployed contract address

#### Step 4: Update Configuration
```typescript
// Update src/lib/lazai-testnet-config.ts
contracts: {
  verificationContract: '0xYOUR_DEPLOYED_ADDRESS_HERE'
}
```

#### Step 5: Test Integration
- Refresh the homepage
- LazAI Testnet Status should show "Active"
- Test "Verify with LazAI" functionality

### Option 2: Script Deployment (Automated)

**For production deployment**

#### Prerequisites
```bash
# Ensure you have LAZAI testnet tokens
# Update .env.local with your private key
PRIVATE_KEY=your_private_key_here
```

#### Deploy
```bash
# Run deployment script
node scripts/deploy-lazai-testnet.js

# Script will:
# 1. Connect to LazAI testnet
# 2. Deploy verification contract
# 3. Update configuration automatically
# 4. Test the deployment
```

### Option 3: Hardhat Deployment (Professional)

#### Setup Hardhat
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

#### Configure Hardhat
```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    lazaiTestnet: {
      url: "https://testnet.lazai.network",
      chainId: 133718,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      lazaiTestnet: "your-api-key" // If LazAI supports verification
    },
    customChains: [
      {
        network: "lazaiTestnet",
        chainId: 133718,
        urls: {
          apiURL: "https://testnet-explorer.lazai.network/api",
          browserURL: "https://testnet-explorer.lazai.network"
        }
      }
    ]
  }
};
```

#### Deploy with Hardhat
```bash
npx hardhat run scripts/deploy.js --network lazaiTestnet
npx hardhat verify --network lazaiTestnet DEPLOYED_CONTRACT_ADDRESS
```

## 🎯 For Live Judging Demo

### **Recommended Approach: Remix IDE**

**Why Remix for Demo:**
- ✅ Visual deployment process
- ✅ Judges can watch live deployment
- ✅ No local setup required
- ✅ Works with any MetaMask wallet
- ✅ Real-time interaction

**Demo Script (5 minutes):**

1. **Show Network Setup** (1 min)
   - MetaMask with LazAI testnet added
   - LAZAI tokens in wallet

2. **Deploy Contract** (2 min)
   - Open Remix with our contract
   - Compile and deploy live
   - Show transaction on explorer

3. **Update Integration** (1 min)
   - Update contract address in config
   - Refresh homepage

4. **Test Live Integration** (1 min)
   - Generate artwork
   - Click "Verify with LazAI"
   - Show real blockchain transaction

## 🔧 Quick Setup Commands

### Add LazAI Testnet to MetaMask (JavaScript)
```javascript
// Run in browser console
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x20A86', // 133718 in hex
    chainName: 'LazAI Testnet',
    nativeCurrency: {
      name: 'LAZAI',
      symbol: 'LAZAI',
      decimals: 18
    },
    rpcUrls: ['https://testnet.lazai.network'],
    blockExplorerUrls: ['https://testnet-explorer.lazai.network']
  }]
});
```

### Test Network Connection
```bash
# Test RPC connectivity
curl -X POST https://testnet.lazai.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## ⚡ Quick Deploy for Judging

**If you want to deploy RIGHT NOW for demonstration:**

1. **Add LazAI Testnet to MetaMask** (30 seconds)
2. **Get some LAZAI tokens** (if faucet available)
3. **Open Remix + Deploy contract** (2 minutes)
4. **Update config with contract address** (30 seconds)
5. **Show live integration** (1 minute)

**Total: 4 minutes for live blockchain deployment demo!**

## 🏆 Advantages of Real Deployment

- ✅ **Real Blockchain**: Actual on-chain verification
- ✅ **Live Explorer**: Judges can verify transactions
- ✅ **Cryptographic Proof**: Immutable verification records
- ✅ **Production Ready**: Same process for mainnet
- ✅ **Impressive Demo**: Most teams won't have live contracts

---

**Ready to deploy? Choose your preferred method and let's get this on the blockchain! 🚀**
