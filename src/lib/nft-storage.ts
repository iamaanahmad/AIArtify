/**
 * Local NFT metadata storage to work around contract issues
 * BONUS TRACK: Enhanced with LazAI reasoning metadata
 * PRODUCTION FIX: Enhanced with storage monitoring and backup systems
 */

import { storageMonitor } from './storage-monitor';

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
    // PRODUCTION FIX: Create emergency backup before storage operations
    storageMonitor.createEmergencyBackup(metadata.walletAddress);
    
    const stored = getStoredNfts();
    // Remove any existing NFT with same token ID OR same transaction hash (to handle updates)
    const filtered = stored.filter(nft => 
      nft.tokenId !== metadata.tokenId && 
      nft.txHash !== metadata.txHash
    );
    filtered.push(metadata);
    
    // PRODUCTION FIX: NEVER delete user's own NFTs - only manage "other users" NFTs
    const userNfts = filtered.filter(nft => 
      nft.walletAddress.toLowerCase() === metadata.walletAddress.toLowerCase()
    );
    const otherNfts = filtered.filter(nft => 
      nft.walletAddress.toLowerCase() !== metadata.walletAddress.toLowerCase()
    );
    
    // Check storage usage before proceeding
    const usage = storageMonitor.getCurrentUsage();
    
    // CRITICAL: Keep ALL user NFTs (never delete user's own artworks)
    // Only limit other users' NFTs to prevent storage bloat
    let recentOtherNfts = otherNfts.sort((a, b) => b.mintedAt - a.mintedAt);
    
    if (usage.isNearLimit) {
      // More aggressive cleanup when near limit
      recentOtherNfts = recentOtherNfts.slice(0, 50);
      console.warn('⚠️ Storage near limit, reduced other NFTs to 50');
    } else {
      recentOtherNfts = recentOtherNfts.slice(0, 200);
    }
    
    const allNfts = [...userNfts, ...recentOtherNfts].sort((a, b) => b.mintedAt - a.mintedAt);
    
    // Add storage quota protection
    const jsonString = JSON.stringify(allNfts);
    const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
    
    if (sizeInMB > 4) { // If approaching 5MB limit
      console.warn('⚠️ Storage approaching quota limit, creating additional backup');
      // Create backup in separate key
      const backupData = { 
        timestamp: Date.now(), 
        userNfts: userNfts,
        walletAddress: metadata.walletAddress 
      };
      localStorage.setItem(`${STORAGE_KEY}_backup_${metadata.walletAddress.slice(-6)}`, JSON.stringify(backupData));
      
      // Reduce other NFTs further
      const minimalOtherNfts = recentOtherNfts.slice(0, 30);
      const reducedNfts = [...userNfts, ...minimalOtherNfts].sort((a, b) => b.mintedAt - a.mintedAt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedNfts));
    } else {
      localStorage.setItem(STORAGE_KEY, jsonString);
    }
    
    console.log('✅ Stored NFT metadata locally:', metadata.tokenId, 
                `(Total: ${allNfts.length}, User: ${userNfts.length}, Size: ${sizeInMB.toFixed(2)}MB)`);
  } catch (error) {
    console.error('Failed to store NFT metadata:', error);
    
    // Emergency fallback: try to store just this user's NFTs
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        console.log('💾 Storage quota exceeded, creating user-only backup');
        const userOnlyData = { 
          timestamp: Date.now(), 
          nfts: [metadata],
          walletAddress: metadata.walletAddress 
        };
        localStorage.setItem(`${STORAGE_KEY}_emergency_${metadata.walletAddress.slice(-6)}`, JSON.stringify(userOnlyData));
      } catch (backupError) {
        console.error('Emergency backup also failed:', backupError);
      }
    }
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
  const userNfts = allNfts.filter(nft => 
    nft.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  ).sort((a, b) => b.mintedAt - a.mintedAt); // Most recent first
  
  // PRODUCTION FIX: Check for backup data if user has few NFTs
  if (userNfts.length < 5) {
    const backupNfts = recoverFromBackup(walletAddress);
    if (backupNfts.length > userNfts.length) {
      console.log(`🔄 Recovered ${backupNfts.length} NFTs from backup for wallet ${walletAddress}`);
      return backupNfts;
    }
  }
  
  return userNfts;
}

