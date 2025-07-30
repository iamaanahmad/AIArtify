
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { contractConfig } from "@/lib/web3/config";
import { safeContractCall } from "@/lib/web3/utils";

interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
}

interface NftData {
  id: string;
  creator: string;
  prompt: string;
  imageUrl: string;
  avatarUrl: string;
}

const getRpcProvider = () => {
    return new ethers.JsonRpcProvider("https://hyperion-testnet.metisdevops.link", 599);
};


export default function GalleryPage() {
  const [nfts, setNfts] = useState<NftData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNfts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const provider = getRpcProvider();
        const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);
        
        // This is a common pattern for contracts that don't have a built-in enumerator
        // We rely on the implicit total supply being equal to the latest token ID.
        // This assumes token IDs are sequential starting from 1.
        let totalSupply;
        try {
            // A common way to get total supply if the contract supports it (like from _nextTokenId in OZ's ERC721)
            // If the contract doesn't explicitly expose total supply, we may need another method.
            // A workaround can be to check tokens until we hit a nonexistent one.
            // Let's assume a reasonable upper limit for a demo.
             const events = await contract.queryFilter(contract.filters.Transfer(ethers.ZeroAddress));
             totalSupply = BigInt(events.length);
        } catch (e) {
            console.warn("Could not determine total supply directly, will iterate up to a limit.");
            totalSupply = BigInt(50); // Fallback for demo purposes
        }


        const nftPromises: Promise<NftData | null>[] = [];
        for (let i = 1; i <= totalSupply; i++) {
          nftPromises.push((async () => {
            try {
              // Use safe contract calls to handle non-existent tokens
              const owner = await safeContractCall(() => contract.ownerOf(i));
              if (!owner) return null;
              
              const tokenURI = await safeContractCall(() => contract.tokenURI(i));
              if (!tokenURI) return null;

              let metadata: NftMetadata;
              if (tokenURI.startsWith('data:application/json;base64,')) {
                const base64String = tokenURI.split(',')[1];
                const jsonString = Buffer.from(base64String, 'base64').toString('utf8');
                metadata = JSON.parse(jsonString);
              } else {
                 // Fallback for http URLs if needed in future
                 const response = await fetch(tokenURI);
                 if (!response.ok) return null;
                 metadata = await response.json();
              }
              
              const promptAttr = metadata.attributes?.find(attr => attr.trait_type === "Refined Prompt")?.value || "No prompt found";

              return {
                id: i.toString(),
                creator: `${owner.substring(0, 6)}...${owner.substring(owner.length - 4)}`,
                prompt: metadata.name || promptAttr,
                imageUrl: metadata.image,
                avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${owner}`,
              };
            } catch (err) {
              // This error is expected if a token was burned or doesn't exist.
              // console.log(`Token with ID ${i} likely doesn't exist or was burned.`, err);
              return null;
            }
          })());
        }

        const results = await Promise.all(nftPromises);
        const validNfts = results.filter((nft): nft is NftData => nft !== null).reverse(); // Show newest first
        setNfts(validNfts);

      } catch (err) {
        console.error("Failed to fetch NFTs:", err);
        setError("Could not load the gallery. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNfts();
  }, []);

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {nfts.map((nft) => (
              <Card key={nft.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <Image
                    src={nft.imageUrl}
                    alt={nft.prompt}
                    width={600}
                    height={600}
                    className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
                    unoptimized // Necessary for external image hosts like i.ibb.co if not in next.config.js
                  />
                </CardContent>
                <CardHeader className="p-4">
                  <CardTitle className="truncate text-base">{nft.prompt}</CardTitle>
                </CardHeader>
                <CardFooter className="p-4 pt-0">
                    <div className="flex w-full items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={nft.avatarUrl} alt={nft.creator} />
                            <AvatarFallback>{nft.creator.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">by {nft.creator}</span>
                    </div>
                </CardFooter>
              </Card>
            ))}
          </div>
      )}
    </div>
  );
}
