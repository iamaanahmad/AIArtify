
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/use-wallet";
import { contractConfig } from "@/lib/web3/config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet, Grid, List, Filter, Plus, BarChart3, Share2, ExternalLink } from "lucide-react";
import { getRpcProvider, safeContractCall, queryEventsInChunks, tokenExists, getTokenMetadata } from "@/lib/web3/utils";
import { getNftsForWallet, getNftByTokenId, storeNftMetadata, recoverLostNfts, getNftCount } from "@/lib/nft-storage";
import { recoverNftMetadataFromTx } from "@/lib/metadata-recovery";
import { useCollections, collectionTemplates } from "@/lib/collection-manager";
import { type ArtworkItem, type ArtCollection } from "@/lib/collection-manager";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import ConsensusBreakdown from "@/components/consensus-breakdown";
import LazAIVerification from "@/components/lazai-verification";
import CollectionSocialShare from "@/components/collection-social-share";
import NFTRecoveryTool from "@/components/nft-recovery-tool";
import { useToast } from "@/hooks/use-toast";

// PRODUCTION FIX: Helper function for token ID range scanning
async function performTokenIdRangeScan(contract: any, address: string, existingNfts: NftData[], blockchainNfts: NftData[]): Promise<void> {
  console.log('🔍 Starting extended token ID range scan for 100+ NFTs...');
  
  // Try checking token IDs 1-300 for ownership (increased from 100)
  for (let tokenId = 1; tokenId <= 300; tokenId++) {
    try {
      // Check if this token exists and who owns it
      const owner = await safeContractCall(() => contract.ownerOf(tokenId));
      
      if (owner && typeof owner === 'string' && owner.toLowerCase() === address.toLowerCase()) {
        // Check if we already have this NFT
        const alreadyExists = existingNfts.some(nft => nft.id === tokenId.toString());
        
        if (!alreadyExists) {
          console.log(`✅ Found owned token ID ${tokenId} via range scan`);
          
          // Try to get metadata
          const tokenURI = await safeContractCall(() => contract.tokenURI(tokenId));
          let metadata: any = null;
          
          if (tokenURI && typeof tokenURI === 'string' && tokenURI.startsWith('data:application/json;base64,')) {
            try {
              const base64String = tokenURI.split(',')[1];
              const jsonString = Buffer.from(base64String, 'base64').toString('utf8');
              metadata = JSON.parse(jsonString);
            } catch (parseError) {
              // Use fallback metadata
            }
          }
          
          const nftData = {
            id: tokenId.toString(),
            title: metadata?.name || `NFT #${tokenId}`,
            prompt: metadata?.attributes?.find((attr: any) => attr.trait_type === "Refined Prompt")?.value || 
                   metadata?.attributes?.find((attr: any) => attr.trait_type === "Original Prompt")?.value || 
                   "Range scan discovered NFT",
            imageUrl: metadata?.image || '/placeholder-nft.svg',
            txHash: 'Range Scan Discovery',
          };
          
          blockchainNfts.push(nftData);
        }
      }
    } catch (error) {
      // Token doesn't exist or other error - continue
      if (tokenId % 50 === 0) {
        console.log(`Range scan progress: checked up to token ${tokenId}/300`);
      }
    }
    
    // Small delay every 10 tokens to avoid rate limiting
    if (tokenId % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

// PRODUCTION FIX: Comprehensive ownership scan
async function performComprehensiveOwnershipScan(contract: any, address: string): Promise<NftData[]> {
  console.log('🔍 Starting comprehensive ownership scan...');
  const foundNfts: NftData[] = [];
  
  try {
    // Get total supply if possible
    let totalSupply = 0;
    try {
      const supplyResult = await safeContractCall(() => contract.totalSupply());
      totalSupply = supplyResult ? parseInt(supplyResult.toString()) : 500; // Increased default from 200 to 500
      console.log('Total supply detected:', totalSupply);
    } catch (error) {
      // If totalSupply doesn't exist, try up to 500 tokens (increased from 200)
      totalSupply = 500;
      console.log('No totalSupply method, checking first 500 tokens');
    }
    
    // Limit scan to reasonable range but allow for 100+ NFTs
    const maxToCheck = Math.min(totalSupply, 500); // Increased from 200 to 500
    
    for (let tokenId = 1; tokenId <= maxToCheck; tokenId++) {
      try {
        const owner = await safeContractCall(() => contract.ownerOf(tokenId));
        
        if (owner && typeof owner === 'string' && owner.toLowerCase() === address.toLowerCase()) {
          console.log(`✅ Comprehensive scan found owned token ${tokenId}`);
          
          // Get metadata
          let metadata: any = null;
          try {
            const tokenURI = await safeContractCall(() => contract.tokenURI(tokenId));
            if (tokenURI && typeof tokenURI === 'string' && tokenURI.startsWith('data:application/json;base64,')) {
              const base64String = tokenURI.split(',')[1];
              const jsonString = Buffer.from(base64String, 'base64').toString('utf8');
              metadata = JSON.parse(jsonString);
            }
          } catch (metadataError) {
            // Continue without metadata
          }
          
          const nftData = {
            id: tokenId.toString(),
            title: metadata?.name || `NFT #${tokenId}`,
            prompt: metadata?.attributes?.find((attr: any) => attr.trait_type === "Refined Prompt")?.value || 
                   metadata?.attributes?.find((attr: any) => attr.trait_type === "Original Prompt")?.value || 
                   "Comprehensive scan discovery",
            imageUrl: metadata?.image || '/placeholder-nft.svg',
            txHash: 'Comprehensive Scan',
          };
          
          foundNfts.push(nftData);
        }
      } catch (error) {
        // Token doesn't exist or other error - continue
      }
      
      // Progress logging and rate limiting
      if (tokenId % 25 === 0) {
        console.log(`Comprehensive scan progress: ${tokenId}/${maxToCheck}`);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
  } catch (error) {
    console.error('Comprehensive scan error:', error);
  }
  
  return foundNfts;
}

interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
}

interface NftData {
  id: string;
  prompt: string;
  title: string;
  imageUrl: string;
  txHash?: string; // We may not have this from events alone
}

export default function CollectionPage() {
  return (
    <Suspense fallback={<CollectionPageSkeleton />}>
      <CollectionPageContent />
    </Suspense>
  );
}

function CollectionPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
          <div className="h-4 w-96 bg-muted animate-pulse rounded mt-2"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded"></div>
        ))}
      </div>
    </div>
  );
}

