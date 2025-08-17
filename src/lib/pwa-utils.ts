// PWA utilities for client-side PWA functionality
// Handles offline detection, caching, and service worker communication

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// PWA Installation Manager
export class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installed = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Check if already installed
    this.installed = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true;

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('[PWA] Install prompt available');
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.installed = true;
      this.deferredPrompt = null;
      console.log('[PWA] App installed successfully');
      this.trackInstallation();
    });
  }

  // Check if PWA can be installed
  canInstall(): boolean {
    return !this.installed && this.deferredPrompt !== null;
  }

  // Check if PWA is already installed
  isInstalled(): boolean {
    return this.installed;
  }

  // Trigger install prompt
  async install(): Promise<{ outcome: 'accepted' | 'dismissed' } | null> {
    if (!this.deferredPrompt) {
      console.warn('[PWA] No install prompt available');
      return null;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      
      console.log('[PWA] Install choice:', choiceResult.outcome);
      return choiceResult;
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return null;
    }
  }

  // Track installation for analytics
  private trackInstallation() {
    // Send analytics event
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'PWA Installation'
      });
    }

    // Custom event for app
    window.dispatchEvent(new CustomEvent('pwa:installed'));
  }
}

// Offline Detection Manager
export class OfflineManager {
  private callbacks: Set<(online: boolean) => void> = new Set();
  private isOnline = true;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyCallbacks(true);
      console.log('[PWA] Back online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyCallbacks(false);
      console.log('[PWA] Gone offline');
    });
  }

  // Subscribe to online/offline changes
  subscribe(callback: (online: boolean) => void): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  // Get current online status
  getStatus(): boolean {
    return this.isOnline;
  }

  private notifyCallbacks(online: boolean) {
    this.callbacks.forEach(callback => {
      try {
        callback(online);
      } catch (error) {
        console.error('[PWA] Offline callback error:', error);
      }
    });
  }
}

// Cache Manager for NFT data
export class NFTCacheManager {
  private cache: Map<string, any> = new Map();
  
