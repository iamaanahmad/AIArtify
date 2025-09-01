
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ethers } from "ethers";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import SocialShare from "@/components/social-share";
import { Share2, MessageCircle, Download, MoreHorizontal } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { contractConfig } from "@/lib/web3/config";
import { getRpcProvider, safeContractCall, queryEventsInChunks } from "@/lib/web3/utils";
import { getStoredNfts, getNftCount } from "@/lib/nft-storage";
import { recoverNftMetadataFromTx } from "@/lib/metadata-recovery";

interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
}

interface PublicNftData {
  id: string;
  creator: string;
  creatorAddress: string; // Full address for linking
  title: string;
  prompt: string;
  imageUrl: string;
  avatarUrl: string;
  txHash: string;
}

export default function GalleryPage() {
  const [nfts, setNfts] = useState<PublicNftData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicNfts = async () => {
      setIsLoading(true);
      setError(null);
      
      // PRODUCTION DEBUG: Show storage stats
      const storageStats = getNftCount();
      console.log('🔍 Gallery storage state:', storageStats);
      
      try {
        const provider = getRpcProvider();
        const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);
        const currentBlock = await provider.getBlockNumber();
        console.log('Current block:', currentBlock);
        
        // Query all mint events (from zero address to any address) with enhanced scanning for 100+ NFTs
        const fromBlock = Math.max(0, currentBlock - 1000000); // Increased to 1M blocks for comprehensive coverage
        console.log(`Querying all mint events from block ${fromBlock} to ${currentBlock}`);
        
        // PRODUCTION FIX: Use smaller chunks for more thorough scanning
        const chunkSize = 25000; // Reduced from 50k to 25k for better coverage
        const allMintEvents: any[] = [];
        
        for (let startBlock = fromBlock; startBlock < currentBlock; startBlock += chunkSize) {
          const endBlock = Math.min(startBlock + chunkSize - 1, currentBlock);
          console.log(`Gallery scanning chunk: blocks ${startBlock} to ${endBlock}`);
          
          try {
            const mintFilter = contract.filters.Transfer(ethers.ZeroAddress, null, null);
            const chunkEvents = await safeContractCall(() => 
              contract.queryFilter(mintFilter, startBlock, endBlock)
            );
            
            if (chunkEvents && chunkEvents.length > 0) {
              allMintEvents.push(...chunkEvents);
              console.log(`Gallery found ${chunkEvents.length} mint events in chunk ${startBlock}-${endBlock}`);
            }
            
            // Reduced delay for faster scanning
            await new Promise(resolve => setTimeout(resolve, 75));
          } catch (chunkError) {
            console.warn(`Gallery failed to scan chunk ${startBlock}-${endBlock}:`, chunkError);
            // Continue with other chunks
          }
        }
        
        console.log('Gallery total mint events found:', allMintEvents.length);
        
        if (!allMintEvents || allMintEvents.length === 0) {
          console.log('No mint events found on blockchain, falling back to local storage only');
          // Fallback to local storage NFTs only
          const localNfts = getStoredNfts();
          const localPublicNfts = localNfts.map((nft, index) => ({
            id: nft.tokenId,
            creator: `${nft.walletAddress.substring(0, 6)}...${nft.walletAddress.substring(nft.walletAddress.length - 4)}`,
            creatorAddress: nft.walletAddress,
            title: nft.name,
            prompt: nft.originalPrompt || nft.refinedPrompt || "AI Generated Artwork",
            imageUrl: nft.image,
            avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${nft.walletAddress}`,
            txHash: nft.txHash
          }));
          setNfts(localPublicNfts);
          setIsLoading(false);
          return;
        }

        console.log('=== STEP 2: Getting local storage data ===');
        const localNfts = getStoredNfts();
        console.log('Local NFTs available:', localNfts.length);

        console.log('=== STEP 3: Processing mint events for public gallery ===');
        const publicNftPromises = allMintEvents.map(async (event: any, index: number): Promise<PublicNftData | null> => {
          try {
            console.log(`Processing mint event ${index + 1}/${allMintEvents.length}`);
            
            const eventLog = event as ethers.EventLog;
            if (!eventLog.args) return null;

            const to = eventLog.args[1]; // recipient address
            const tokenId = eventLog.args[2]; // token ID
            const txHash = eventLog.transactionHash;
            
            console.log(`Token ${tokenId}: to=${to}, tx=${txHash}`);

            // Verify current ownership (token might have been transferred)
            const currentOwner = await safeContractCall(() => contract.ownerOf(tokenId));
            if (!currentOwner) {
              console.log(`Token ${tokenId} does not exist or was burned`);
              return null;
            }

            // Try to get metadata from multiple sources
            let metadata = null;
            let source = 'unknown';

            // 1. Try local storage first
            const localNft = localNfts.find(nft => nft.tokenId === tokenId.toString());
            if (localNft) {
              metadata = {
                name: localNft.name,
                description: localNft.description,
                image: localNft.image,
                attributes: [
                  { trait_type: "Original Prompt", value: localNft.originalPrompt },
                  { trait_type: "Refined Prompt", value: localNft.refinedPrompt },
                  { trait_type: "Alith's Reasoning", value: localNft.reasoning },
                  // BONUS TRACK: Include LazAI metadata in gallery display
                  ...(localNft.lazaiReasoning ? [{ trait_type: "LazAI Reasoning", value: localNft.lazaiReasoning }] : []),
                  ...(localNft.lazaiModel ? [{ trait_type: "LazAI Model", value: localNft.lazaiModel }] : []),
                  ...(localNft.lazaiConfidence ? [{ trait_type: "LazAI Confidence", value: localNft.lazaiConfidence }] : []),
                ]
              };
              source = 'local';
              console.log(`Token ${tokenId}: Found in local storage with LazAI data:`, {
                hasLazaiReasoning: !!localNft.lazaiReasoning,
                lazaiModel: localNft.lazaiModel,
                lazaiConfidence: localNft.lazaiConfidence,
              });
            }

            // 2. Try contract tokenURI (unlikely to work but worth trying)
            if (!metadata) {
              const tokenURI = await safeContractCall(() => contract.tokenURI(tokenId));
              if (tokenURI && tokenURI.startsWith('data:application/json;base64,')) {
                try {
                  const base64String = tokenURI.split(',')[1];
                  const jsonString = Buffer.from(base64String, 'base64').toString('utf8');
                  metadata = JSON.parse(jsonString);
                  source = 'contract';
                  console.log(`Token ${tokenId}: Found in contract`);
                } catch (parseError) {
                  console.log(`Token ${tokenId}: Failed to parse contract metadata`);
                }
              }
            }

            // 3. Try transaction recovery
            if (!metadata && txHash) {
              console.log(`Token ${tokenId}: Trying transaction recovery...`);
              try {
                const recoveredMetadata = await recoverNftMetadataFromTx(txHash);
                if (recoveredMetadata) {
                  metadata = recoveredMetadata;
                  source = 'recovery';
                  console.log(`Token ${tokenId}: Recovered from transaction`);
                }
              } catch (recoveryError) {
                console.log(`Token ${tokenId}: Recovery failed`, recoveryError);
              }
            }

            // 4. Create fallback entry if no metadata found
            if (!metadata) {
              console.log(`Token ${tokenId}: No metadata found, creating fallback`);
              source = 'fallback';
              metadata = {
                name: `NFT #${tokenId}`,
                description: "An AI-generated artwork from AIArtify",
                image: '/placeholder-nft.svg',
                attributes: [{ trait_type: "Original Prompt", value: "Metadata not available" }]
                };
            }

            // Create public NFT data
            const publicNft: PublicNftData = {
              id: tokenId.toString(),
              creator: `${currentOwner.substring(0, 6)}...${currentOwner.substring(currentOwner.length - 4)}`,
              creatorAddress: currentOwner,
              title: metadata.name,
              prompt: metadata.attributes?.find((attr: any) => attr.trait_type === "Refined Prompt")?.value || 
                     metadata.attributes?.find((attr: any) => attr.trait_type === "Original Prompt")?.value || 
                     metadata.name,
              imageUrl: metadata.image,
              avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentOwner}`,
              txHash: txHash || 'N/A'
            };

            console.log(`Token ${tokenId}: Created public NFT data (source: ${source})`);
            return publicNft;

          } catch (err) {
            console.error(`Failed to process mint event:`, err);
            return null;
          }
        });

        const results = await Promise.all(publicNftPromises);
        const validNfts = results.filter((nft: PublicNftData | null): nft is PublicNftData => nft !== null).reverse(); // Show newest first
        
        console.log('=== GALLERY RESULT ===');
        console.log('Total public NFTs:', validNfts.length);
        console.log('Public NFTs:', validNfts);
        
        setNfts(validNfts);

      } catch (err) {
        console.error("Failed to fetch public NFTs:", err);
        setError("Could not load the gallery. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicNfts();
  }, []);

  const [shareNft, setShareNft] = useState<PublicNftData | null>(null);

  // Direct share function for quick sharing with engaging captions
  const handleQuickShare = (nft: PublicNftData, platform: 'twitter' | 'telegram') => {
    const shareUrl = `${window.location.origin}/gallery?highlight=${nft.id}`;
    const promptSnippet = nft.prompt.length > 60 ? nft.prompt.substring(0, 57) + '...' : nft.prompt;
    
    // Random engaging captions for viral sharing
    const viralCaptions = [
      `🎨 Just discovered this AI masterpiece ✨ What do you think? 👇`,
      `💫 Mind-blown by this AI art → Check out this creation 🚀`,
      `👀 This AI artwork is absolutely stunning`,
      `✨ Found this gem in the AI art gallery`,
      `🔮 AI + creativity = pure magic. Look at this!`,
      `🚀 This might be the coolest AI art I've seen`,
      `🎨 Okay, this AI artist is talented 👀`,
      `💎 Gallery surfing and found this beauty`
    ];
    
    const baseCaption = viralCaptions[Math.floor(Math.random() * viralCaptions.length)];
    
    let shareText = '';
    let shareUrlFinal = '';
    
    if (platform === 'twitter') {
      // X (Twitter) - optimized for engagement and 280 char limit
      shareText = `${baseCaption}\n\n🖼️ Prompt: "${promptSnippet}"\n\n🔗 Create your own: https://ai-artify.xyz\n\n#AIArtify #AIArt #NFT #MetisHyperion`;
      
      // Check length and shorten if needed
      if (shareText.length > 280) {
        shareText = `${baseCaption}\n\n🔗 https://ai-artify.xyz\n\n#AIArtify #AIArt #NFT`;
      }
      
      shareUrlFinal = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    } else if (platform === 'telegram') {
      // Telegram - more space, include everything
      shareText = `${baseCaption}\n\n🖼️ Prompt: "${promptSnippet}"\n\n🔗 Create your own: https://ai-artify.xyz\n\n👀 View this piece: ${shareUrl}`;
      
      // Add explorer link if available
      if (nft.txHash && nft.txHash !== 'N/A') {
        shareText += `\n\n🧾 View on Explorer: https://hyperion-testnet-explorer.metisdevops.link/tx/${nft.txHash}`;
      }
      
      shareText += `\n\n#AIArtify #AIArt #NFT #MetisHyperion #LazAI #Web3Art\n\n💬 Join community: t.me/aiartify`;
      
      shareUrlFinal = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    }
    
    console.log(`Sharing to ${platform}:`, shareText);
    
    // Open in new window
    const newWindow = window.open(shareUrlFinal, '_blank', 'width=600,height=500,scrollbars=yes,resizable=yes');
    
    if (!newWindow) {
      // Fallback if popup was blocked
      window.location.href = shareUrlFinal;
    }
    
    // Show success message
    if (platform === 'twitter') {
      console.log('🚀 X (Twitter) share opened - ready to go viral!');
    } else {
      console.log('💬 Telegram share opened - spreading the word!');
    }
  };

  // Save image to device function
  const handleSaveToDevice = async (nft: PublicNftData) => {
    try {
      // Try to download via fetch first (better for CORS)
      const response = await fetch(nft.imageUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${nft.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'AI-Art'}-AIArtify.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('📱 Image saved to device successfully');
      } else {
        throw new Error('Failed to fetch image');
      }
    } catch (error) {
      // Fallback: direct link download
      const link = document.createElement('a');
      link.href = nft.imageUrl;
      link.download = `${nft.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'AI-Art'}-AIArtify.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('📱 Image download initiated (fallback method)');
    }
  };
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="text-center space-y-4">
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          Public Gallery
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore the incredible creations from the AIArtify community, stored forever on-chain.
        </p>
        {!isLoading && !error && nfts.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-fade-in-up animation-delay-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>{nfts.length} artworks on display</span>
          </div>
        )}
      </div>

      {isLoading && (
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in-up animation-delay-300">
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden group hover-scale">
                    <Skeleton className="aspect-square w-full skeleton-pulse" />
                    <CardHeader className="p-4">
                        <Skeleton className="h-5 w-4/5 skeleton-pulse" />
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                        <div className="flex w-full items-center gap-2">
                           <Skeleton className="h-6 w-6 rounded-full skeleton-pulse" />
                           <Skeleton className="h-4 w-1/3 skeleton-pulse" />
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
                <h3 className="text-xl font-semibold text-destructive">Error Loading Gallery</h3>
                <p className="mt-2 text-muted-foreground">{error}</p>
            </div>
        </div>
      )}

      {!isLoading && !error && nfts.length === 0 && (
         <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
                <h3 className="text-xl font-semibold">The Gallery is Empty</h3>
                <p className="mt-2 text-muted-foreground">Be the first to create and mint an artwork!</p>
            </div>
        </div>
      )}
      
      {!isLoading && !error && nfts.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in-up animation-delay-400">
            {nfts.map((nft, index) => (
              <Card key={nft.id} className="overflow-hidden relative group hover-scale hover-glow transition-all duration-300" style={{animationDelay: `${(index % 8) * 100}ms`}}>
                <CardContent className="p-0">
                  <div className="relative">
                    <Image
                      src={nft.imageUrl}
                      alt={nft.title}
                      width={600}
                      height={600}
                      className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized
                    />
                    {/* Enhanced overlay effects */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Share dropdown */}
                    <TooltipProvider>
                      <Tooltip>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                                aria-label="Share NFT"
                              >
                                <Share2 className="w-4 h-4 text-blue-600" />
                              </button>
                            </TooltipTrigger>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => handleQuickShare(nft, 'twitter')}
                              className="cursor-pointer"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Share on X (Twitter)
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleQuickShare(nft, 'telegram')}
                              className="cursor-pointer"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Share on Telegram
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSaveToDevice(nft)}
                              className="cursor-pointer"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Save to Device
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setShareNft(nft)}
                              className="cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4 mr-2" />
                              More Options
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <TooltipContent side="left">Share this artwork</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {/* AI Generated badge */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-purple-500/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                        <span>✨</span>
                        <span className="hidden sm:inline">AI Generated</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardHeader className="p-4">
                  <CardTitle className="truncate text-base group-hover:text-purple-600 transition-colors duration-300">{nft.title}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate group-hover:text-muted-foreground/80 transition-colors duration-300">{nft.prompt}</p>
                </CardHeader>
                <CardFooter className="p-4 pt-0">
                  <div className="flex w-full items-center justify-between">
                    <Link 
                      href={`/collection?owner=${nft.creatorAddress}`}
                      className="flex items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg p-2 transition-all duration-300 hover:scale-105 group/creator"
                      title={`View ${nft.creator}'s collection`}
                    >
                      <Avatar className="h-6 w-6 ring-2 ring-transparent group-hover/creator:ring-purple-300 transition-all duration-300">
                        <AvatarImage src={nft.avatarUrl} alt={nft.creator} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                          {nft.creator.substring(0,2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground group-hover/creator:text-purple-600 transition-colors duration-300 font-medium">
                        by {nft.creator}
                      </span>
                    </Link>
                    <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                      #{nft.id}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          {shareNft && (
            <SocialShare
              shareData={{
                imageUrl: shareNft.imageUrl,
                title: shareNft.title,
                description: shareNft.title,
                prompt: shareNft.prompt,
                mintTxHash: shareNft.txHash,
                chainData: { network: 'Metis', contractAddress: '', tokenId: shareNft.id },
              }}
              onShare={() => setShareNft(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
