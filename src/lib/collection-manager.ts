/**
 * Phase 4: Dynamic Art Collections System
 * Create and manage themed collections from multiple generations
 */

export interface ArtworkItem {
  id: string;
  imageUrl: string;
  prompt: string;
  title?: string;
  description?: string;
  qualityScore?: number;
  qualityLevel: 'standard' | 'high' | 'premium';
  mintTxHash?: string;
  tokenId?: string;
  createdAt: number;
  lazaiReasoning?: string;
  lazaiVerified?: boolean;
  lazaiScore?: number;
  enhancedPrompt?: string;
  consensusNodes?: number;
  socialShares: number;
  metadata?: any;
}

export interface ArtCollection {
  id: string;
  name: string;
  description: string;
  theme: string;
  artworks: ArtworkItem[];
  coverImageId?: string;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  tags: string[];
  rarityScore: number;
  totalValue: number;
  mintedCount: number;
  averageQuality: number;
  collectionMetadata?: {
    website?: string;
    discord?: string;
    twitter?: string;
    royalty?: number;
    creator: string;
  };
}

export interface CollectionTemplate {
  id: string;
  name: string;
  description: string;
  theme: string;
  suggestedPrompts: string[];
  qualityLevel: 'standard' | 'high' | 'premium';
  minArtworks: number;
  maxArtworks: number;
  tags: string[];
  rarityBonus: number;
}

// Predefined collection templates
export const collectionTemplates: CollectionTemplate[] = [
  {
    id: 'cyberpunk_series',
    name: 'Cyberpunk Chronicles',
    description: 'A futuristic collection exploring neon-lit dystopian worlds',
    theme: 'cyberpunk',
    suggestedPrompts: [
      'A cyberpunk cityscape with neon lights and flying cars',
      'A futuristic warrior with glowing cybernetic implants',
      'A dystopian marketplace in a cyber city',
      'A hacker in a neon-lit underground tunnel'
    ],
    qualityLevel: 'high',
    minArtworks: 3,
    maxArtworks: 8,
    tags: ['cyberpunk', 'futuristic', 'neon', 'dystopian'],
    rarityBonus: 1.2
  },
  {
    id: 'fantasy_realms',
    name: 'Mystical Realms',
    description: 'Enchanted worlds filled with magic and wonder',
    theme: 'fantasy',
    suggestedPrompts: [
      'A majestic dragon soaring over a crystal castle',
      'An ancient wizard casting spells in a magical forest',
      'A fairy village hidden in giant mushrooms',
      'A phoenix rising from ethereal flames'
    ],
    qualityLevel: 'premium',
    minArtworks: 4,
    maxArtworks: 10,
    tags: ['fantasy', 'magic', 'mystical', 'enchanted'],
    rarityBonus: 1.5
  },
  {
    id: 'abstract_emotions',
    name: 'Emotional Abstracts',
    description: 'Abstract art representing different human emotions',
    theme: 'abstract',
    suggestedPrompts: [
      'Abstract representation of joy with vibrant colors',
      'Melancholy expressed through flowing dark shapes',
      'Anger visualized as explosive geometric forms',
      'Love depicted in swirling pink and gold patterns'
    ],
    qualityLevel: 'high',
    minArtworks: 5,
    maxArtworks: 12,
    tags: ['abstract', 'emotions', 'expressive', 'colorful'],
    rarityBonus: 1.3
  },
  {
    id: 'nature_elements',
    name: 'Elements of Nature',
    description: 'The raw power and beauty of natural elements',
    theme: 'nature',
    suggestedPrompts: [
      'A powerful waterfall cascading down ancient rocks',
      'A volcano erupting with molten lava and ash',
      'A serene forest with sunbeams filtering through trees',
      'An ocean storm with massive waves and lightning'
    ],
    qualityLevel: 'standard',
    minArtworks: 4,
    maxArtworks: 8,
    tags: ['nature', 'elements', 'landscape', 'powerful'],
    rarityBonus: 1.1
  },
  {
    id: 'portrait_gallery',
    name: 'AI Portrait Gallery',
    description: 'Diverse collection of AI-generated portraits',
    theme: 'portraits',
    suggestedPrompts: [
      'A wise elderly person with kind eyes and weathered hands',
      'A young artist with paint-stained fingers and creative vision',
      'A mysterious figure in shadows with glowing eyes',
      'A confident leader with a determined expression'
    ],
    qualityLevel: 'premium',
    minArtworks: 6,
    maxArtworks: 15,
    tags: ['portraits', 'people', 'faces', 'character'],
    rarityBonus: 1.4
  }
];

