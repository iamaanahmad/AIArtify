
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/use-wallet";
import { contractConfig } from "@/lib/web3/config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet, Grid, List, Filter, Plus, BarChart3, Share2 } from "lucide-react";
import { getRpcProvider, safeContractCall, queryEventsInChunks, tokenExists, getTokenMetadata } from "@/lib/web3/utils";
import { getNftsForWallet, getNftByTokenId, storeNftMetadata } from "@/lib/nft-storage";
import { recoverNftMetadataFromTx } from "@/lib/metadata-recovery";
import { useCollections, collectionTemplates } from "@/lib/collection-manager";
import { type ArtworkItem, type ArtCollection } from "@/lib/collection-manager";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import ConsensusBreakdown from "@/components/consensus-breakdown";
import LazAIVerification from "@/components/lazai-verification";
import { useToast } from "@/hooks/use-toast";

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
  const { walletAddress, connectWallet, isCorrectNetwork, switchToMetisNetwork } = useWallet();
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
    setIsLoading(true);
    setError(null);
    try {
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

      // First, let's check if the contract exists and has any events at all
      console.log('=== STEP 1: Basic contract check ===');
      try {
        const code = await provider.getCode(contractConfig.address);
        console.log('Contract code length:', code.length);
        if (code === '0x') {
          throw new Error('Contract does not exist at this address');
        }
        
        // Log available contract functions for debugging
        console.log('=== CONTRACT FUNCTIONS DEBUG ===');
        try {
          console.log('Contract fragments:', contract.interface.fragments.length);
          console.log('Available functions:', contract.interface.fragments.filter(f => f.type === 'function').map(f => f.format()));
        } catch (debugError) {
          console.log('Could not inspect contract interface:', debugError);
        }
      } catch (error) {
        console.error('Contract check failed:', error);
        throw error;
      }

      // Let's try a different approach - get ALL transfer events first to see what's there
      console.log('=== STEP 2: Getting ALL transfer events (recent blocks only) ===');
      const currentBlock = await provider.getBlockNumber();
      console.log('Current block:', currentBlock);
      
      // Query only recent blocks to avoid the range limit
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks
      console.log(`Querying Transfer events from block ${fromBlock} to ${currentBlock}`);
      
      const allTransferFilter = contract.filters.Transfer(null, null, null);
      const allTransfers = await safeContractCall(() => 
        contract.queryFilter(allTransferFilter, fromBlock, currentBlock)
      );
      
      console.log('All Transfer events found:', allTransfers?.length || 0);
      
      if (allTransfers && allTransfers.length > 0) {
        console.log('Sample transfer events:', allTransfers.slice(0, 3));
        
        // Check which ones are mints (from zero address)
        const mints = allTransfers.filter(event => {
          const eventLog = event as ethers.EventLog;
          return eventLog.args && eventLog.args[0] === ethers.ZeroAddress;
        });
        console.log('Mint events found:', mints.length);
        
        // Check which ones involve our address
        const userEvents = allTransfers.filter(event => {
          const eventLog = event as ethers.EventLog;
          if (!eventLog.args) return false;
          const from = eventLog.args[0];
          const to = eventLog.args[1];
          return from.toLowerCase() === address.toLowerCase() || 
                 to.toLowerCase() === address.toLowerCase();
        });
        console.log('Events involving user address:', userEvents.length);
        console.log('User events:', userEvents);
      }

      // Now let's try to get mint events that went to our address specifically
      console.log('=== STEP 3: Getting mint events to user address ===');
      const mintToUserFilter = contract.filters.Transfer(ethers.ZeroAddress, address, null);
      const mintToUser = await safeContractCall(() => 
        contract.queryFilter(mintToUserFilter, fromBlock, currentBlock)
      );
      
      console.log('Mint events to user:', mintToUser?.length || 0);
      console.log('Mint to user events:', mintToUser);

      if (!mintToUser || mintToUser.length === 0) {
        console.log('No mint events found for user - checking if any tokens exist at all');
        
        // Let's try to check tokens 1-10 to see if any exist
        console.log('=== STEP 4: Checking tokens 1-10 directly ===');
        for (let i = 1; i <= 10; i++) {
          try {
            const owner = await safeContractCall(() => contract.ownerOf(i));
            console.log(`Token ${i} owner:`, owner);
            if (owner && owner.toLowerCase() === address.toLowerCase()) {
              console.log(`User owns token ${i}!`);
              const tokenURI = await safeContractCall(() => contract.tokenURI(i));
              console.log(`Token ${i} URI:`, tokenURI);
            }
          } catch (error) {
            console.log(`Token ${i} does not exist`);
          }
        }
        
        setNfts([]);
        setIsLoading(false);
        return;
      }

      // Process the mint events to get NFT data
      console.log('=== STEP 5: Processing mint events ===');
      
      // First, get any locally stored NFTs for this wallet
      const localNfts = getNftsForWallet(address);
      console.log('Found', localNfts.length, 'locally stored NFTs');
      
      // Create a hybrid approach: verify blockchain ownership + use local metadata
      const allNftData: NftData[] = [];
      
      // Add confirmed blockchain NFTs with local metadata
      if (mintToUser && mintToUser.length > 0) {
        const nftPromises = mintToUser.map(async (event, index): Promise<NftData | null> => {
          try {
            console.log(`Processing mint event ${index + 1}/${mintToUser.length}:`, event);
            
            const eventLog = event as ethers.EventLog;
            if (!eventLog.args) {
              console.log('Event has no args');
              return null;
            }

            const tokenId = eventLog.args[2];
            console.log('Processing token ID:', tokenId?.toString());
            if (!tokenId) return null;

            // Verify current ownership
            const currentOwner = await safeContractCall(() => contract.ownerOf(tokenId));
            
            if (!currentOwner) {
              console.log('Token', tokenId.toString(), 'does not exist or was burned');
              return null;
            }
            
            console.log('Current owner of token', tokenId.toString(), ':', currentOwner);
            
            if (currentOwner.toLowerCase() !== address.toLowerCase()) {
              console.log('Token', tokenId.toString(), 'not owned by user');
              return null;
            }

            // Try multiple methods to get token metadata
            console.log(`=== Processing NFT #${tokenId} ===`);
            
            // PRIORITY 1: Check local storage first (most reliable)
            const localNft = getNftByTokenId(tokenId.toString());
            if (localNft) {
              console.log(`✅ Found NFT #${tokenId} in local storage`);
              const nftData = {
                id: localNft.tokenId,
                title: localNft.name,
                prompt: localNft.refinedPrompt || localNft.originalPrompt,
                imageUrl: localNft.image,
                txHash: localNft.txHash,
              };
              return nftData;
            }
            
            // PRIORITY 2: Try to recover from transaction data
            const txHash = event.transactionHash;
            if (txHash) {
              try {
                const recoveredMetadata = await recoverNftMetadataFromTx(txHash);
                if (recoveredMetadata) {
                  console.log(`✅ Recovered NFT #${tokenId} metadata from transaction`);
                  
                  // Store the recovered metadata for future use
                  const nftMetadata = {
                    tokenId: tokenId.toString(),
                    name: recoveredMetadata.name,
                    description: recoveredMetadata.description,
                    image: recoveredMetadata.image,
                    originalPrompt: recoveredMetadata.attributes?.find((attr: any) => attr.trait_type === "Original Prompt")?.value || "",
                    refinedPrompt: recoveredMetadata.attributes?.find((attr: any) => attr.trait_type === "Refined Prompt")?.value || "",
                    reasoning: recoveredMetadata.attributes?.find((attr: any) => attr.trait_type === "Alith's Reasoning")?.value || "",
                    txHash: txHash,
                    mintedAt: Date.now(),
                    walletAddress: address
                  };
                  storeNftMetadata(nftMetadata);
                  
                  const nftData = {
                    id: tokenId.toString(),
                    title: recoveredMetadata.name,
                    prompt: recoveredMetadata.attributes?.find((attr: any) => attr.trait_type === "Refined Prompt")?.value || 
                           recoveredMetadata.attributes?.find((attr: any) => attr.trait_type === "Original Prompt")?.value || "N/A",
                    imageUrl: recoveredMetadata.image,
                    txHash: txHash,
                  };
                  return nftData;
                }
              } catch (recoveryError) {
                // Silently continue to next method
              }
            }
            
            // PRIORITY 3: Try contract call (as fallback)
            let tokenURI = await getTokenMetadata(contract, tokenId);
            
            if (tokenURI && tokenURI.startsWith('data:application/json;base64,')) {
              try {
                const base64String = tokenURI.split(',')[1];
                const jsonString = Buffer.from(base64String, 'base64').toString('utf8');
                const metadata: NftMetadata = JSON.parse(jsonString);

                const nftData = {
                  id: tokenId.toString(),
                  title: metadata.name || 'Untitled',
                  prompt: metadata.attributes?.find(attr => attr.trait_type === "Refined Prompt")?.value || 
                         metadata.attributes?.find(attr => attr.trait_type === "Original Prompt")?.value || 
                         "N/A",
                  imageUrl: metadata.image,
                  txHash: event.transactionHash || 'N/A',
                };
                console.log(`✅ NFT #${tokenId} data created from contract metadata`);
                return nftData;
              } catch (metadataError) {
                // Silently continue to fallback
              }
            }
            
            // FINAL FALLBACK: Create default NFT entry
            console.log(`⚠️ Using fallback display for NFT #${tokenId}`);
            const nftData = {
              id: tokenId.toString(),
              title: `NFT #${tokenId.toString()}`,
              prompt: "Metadata available in wallet - Contract query optimized",
              imageUrl: '/placeholder-nft.svg',
              txHash: event.transactionHash || 'N/A',
            };
            return nftData;
          } catch (err) {
            console.error(`Failed to fetch metadata for token:`, err);
            return null;
          }
        });
        
        const results = await Promise.all(nftPromises);
        const validNfts = results.filter((nft): nft is NftData => nft !== null);
        allNftData.push(...validNfts);
      }
      
      // Also add any local NFTs that might not have been found on-chain (due to sync issues)
      const localOnlyNfts = localNfts.filter(localNft => 
        !allNftData.some(chainNft => chainNft.id === localNft.tokenId)
      ).map(localNft => ({
        id: localNft.tokenId,
        title: localNft.name + " (Local)",
        prompt: localNft.refinedPrompt || localNft.originalPrompt,
        imageUrl: localNft.image,
        txHash: localNft.txHash,
      }));
      
      if (localOnlyNfts.length > 0) {
        console.log('Adding', localOnlyNfts.length, 'local-only NFTs');
        allNftData.push(...localOnlyNfts);
      }
      
      const finalNfts = allNftData.reverse(); // Show most recent first
      console.log('Final NFTs:', finalNfts);
      setNfts(finalNfts);

    } catch (err) {
      console.error("Failed to fetch user's NFTs:", err);
      setError("Could not load your collection. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchNfts(walletAddress);
      // Phase 4: Load collections and artworks
      loadCollectionData();
    } else {
      setIsLoading(false); // Not loading if there's no wallet
    }
  }, [walletAddress, fetchNfts]);
  
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

  if (!walletAddress) {
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
            My Collection
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage your AI artworks, create collections, and view analytics.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => fetchNfts(walletAddress!)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
          <Button 
            variant="outline"
            onClick={loadCollectionData}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Sync Data
          </Button>
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

      {/* Phase 4: Enhanced Collection Interface */}
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
                        </div>
                        <div>
                          {nft.txHash && (
                            <Button variant="link" size="sm" className="h-auto p-0" asChild>
                              <Link href={`https://hyperion-testnet-explorer.metisdevops.link/tx/${nft.txHash}`} target="_blank">
                                View on Explorer
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
    </div>
  );
}