// PRODUCTION FIX: New backup recovery function
function recoverFromBackup(walletAddress: string): StoredNftMetadata[] {
  try {
    const shortAddress = walletAddress.slice(-6);
    
    // Check regular backup
    const backupKey = `${STORAGE_KEY}_backup_${shortAddress}`;
    const backupData = localStorage.getItem(backupKey);
    if (backupData) {
      const backup = JSON.parse(backupData);
      if (backup.userNfts && Array.isArray(backup.userNfts)) {
        console.log('✅ Found backup data with', backup.userNfts.length, 'NFTs');
        return backup.userNfts;
      }
    }
    
    // Check emergency backup
    const emergencyKey = `${STORAGE_KEY}_emergency_${shortAddress}`;
    const emergencyData = localStorage.getItem(emergencyKey);
    if (emergencyData) {
      const emergency = JSON.parse(emergencyData);
      if (emergency.nfts && Array.isArray(emergency.nfts)) {
        console.log('✅ Found emergency backup data with', emergency.nfts.length, 'NFTs');
        return emergency.nfts;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Failed to recover from backup:', error);
    return [];
  }
}

export function getNftByTokenId(tokenId: string): StoredNftMetadata | null {
  const allNfts = getStoredNfts();
  return allNfts.find(nft => nft.tokenId === tokenId) || null;
}

export function getNftByTxHash(txHash: string): StoredNftMetadata | null {
  const allNfts = getStoredNfts();
  return allNfts.find(nft => nft.txHash === txHash) || null;
}

// PRODUCTION FIX: Recovery function for lost NFT data
export function recoverLostNfts(walletAddress: string): void {
  try {
    console.log('🔄 Attempting to recover lost NFTs for wallet:', walletAddress);
    
    // Get current stored NFTs for this wallet
    const currentUserNfts = getNftsForWallet(walletAddress);
    console.log('Current stored NFTs:', currentUserNfts.length);
    
    // If user has fewer than expected NFTs, try recovery from blockchain
    if (currentUserNfts.length < 10) { // Arbitrary threshold for recovery
      console.log('⚠️ Low NFT count detected, blockchain recovery may be needed');
      console.log('💡 Tip: Refresh the collection page to trigger blockchain recovery');
      
      // PRODUCTION FIX: Try storage monitor backup recovery
      const restored = storageMonitor.restoreFromBackup(walletAddress);
      if (restored) {
        console.log('✅ Successfully restored from storage monitor backup');
      }
    }
    
    // Store recovery timestamp to avoid frequent attempts
    const recoveryKey = `nft_recovery_${walletAddress.toLowerCase()}`;
    const lastRecovery = localStorage.getItem(recoveryKey);
    const now = Date.now();
    
    if (!lastRecovery || now - parseInt(lastRecovery) > 300000) { // 5 minutes cooldown
      localStorage.setItem(recoveryKey, now.toString());
      console.log('✅ Recovery cooldown reset for wallet');
    }
    
  } catch (error) {
    console.error('Recovery attempt failed:', error);
  }
}

// PRODUCTION FIX: Get NFT count for debugging
export function getNftCount(): { total: number; byWallet: Record<string, number> } {
  const allNfts = getStoredNfts();
  const byWallet: Record<string, number> = {};
  
  allNfts.forEach(nft => {
    const wallet = nft.walletAddress.toLowerCase();
    byWallet[wallet] = (byWallet[wallet] || 0) + 1;
  });
  
  return {
    total: allNfts.length,
    byWallet
  };
}
