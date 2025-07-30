
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-wallet";
import { contractConfig } from "@/lib/web3/config";
import { safeContractCall } from "@/lib/web3/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet } from "lucide-react";

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

const getRpcProvider = () => {
    return new ethers.JsonRpcProvider("https://hyperion-testnet.metisdevops.link", 599);
};

export default function CollectionPage() {
  const { walletAddress, connectWallet } = useWallet();
  const [nfts, setNfts] = useState<NftData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNfts = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = getRpcProvider();
      const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);

      // Create a filter to find all Transfer events where the 'to' address is the user's wallet
      const filter = contract.filters.Transfer(null, address);
      const events = await contract.queryFilter(filter);

      if (events.length === 0) {
        setNfts([]);
        setIsLoading(false);
        return;
      }
      
      const nftPromises = events.map(async (event): Promise<NftData | null> => {
        // The token ID is the third argument in the Transfer event
        // Handle both EventLog and Log types
        if (!('args' in event) || !event.args) return null;
        const tokenId = event.args[2];
        if (!tokenId) return null;

        try {
          // Use safe contract calls to handle non-existent tokens
          const owner = await safeContractCall(() => contract.ownerOf(tokenId));
          if (!owner) return null;
          
          const tokenURI = await safeContractCall(() => contract.tokenURI(tokenId));
          if (!tokenURI) return null;
          
          if (tokenURI.startsWith('data:application/json;base64,')) {
            const base64String = tokenURI.split(',')[1];
            const jsonString = Buffer.from(base64String, 'base64').toString('utf8');
            const metadata: NftMetadata = JSON.parse(jsonString);

            return {
              id: tokenId.toString(),
              title: metadata.name,
              prompt: metadata.attributes.find(attr => attr.trait_type === "Refined Prompt")?.value || "N/A",
              imageUrl: metadata.image,
              txHash: event.transactionHash,
            };
          }
          return null;
        } catch (err) {
          console.error(`Failed to fetch metadata for token ${tokenId}:`, err);
          return null;
        }
      });
      
      const results = await Promise.all(nftPromises);
      const validNfts = results.filter((nft): nft is NftData => nft !== null).reverse(); // Show most recent first
      setNfts(validNfts);

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
    } else {
      setIsLoading(false); // Not loading if there's no wallet
    }
  }, [walletAddress, fetchNfts]);

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
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
          My Collection
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Here are the unique artworks you've created and minted on the blockchain.
        </p>
      </div>

      {nfts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {nfts.map((nft) => (
            <Card key={nft.id} className="flex flex-col overflow-hidden">
              <CardContent className="p-0">
                <Image
                  src={nft.imageUrl}
                  alt={nft.title}
                  width={600}
                  height={600}
                  className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
                  unoptimized
                />
              </CardContent>
              <CardHeader className="flex-grow p-4">
                <CardTitle className="truncate text-base">{nft.title}</CardTitle>
                <CardFooter className="p-0 pt-2 text-xs text-muted-foreground">
                    Token ID: {nft.id}
                </CardFooter>
              </CardHeader>
              <CardFooter className="flex justify-end p-4 pt-0">
                {nft.txHash && (
                     <Button variant="link" size="sm" className="h-auto p-0" asChild>
                        <Link href={`https://hyperion-testnet-explorer.metisdevops.link/tx/${nft.txHash}`} target="_blank">
                            View on Explorer
                        </Link>
                    </Button>
                )}
              </CardFooter>
            </Card>
          ))}
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
    </div>
  );
}
