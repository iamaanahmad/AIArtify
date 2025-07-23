
"use client";

import { useState, useEffect } from "react";
import { Sparkles, Wand2 } from "lucide-react";
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

        // Create metadata for the NFT
        const metadata = {
            name: "AI Artify NFT",
            description: `An AI-generated artwork based on the prompt: "${prompt}"`,
            image: imageUrl,
            prompt: prompt,
            alith_suggestion: refinedResult?.reasoning || "N/A"
        };
        const tokenURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;
        
        const transaction = await contract.mintNFT(walletAddress, tokenURI);
        
        toast({
            title: "Transaction Sent",
            description: "Waiting for confirmation from the blockchain...",
        });

        await transaction.wait();

        toast({
            title: "🎉 NFT Minted Successfully!",
            description: "Your artwork is now a permanent part of the blockchain.",
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
