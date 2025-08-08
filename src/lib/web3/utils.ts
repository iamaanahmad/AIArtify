import { ethers } from 'ethers';

export async function safeContractCall<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    const result = await fn();
    return result;
  } catch (error: any) {
    // Only log detailed errors in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Contract call failed (expected for some contracts):', {
        code: error.code,
        message: error.message?.substring(0, 100) + '...',
        isCallException: error.code === 'CALL_EXCEPTION'
      });
    }
    
    // Handle specific ERC721 errors more gracefully
    if (error.code === 'CALL_EXCEPTION') {
      if (error.reason === 'ERC721: invalid token ID' || 
          error.reason === 'ERC721: owner query for nonexistent token' ||
          error.reason?.includes('ERC721NonexistentToken') ||
          error.message?.includes('missing revert data')) {
        // These are expected failures for non-existent tokens or contract issues
        return null;
      }
    }
    
    // Handle network issues
    if (error.code === 'NETWORK_ERROR' || error.code === 'SERVER_ERROR') {
      console.log('Network error detected, using fallback...');
      return null;
    }
    
    // For any other errors, silently return null (fallback systems will handle it)
    return null;
  }
}

export const getRpcProvider = () => {
  // Create a completely isolated provider that won't be affected by wallet network changes
  return new ethers.JsonRpcProvider("https://hyperion-testnet.metisdevops.link", {
    name: "Metis Hyperion Testnet",
    chainId: 133717
  });
};

/**
 * Check if a token exists on the blockchain
 */
export async function tokenExists(contract: ethers.Contract, tokenId: number | bigint): Promise<boolean> {
  try {
    const owner = await safeContractCall(() => contract.ownerOf(tokenId));
    return owner !== null && owner !== ethers.ZeroAddress;
  } catch (error) {
    return false;
  }
}

/**
 * Get token metadata with enhanced error handling and fallbacks
 */
export async function getTokenMetadata(contract: ethers.Contract, tokenId: number | bigint): Promise<string | null> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Getting metadata for token ${tokenId}`);
  }
  
  // First check if token exists
  const exists = await tokenExists(contract, tokenId);
  if (!exists) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`❌ Token ${tokenId} does not exist on blockchain`);
    }
    return null;
  }
  
  // Try different approaches to get tokenURI
  const approaches = [
    // Standard approach
    () => contract.tokenURI(tokenId),
    // With explicit BigInt conversion
    () => contract.tokenURI(BigInt(tokenId.toString())),
    // With static call
    () => contract.tokenURI.staticCall(tokenId),
    // With static call and BigInt
    () => contract.tokenURI.staticCall(BigInt(tokenId.toString())),
  ];
  
  for (let i = 0; i < approaches.length; i++) {
    try {
      const result = await safeContractCall(approaches[i]);
      if (result) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Success with approach ${i + 1}: ${result.substring(0, 50)}...`);
        }
        return result;
      }
    } catch (error) {
      // Silently continue to next approach
      continue;
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`❌ All approaches failed for token ${tokenId} - using fallback systems`);
  }
  return null;
}

// Query events in chunks to avoid "max block range" errors
export async function queryEventsInChunks(
  contract: ethers.Contract,
  filter: ethers.DeferredTopicFilter,
  maxBlockRange: number = 50000
): Promise<ethers.Log[]> {
  const provider = contract.runner?.provider;
  if (!provider) throw new Error('No provider available');

  const currentBlock = await provider.getBlockNumber();
  const allEvents: ethers.Log[] = [];
  
  // Start from a reasonable block number (not from 0 to avoid querying too much history)
  // Let's start from 30 days ago assuming ~2 second block time
  const blocksPerDay = (24 * 60 * 60) / 2; // ~43,200 blocks per day
  const startBlock = Math.max(0, currentBlock - (blocksPerDay * 30)); // 30 days ago
  
  console.log(`Querying events from block ${startBlock} to ${currentBlock} (${currentBlock - startBlock} blocks)`);
  
  for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += maxBlockRange) {
    const toBlock = Math.min(fromBlock + maxBlockRange - 1, currentBlock);
    
    console.log(`Querying chunk: blocks ${fromBlock} to ${toBlock}`);
    
    try {
      const events = await contract.queryFilter(filter, fromBlock, toBlock);
      allEvents.push(...events);
      console.log(`Found ${events.length} events in chunk`);
    } catch (error) {
      console.error(`Error querying blocks ${fromBlock} to ${toBlock}:`, error);
      // Continue with next chunk even if this one fails
    }
  }
  
  console.log(`Total events found: ${allEvents.length}`);
  return allEvents;
}
