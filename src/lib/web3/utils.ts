import { ethers } from 'ethers';

export async function safeContractCall<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error: any) {
    // Handle specific ERC721 errors more gracefully
    if (error.code === 'CALL_EXCEPTION') {
      if (error.reason === 'ERC721: invalid token ID' || 
          error.reason === 'ERC721: owner query for nonexistent token' ||
          error.message?.includes('missing revert data')) {
        console.log('Token does not exist or was burned');
        return null;
      }
    }
    console.error('Contract call failed:', error);
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
