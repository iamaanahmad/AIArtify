/**
 * Local NFT metadata storage to work around contract issues
 * BONUS TRACK: Enhanced with LazAI reasoning metadata
 */

export interface StoredNftMetadata {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  originalPrompt: string;
  refinedPrompt: string;
  reasoning: string;
  // BONUS TRACK: LazAI reasoning metadata
  lazaiReasoning?: string;
  lazaiModel?: string;
  lazaiConfidence?: string;
  lazaiTxHash?: string;
  txHash: string;
  mintedAt: number;
  walletAddress: string;
}

const STORAGE_KEY = 'aiartify_nfts';

export function storeNftMetadata(metadata: StoredNftMetadata): void {
  try {
    const stored = getStoredNfts();
    // Add new NFT, removing any existing one with same token ID
    const filtered = stored.filter(nft => nft.tokenId !== metadata.tokenId);
    filtered.push(metadata);
    
    // Keep only last 100 NFTs to avoid storage bloat
    const recent = filtered.slice(-100);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    console.log('✅ Stored NFT metadata locally:', metadata.tokenId);
  } catch (error) {
    console.error('Failed to store NFT metadata:', error);
  }
}

export function getStoredNfts(): StoredNftMetadata[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to retrieve stored NFTs:', error);
    return [];
  }
}

export function getNftsForWallet(walletAddress: string): StoredNftMetadata[] {
  const allNfts = getStoredNfts();
  return allNfts.filter(nft => 
    nft.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  ).sort((a, b) => b.mintedAt - a.mintedAt); // Most recent first
}

export function getNftByTokenId(tokenId: string): StoredNftMetadata | null {
  const allNfts = getStoredNfts();
  return allNfts.find(nft => nft.tokenId === tokenId) || null;
}
