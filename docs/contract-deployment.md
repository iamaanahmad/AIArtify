# Contract Deployment Guide

## The Problem
The current contract at `0x9d24b503f3abde31f6861d33e8e20f523f63c6eb` has no code deployed (returns `0x` bytecode), which is why NFT minting is failing with transaction reverts.

## Solution: Deploy New Contract

### Option 1: Using Remix (Recommended)
1. Go to https://remix.ethereum.org/
2. Create a new file called `SimpleNFT.sol`
3. Copy the contract code from `contracts/SimpleNFT.sol`
4. Compile the contract (Solidity 0.8.20+)
5. Deploy to Metis Hyperion Testnet:
   - Network: Metis Hyperion Testnet
   - RPC: https://andromeda.metis.io/
   - Chain ID: 588
   - Constructor parameter: Your wallet address (0xD1c17c98f84639e96A38d77496016E416077e1C7)

### Option 2: Using Hardhat (Advanced)
```bash
npm install --save-dev hardhat @openzeppelin/contracts
npx hardhat init
# Configure hardhat.config.js for Metis
npx hardhat compile
npx hardhat run scripts/deploy.js --network metis
```

## After Deployment
1. Copy the new contract address
2. Update `src/lib/web3/config.ts` with the new address
3. Test the contract using the debug endpoint

## Contract Features
- ✅ Public `mintNFT` function (anyone can mint)
- ✅ Owner-only `ownerMintNFT` function
- ✅ ERC721 compliant with metadata support
- ✅ OpenZeppelin battle-tested contracts

## Verification
After deployment, verify the contract has code:
```bash
curl -X POST https://andromeda.metis.io/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["YOUR_NEW_CONTRACT_ADDRESS","latest"],"id":1}'
```

The result should be a long hex string (not "0x").
