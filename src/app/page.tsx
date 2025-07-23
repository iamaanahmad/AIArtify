
"use client";

import { useState, useEffect } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import Image from "next/image";

import { alithPromptHelper, type AlithPromptHelperOutput } from "@/ai/flows/alith-prompt-helper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// A simple check if the code is running in a browser environment
const isBrowser = typeof window !== "undefined";

export default function GeneratePage() {
  const [prompt, setPrompt] = useState<string>("");
  const [refinedResult, setRefinedResult] = useState<AlithPromptHelperOutput | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Check if a wallet is already connected when the component mounts
    const checkIfWalletIsConnected = async () => {
      if (isBrowser && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking for connected wallet:", error);
        }
      }
    };
    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    if (!isBrowser || !window.ethereum) {
        toast({
            variant: "destructive",
            title: "MetaMask not found",
            description: "Please install the MetaMask extension to connect your wallet.",
        });
        return;
    }
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        toast({
            title: "Wallet Connected",
            description: "Your wallet has been successfully connected.",
        });
    } catch (error) {
        console.error("Error connecting to wallet:", error);
        toast({
            variant: "destructive",
            title: "Wallet connection failed",
            description: "Could not connect to your wallet. Please try again.",
        });
    }
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
    // Simulate API call for image generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const randomImageId = Math.floor(Math.random() * 1000);
    setImageUrl(`https://placehold.co/1024x1024.png?id=${randomImageId}`);
    setIsGenerating(false);
  };

  const handleMintNFT = async () => {
    if (!walletAddress) {
        toast({
            variant: "destructive",
            title: "Wallet not connected",
            description: "Please connect your wallet before minting.",
        });
        return;
    }
    setIsMinting(true);
    toast({
        title: "Minting in Progress",
        description: "Please approve the transaction in your wallet. Your NFT is being minted on the Hyperion testnet.",
    });

    // TODO: Replace with actual smart contract minting logic
    // For now, we'll just simulate the delay
    await new Promise((resolve) => setTimeout(resolve, 5000));

    toast({
        title: "🎉 NFT Minted Successfully!",
        description: "Your artwork is now a permanent part of the blockchain.",
    });
    setIsMinting(false);
  }

  const isCtaDisabled = isRefining || isGenerating || isMinting;
  const isGenerateDisabled = isCtaDisabled || !prompt;
  const isMintDisabled = isCtaDisabled || !imageUrl;

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight lg:text-5xl">
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
              <Button onClick={handleRefinePrompt} disabled={isCtaDisabled} className="w-full">
                <Sparkles className="mr-2" />
                {isRefining ? "Refining with Alith..." : "Refine with Alith"}
              </Button>
              <Button onClick={handleGenerateArt} disabled={isGenerateDisabled} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
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
            <AlertTitle>Alith's Suggestion</AlertTitle>
            <AlertDescription>
                {refinedResult.reasoning}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>2. Your Artwork</CardTitle>
            <CardDescription>
              Connect your wallet, then mint your masterpiece as an NFT on the Hyperion testnet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="aspect-square w-full max-w-md rounded-lg border-2 border-dashed bg-card-foreground/5">
              {isGenerating ? (
                <Skeleton className="h-full w-full" />
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
                <div className="flex h-full w-full flex-col items-center justify-center text-center text-muted-foreground">
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

// Add a declaration for the ethereum object
declare global {
    interface Window {
        ethereum?: any;
    }
}
