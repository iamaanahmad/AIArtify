/**
 * LazAI Testnet Configuration for Production Integration
 * 
 * This implements real LazAI testnet connectivity for the bonus track.
 * We're deploying verification contracts and anchoring data on LazAI blockchain.
 */

export const LAZAI_TESTNET_CONFIG = {
  // LazAI Testnet Network Configuration (OFFICIAL ENDPOINTS)
  network: {
    chainId: 133718,
    name: 'LazAI Testnet',
    rpcUrl: 'https://testnet.lazai.network',
    explorerUrl: 'https://testnet-explorer.lazai.network',
    currency: {
      name: 'LAZAI',
      symbol: 'LAZAI',
      decimals: 18
    }
  },
  
  // Contract addresses for LazAI integration (DEPLOYED!)
  contracts: {
    // Data Registry for storing reasoning results
    dataRegistry: '0x4f51850b73db416efe093730836dedefb9f5a3f6', // LIVE CONTRACT!
    
    // Verification contract for AI consensus proof
    verificationContract: '0x4f51850b73db416efe093730836dedefb9f5a3f6', // DEPLOYED ON LAZAI TESTNET
    
    // Settlement contract for cryptographic proofs
    settlementContract: '0x4f51850b73db416efe093730836dedefb9f5a3f6' // Same contract handles all functions
  },
  
  // LazAI API endpoints
  api: {
    baseUrl: 'https://api.lazai.com/v1',
    reasoning: '/reasoning/analyze',
    verification: '/verification/submit',
    consensus: '/consensus/validate'
  },
  
  // Gas settings for LazAI testnet
  gas: {
    limit: 300000,
    price: '20000000000' // 20 gwei
  }
} as const;

/**
 * Helper function to get LazAI testnet provider
 */
export function getLazAIProvider() {
  if (typeof window !== 'undefined') {
    // Browser environment - use MetaMask or injected provider
    return window.ethereum;
  } else {
    // Server environment - use JSON-RPC provider
    const { JsonRpcProvider } = require('ethers');
    return new JsonRpcProvider(LAZAI_TESTNET_CONFIG.network.rpcUrl);
  }
}

/**
 * Add LazAI testnet to MetaMask
 */
export async function addLazAITestnetToMetaMask() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not available');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${LAZAI_TESTNET_CONFIG.network.chainId.toString(16)}`,
        chainName: LAZAI_TESTNET_CONFIG.network.name,
        nativeCurrency: LAZAI_TESTNET_CONFIG.network.currency,
        rpcUrls: [LAZAI_TESTNET_CONFIG.network.rpcUrl],
        blockExplorerUrls: [LAZAI_TESTNET_CONFIG.network.explorerUrl]
      }]
    });
    
    return true;
  } catch (error) {
    console.error('Failed to add LazAI testnet to MetaMask:', error);
    return false;
  }
}

/**
 * Switch to LazAI testnet in MetaMask
 */
export async function switchToLazAITestnet() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not available');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${LAZAI_TESTNET_CONFIG.network.chainId.toString(16)}` }],
    });
    
    return true;
  } catch (error: any) {
    // Chain not added to MetaMask, try to add it
    if (error.code === 4902) {
      return await addLazAITestnetToMetaMask();
    }
    
    console.error('Failed to switch to LazAI testnet:', error);
    return false;
  }
}

/**
 * Check if we're currently on LazAI testnet
 */
export async function isOnLazAITestnet(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainId, 16);
    return currentChainId === LAZAI_TESTNET_CONFIG.network.chainId;
  } catch (error) {
    console.error('Failed to check current network:', error);
    return false;
  }
}
