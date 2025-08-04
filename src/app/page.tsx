
"use client";

import { useState } from "react";
import { Copy, Sparkles, Wand2, CheckCircle } from "lucide-react";
import Image from "next/image";
import { ethers } from "ethers";
import axios from "axios";

import { type AlithPromptHelperOutput } from "@/ai/flows/alith-prompt-helper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { contractConfig } from "@/lib/web3/config";
import { storeNftMetadata } from "@/lib/nft-storage";
import { useWallet } from "@/hooks/use-wallet";
import Link from "next/link";
import { ToastAction } from "@/components/ui/toast";

export default function GeneratePage() {
  const [prompt, setPrompt] = useState<string>("A majestic lion with a crown of stars, in a cosmic nebula, hyperrealistic, 4k");
  const [refinedResult, setRefinedResult] = useState<AlithPromptHelperOutput | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStep, setMintingStep] = useState("");
  const [lastMintTx, setLastMintTx] = useState<string | null>(null);

  const { walletAddress, connectWallet, isBrowser, isCorrectNetwork, switchToMetisNetwork } = useWallet();

  const { toast } = useToast();

  const handleCreateAnother = () => {
    setRefinedResult(null);
    setImageUrl(null);
    setLastMintTx(null);
    setMintingStep("");
    setPrompt("A new masterpiece, a futuristic city floating in the clouds, detailed, 4k");
  }

  const handleRefinePrompt = async () => {
    if (!prompt) {
      toast({
        variant: "destructive",
        title: "Prompt is empty",
        description: "Please enter a prompt to refine.",
      });
      return;
    }
    setIsRefining(true);
    setRefinedResult(null);
    try {
      const response = await fetch('/api/alith-prompt-helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to refine prompt');
      }
      
      const result = await response.json();
      setRefinedResult(result);
      setPrompt(result.refinedPrompt);
    } catch (error) {
      console.error("Error refining prompt:", error);
      toast({
        variant: "destructive",
        title: "Failed to refine prompt",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerateArt = async () => {
    if (!prompt) {
      toast({
        variant: "destructive",
        title: "Prompt is empty",
        description: "Please enter a prompt to generate art.",
      });
      return;
    }
    setIsGenerating(true);
    setImageUrl(null);
    setLastMintTx(null);
    try {
      const response = await fetch('/api/generate-art', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate art');
      }
      
      const result = await response.json();
      setImageUrl(result.imageUrl);
    } catch (error) {
      console.error("Error generating art:", error);
      toast({
        variant: "destructive",
        title: "Failed to generate art",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
    });
  };

  const uploadImageToImgBB = async (dataUri: string): Promise<string> => {
    console.log('=== IMGBB UPLOAD DEBUG ===');
    console.log('Input data URI length:', dataUri.length);
    console.log('Data URI prefix:', dataUri.substring(0, 50));
    
    // We expect the data URI to be 'data:image/png;base64,....'
    // The API needs just the base64 part.
    const base64Data = dataUri.split(",")[1];
    console.log('Extracted base64 length:', base64Data.length);
    
    const formData = new FormData();
    formData.append("image", base64Data);

    console.log('Uploading to ImgBB...');
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=5646315e9455d5ea1fa66362d1b33433`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log('ImgBB response status:', response.status);
    console.log('ImgBB response data:', response.data);

    if (response.data.success) {
      // Use the https URL for better compatibility and to avoid mixed content issues.
      const imageUrl = response.data.data.url.replace(/^http:/, 'https:');
      console.log('✅ Image uploaded successfully:', imageUrl);
      return imageUrl;
    } else {
      console.error('❌ ImgBB upload failed:', response.data);
      throw new Error("Image upload failed: " + response.data.error.message);
    }
  };

  const handleMintNFT = async () => {
    if (!walletAddress || !imageUrl) {
        toast({
            variant: "destructive",
            title: "Prerequisites not met",
            description: "Please connect your wallet and generate an image before minting.",
        });
        return;
    }

    if (!isBrowser || !window.ethereum) {
        toast({
            variant: "destructive",
            title: "MetaMask not found",
            description: "Please ensure MetaMask is installed and active.",
        });
        return;
    }

    setIsMinting(true);
    setLastMintTx(null);
    
    try {
        setMintingStep("Step 1/3: Preparing Artwork...");
        // The image is already a data URI from the AI. We need to upload it to get a stable URL.
        const hostedImageUrl = await uploadImageToImgBB(imageUrl);

        setMintingStep("Step 2/3: Creating On-Chain Metadata...");
        const metadata = {
            name: refinedResult?.title || "AIArtify NFT",
            description: `An AI-generated artwork from AIArtify.`,
            image: hostedImageUrl, // Use the public URL from the image host
            attributes: [
              {
                trait_type: "Original Prompt",
                value: prompt, // This is the final prompt used for generation
              },
              {
                trait_type: "Refined Prompt",
                value: refinedResult?.refinedPrompt || prompt,
              },
              {
                trait_type: "Alith's Reasoning",
                value: refinedResult?.reasoning || "N/A",
              }
            ]
        };

        // Encode the metadata to a Base64 data URI
        const metadataJson = JSON.stringify(metadata);
        const base64Metadata = Buffer.from(metadataJson).toString('base64');
        const tokenURI = `data:application/json;base64,${base64Metadata}`;
        
        // Debug: Log the metadata and tokenURI we're about to send
        console.log('=== MINTING DEBUG ===');
        console.log('Metadata object:', metadata);
        console.log('Metadata JSON:', metadataJson);
        console.log('Base64 metadata length:', base64Metadata.length);
        console.log('TokenURI length:', tokenURI.length);
        console.log('TokenURI preview:', tokenURI.substring(0, 100) + '...');
        
        setMintingStep("Step 3/3: Minting in your wallet...");

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
        
        // Debug: Test if we can call the contract function before minting
        console.log('Testing contract before minting...');
        try {
          const testCall = await contract.name();
          console.log('Contract name:', testCall);
        } catch (testError) {
          console.error('Contract test call failed:', testError);
        }
        
        // We no longer need to estimate gas manually if the transaction is simple
        console.log('Calling mintNFT with params:', { to: walletAddress, tokenURI: tokenURI.substring(0, 50) + '...' });
        const transaction = await contract.mintNFT(walletAddress, tokenURI);
        
        setMintingStep("Waiting for blockchain confirmation...");

        const receipt = await transaction.wait();
        
        if (!receipt) {
          throw new Error("Transaction receipt is null");
        }

        console.log('=== POST-MINT VERIFICATION ===');
        console.log('Transaction receipt:', receipt);
        
        // Extract token ID from the receipt
        let tokenId: bigint | null = null;
        try {
          // Look for Transfer event in the logs
          const transferLog = receipt.logs.find((log: any) => {
            try {
              const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
              return parsed?.name === 'Transfer' && parsed.args[0] === ethers.ZeroAddress;
            } catch {
              return false;
            }
          });
          
          if (transferLog) {
            const parsed = contract.interface.parseLog({ topics: transferLog.topics, data: transferLog.data });
            tokenId = parsed?.args[2] as bigint;
            console.log('Minted token ID:', tokenId?.toString());
            
            // Store NFT metadata locally as a fallback
            if (tokenId) {
              const nftMetadata = {
                tokenId: tokenId.toString(),
                name: metadata.name,
                description: metadata.description,
                image: metadata.image,
                originalPrompt: metadata.attributes.find(attr => attr.trait_type === "Original Prompt")?.value || "",
                refinedPrompt: metadata.attributes.find(attr => attr.trait_type === "Refined Prompt")?.value || "",
                reasoning: metadata.attributes.find(attr => attr.trait_type === "Alith's Reasoning")?.value || "",
                txHash: receipt.hash,
                mintedAt: Date.now(),
                walletAddress: walletAddress!
              };
              storeNftMetadata(nftMetadata);
              console.log('✅ Stored NFT metadata locally for token:', tokenId.toString());
            }
            
            // Immediately try to fetch the tokenURI to see if it was stored
            if (tokenId) {
              setTimeout(async () => {
                try {
                  console.log('Verifying tokenURI storage...');
                  const storedURI = await contract.tokenURI(tokenId);
                  console.log('Stored tokenURI:', storedURI);
                  console.log('Original tokenURI:', tokenURI);
                  console.log('URIs match:', storedURI === tokenURI);
                  
                  if (!storedURI) {
                    console.error('❌ CRITICAL: tokenURI was not stored in contract!');
                    console.log('✅ Using local storage fallback instead');
                  } else if (storedURI === tokenURI) {
                    console.log('✅ SUCCESS: tokenURI was stored correctly');
                  } else {
                    console.warn('⚠️ WARNING: tokenURI was stored but differs from original');
                  }
                } catch (verifyError) {
                  console.error('Failed to verify tokenURI:', verifyError);
                  console.log('✅ Contract has issues, but local storage backup available');
                }
              }, 2000); // Wait 2 seconds for blockchain to settle
            }
          }
        } catch (logError) {
          console.error('Failed to parse transaction logs:', logError);
        }

        setLastMintTx(receipt.hash);

        toast({
            title: "🎉 NFT Minted Successfully!",
            description: "Your artwork is now a permanent part of the blockchain.",
            action: (
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button variant="outline" size="sm" onClick={() => handleCopy(receipt.hash)}>
                  <Copy className="mr-2" /> Copy Tx
                </Button>
                <ToastAction altText="View on Explorer" asChild>
                  <Link href={`https://hyperion-testnet-explorer.metisdevops.link/tx/${receipt.hash}`} target="_blank">
                    View on Explorer
                  </Link>
                </ToastAction>
              </div>
            ),
            duration: 10000,
        });

    } catch (error: any) {
        console.error("Error minting NFT:", error);
        const errorMessage = error.reason || error.message || "An unexpected error occurred during minting.";
        toast({
            variant: "destructive",
            title: "Minting Failed",
            description: errorMessage.length > 100 ? `${errorMessage.substring(0, 100)}...` : errorMessage,
        });
    } finally {
        setIsMinting(false);
        setMintingStep("");
    }
  }

  const isCtaDisabled = isRefining || isGenerating || isMinting;
  const isGenerateDisabled = isCtaDisabled || !prompt;

  return (
    <div className="container mx-auto max-w-3xl py-4 sm:py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Create with AI
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Bring your imagination to life. Describe anything, and our AI will create a unique piece of art for you.
          </p>
        </div>

        {walletAddress && !isCorrectNetwork && (
          <Alert variant="destructive">
            <AlertTitle>Wrong Network</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Please switch to Metis Hyperion Testnet to mint NFTs.</span>
              <Button variant="outline" size="sm" onClick={switchToMetisNetwork}>
                Switch Network
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>1. Describe Your Vision</CardTitle>
            <CardDescription>
              Enter a detailed prompt. The more specific you are, the better the result.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="e.g., A majestic lion with a crown of stars, in a cosmic nebula, hyperrealistic, 4k"
              className="min-h-[120px] resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isCtaDisabled || !!lastMintTx}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleRefinePrompt} disabled={isCtaDisabled || !!lastMintTx}>
                <Sparkles className="mr-2" />
                {isRefining ? "Refining with Alith..." : "Refine with Alith"}
              </Button>
              <Button onClick={handleGenerateArt} disabled={isGenerateDisabled || !!lastMintTx} className="w-full sm:w-auto flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                <Wand2 className="mr-2" />
                {isGenerating ? "Generating Art..." : "Generate Art"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isRefining && <Skeleton className="h-24 w-full" />}

        {refinedResult?.reasoning && (
          <Alert>
             <Sparkles className="h-4 w-4" />
            <AlertTitle>{refinedResult.title || "Alith's Suggestion"}</AlertTitle>
            <AlertDescription>
                {refinedResult.reasoning}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>2. Your Artwork</CardTitle>
            <CardDescription>
              Mint your masterpiece as an NFT on the Hyperion testnet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="aspect-square w-full max-w-md rounded-lg border-2 border-dashed bg-card-foreground/5">
              {isGenerating ? (
                <div className="flex h-full w-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Wand2 className="mb-4 size-16 animate-pulse" />
                  <p className="text-lg font-medium">Generating your art...</p>
                  <p className="text-sm">This may take a moment.</p>
                </div>
              ) : imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={prompt}
                  width={1024}
                  height={1024}
                  className="h-full w-full rounded-md object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
                    <Wand2 className="mb-4 size-16" />
                    <p className="text-lg font-medium">Your art will appear here</p>
                    <p className="text-sm">Start by entering a prompt and clicking "Generate Art".</p>
                </div>
              )}
            </div>

            <div className="flex w-full max-w-md flex-col items-center gap-4">
              {!walletAddress && imageUrl && (
                  <Button size="lg" onClick={connectWallet} disabled={isCtaDisabled}>
                      Connect Wallet to Mint
                  </Button>
              )}

              {walletAddress && imageUrl && !lastMintTx && (
                  <>
                      <p className="text-sm text-muted-foreground">Connected: {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</p>
                      <Button size="lg" onClick={handleMintNFT} disabled={isMinting}>
                          {isMinting ? "Minting in Progress..." : "Mint as NFT"}
                      </Button>
                      {mintingStep && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary/80"></span>
                              </span>
                              <span>{mintingStep}</span>
                          </div>
                      )}
                  </>
              )}

              {lastMintTx && (
                <div className="flex w-full flex-col items-center gap-4 rounded-lg border bg-background p-4 text-center">
                    <CheckCircle className="size-12 text-green-500" />
                    <h3 className="text-lg font-semibold">Minted Successfully!</h3>
                    <p className="text-sm text-muted-foreground">Your artwork is permanently on the blockchain.</p>
                    <div className="flex w-full flex-col gap-2 sm:flex-row">
                      <Button asChild variant="outline" className="flex-1">
                          <Link href={`https://hyperion-testnet-explorer.metisdevops.link/tx/${lastMintTx}`} target="_blank">
                              View Transaction
                          </Link>
                      </Button>
                      <Button onClick={handleCreateAnother} className="flex-1">
                          Create Another
                      </Button>
                    </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