  // Cache NFT data for offline access
  async cacheNFT(nftData: any): Promise<void> {
    try {
      // Store in memory cache
      this.cache.set(nftData.tokenId, nftData);

      // Send to service worker for persistent caching
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_NFT',
          nft: nftData
        });
      }

      // Store in localStorage as backup
      const cacheKey = `nft_cache_${nftData.tokenId}`;
      localStorage.setItem(cacheKey, JSON.stringify(nftData));

      console.log('[PWA] Cached NFT:', nftData.tokenId);
    } catch (error) {
      console.error('[PWA] Failed to cache NFT:', error);
    }
  }

  // Get cached NFT data
  getCachedNFT(tokenId: string): any | null {
    // Try memory cache first
    if (this.cache.has(tokenId)) {
      return this.cache.get(tokenId);
    }

    // Fallback to localStorage
    try {
      const cacheKey = `nft_cache_${tokenId}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const nftData = JSON.parse(cachedData);
        this.cache.set(tokenId, nftData); // Add to memory cache
        return nftData;
      }
    } catch (error) {
      console.error('[PWA] Failed to get cached NFT:', error);
    }

    return null;
  }

  // Get all cached NFTs
  getAllCachedNFTs(): any[] {
    const allNFTs: any[] = [];
    
    // Get from memory cache
    this.cache.forEach(nft => allNFTs.push(nft));

    // Get from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('nft_cache_')) {
        try {
          const nftData = JSON.parse(localStorage.getItem(key) || '');
          if (!this.cache.has(nftData.tokenId)) {
            allNFTs.push(nftData);
          }
        } catch (error) {
          console.error('[PWA] Invalid cached NFT data:', key);
        }
      }
    }

    return allNFTs;
  }

  // Clear NFT cache
  clearCache(): void {
    this.cache.clear();
    
    // Clear localStorage cache
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('nft_cache_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('[PWA] NFT cache cleared');
  }
}

// Background Sync Manager
export class BackgroundSyncManager {
  private pendingActions: Array<{
    id: string;
    action: string;
    data: any;
    timestamp: number;
  }> = [];

  constructor() {
    this.loadPendingActions();
  }

  // Queue action for background sync
  queueAction(action: string, data: any): string {
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedAction = {
      id,
      action,
      data,
      timestamp: Date.now()
    };

    this.pendingActions.push(queuedAction);
    this.savePendingActions();

    console.log('[PWA] Queued action for background sync:', action);
    return id;
  }

  // Get pending actions
  getPendingActions(): Array<any> {
    return [...this.pendingActions];
  }

  // Remove completed action
  removeAction(id: string): void {
    this.pendingActions = this.pendingActions.filter(action => action.id !== id);
    this.savePendingActions();
  }

  // Process pending actions when online
  async processPendingActions(): Promise<void> {
    if (!navigator.onLine || this.pendingActions.length === 0) {
      return;
    }

    console.log('[PWA] Processing pending actions:', this.pendingActions.length);

    const actionsToProcess = [...this.pendingActions];
    
    for (const action of actionsToProcess) {
      try {
        await this.processAction(action);
        this.removeAction(action.id);
        console.log('[PWA] Processed action:', action.action);
      } catch (error) {
        console.error('[PWA] Failed to process action:', action.action, error);
        
        // Remove actions older than 24 hours
        if (Date.now() - action.timestamp > 24 * 60 * 60 * 1000) {
          this.removeAction(action.id);
          console.log('[PWA] Removed expired action:', action.action);
        }
      }
    }
  }

  private async processAction(action: any): Promise<void> {
    switch (action.action) {
      case 'mint_nft':
        await this.processMintNFT(action.data);
        break;
      case 'update_profile':
        await this.processUpdateProfile(action.data);
        break;
      case 'like_nft':
        await this.processLikeNFT(action.data);
        break;
      default:
        console.warn('[PWA] Unknown action type:', action.action);
    }
  }

  private async processMintNFT(data: any): Promise<void> {
    const response = await fetch('/api/mint-nft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Mint NFT failed: ${response.statusText}`);
    }
  }

  private async processUpdateProfile(data: any): Promise<void> {
    const response = await fetch('/api/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Update profile failed: ${response.statusText}`);
    }
  }

  private async processLikeNFT(data: any): Promise<void> {
    const response = await fetch('/api/like-nft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Like NFT failed: ${response.statusText}`);
    }
  }

  private loadPendingActions(): void {
    try {
      const stored = localStorage.getItem('pending_actions');
      if (stored) {
        this.pendingActions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[PWA] Failed to load pending actions:', error);
      this.pendingActions = [];
    }
  }

  private savePendingActions(): void {
    try {
      localStorage.setItem('pending_actions', JSON.stringify(this.pendingActions));
    } catch (error) {
      console.error('[PWA] Failed to save pending actions:', error);
    }
  }
}

// Main PWA utilities instance
export const pwaManager = new PWAManager();
export const offlineManager = new OfflineManager();
export const nftCacheManager = new NFTCacheManager();
export const backgroundSyncManager = new BackgroundSyncManager();

// Initialize background sync processing when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    backgroundSyncManager.processPendingActions();
  });

  // Process pending actions on page load if online
  if (navigator.onLine) {
    setTimeout(() => {
      backgroundSyncManager.processPendingActions();
    }, 1000);
  }
}

// Export utility functions
export const isPWAInstalled = () => pwaManager.isInstalled();
export const canInstallPWA = () => pwaManager.canInstall();
export const installPWA = () => pwaManager.install();
export const isOnline = () => offlineManager.getStatus();
export const subscribeToOnlineStatus = (callback: (online: boolean) => void) => 
  offlineManager.subscribe(callback);

console.log('[PWA] Utilities initialized successfully');