function CollectionPageContent() {
  const { walletAddress, connectWallet, isCorrectNetwork, switchToMetisNetwork } = useWallet();
  const searchParams = useSearchParams();
  const ownerParam = searchParams.get('owner');
  const isViewingOtherUser = ownerParam && ownerParam.toLowerCase() !== walletAddress?.toLowerCase();
  const displayAddress = isViewingOtherUser ? ownerParam : walletAddress;
  
  const [nfts, setNfts] = useState<NftData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Phase 4: Collection Management State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentView, setCurrentView] = useState<'nfts' | 'collections' | 'analytics'>('nfts');
  const [collections, setCollections] = useState<ArtCollection[]>([]);
  const [unassignedArtworks, setUnassignedArtworks] = useState<ArtworkItem[]>([]);
  const [selectedArtworks, setSelectedArtworks] = useState<Set<string>>(new Set());
  
  const { 
    getCollections, 
    getArtworks, 
    getUnassignedArtworks,
    getSuggestedCollections,
    createCollection,
    createCustomCollection 
  } = useCollections();

  const fetchNfts = useCallback(async (address: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Fetching NFTs for:', address);
    }
    
    // PRODUCTION DEBUG: Show current storage state
    const storageStats = getNftCount();
    console.log('🔍 Current storage state:', storageStats);
    
    // PRODUCTION FIX: Trigger recovery for low NFT counts
    recoverLostNfts(address);
    
    setIsLoading(true);
    setError(null);
    try {
      // Phase 1: Check local storage first (fastest)
      console.log('=== STEP 1: Loading from local storage ===');
      const localNfts = getNftsForWallet(address);
      console.log('Found', localNfts.length, 'locally stored NFTs for wallet');
      
      // PRODUCTION ALERT: Show warning if NFT count seems low for users with 100+ NFTs
      if (localNfts.length > 0 && localNfts.length < 50) { // Increased threshold from 5 to 50
        console.warn('⚠️ LOW NFT COUNT DETECTED - User may have lost NFTs due to storage cleanup');
        toast({
          title: "⚠️ Checking for Missing Artworks",
          description: `Found ${localNfts.length} NFTs locally. Scanning blockchain for comprehensive recovery...`,
          variant: "default",
          duration: 8000
        });
      } else if (localNfts.length === 0) {
        console.warn('⚠️ NO LOCAL NFTs FOUND - Starting full blockchain recovery');
        toast({
          title: "🔍 Comprehensive Blockchain Scan",
          description: "No local NFTs found. Performing comprehensive blockchain scan for 100+ NFTs...",
          variant: "default",
          duration: 10000
        });
      } else if (localNfts.length >= 50) {
        console.log(`✅ Good local NFT count: ${localNfts.length} found`);
      }
      
      let localNftData: NftData[] = [];
      
      if (localNfts.length > 0) {
        // Display local NFTs immediately for better UX
        localNftData = localNfts.map(localNft => ({
          id: localNft.tokenId,
          title: localNft.name,
          prompt: localNft.refinedPrompt || localNft.originalPrompt,
          imageUrl: localNft.image,
          txHash: localNft.txHash,
        }));
        setNfts(localNftData);
      }

      // Phase 2: Verify ownership on blockchain
      console.log('=== STEP 2: Blockchain verification ===');
      
      // Create a completely fresh provider for each call to avoid network conflicts
      const provider = new ethers.JsonRpcProvider("https://hyperion-testnet.metisdevops.link", {
        name: "Metis Hyperion Testnet",
        chainId: 133717
      });
      
      // Verify we're connected to the right network
      const network = await provider.getNetwork();
      console.log('Provider network:', network.chainId.toString());
      
      if (network.chainId !== BigInt(133717)) {
        throw new Error(`Wrong network: expected 133717, got ${network.chainId}`);
      }
      
      const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);

      // Basic contract existence check
      const code = await provider.getCode(contractConfig.address);
      if (code === '0x') {
        throw new Error('Contract does not exist at this address');
      }

      // Get current block to limit search range
      const currentBlock = await provider.getBlockNumber();
      console.log('Current block:', currentBlock);
      
      // PRODUCTION FIX: Extended blockchain scanning with chunked queries for 100+ NFTs
      const fromBlock = Math.max(0, currentBlock - 1000000); // Increased to 1M blocks (covers ~2+ months)
      console.log(`Querying Transfer events from block ${fromBlock} to ${currentBlock}`);
      
      // PRODUCTION FIX: Use chunked queries to avoid RPC limits
      const chunkSize = 25000; // Reduced chunk size for more thorough scanning
      const mintEvents: any[] = [];
      
      for (let startBlock = fromBlock; startBlock < currentBlock; startBlock += chunkSize) {
        const endBlock = Math.min(startBlock + chunkSize - 1, currentBlock);
        console.log(`Scanning chunk: blocks ${startBlock} to ${endBlock}`);
        
        try {
          const mintToUserFilter = contract.filters.Transfer(ethers.ZeroAddress, address, null);
          const chunkEvents = await safeContractCall(() => 
            contract.queryFilter(mintToUserFilter, startBlock, endBlock)
          );
          
          if (chunkEvents && chunkEvents.length > 0) {
            mintEvents.push(...chunkEvents);
            console.log(`Found ${chunkEvents.length} mint events in chunk ${startBlock}-${endBlock}`);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (chunkError) {
          console.warn(`Failed to scan chunk ${startBlock}-${endBlock}:`, chunkError);
          // Continue with other chunks
        }
      }
      
      console.log('Total mint events to user found:', mintEvents.length);

      if (mintEvents && mintEvents.length > 0) {
        console.log('=== STEP 3: Processing blockchain NFTs ===');
        
        const blockchainNfts: NftData[] = [];
        
        // Process each mint event
        for (const event of mintEvents) {
          try {
            const eventLog = event as ethers.EventLog;
            if (!eventLog.args) continue;

            const tokenId = eventLog.args[2];
            if (!tokenId) continue;

            // Verify current ownership
            const currentOwner = await safeContractCall(() => contract.ownerOf(tokenId));
            
            if (!currentOwner || currentOwner.toLowerCase() !== address.toLowerCase()) {
              console.log(`Token ${tokenId} no longer owned by user`);
              continue;
            }

            // Check if we already have this NFT from local storage
            const existingNft = localNfts.find(local => local.tokenId === tokenId.toString());
            if (existingNft) {
              console.log(`Token ${tokenId} already in local storage, verified ownership`);
              continue;
            }

            // Try to get metadata for new NFTs
            console.log(`Processing new NFT #${tokenId} from blockchain`);
            
            let metadata = null;
            
            // Try transaction recovery first
            if (event.transactionHash) {
              try {
                const recoveredMetadata = await recoverNftMetadataFromTx(event.transactionHash);
                if (recoveredMetadata) {
                  metadata = recoveredMetadata;
                  console.log(`✅ Recovered metadata for NFT #${tokenId} from transaction`);
                  
                  // Store the recovered metadata locally for future use
                  const nftMetadata = {
                    tokenId: tokenId.toString(),
                    name: recoveredMetadata.name,
                    description: recoveredMetadata.description,
                    image: recoveredMetadata.image,
                    originalPrompt: recoveredMetadata.attributes?.find((attr: any) => attr.trait_type === "Original Prompt")?.value || "",
                    refinedPrompt: recoveredMetadata.attributes?.find((attr: any) => attr.trait_type === "Refined Prompt")?.value || "",
                    reasoning: recoveredMetadata.attributes?.find((attr: any) => attr.trait_type === "Alith's Reasoning")?.value || "",
                    txHash: event.transactionHash,
                    mintedAt: Date.now(),
                    walletAddress: address
                  };
                  storeNftMetadata(nftMetadata);
                }
              } catch (recoveryError) {
                // Continue to fallback
              }
            }
            
            // Try contract call if no metadata recovered
            if (!metadata) {
              const tokenURI = await getTokenMetadata(contract, tokenId);
              if (tokenURI && tokenURI.startsWith('data:application/json;base64,')) {
                try {
                  const base64String = tokenURI.split(',')[1];
                  const jsonString = Buffer.from(base64String, 'base64').toString('utf8');
                  metadata = JSON.parse(jsonString);
                  console.log(`✅ Got metadata for NFT #${tokenId} from contract`);
                } catch (parseError) {
                  // Continue to fallback
                }
              }
            }
            
            // Create NFT data entry
            if (metadata) {
              const nftData = {
                id: tokenId.toString(),
                title: metadata.name || `NFT #${tokenId}`,
                prompt: metadata.attributes?.find((attr: any) => attr.trait_type === "Refined Prompt")?.value || 
                       metadata.attributes?.find((attr: any) => attr.trait_type === "Original Prompt")?.value || 
                       "Blockchain-verified artwork",
                imageUrl: metadata.image || '/placeholder-nft.svg',
                txHash: event.transactionHash || 'N/A',
              };
              blockchainNfts.push(nftData);
            } else {
              // Fallback entry for verified ownership
              const nftData = {
                id: tokenId.toString(),
                title: `NFT #${tokenId}`,
                prompt: "Blockchain-verified artwork (metadata loading...)",
                imageUrl: '/placeholder-nft.svg',
                txHash: event.transactionHash || 'N/A',
              };
              blockchainNfts.push(nftData);
            }
            
          } catch (error) {
            console.error(`Failed to process NFT:`, error);
            continue;
          }
        }
        
        // Merge local and blockchain NFTs
        const allNftData = [...localNftData, ...blockchainNfts].reverse(); // Most recent first
        console.log('Final merged NFT count:', allNftData.length);
        setNfts(allNftData);
      } else {
        // Only local NFTs available
        console.log('No blockchain events found, using local NFTs only');
      }

    } catch (err) {
      console.error("Failed to fetch user's NFTs:", err);
      
      // Fallback: try to show local NFTs even if blockchain query failed
      const fallbackLocalNfts = getNftsForWallet(address);
      if (fallbackLocalNfts.length > 0) {
        console.log('Blockchain query failed, showing local NFTs as fallback');
        const fallbackNftData = fallbackLocalNfts.map(localNft => ({
          id: localNft.tokenId,
          title: localNft.name + " (Local)",
          prompt: localNft.refinedPrompt || localNft.originalPrompt,
          imageUrl: localNft.image,
          txHash: localNft.txHash,
        }));
        setNfts(fallbackNftData);
      } else {
        setError("Could not load your collection. Please try refreshing or check your network connection.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (displayAddress) {
      fetchNfts(displayAddress);
      // Only load collection management for own wallet
      if (!isViewingOtherUser) {
        loadCollectionData();
      }
    } else {
      setIsLoading(false); // Not loading if there's no wallet
    }
    
    // PRODUCTION FIX: Listen for forced refresh events from recovery tool
    const handleForceRefresh = (event: CustomEvent) => {
      const { walletAddress: refreshWallet } = event.detail;
      if (refreshWallet && refreshWallet.toLowerCase() === displayAddress?.toLowerCase()) {
        console.log('🔄 Forced refresh triggered by recovery tool');
        if (displayAddress) {
          fetchNfts(displayAddress);
        }
      }
    };
    
    window.addEventListener('force-nft-refresh', handleForceRefresh as EventListener);
    
    return () => {
      window.removeEventListener('force-nft-refresh', handleForceRefresh as EventListener);
    };
  }, [displayAddress, fetchNfts, isViewingOtherUser]);
  
  // Phase 4: Load collection management data
  const loadCollectionData = () => {
    try {
      const allCollections = getCollections();
      const allArtworks = getArtworks();
      const unassigned = getUnassignedArtworks();
      
      setCollections(allCollections);
      setUnassignedArtworks(unassigned);
      
      console.log('📊 Collection data loaded:', {
        collections: allCollections.length,
        artworks: allArtworks.length,
        unassigned: unassigned.length
      });
    } catch (error) {
      console.error('Failed to load collection data:', error);
    }
  };
  
  // Phase 4: Handle artwork selection for collection creation
  const toggleArtworkSelection = (artworkId: string) => {
    const newSelection = new Set(selectedArtworks);
    if (newSelection.has(artworkId)) {
      newSelection.delete(artworkId);
    } else {
      newSelection.add(artworkId);
    }
    setSelectedArtworks(newSelection);
  };
  
  // Phase 4: Create collection from selected artworks
  const handleCreateCollection = (templateIndex?: number) => {
    if (selectedArtworks.size === 0) {
      toast({
        variant: "destructive",
        title: "No artworks selected",
        description: "Please select artworks to create a collection.",
      });
      return;
    }
    
    const selectedIds = Array.from(selectedArtworks);
    
    if (templateIndex !== undefined) {
      const template = collectionTemplates[templateIndex];
      if (selectedIds.length < template.minArtworks) {
        toast({
          variant: "destructive",
          title: "Not enough artworks",
          description: `This template requires at least ${template.minArtworks} artworks.`,
        });
        return;
      }
      
      const collectionId = createCollection(template, selectedIds);
      toast({
        title: "🎨 Collection Created!",
        description: `${template.name} collection created with ${selectedIds.length} artworks.`,
        duration: 4000,
      });
    } else {
      // Create custom collection
      const collectionId = createCustomCollection(
        `Custom Collection ${collections.length + 1}`,
        `A curated collection of ${selectedIds.length} artworks`,
        'custom',
        selectedIds,
        ['curated', 'custom']
      );
      
      toast({
        title: "🎨 Custom Collection Created!",
        description: `Collection created with ${selectedIds.length} artworks.`,
        duration: 4000,
      });
    }
    
    setSelectedArtworks(new Set());
    loadCollectionData();
  };

  if (!displayAddress) {
      return (
          <div className="flex h-64 w-full items-center justify-center rounded-lg border-2 border-dashed">
              <div className="text-center">
                   <Alert className="max-w-md mx-auto">
                      <Wallet className="h-4 w-4" />
                      <AlertTitle>Wallet Not Connected</AlertTitle>
                      <AlertDescription>
                          Please connect your wallet to view your personal NFT collection.
                      </AlertDescription>
                    </Alert>
                  <Button onClick={connectWallet} className="mt-4">
                      <Wallet className="mr-2" /> Connect Wallet
                  </Button>
              </div>
          </div>
      )
  }

  if (isLoading) {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">My Collection</h1>
                <p className="mt-2 text-lg text-muted-foreground">Here are the unique artworks you've created and minted on the blockchain.</p>
                <div className="mt-3 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block">
                  🔄 Loading with advanced metadata recovery system
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="flex flex-col">
                        <Skeleton className="aspect-square w-full rounded-t-lg" />
                        <CardHeader className="flex-grow p-4">
                            <Skeleton className="h-5 w-4/5" />
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                            <Skeleton className="h-4 w-1/2" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
                <h3 className="text-xl font-semibold text-destructive">Error Loading Collection</h3>
                <p className="mt-2 text-muted-foreground">{error}</p>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
            {isViewingOtherUser ? `Collection by ${ownerParam?.substring(0, 6)}...${ownerParam?.substring(ownerParam.length - 4)}` : "My Collection"}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {isViewingOtherUser 
              ? "Explore this creator's AI artworks and NFT collection." 
              : "Manage your AI artworks, create collections, and view analytics."
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => fetchNfts(displayAddress!)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
          {!isViewingOtherUser && (
            <Button 
              variant="outline"
              onClick={loadCollectionData}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Sync Data
            </Button>
          )}
        </div>
      </div>

      {!isCorrectNetwork && (
        <Alert variant="destructive">
          <AlertTitle>Wrong Network</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Please switch to Metis Hyperion Testnet to view your collection.</span>
            <Button variant="outline" size="sm" onClick={switchToMetisNetwork}>
              Switch Network
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Collection Interface - Only show for own collection */}
      {!isViewingOtherUser ? (
        <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nfts" className="flex items-center gap-2">
              <Grid className="w-4 h-4" />
              NFTs ({nfts.length})
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Collections ({collections.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

        <TabsContent value="nfts" className="space-y-6">
          {/* Selection Tools */}
          {unassignedArtworks.length > 0 && (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Collection
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select artworks below to create a themed collection. {selectedArtworks.size} selected.
                </p>
              </CardHeader>
              {selectedArtworks.size > 0 && (
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateCollection()}
                    >
                      Create Custom Collection
                    </Button>
                    {collectionTemplates.map((template, index) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateCollection(index)}
                        disabled={selectedArtworks.size < template.minArtworks}
                      >
                        {template.name} ({template.minArtworks}+ works)
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedArtworks(new Set())}
                  >
                    Clear Selection
                  </Button>
                </CardContent>
              )}
            </Card>
          )}

          {/* View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            {selectedArtworks.size > 0 && (
              <Badge variant="secondary">
                {selectedArtworks.size} selected
              </Badge>
            )}
          </div>

          {/* NFTs Grid/List */}
          {nfts.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
            }>
              {nfts.map((nft) => {
                const isSelected = selectedArtworks.has(nft.id);
                const isUnassigned = unassignedArtworks.some(artwork => artwork.id === nft.id);
                
                return (
                  <Card 
                    key={nft.id} 
                    className={`flex ${viewMode === 'list' ? 'flex-row' : 'flex-col'} overflow-hidden transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    } ${isUnassigned ? 'hover:ring-1 hover:ring-muted-foreground' : ''}`}
                    onClick={() => isUnassigned && toggleArtworkSelection(nft.id)}
                  >
                    <CardContent className="p-0">
                      <Image
                        src={nft.imageUrl}
                        alt={nft.title}
                        width={600}
                        height={600}
                        className={`${viewMode === 'list' ? 'w-24 h-24' : 'aspect-square w-full'} object-cover transition-transform duration-300 hover:scale-105`}
                        unoptimized
                      />
                    </CardContent>
                    <div className="flex-1">
                      <CardHeader className={`flex-grow ${viewMode === 'list' ? 'p-4' : 'p-4'}`}>
                        <CardTitle className="truncate text-base flex items-center justify-between">
                          {nft.title}
                          {isUnassigned && (
                            <Badge variant="outline" className="text-xs">
                              Available
                            </Badge>
                          )}
                        </CardTitle>
                        <CardFooter className="p-0 pt-2 text-xs text-muted-foreground">
                          Token ID: {nft.id}
                        </CardFooter>
                      </CardHeader>
                      <CardFooter className={`flex justify-between ${viewMode === 'list' ? 'p-4' : 'p-4 pt-0'}`}>
                        <div className="flex gap-2">
                          {/* Phase 5: LazAI Verification for NFTs */}
                          <LazAIVerification
                            artworkId={nft.id}
                            imageUrl={nft.imageUrl}
                            prompt={nft.prompt}
                            onVerified={(result) => {
                              toast({
                                title: "🏆 NFT Verified with LazAI!",
                                description: `Quality Score: ${(result.newScore * 100).toFixed(1)}%`,
                              });
                            }}
                          />
                          {/* Collection Social Sharing */}
                          <CollectionSocialShare
                            nft={nft}
                            variant="icon"
                          />
                        </div>
                        <div>
                          {nft.txHash && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild title="View transaction on Metis Explorer">
                              <Link href={`https://hyperion-testnet-explorer.metisdevops.link/tx/${nft.txHash}`} target="_blank">
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
              <div className="text-center">
                <h3 className="text-xl font-semibold">Your collection is empty</h3>
                <p className="mt-2 text-muted-foreground">Start creating and minting art to build your collection.</p>
                <Button className="mt-4" asChild>
                  <Link href="/">Generate Art</Link>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections" className="space-y-6">
          {collections.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {collections.map((collection) => (
                <Card key={collection.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {collection.name}
                      <Badge variant="secondary">
                        {collection.artworks.length} works
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {collection.artworks.slice(0, 3).map((artwork, index) => (
                        <Image
                          key={artwork.id}
                          src={artwork.imageUrl}
                          alt={artwork.title || 'Artwork'}
                          width={100}
                          height={100}
                          className="aspect-square w-full rounded object-cover"
                          unoptimized
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {collection.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Average Quality:</span>
                        <span>{(collection.averageQuality * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Minted:</span>
                        <span>{collection.mintedCount}/{collection.artworks.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rarity Score:</span>
                        <span>{collection.rarityScore.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      <Share2 className="w-4 h-4 mr-2" />
                      Export for Minting
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
              <div className="text-center">
                <h3 className="text-xl font-semibold">No collections yet</h3>
                <p className="mt-2 text-muted-foreground">Create your first collection from your NFTs.</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard onRefresh={() => {
            toast({
              title: "📊 Analytics Refreshed",
              description: "Dashboard data has been updated.",
              duration: 2000,
            });
          }} />
        </TabsContent>
      </Tabs>
      ) : (
        /* Simple grid view for other users' collections */
        <div className="space-y-6">
          {/* View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {nfts.length} NFT{nfts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* NFTs Grid/List for other users */}
          {nfts.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
            }>
              {nfts.map((nft) => (
                <Card 
                  key={nft.id} 
                  className={`flex ${viewMode === 'list' ? 'flex-row' : 'flex-col'} overflow-hidden transition-all`}
                >
                  <CardContent className="p-0">
                    <Image
                      src={nft.imageUrl}
                      alt={nft.title}
                      width={600}
                      height={600}
                      className={`${viewMode === 'list' ? 'w-24 h-24' : 'aspect-square w-full'} object-cover transition-transform duration-300 hover:scale-105`}
                      unoptimized
                    />
                  </CardContent>
                  <div className="flex-1">
                    <CardHeader className={`flex-grow ${viewMode === 'list' ? 'p-4' : 'p-4'}`}>
                      <CardTitle className="truncate text-base">
                        {nft.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground truncate">
                        {nft.prompt}
                      </p>
                      <CardFooter className="p-0 pt-2 text-xs text-muted-foreground">
                        Token ID: {nft.id}
                      </CardFooter>
                    </CardHeader>
                    <CardFooter className={`flex justify-between ${viewMode === 'list' ? 'p-4' : 'p-4 pt-0'}`}>
                      <div className="flex gap-2">
                        {/* Social sharing for other users' NFTs */}
                        <CollectionSocialShare
                          nft={nft}
                          variant="icon"
                        />
                      </div>
                      <div>
                        {nft.txHash && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild title="View transaction on Metis Explorer">
                            <Link href={`https://hyperion-testnet-explorer.metisdevops.link/tx/${nft.txHash}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
              <div className="text-center">
                <h3 className="text-xl font-semibold">No NFTs found</h3>
                <p className="mt-2 text-muted-foreground">This creator hasn't minted any artworks yet.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
