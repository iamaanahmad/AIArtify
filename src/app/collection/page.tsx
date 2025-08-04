
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet } from "lucide-react";
import { getRpcProvider, safeContractCall, queryEventsInChunks } from "@/lib/web3/utils";
import { getNftsForWallet, getNftByTokenId, storeNftMetadata } from "@/lib/nft-storage";
import { recoverNftMetadataFromTx } from "@/lib/metadata-recovery";

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

  const fetchNfts = useCallback(async (address: string) => {
    console.log('=== COLLECTION DEBUG START ===');
    console.log('fetchNfts called with address:', address);
    console.log('Contract address:', contractConfig.address);
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
            console.log('=== STEP 6: Trying to get token metadata ===');
            
            let tokenURI = await safeContractCall(() => contract.tokenURI(tokenId));
            console.log('tokenURI() result for', tokenId.toString(), ':', tokenURI);
            
            // If tokenURI fails, try alternative methods
            if (!tokenURI) {
              console.log('tokenURI() failed, trying alternatives...');
              
              // Try getTokenURI
              tokenURI = await safeContractCall(() => contract.getTokenURI(tokenId));
              console.log('getTokenURI() result:', tokenURI);
              
              // Try uri
              if (!tokenURI) {
                tokenURI = await safeContractCall(() => contract.uri(tokenId));
                console.log('uri() result:', tokenURI);
              }
              
              // Debug: Let's check if the contract has any stored data for this token
              console.log('=== DEBUGGING CONTRACT STATE ===');
              try {
                // Try to call the contract function directly with explicit parameters
                const directCall = await contract.tokenURI.staticCall(tokenId);
                console.log('Direct staticCall result:', directCall);
              } catch (directError) {
                console.log('Direct call failed:', directError);
              }
              
              // If still no URI, try local storage fallback
              if (!tokenURI) {
                console.log('Trying local storage fallback...');
                const localNft = getNftByTokenId(tokenId.toString());
                if (localNft) {
                  console.log('✅ Found NFT in local storage:', localNft);
                  const nftData = {
                    id: localNft.tokenId,
                    title: localNft.name,
                    prompt: localNft.refinedPrompt || localNft.originalPrompt,
                    imageUrl: localNft.image,
                    txHash: localNft.txHash,
                  };
                  console.log('Local NFT data created:', nftData);
                  return nftData;
                }
                
                // Try to recover metadata from transaction data
                console.log('Trying metadata recovery from transaction...');
                const txHash = event.transactionHash;
                if (txHash) {
                  try {
                    const recoveredMetadata = await recoverNftMetadataFromTx(txHash);
                    if (recoveredMetadata) {
                      console.log('✅ Successfully recovered metadata from transaction');
                      
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
                      console.log('Recovered NFT data created:', nftData);
                      return nftData;
                    }
                  } catch (recoveryError) {
                    console.error('Failed to recover metadata:', recoveryError);
                  }
                }
                
                console.log('No metadata found in contract, local storage, or transaction data - creating default NFT entry');
                const nftData = {
                  id: tokenId.toString(),
                  title: `NFT #${tokenId.toString()}`,
                  prompt: "Metadata not available - Contract issue detected",
                  imageUrl: '/placeholder-nft.svg',
                  txHash: event.transactionHash || 'N/A',
                };
                console.log('Default NFT data created:', nftData);
                return nftData;
              }
            }
            
            if (tokenURI.startsWith('data:application/json;base64,')) {
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
                console.log('NFT data created for token', tokenId.toString(), ':', nftData);
                return nftData;
              } catch (metadataError) {
                console.error('Error parsing metadata for token', tokenId.toString(), ':', metadataError);
                return null;
              }
            } else {
              console.log('Token URI is not base64 encoded for token', tokenId.toString(), ':', tokenURI);
              return null;
            }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
            My Collection
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Here are the unique artworks you've created and minted on the blockchain.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchNfts(walletAddress!)}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
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
