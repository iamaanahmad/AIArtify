
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ethers } from "ethers";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SocialShare from "@/components/social-share";
import { Share2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { contractConfig } from "@/lib/web3/config";
import { getRpcProvider, safeContractCall, queryEventsInChunks } from "@/lib/web3/utils";
import { getStoredNfts } from "@/lib/nft-storage";
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
      
      try {
        const provider = getRpcProvider();
        const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);
        const currentBlock = await provider.getBlockNumber();
        console.log('Current block:', currentBlock);
        
        // Query all mint events (from zero address to any address)
        const fromBlock = Math.max(0, currentBlock - 50000); // Last ~50k blocks should cover all NFTs
        console.log(`Querying all mint events from block ${fromBlock} to ${currentBlock}`);
        
        const mintFilter = contract.filters.Transfer(ethers.ZeroAddress, null, null);
        const allMints = await safeContractCall(() => 
          contract.queryFilter(mintFilter, fromBlock, currentBlock)
        );
        
        console.log('Total mint events found:', allMints?.length || 0);
        
        if (!allMints || allMints.length === 0) {
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
        const publicNftPromises = allMints.map(async (event, index): Promise<PublicNftData | null> => {
          try {
            console.log(`Processing mint event ${index + 1}/${allMints.length}`);
            
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
        const validNfts = results.filter((nft): nft is PublicNftData => nft !== null).reverse(); // Show newest first
        
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
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
          Public Gallery
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore the incredible creations from the AIArtify community, stored forever on-chain.
        </p>
      </div>

      {isLoading && (
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <CardHeader className="p-4">
                        <Skeleton className="h-5 w-4/5" />
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                        <div className="flex w-full items-center gap-2">
                           <Skeleton className="h-6 w-6 rounded-full" />
                           <Skeleton className="h-4 w-1/3" />
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {nfts.map((nft) => (
              <Card key={nft.id} className="overflow-hidden relative group">
                <CardContent className="p-0">
                  <div className="relative">
                    <Image
                      src={nft.imageUrl}
                      alt={nft.title}
                      width={600}
                      height={600}
                      className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
                      unoptimized
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white shadow rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Share NFT"
                            onClick={() => setShareNft(nft)}
                          >
                            <Share2 className="w-5 h-5 text-blue-600" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Share this NFT</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
                <CardHeader className="p-4">
                  <CardTitle className="truncate text-base">{nft.title}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate">{nft.prompt}</p>
                </CardHeader>
                <CardFooter className="p-4 pt-0">
                  <div className="flex w-full items-center justify-between">
                    <Link 
                      href={`/collection?owner=${nft.creatorAddress}`}
                      className="flex items-center gap-2 hover:bg-muted/50 rounded p-1 transition-colors"
                      title={`View ${nft.creator}'s collection`}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={nft.avatarUrl} alt={nft.creator} />
                        <AvatarFallback>{nft.creator.substring(0,2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        by {nft.creator}
                      </span>
                    </Link>
                    <div className="text-xs text-muted-foreground">
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
