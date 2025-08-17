"use client";

import { useState } from "react";
import { Copy, Sparkles, Wand2, CheckCircle } from "lucide-react";
import Image from "next/image";
import axios from "axios";

import { type AlithPromptHelperOutput } from "@/ai/flows/alith-prompt-helper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

  const { toast } = useToast();
  const { walletAddress, connectWallet, isBrowser, isCorrectNetwork, switchToMetisNetwork } = useWallet();

  // LazAI prompting enhancement
  const handleAlithRefinement = async () => {
    setIsRefining(true);
    setRefinedResult(null);

    try {
      const response = await fetch('/api/alith-prompt-helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalPrompt: prompt }),
      });

      const data = await response.json();

      if (response.ok) {
        setRefinedResult(data);
        toast({
          title: "Prompt Enhanced Successfully!",
          description: "Your prompt has been optimized with LazAI's reasoning. You can now generate improved artwork.",
        });
      } else {
        throw new Error(data.error || 'Refinement failed');
      }
    } catch (error: any) {
      console.error('Error refining prompt:', error);
      toast({
        variant: "destructive",
        title: "Refinement failed",
        description: error.message || "Failed to enhance prompt. Please try again.",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleImageGeneration = async () => {
    if (!refinedResult) {
      toast({
        variant: "destructive",
        title: "No enhanced prompt",
        description: "Please refine your prompt first using LazAI enhancement.",
      });
      return;
    }

    setIsGenerating(true);
    setImageUrl(null);

    try {
      const response = await fetch('/api/generate-art', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: refinedResult.refinedPrompt,
          originalPrompt: prompt,
          reasoning: refinedResult.reasoning
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setImageUrl(data.imageUrl);
        toast({
          title: "Artwork Generated Successfully!",
          description: "Your enhanced prompt has created beautiful artwork. You can now mint it as an NFT.",
        });
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Failed to generate artwork. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const uploadImageToImgBB = async (imageDataUrl: string): Promise<string> => {
    const imgbbApiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!imgbbApiKey) {
      throw new Error("ImgBB API key not configured");
    }

    const base64Data = imageDataUrl.split(",")[1];
    if (!base64Data) {
      throw new Error("Invalid image data URL");
    }

    const formData = new FormData();
    formData.append("image", base64Data);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
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

    setIsMinting(true);
    setLastMintTx(null);
    
    try {
        setMintingStep("Step 1/3: Preparing Artwork...");
        // Upload image to get a stable URL
        const hostedImageUrl = await uploadImageToImgBB(imageUrl);

        setMintingStep("Step 2/3: Creating Metadata...");
        const metadata = {
            name: refinedResult?.title || "AIArtify NFT",
            description: `AI-generated artwork from AIArtify (Demo Mode)`,
            image: hostedImageUrl,
            attributes: [
              { trait_type: "Creator", value: "AIArtify" },
              { trait_type: "AI Enhanced", value: "Yes" },
              { trait_type: "Mode", value: "Demo" },
              { trait_type: "Prompt", value: prompt.substring(0, 100) + "..." }
            ]
        };
        
        setMintingStep("Step 3/3: Minting NFT (Demo Mode)...");
        
        // Use mock minting endpoint
        console.log('🎭 Using demo minting mode');
        const response = await fetch('/api/mock-mint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: walletAddress,
            tokenURI: JSON.stringify(metadata)
          })
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Demo minting failed');
        }

        console.log('✅ Demo mint successful:', result);

        // Store NFT metadata locally
        const nftMetadata = {
          tokenId: result.tokenId.toString(),
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          originalPrompt: prompt,
          refinedPrompt: refinedResult?.refinedPrompt || prompt,
          txHash: result.transactionHash,
          contractAddress: result.contractAddress,
          minted: new Date().toISOString(),
          mode: "demo"
        };
        
        const existingNFTs = JSON.parse(localStorage.getItem('aiartifyNFTs') || '[]');
        existingNFTs.push(nftMetadata);
        localStorage.setItem('aiartifyNFTs', JSON.stringify(existingNFTs));

        setLastMintTx(result.transactionHash);

        toast({
            title: "🎉 NFT Minted Successfully! (Demo)",
            description: "Your artwork has been created in demo mode. Deploy a real contract for blockchain minting.",
            action: (
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button variant="outline" size="sm" onClick={() => handleCopy(result.transactionHash)}>
                  <Copy className="mr-2" /> Copy ID
                </Button>
                <ToastAction altText="View Details" asChild>
                  <Link href="#" onClick={(e) => { e.preventDefault(); console.log('Demo NFT:', nftMetadata); }}>
                    View Details
                  </Link>
                </ToastAction>
              </div>
            ),
            duration: 10000,
        });

    } catch (error: any) {
        console.error("❌ Error in demo minting:", error);
        
        toast({
            variant: "destructive",
            title: "Demo Minting Failed",
            description: error.message || "An error occurred during demo minting.",
            duration: 8000,
        });
    } finally {
        setIsMinting(false);
        setMintingStep("");
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `Copied: ${text.substring(0, 20)}...`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Dynamically determine button text and state
  const isCtaDisabled = isRefining || isGenerating || isMinting;
  const isGenerateDisabled = !refinedResult || isGenerating || isMinting;

  return (
    <div className="container mx-auto max-w-3xl py-4 sm:py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Create with AI
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Transform your ideas into stunning digital art using advanced AI and mint them as NFTs
          </p>
        </div>

        {/* Wallet Connection Alert */}
        {walletAddress && !isCorrectNetwork && (
          <Alert variant="destructive">
            <AlertTitle>Wrong Network</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Please switch to Metis Hyperion network to mint NFTs.</span>
              <Button variant="outline" size="sm" onClick={switchToMetisNetwork}>
                Switch Network
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Prompt Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Step 1: Describe Your Vision
            </CardTitle>
            <CardDescription>
              Enter a detailed description of the artwork you want to create
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe your artwork in detail..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={handleAlithRefinement} 
              disabled={isCtaDisabled || !prompt.trim()}
              className="w-full"
            >
              {isRefining ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Enhancing with LazAI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Enhance Prompt with LazAI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Enhanced Prompt Display */}
        {refinedResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Step 2: LazAI Enhanced Prompt
              </CardTitle>
              <CardDescription>
                Your prompt has been optimized for better results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Enhanced Prompt:</h4>
                <p className="text-sm bg-muted p-3 rounded">{refinedResult.refinedPrompt}</p>
              </div>
              {refinedResult.reasoning && (
                <div className="space-y-2">
                  <h4 className="font-medium">LazAI's Reasoning:</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{refinedResult.reasoning}</p>
                </div>
              )}
              <Button 
                onClick={handleImageGeneration} 
                disabled={isGenerateDisabled}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Generating Artwork...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Artwork
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Generated Image */}
        {isGenerating && (
          <Card>
            <CardHeader>
              <CardTitle>Generating Your Artwork...</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-square w-full rounded-md" />
            </CardContent>
          </Card>
        )}

        {imageUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Step 3: Your AI Artwork
              </CardTitle>
              <CardDescription>
                Beautiful! Your enhanced prompt created this unique artwork
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                <Image
                  src={imageUrl}
                  alt="Generated artwork"
                  fill
                  className="object-cover"
                />
              </div>

              {/* NFT Minting Section */}
              {!walletAddress && imageUrl && (
                <Button onClick={connectWallet} className="w-full">
                  Connect Wallet to Mint NFT
                </Button>
              )}

              {walletAddress && imageUrl && !lastMintTx && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Connected: {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</p>
                  <Button 
                    onClick={handleMintNFT} 
                    disabled={isMinting}
                    className="w-full"
                  >
                    {isMinting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        {mintingStep || "Minting NFT..."}
                      </>
                    ) : (
                      "Mint as NFT (Demo Mode)"
                    )}
                  </Button>
                </div>
              )}

              {lastMintTx && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>NFT Minted Successfully!</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>Transaction ID: {lastMintTx.substring(0, 20)}...</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleCopy(lastMintTx)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
