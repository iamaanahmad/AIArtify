
"use client";

import { useState } from "react";
import { Copy, Sparkles, Wand2 } from "lucide-react";
import Image from "next/image";
import { ethers } from "ethers";

import { alithPromptHelper, type AlithPromptHelperOutput } from "@/ai/flows/alith-prompt-helper";
import { generateArt } from "@/ai/flows/generate-art-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { contractConfig } from "@/lib/web3/config";
import { useWallet } from "@/hooks/use-wallet";
import Link from "next/link";
import { ToastAction } from "@/components/ui/toast";

export default function GeneratePage() {
  const [prompt, setPrompt] = useState<string>("A stoic robot meditating in a cherry blossom garden, detailed, 4k");
  const [refinedResult, setRefinedResult] = useState<AlithPromptHelperOutput | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const { walletAddress, connectWallet, isBrowser } = useWallet();

  const { toast } = useToast();

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
      const result = await alithPromptHelper({ prompt });
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
    try {
      const result = await generateArt({ prompt });
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
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
        
        toast({
            title: "Minting in Progress",
            description: "Please approve the transaction in your wallet.",
        });

        const metadata = {
            name: refinedResult?.title || "AIArtify NFT",
            description: `An AI-generated artwork. Original prompt: "${prompt}"`,
            image: imageUrl,
            attributes: [
              {
                trait_type: "Original Prompt",
                value: prompt,
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
        const tokenURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;
        
        const contractWithSigner = contract.connect(signer);
        const transaction = await contractWithSigner.mintNFT(walletAddress, tokenURI);
        
        toast({
            title: "Transaction Sent",
            description: "Waiting for confirmation from the blockchain...",
        });

        const receipt = await transaction.wait();
        
        toast({
            title: "🎉 NFT Minted Successfully!",
            description: (
              <div className="flex flex-col gap-2">
                  <p>Your artwork is now a permanent part of the blockchain.</p>
                  <div className="flex items-center gap-2 text-xs font-mono bg-muted text-muted-foreground p-2 rounded-md">
                      <span className="truncate">Tx: {receipt.hash}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(receipt.hash)}>
                          <Copy className="h-4 w-4" />
                      </Button>
                  </div>
              </div>
            ),
            action: (
              <ToastAction altText="View on Explorer" asChild>
                <Link href={`https://hyperion-testnet-explorer.metisdevops.link/tx/${receipt.hash}`} target="_blank">
                  View on Explorer
                </Link>
              </ToastAction>
            ),
        });

    } catch (error: any) {
        console.error("Error minting NFT:", error);
        toast({
            variant: "destructive",
            title: "Minting Failed",
            description: error.reason || "An unexpected error occurred during minting.",
        });
    } finally {
        setIsMinting(false);
    }
  }

  const isCtaDisabled = isRefining || isGenerating || isMinting;
  const isGenerateDisabled = isCtaDisabled || !prompt;
  const isMintDisabled = isCtaDisabled || !imageUrl;

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
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleRefinePrompt} disabled={isCtaDisabled}>
                <Sparkles className="mr-2" />
                {isRefining ? "Refining with Alith..." : "Refine with Alith"}
              </Button>
              <Button onClick={handleGenerateArt} disabled={isGenerateDisabled} className="w-full sm:w-auto flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
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
                  data-ai-hint="futuristic abstract"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
                    <Wand2 className="mb-4 size-16" />
                    <p className="text-lg font-medium">Your art will appear here</p>
                    <p className="text-sm">Start by entering a prompt and clicking "Generate Art".</p>
                </div>
              )}
            </div>
            {imageUrl && !walletAddress && (
                <Button size="lg" onClick={connectWallet} disabled={isCtaDisabled}>
                    Connect Wallet to Mint
                </Button>
            )}
            {imageUrl && walletAddress && (
                <div className="flex flex-col items-center gap-4">
                     <p className="text-sm text-muted-foreground">Connected: {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</p>
                    <Button size="lg" onClick={handleMintNFT} disabled={isMintDisabled}>
                        {isMinting ? "Minting in Progress..." : "Mint as NFT"}
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
