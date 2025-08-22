/**
 * LazAI Testnet MetaMask Helper
 * 
 * Simple utility to add LazAI testnet to MetaMask for easy setup
 */

export const LAZAI_NETWORK_PARAMS = {
  chainId: '0x20A86', // 133718 in hex
  chainName: 'LazAI Testnet',
  nativeCurrency: {
    name: 'LAZAI',
    symbol: 'LAZAI',
    decimals: 18
  },
  rpcUrls: ['https://testnet.lazai.network'],
  blockExplorerUrls: ['https://testnet-explorer.lazai.network']
};

/**
 * Add LazAI testnet to MetaMask
 */
export async function addLazAITestnetToMetaMask(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.error('MetaMask not detected');
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [LAZAI_NETWORK_PARAMS]
    });
    
    console.log('✅ LazAI Testnet added to MetaMask');
    return true;
  } catch (error) {
    console.error('❌ Failed to add LazAI Testnet:', error);
    return false;
  }
}

/**
 * Switch to LazAI testnet
 */
export async function switchToLazAITestnet(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.error('MetaMask not detected');
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: LAZAI_NETWORK_PARAMS.chainId }]
    });
    
    console.log('✅ Switched to LazAI Testnet');
    return true;
  } catch (error: any) {
    // If network not added, try to add it
    if (error.code === 4902) {
      return await addLazAITestnetToMetaMask();
    }
    
    console.error('❌ Failed to switch to LazAI Testnet:', error);
    return false;
  }
}

/**
 * Check if currently on LazAI testnet
 */
export async function isOnLazAITestnet(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return chainId === LAZAI_NETWORK_PARAMS.chainId;
  } catch (error) {
    console.error('❌ Failed to check network:', error);
    return false;
  }
}

/**
 * One-click setup for LazAI testnet
 */
export async function setupLazAITestnet(): Promise<boolean> {
  try {
    // First try to switch
    const switched = await switchToLazAITestnet();
    if (switched) {
      return true;
    }
    
    // If switch failed, try to add
    const added = await addLazAITestnetToMetaMask();
    if (added) {
      // Try to switch again after adding
      return await switchToLazAITestnet();
    }
    
    return false;
  } catch (error) {
    console.error('❌ Failed to setup LazAI Testnet:', error);
    return false;
  }
}

// Browser console helper
if (typeof window !== 'undefined') {
  (window as any).setupLazAITestnet = setupLazAITestnet;
  console.log('🔧 LazAI Testnet Helper loaded. Run setupLazAITestnet() in console to add network.');
}