class CollectionManager {
  private storageKey = 'aiartify_collections';
  private artworksKey = 'aiartify_artworks';

  private saveCollections(collections: ArtCollection[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(collections));
    } catch (error) {
      console.warn('Failed to save collections:', error);
    }
  }

  private loadCollections(): ArtCollection[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Failed to load collections:', error);
      return [];
    }
  }

  private saveArtworks(artworks: ArtworkItem[]) {
    try {
      localStorage.setItem(this.artworksKey, JSON.stringify(artworks));
    } catch (error) {
      console.warn('Failed to save artworks:', error);
    }
  }

  private loadArtworks(): ArtworkItem[] {
    try {
      const data = localStorage.getItem(this.artworksKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Failed to load artworks:', error);
      return [];
    }
  }

  // Add artwork to the global artwork library
  addArtwork(artwork: Omit<ArtworkItem, 'id' | 'createdAt' | 'socialShares'>): string {
    const artworks = this.loadArtworks();
    const newArtwork: ArtworkItem = {
      ...artwork,
      id: `artwork_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
      socialShares: 0
    };
    
    artworks.push(newArtwork);
    this.saveArtworks(artworks);
    return newArtwork.id;
  }

  // Update artwork (e.g., when minted or shared)
  updateArtwork(id: string, updates: Partial<ArtworkItem>) {
    const artworks = this.loadArtworks();
    const artwork = artworks.find(a => a.id === id);
    
    if (artwork) {
      Object.assign(artwork, updates);
      this.saveArtworks(artworks);
      
      // Update artwork in all collections that contain it
      const collections = this.loadCollections();
      let collectionsUpdated = false;
      
      collections.forEach(collection => {
        const collectionArtwork = collection.artworks.find(a => a.id === id);
        if (collectionArtwork) {
          Object.assign(collectionArtwork, updates);
          collectionsUpdated = true;
        }
      });
      
      if (collectionsUpdated) {
        collections.forEach(collection => {
          this.recalculateCollectionStats(collection);
        });
        this.saveCollections(collections);
      }
    }
  }

  // Create a new collection
  createCollection(template: CollectionTemplate, artworkIds: string[]): string {
    const collections = this.loadCollections();
    const artworks = this.loadArtworks();
    
    const selectedArtworks = artworks.filter(a => artworkIds.includes(a.id));
    
    const collection: ArtCollection = {
      id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: template.name,
      description: template.description,
      theme: template.theme,
      artworks: selectedArtworks,
      coverImageId: selectedArtworks[0]?.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: false,
      tags: template.tags,
      rarityScore: 0,
      totalValue: 0,
      mintedCount: 0,
      averageQuality: 0,
      collectionMetadata: {
        creator: 'AI Artist',
        royalty: 5
      }
    };
    
    this.recalculateCollectionStats(collection);
    
    collections.push(collection);
    this.saveCollections(collections);
    
    return collection.id;
  }

  // Create custom collection
  createCustomCollection(
    name: string,
    description: string,
    theme: string,
    artworkIds: string[],
    tags: string[] = []
  ): string {
    const collections = this.loadCollections();
    const artworks = this.loadArtworks();
    
    const selectedArtworks = artworks.filter(a => artworkIds.includes(a.id));
    
    const collection: ArtCollection = {
      id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      description,
      theme,
      artworks: selectedArtworks,
      coverImageId: selectedArtworks[0]?.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: false,
      tags,
      rarityScore: 0,
      totalValue: 0,
      mintedCount: 0,
      averageQuality: 0,
      collectionMetadata: {
        creator: 'AI Artist',
        royalty: 5
      }
    };
    
    this.recalculateCollectionStats(collection);
    
    collections.push(collection);
    this.saveCollections(collections);
    
    return collection.id;
  }

  // Add artwork to existing collection
  addToCollection(collectionId: string, artworkId: string) {
    const collections = this.loadCollections();
    const artworks = this.loadArtworks();
    
    const collection = collections.find(c => c.id === collectionId);
    const artwork = artworks.find(a => a.id === artworkId);
    
    if (collection && artwork && !collection.artworks.find(a => a.id === artworkId)) {
      collection.artworks.push(artwork);
      collection.updatedAt = Date.now();
      this.recalculateCollectionStats(collection);
      this.saveCollections(collections);
    }
  }

  // Remove artwork from collection
  removeFromCollection(collectionId: string, artworkId: string) {
    const collections = this.loadCollections();
    const collection = collections.find(c => c.id === collectionId);
    
    if (collection) {
      collection.artworks = collection.artworks.filter(a => a.id !== artworkId);
      collection.updatedAt = Date.now();
      
      // Update cover image if removed artwork was the cover
      if (collection.coverImageId === artworkId && collection.artworks.length > 0) {
        collection.coverImageId = collection.artworks[0].id;
      }
      
      this.recalculateCollectionStats(collection);
      this.saveCollections(collections);
    }
  }

  // Calculate collection statistics
  private recalculateCollectionStats(collection: ArtCollection) {
    const artworks = collection.artworks;
    
    // Average quality
    const totalQuality = artworks.reduce((sum, a) => sum + (a.qualityScore || 0), 0);
    collection.averageQuality = artworks.length > 0 ? totalQuality / artworks.length : 0;
    
    // Minted count
    collection.mintedCount = artworks.filter(a => a.mintTxHash).length;
    
    // Total value (based on quality and rarity)
    collection.totalValue = artworks.reduce((sum, a) => {
      const baseValue = (a.qualityScore || 0.5) * 100;
      const rarityMultiplier = a.qualityLevel === 'premium' ? 2 : a.qualityLevel === 'high' ? 1.5 : 1;
      const mintBonus = a.mintTxHash ? 1.2 : 1;
      return sum + (baseValue * rarityMultiplier * mintBonus);
    }, 0);
    
    // Rarity score (higher for consistent quality, premium generations, and thematic coherence)
    const qualityConsistency = this.calculateQualityConsistency(artworks);
    const premiumRatio = artworks.filter(a => a.qualityLevel === 'premium').length / artworks.length;
    const themeBonus = collection.theme ? 1.1 : 1;
    
    collection.rarityScore = (collection.averageQuality + qualityConsistency + premiumRatio) * themeBonus;
  }

  private calculateQualityConsistency(artworks: ArtworkItem[]): number {
    if (artworks.length < 2) return 0;
    
    const qualities = artworks.map(a => a.qualityScore || 0);
    const mean = qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
    const variance = qualities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / qualities.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency = higher score
    return Math.max(0, 1 - standardDeviation);
  }

  // Get all collections
  getCollections(): ArtCollection[] {
    return this.loadCollections();
  }

  // Get all artworks
  getArtworks(): ArtworkItem[] {
    return this.loadArtworks();
  }

  // Get collection by ID
  getCollection(id: string): ArtCollection | null {
    const collections = this.loadCollections();
    return collections.find(c => c.id === id) || null;
  }

  // Get artworks not in any collection
  getUnassignedArtworks(): ArtworkItem[] {
    const collections = this.loadCollections();
    const artworks = this.loadArtworks();
    
    const assignedIds = new Set();
    collections.forEach(collection => {
      collection.artworks.forEach(artwork => {
        assignedIds.add(artwork.id);
      });
    });
    
    return artworks.filter(artwork => !assignedIds.has(artwork.id));
  }

  // Get suggested collections based on existing artworks
  getSuggestedCollections(): Array<{ template: CollectionTemplate; matchingArtworks: ArtworkItem[] }> {
    const artworks = this.loadArtworks();
    const suggestions: Array<{ template: CollectionTemplate; matchingArtworks: ArtworkItem[] }> = [];
    
    collectionTemplates.forEach(template => {
      const matchingArtworks = artworks.filter(artwork => {
        // Check if artwork matches template theme
        return template.tags.some(tag => 
          artwork.prompt.toLowerCase().includes(tag.toLowerCase()) ||
          artwork.description?.toLowerCase().includes(tag.toLowerCase())
        );
      });
      
      if (matchingArtworks.length >= template.minArtworks) {
        suggestions.push({ template, matchingArtworks });
      }
    });
    
    return suggestions.sort((a, b) => b.matchingArtworks.length - a.matchingArtworks.length);
  }

  // Update collection metadata
  updateCollection(
    id: string, 
    updates: Partial<Pick<ArtCollection, 'name' | 'description' | 'isPublic' | 'tags' | 'collectionMetadata'>>
  ) {
    const collections = this.loadCollections();
    const collection = collections.find(c => c.id === id);
    
    if (collection) {
      Object.assign(collection, updates);
      collection.updatedAt = Date.now();
      this.saveCollections(collections);
    }
  }

  // Delete collection
  deleteCollection(id: string) {
    const collections = this.loadCollections();
    const filteredCollections = collections.filter(c => c.id !== id);
    this.saveCollections(filteredCollections);
  }

  // Export collection metadata for batch minting
  exportCollectionForMinting(id: string) {
    const collection = this.getCollection(id);
    if (!collection) return null;
    
    return {
      collection: {
        name: collection.name,
        description: collection.description,
        image: collection.coverImageId ? 
          collection.artworks.find(a => a.id === collection.coverImageId)?.imageUrl : 
          collection.artworks[0]?.imageUrl,
        external_url: `${window.location.origin}/collection/${id}`,
        attributes: [
          { trait_type: "Theme", value: collection.theme },
          { trait_type: "Artwork Count", value: collection.artworks.length.toString() },
          { trait_type: "Average Quality", value: `${(collection.averageQuality * 100).toFixed(1)}%` },
          { trait_type: "Rarity Score", value: collection.rarityScore.toFixed(2) },
          { trait_type: "Minted Count", value: collection.mintedCount.toString() },
          ...collection.tags.map(tag => ({ trait_type: "Tag", value: tag }))
        ]
      },
      artworks: collection.artworks.map((artwork, index) => ({
        name: `${collection.name} #${index + 1}`,
        description: artwork.description || `Part ${index + 1} of the ${collection.name} collection. ${artwork.prompt}`,
        image: artwork.imageUrl,
        attributes: [
          { trait_type: "Collection", value: collection.name },
          { trait_type: "Position", value: (index + 1).toString() },
          { trait_type: "Quality Score", value: `${((artwork.qualityScore || 0) * 100).toFixed(1)}%` },
          { trait_type: "Quality Level", value: artwork.qualityLevel },
          { trait_type: "Original Prompt", value: artwork.prompt },
          ...(artwork.enhancedPrompt ? [{ trait_type: "Enhanced Prompt", value: artwork.enhancedPrompt }] : []),
          ...(artwork.lazaiReasoning ? [{ trait_type: "LazAI Reasoning", value: artwork.lazaiReasoning }] : []),
          ...(artwork.consensusNodes ? [{ trait_type: "Consensus Nodes", value: artwork.consensusNodes.toString() }] : [])
        ]
      }))
    };
  }
}

// Create singleton instance
export const collectionManager = new CollectionManager();

// Helper hooks
export function useCollections() {
  return {
    addArtwork: collectionManager.addArtwork.bind(collectionManager),
    updateArtwork: collectionManager.updateArtwork.bind(collectionManager),
    createCollection: collectionManager.createCollection.bind(collectionManager),
    createCustomCollection: collectionManager.createCustomCollection.bind(collectionManager),
    addToCollection: collectionManager.addToCollection.bind(collectionManager),
    removeFromCollection: collectionManager.removeFromCollection.bind(collectionManager),
    getCollections: collectionManager.getCollections.bind(collectionManager),
    getArtworks: collectionManager.getArtworks.bind(collectionManager),
    getCollection: collectionManager.getCollection.bind(collectionManager),
    getUnassignedArtworks: collectionManager.getUnassignedArtworks.bind(collectionManager),
    getSuggestedCollections: collectionManager.getSuggestedCollections.bind(collectionManager),
    updateCollection: collectionManager.updateCollection.bind(collectionManager),
    deleteCollection: collectionManager.deleteCollection.bind(collectionManager),
    exportCollectionForMinting: collectionManager.exportCollectionForMinting.bind(collectionManager)
  };
}
