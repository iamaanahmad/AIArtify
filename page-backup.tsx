
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
  // BONUS TRACK: Enhanced UX states for LazAI integration
  const [lazaiProcessing, setLazaiProcessing] = useState(false);
  const [lazaiStep, setLazaiStep] = useState("");

  const { walletAddress, connectWallet, isBrowser, isCorrectNetwork, switchToMetisNetwork } = useWallet();

  const { toast } = useToast();

  // Simple markdown processing function for AI reasoning text
  const processMarkdown = (text: string): JSX.Element[] => {
    if (!text) return [];
    
    // Split text by **bold** patterns
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove the ** and make it bold
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold text-gray-900 dark:text-gray-100">{boldText}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Computed state for button controls
  const isCtaDisabled = isRefining || isGenerating || isMinting;
  const isGenerateDisabled = isCtaDisabled || !prompt;

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
    setLazaiProcessing(true);
    setLazaiStep("Initializing Alith AI...");
    setRefinedResult(null);
    try {
      setLazaiStep("Connecting to LazAI network...");
      
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
      
      setLazaiStep("Processing with LazAI reasoning...");
      const result = await response.json();
      
      setRefinedResult(result);
      setPrompt(result.refinedPrompt);
      
      // Show success message with LazAI details if available
      if (result.lazaiReasoning) {
        setLazaiStep("LazAI reasoning completed!");
        toast({
          title: "🚀 Enhanced with LazAI!",
          description: `Prompt refined using ${result.lazaiModel || 'LazAI'} with ${Math.round((result.lazaiConfidence || 0) * 100)}% confidence`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Prompt refined!",
          description: "Your prompt has been enhanced by Alith AI",
        });
      }
    } catch (error) {
      console.error("Error refining prompt:", error);
      toast({
        variant: "destructive",
        title: "Failed to refine prompt",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsRefining(false);
      setLazaiProcessing(false);
      setLazaiStep("");
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
  }
    
    try {
        setMintingStep("Step 1/3: Preparing Artwork...");
        // The image is already a data URI from the AI. We need to upload it to get a stable URL.
        const hostedImageUrl = await uploadImageToImgBB(imageUrl);

        setMintingStep("Step 2/3: Creating On-Chain Metadata...");
        const metadata = {
            name: refinedResult?.title || "AIArtify NFT",
            description: `An AI-generated artwork from AIArtify, enhanced with LazAI reasoning.`,
            image: hostedImageUrl, // Use the public URL from the image host
            attributes: [
              {
                trait_type: "Original Prompt",
                value: prompt.substring(0, 200), // Limit length
              },
              {
                trait_type: "Refined Prompt", 
                value: (refinedResult?.refinedPrompt || prompt).substring(0, 200),
              },
              {
                trait_type: "Creator",
                value: "AIArtify"
              },
              {
                trait_type: "AI Enhanced",
                value: "Yes"
              }
            ]
        };

        // Store metadata externally using IPFS or create a shorter tokenURI
        setMintingStep("Step 2/3: Preparing metadata...");
        let tokenURI: string;
        
        // Create a much simpler metadata object to avoid size limits
        const simpleMetadata = {
          name: metadata.name,
          description: metadata.description.substring(0, 100) + "...",
          image: hostedImageUrl,
          attributes: [
            { trait_type: "Creator", value: "AIArtify" },
            { trait_type: "AI Enhanced", value: "Yes" },
            { trait_type: "Prompt", value: prompt.substring(0, 100) + "..." }
          ]
        };
        
        const metadataJson = JSON.stringify(simpleMetadata);
        const base64Metadata = Buffer.from(metadataJson).toString('base64');
        tokenURI = `data:application/json;base64,${base64Metadata}`;
        
        // Debug: Log the metadata and tokenURI we're about to send
        console.log('=== MINTING DEBUG ===');
        console.log('Metadata object:', simpleMetadata);
        console.log('Metadata JSON:', metadataJson);
        console.log('Base64 metadata length:', base64Metadata.length);
        console.log('TokenURI length:', tokenURI.length);
        console.log('TokenURI preview:', tokenURI.substring(0, 100) + '...');
        
        setMintingStep("Step 3/3: Minting NFT...");

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
          // Continue anyway - the test call failure doesn't mean minting will fail
        }
        
        console.log('Calling mintNFT with params:', { 
          to: walletAddress, 
          tokenURI: tokenURI.length > 50 ? tokenURI.substring(0, 50) + '...' : tokenURI 
        });
        
        // Enhanced gas estimation and transaction handling
        let transaction;
        try {
          // First try with a reasonable fixed gas limit to avoid estimation issues
          console.log('Attempting mint with standard gas limit...');
          transaction = await contract.mintNFT(walletAddress, tokenURI, {
            gasLimit: 300000, // Conservative gas limit for NFT minting
          });
          
          console.log('✅ Transaction submitted:', transaction.hash);
        } catch (firstError: any) {
          console.warn('⚠️ First attempt failed:', firstError.message);
          
          // Check if it's a user rejection
          if (firstError.code === 'ACTION_REJECTED' || firstError.code === 4001) {
            throw new Error('Transaction rejected by user');
          }
          
          // Try with gas estimation if fixed gas failed
          try {
            console.log('Trying with gas estimation...');
            const gasEstimate = await contract.mintNFT.estimateGas(walletAddress, tokenURI);
            console.log('Gas estimate:', gasEstimate.toString());
            
            // Add 20% buffer to gas estimate
            const gasLimit = gasEstimate * BigInt(120) / BigInt(100);
            console.log('Gas limit with buffer:', gasLimit.toString());
            
            transaction = await contract.mintNFT(walletAddress, tokenURI, {
              gasLimit: gasLimit,
            });
            
            console.log('✅ Transaction submitted with estimated gas:', transaction.hash);
          } catch (secondError: any) {
            console.warn('⚠️ Gas estimation failed:', secondError.message);
            
            // Check if it's a user rejection
            if (secondError.code === 'ACTION_REJECTED' || secondError.code === 4001) {
              throw new Error('Transaction rejected by user');
            }
            
            // Final fallback: let provider handle everything
            try {
              console.log('Final attempt: letting provider handle gas...');
              transaction = await contract.mintNFT(walletAddress, tokenURI);
              console.log('✅ Transaction submitted with provider gas:', transaction.hash);
            } catch (finalError: any) {
              console.error('❌ All attempts failed:', finalError);
              
              // Check if it's a user rejection
              if (finalError.code === 'ACTION_REJECTED' || finalError.code === 4001) {
                throw new Error('Transaction rejected by user');
              }
              
              // Provide more specific error message based on the error
              if (finalError.message?.includes('execution reverted')) {
                throw new Error('Contract execution failed. The contract may have restrictions or the tokenURI may be invalid.');
              } else if (finalError.message?.includes('insufficient funds')) {
                throw new Error('Insufficient funds for transaction. Please check your METIS balance.');
              } else {
                throw new Error(`Minting failed: ${finalError.message || 'Unknown error'}`);
              }
            }
          }
        }
        
        setMintingStep("Waiting for blockchain confirmation...");
        console.log('⏳ Waiting for transaction confirmation...');

        const receipt = await transaction.wait();
        
        if (!receipt) {
          throw new Error("Transaction receipt is null");
        }
        
        if (receipt.status !== 1) {
          throw new Error(`Transaction failed with status: ${receipt.status}`);
        }

        console.log('=== MINT SUCCESS ===');
        console.log('✅ Transaction confirmed:', receipt.hash);
        console.log('📊 Gas used:', receipt.gasUsed.toString());
        console.log('💰 Gas price:', receipt.gasPrice.toString());
        
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
                // BONUS TRACK: Store LazAI reasoning data in local metadata
                lazaiReasoning: metadata.attributes.find(attr => attr.trait_type === "LazAI Reasoning")?.value || "",
                lazaiModel: metadata.attributes.find(attr => attr.trait_type === "LazAI Model")?.value || "",
                lazaiConfidence: metadata.attributes.find(attr => attr.trait_type === "LazAI Confidence")?.value || "",
                lazaiTxHash: metadata.attributes.find(attr => attr.trait_type === "LazAI Transaction")?.value || "",
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
        console.error("❌ Error minting NFT:", error);
        
        let errorMessage = "An unexpected error occurred during minting.";
        let errorTitle = "Minting Failed";
        
        // Provide specific error messages based on error type
        if (error.message?.includes('rejected by user') || error.message?.includes('User denied')) {
          errorTitle = "Transaction Cancelled";
          errorMessage = "You cancelled the transaction. No charges were made.";
        } else if (error.message?.includes('insufficient funds')) {
          errorTitle = "Insufficient Funds";
          errorMessage = "You don't have enough METIS to complete this transaction. Please add funds to your wallet.";
        } else if (error.message?.includes('execution reverted')) {
          errorTitle = "Contract Error";
          errorMessage = "The smart contract rejected the transaction. This might be due to contract restrictions or network issues.";
        } else if (error.message?.includes('network')) {
          errorTitle = "Network Error";
          errorMessage = "There was a network connection issue. Please check your internet and try again.";
        } else if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
          errorTitle = "Transaction Cancelled";
          errorMessage = "Transaction was cancelled by user.";
        } else {
          // Use the original error message but clean it up
          errorMessage = error.reason || error.message || errorMessage;
          
          // Clean up common error prefixes
          errorMessage = errorMessage
            .replace(/^Error: /, '')
            .replace(/^execution reverted: /, '')
            .replace(/^MetaMask Tx Signature: /, '');
        }
        
        toast({
            variant: "destructive",
            title: errorTitle,
            description: errorMessage.length > 150 ? `${errorMessage.substring(0, 150)}...` : errorMessage,
            duration: 8000,
        });
    } finally {
        setIsMinting(false);
        setMintingStep("");
    }
  }

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
            
            {/* BONUS TRACK: LazAI Processing Indicator */}
            {lazaiProcessing && lazaiStep && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </div>
                <span className="font-medium">🚀 LazAI Integration:</span>
                <span>{lazaiStep}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {isRefining && <Skeleton className="h-24 w-full" />}

        {refinedResult?.reasoning && (
          <Alert>
             <Sparkles className="h-4 w-4" />
            <AlertTitle>{refinedResult.title || "Alith's Suggestion"}</AlertTitle>
            <AlertDescription className="space-y-2">
                <div>{processMarkdown(refinedResult.reasoning)}</div>
                {/* BONUS TRACK: Display LazAI reasoning if available */}
                {refinedResult.lazaiReasoning && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">🚀 LazAI Enhanced Reasoning:</span>
                      {refinedResult.lazaiModel && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          {refinedResult.lazaiModel}
                        </span>
                      )}
                      {refinedResult.lazaiConfidence && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                          {Math.round(refinedResult.lazaiConfidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">{processMarkdown(refinedResult.lazaiReasoning)}</div>
                    {refinedResult.lazaiTxHash && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Reasoning stored on-chain: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{refinedResult.lazaiTxHash.substring(0, 16)}...</code>
                      </p>
                    )}
                  </div>
                )}
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
