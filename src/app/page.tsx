"use client";

import { useState } from "react";
import { Copy, Sparkles, Wand2, CheckCircle, Upload, ImageIcon, Zap, BarChart3, Globe } from "lucide-react";
import Image from "next/image";
import { ethers } from "ethers";
import axios from "axios";

import { type AlithPromptHelperOutput } from "@/ai/flows/alith-prompt-helper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { contractConfig } from "@/lib/web3/config";
import { storeNftMetadata } from "@/lib/nft-storage";
import { useWallet } from "@/hooks/use-wallet";
import Link from "next/link";
import { ToastAction } from "@/components/ui/toast";
import ExternalArtUpload from "@/components/external-art-upload";
import SocialShare from "@/components/social-share";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import LazAIInfo from "@/components/lazai-info";
import LazAIVerification from "@/components/lazai-verification";
import ConsensusBreakdown from "@/components/consensus-breakdown";
import { useAnalytics } from "@/lib/analytics";
import { useCollections } from "@/lib/collection-manager";
import { type SocialShareData } from "@/lib/social-integration";

export default function GeneratePage() {
  const [prompt, setPrompt] = useState<string>("A majestic lion with a crown of stars, in a cosmic nebula, hyperrealistic, 4k");
  const [refinedResult, setRefinedResult] = useState<AlithPromptHelperOutput | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStep, setMintingStep] = useState("");
  const [lastMintTx, setLastMintTx] = useState<string | null>(null);
  
  // Enhanced generation state
  const [qualityLevel, setQualityLevel] = useState<'standard' | 'high' | 'premium'>('standard');
  
  // External art state
  const [externalImageData, setExternalImageData] = useState<string | null>(null);
  const [externalMetadata, setExternalMetadata] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState('generate');
  
  // BONUS TRACK: Enhanced UX states for LazAI integration
  const [lazaiProcessing, setLazaiProcessing] = useState(false);
  const [lazaiStep, setLazaiStep] = useState("");
  
  // Phase 4: Advanced Features
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState<number>(0);

  const { walletAddress, connectWallet, isBrowser, isCorrectNetwork, switchToMetisNetwork } = useWallet();
  const { toast } = useToast();
  
  // Phase 4: Analytics and Collections
  const { trackGeneration, updateGeneration, trackSocialShare } = useAnalytics();
  const { addArtwork, updateArtwork } = useCollections();

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
    setExternalImageData(null);
    setExternalMetadata(null);
    setCurrentTab('generate');
    setCurrentGenerationId(null);
    setPrompt("A new masterpiece, a futuristic city floating in the clouds, detailed, 4k");
  }
  
  // Phase 4: Prepare social share data
  const shareData: SocialShareData | null = imageUrl ? {
    imageUrl,
    title: refinedResult?.title || externalMetadata?.analysisResult?.suggestedTitle || `AI Art - ${new Date().toLocaleDateString()}`,
    description: refinedResult?.reasoning || externalMetadata?.analysisResult?.enhancedDescription || `Created with AIArtify using prompt: "${prompt}"`,
    prompt,
    qualityScore: externalMetadata?.analysisResult?.qualityScore,
    mintTxHash: lastMintTx || undefined,
    chainData: lastMintTx ? {
      network: 'Metis Hyperion Testnet',
      contractAddress: contractConfig.address
    } : undefined
  } : null;
  
  // Handle social share tracking
  const handleSocialShare = (platform: string) => {
    if (currentGenerationId) {
      trackSocialShare(currentGenerationId);
    }
    toast({
      title: `📱 Shared to ${platform}!`,
      description: "Your artwork has been shared successfully.",
      duration: 2000,
    });
  };

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
    setProcessingStartTime(Date.now());
    
    try {
      // Use enhanced generation API for high/premium quality
      const apiEndpoint = qualityLevel === 'standard' ? '/api/generate-art' : '/api/enhanced-generate-art';
      
      const requestBody = qualityLevel === 'standard' 
        ? { prompt }
        : { 
            prompt, 
            qualityLevel,
            enhancePrompt: qualityLevel === 'high' || qualityLevel === 'premium',
            validateResult: qualityLevel === 'premium'
          };
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate art');
      }
      
      const result = await response.json();
      setImageUrl(result.imageUrl);
      
      // Phase 4: Track generation with analytics
      const processingTime = Date.now() - processingStartTime;
      const generationId = trackGeneration({
        prompt,
        promptLength: prompt.length,
        qualityLevel,
        qualityScore: result.performance?.qualityScore,
        consensusNodes: result.performance?.consensusNodes,
        processingTime,
        enhancedPrompt: result.enhancedPrompt || refinedResult?.refinedPrompt,
        lazaiReasoning: refinedResult?.lazaiReasoning,
        mintStatus: 'pending',
        socialShares: 0
      });
      
      setCurrentGenerationId(generationId);
      
      // Add to collection manager
      addArtwork({
        imageUrl: result.imageUrl,
        prompt,
        title: refinedResult?.title || `AI Art - ${new Date().toLocaleDateString()}`,
        description: result.enhancedDescription || `Generated with ${qualityLevel} quality using advanced AI`,
        qualityScore: result.performance?.qualityScore,
        qualityLevel,
        enhancedPrompt: result.enhancedPrompt || refinedResult?.refinedPrompt,
        lazaiReasoning: refinedResult?.lazaiReasoning,
        consensusNodes: result.performance?.consensusNodes,
        metadata: {
          processingTime,
          timestamp: Date.now(),
          refinedResult,
          performance: result.performance
        }
      });
      
      // Show enhanced generation results if available
      if (result.performance && qualityLevel !== 'standard') {
        toast({
          title: "🎨 Enhanced AI Generation Complete!",
          description: `Quality: ${(result.performance.qualityScore * 100).toFixed(1)}% | Confidence: ${(result.performance.confidence * 100).toFixed(1)}% | Nodes: ${result.performance.consensusNodes}`,
          duration: 5000,
        });
      }
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
  
  // External art handlers
  const handleExternalImageSelected = (imageData: string, metadata: any) => {
    setExternalImageData(imageData);
    setExternalMetadata(metadata);
    setImageUrl(imageData); // Set as current image for minting
    
    // Extract quality score from analysis result
    const qualityScore = metadata.analysisResult?.qualityScore || 0.8;
    const description = metadata.analysisResult?.enhancedDescription || metadata.userDescription || 'Analysis complete';
    
    toast({
      title: "🎨 External Art Uploaded!",
      description: `Quality Score: ${(qualityScore * 100).toFixed(1)}% | ${description}`,
      duration: 4000,
    });
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
        
        // Create full metadata for local storage
        const fullMetadata = {
            name: refinedResult?.title || externalMetadata?.title || "AIArtify NFT",
            description: externalMetadata?.description || `An AI-generated artwork from AIArtify, enhanced with LazAI reasoning.`,
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
              },
              // BONUS TRACK: Store LazAI reasoning in NFT metadata
              {
                trait_type: "LazAI Reasoning",
                value: refinedResult?.lazaiReasoning || "Not available",
              },
              {
                trait_type: "LazAI Model",
                value: refinedResult?.lazaiModel || "N/A",
              },
              {
                trait_type: "LazAI Confidence",
                value: refinedResult?.lazaiConfidence?.toString() || "N/A",
              },
              {
                trait_type: "LazAI Transaction",
                value: refinedResult?.lazaiTxHash || "N/A",
              },
              // External art metadata
              ...(externalMetadata ? [
                {
                  trait_type: "Art Type",
                  value: "External Upload",
                },
                {
                  trait_type: "Quality Score",
                  value: ((externalMetadata.analysisResult?.qualityScore || 0.8) * 100).toFixed(1) + "%",
                },
                {
                  trait_type: "LazAI Analysis",
                  value: externalMetadata.analysisResult?.lazaiReasoning || "N/A",
                },
                {
                  trait_type: "Original Source",
                  value: externalMetadata.source === 'upload' ? 'File Upload' : 'URL',
                },
                {
                  trait_type: "Original Name",
                  value: externalMetadata.originalName || externalMetadata.originalUrl || "N/A",
                }
              ] : [
                {
                  trait_type: "Art Type",
                  value: "AI Generated",
                }
              ])
            ]
        };

        // Create optimized metadata for blockchain storage
        const maxPromptLength = 150;
        const maxReasoningLength = 100;
        
        const optimizedMetadata = {
            name: fullMetadata.name,
            description: "AI artwork from AIArtify with LazAI",
            image: fullMetadata.image,
            attributes: [
              {
                trait_type: "Original Prompt",
                value: prompt.length > maxPromptLength ? prompt.slice(0, maxPromptLength) + "..." : prompt,
              },
              {
                trait_type: "Refined Prompt", 
                value: (refinedResult?.refinedPrompt || prompt).length > maxPromptLength ? 
                       (refinedResult?.refinedPrompt || prompt).slice(0, maxPromptLength) + "..." : 
                       (refinedResult?.refinedPrompt || prompt),
              },
              {
                trait_type: "AI Enhanced",
                value: refinedResult?.reasoning ? "true" : "false",
              },
              {
                trait_type: "LazAI Verified",
                value: refinedResult?.lazaiReasoning ? "true" : "false",
              },
              {
                trait_type: "Art Type",
                value: externalMetadata ? "External Upload" : "AI Generated",
              }
            ]
        };

        // Encode the optimized metadata to a Base64 data URI for blockchain
        const metadataJson = JSON.stringify(optimizedMetadata);
        const base64Metadata = Buffer.from(metadataJson).toString('base64');
        const tokenURI = `data:application/json;base64,${base64Metadata}`;
        
        // Debug: Log the metadata and tokenURI we're about to send
        console.log('=== MINTING DEBUG ===');
        console.log('Full metadata object:', fullMetadata);
        console.log('Optimized metadata object:', optimizedMetadata);
        console.log('Optimized metadata JSON:', metadataJson);
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
        
        // Enhanced gas estimation and transaction handling with production safeguards
        let transaction;
        try {
          // First verify contract exists and is accessible
          console.log('Verifying contract accessibility...');
          const contractOwner = await contract.owner();
          console.log('Contract owner:', contractOwner);
          
          // Check if we can estimate gas
          console.log('Estimating gas for transaction...');
          const gasEstimate = await contract.mintNFT.estimateGas(walletAddress, tokenURI);
          console.log('Gas estimate:', gasEstimate.toString());
          
          // Add buffer to the gas estimate (50% more for safety in production)
          const gasLimit = gasEstimate * BigInt(150) / BigInt(100);
          console.log('Gas limit with buffer:', gasLimit.toString());
          
          // Execute the transaction with proper gas settings
          transaction = await contract.mintNFT(walletAddress, tokenURI, {
            gasLimit: gasLimit,
          });
          
          console.log('Transaction submitted:', transaction.hash);
        } catch (gasError: any) {
          console.warn('Gas estimation failed, trying with fallback approach:', gasError.message);
          
          // Check if it's a specific error we can handle
          if (gasError.message.includes('revert') || gasError.message.includes('execution reverted')) {
            throw new Error('Contract call would fail. This might be due to metadata size limits or contract restrictions.');
          }
          
          // Fallback: try without gas estimation but with a reasonable gas limit
          try {
            transaction = await contract.mintNFT(walletAddress, tokenURI, {
              gasLimit: 800000, // Increased gas limit for production
            });
            
            console.log('Transaction submitted with fallback gas:', transaction.hash);
          } catch (fallbackError: any) {
            console.warn('Fallback gas failed, trying minimal approach:', fallbackError.message);
            
            // Final fallback: let the provider handle everything
            transaction = await contract.mintNFT(walletAddress, tokenURI);
            console.log('Transaction submitted without gas limit:', transaction.hash);
          }
        }
        
        setMintingStep("Waiting for blockchain confirmation...");

        const receipt = await transaction.wait();
        
        if (!receipt) {
          throw new Error("Transaction receipt is null");
        }

        console.log('=== POST-MINT VERIFICATION ===');
        console.log('Transaction receipt:', receipt);
        
        // CRITICAL: Store NFT immediately with transaction hash as fallback ID
        // This ensures the NFT is saved even if tokenId extraction fails
        // Store FULL metadata locally, not the optimized version
        const fallbackNftMetadata = {
          tokenId: `tx_${receipt.hash.slice(-8)}`, // Use last 8 chars of tx hash as fallback ID
          name: fullMetadata.name,
          description: fullMetadata.description,
          image: fullMetadata.image,
          originalPrompt: fullMetadata.attributes.find(attr => attr.trait_type === "Original Prompt")?.value || "",
          refinedPrompt: fullMetadata.attributes.find(attr => attr.trait_type === "Refined Prompt")?.value || "",
          reasoning: fullMetadata.attributes.find(attr => attr.trait_type === "Alith's Reasoning")?.value || "",
          lazaiReasoning: fullMetadata.attributes.find(attr => attr.trait_type === "LazAI Reasoning")?.value || "",
          lazaiModel: fullMetadata.attributes.find(attr => attr.trait_type === "LazAI Model")?.value || "",
          lazaiConfidence: fullMetadata.attributes.find(attr => attr.trait_type === "LazAI Confidence")?.value || "",
          lazaiTxHash: fullMetadata.attributes.find(attr => attr.trait_type === "LazAI Transaction")?.value || "",
          txHash: receipt.hash,
          mintedAt: Date.now(),
          walletAddress: walletAddress!
        };
        storeNftMetadata(fallbackNftMetadata);
        
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
            
            // Update the NFT with the proper tokenId (this will replace the fallback entry)
            // Store FULL metadata locally with proper tokenId
            if (tokenId) {
              const nftMetadata = {
                tokenId: tokenId.toString(),
                name: fullMetadata.name,
                description: fullMetadata.description,
                image: fullMetadata.image,
                originalPrompt: fullMetadata.attributes.find(attr => attr.trait_type === "Original Prompt")?.value || "",
                refinedPrompt: fullMetadata.attributes.find(attr => attr.trait_type === "Refined Prompt")?.value || "",
                reasoning: fullMetadata.attributes.find(attr => attr.trait_type === "Alith's Reasoning")?.value || "",
                // BONUS TRACK: Store LazAI reasoning data in local metadata
                lazaiReasoning: fullMetadata.attributes.find(attr => attr.trait_type === "LazAI Reasoning")?.value || "",
                lazaiModel: fullMetadata.attributes.find(attr => attr.trait_type === "LazAI Model")?.value || "",
                lazaiConfidence: fullMetadata.attributes.find(attr => attr.trait_type === "LazAI Confidence")?.value || "",
                lazaiTxHash: fullMetadata.attributes.find(attr => attr.trait_type === "LazAI Transaction")?.value || "",
                txHash: receipt.hash,
                mintedAt: Date.now(),
                walletAddress: walletAddress!
              };
              storeNftMetadata(nftMetadata); // This will replace the fallback entry due to same txHash
              console.log('✅ Updated NFT metadata with proper token ID:', tokenId.toString());
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

        // Phase 4: Update analytics and collection tracking
        if (currentGenerationId) {
          updateGeneration(currentGenerationId, {
            mintStatus: 'minted',
            mintTxHash: receipt.hash
          });
        }

        // Update artwork in collections
        updateArtwork(currentGenerationId || 'unknown', {
          mintTxHash: receipt.hash,
          tokenId: tokenId?.toString()
        });

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
        
        // Phase 4: Track failed mint
        if (currentGenerationId) {
          updateGeneration(currentGenerationId, {
            mintStatus: 'failed'
          });
        }
        
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

  return (
    <div className="container mx-auto max-w-4xl py-4 sm:py-8">
      <div className="space-y-8">
        {/* Enhanced Hero Section with Animation */}
        <div className="text-center space-y-6">
          <div className="animate-fade-in-up">
            <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Create with AI
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Bring your imagination to life with our advanced AI art generation platform. Create stunning artworks or upload your own to mint as NFTs on the Metis blockchain.
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-3 mt-6 animate-fade-in-up animation-delay-200">
            <Badge variant="secondary" className="px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              5-Node AI Consensus
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Zap className="w-3 h-3 mr-1" />
              LazAI Enhanced
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Globe className="w-3 h-3 mr-1" />
              Metis Hyperion
            </Badge>
          </div>
          
          <div className="mt-6 animate-fade-in-up animation-delay-300">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showAnalytics ? 'Hide Analytics' : 'View Platform Analytics'}
            </Button>
          </div>
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

        {/* Phase 4: Analytics Dashboard */}
        {showAnalytics && (
          <div className="space-y-4">
            <AnalyticsDashboard onRefresh={() => {
              toast({
                title: "📊 Analytics Refreshed",
                description: "Dashboard data has been updated.",
                duration: 2000,
              });
            }} />
          </div>
        )}

        <Card className="animate-fade-in-up animation-delay-400 hover-scale hover-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Create Your NFT Art
            </CardTitle>
            <CardDescription>
              Choose how you want to create your unique NFT artwork
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <TabsTrigger value="generate" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 transition-all duration-300">
                  <Wand2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Generate with AI</span>
                  <span className="sm:hidden">AI Generate</span>
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 transition-all duration-300">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload External Art</span>
                  <span className="sm:hidden">Upload Art</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="generate" className="space-y-4 mt-6 animate-slide-in-left">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Describe Your Vision
                    </label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Enter a detailed prompt. The more specific you are, the better the result.
                    </p>
                    <Textarea
                      placeholder="e.g., A majestic lion with a crown of stars, in a cosmic nebula, hyperrealistic, 4k"
                      className="min-h-[120px] resize-none"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isCtaDisabled || !!lastMintTx}
                    />
                  </div>
                  
                  {/* Enhanced Generation Quality Selector */}
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">AI Quality:</span>
                    </div>
                    <Select value={qualityLevel} onValueChange={(value: 'standard' | 'high' | 'premium') => setQualityLevel(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Standard
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            High Quality
                          </div>
                        </SelectItem>
                        <SelectItem value="premium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            Premium
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      {qualityLevel === 'high' && (
                        <Badge variant="secondary" className="text-xs">
                          Enhanced Prompts
                        </Badge>
                      )}
                      {qualityLevel === 'premium' && (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            Multi-Node AI
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Quality Validation
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button 
                      onClick={handleRefinePrompt} 
                      disabled={isCtaDisabled || !!lastMintTx}
                      variant="outline"
                      className="group relative overflow-hidden transition-all duration-300 hover:shadow-md"
                    >
                      <Sparkles className={`mr-2 h-4 w-4 transition-all duration-300 ${isRefining ? 'animate-spin text-purple-500' : 'group-hover:text-purple-500'}`} />
                      <span className="relative z-10">
                        {isRefining ? "Refining with Alith..." : "Refine with Alith"}
                      </span>
                      {isRefining && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-shimmer"></div>
                      )}
                    </Button>
                    <Button 
                      onClick={handleGenerateArt} 
                      disabled={isGenerateDisabled || !!lastMintTx} 
                      className="w-full sm:w-auto flex-1 relative overflow-hidden group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <Wand2 className={`mr-2 h-4 w-4 transition-all duration-300 ${isGenerating ? 'animate-bounce' : 'group-hover:rotate-12'}`} />
                      <span className="relative z-10 font-medium">
                        {isGenerating ? "Creating Magic..." : "Generate Art"}
                      </span>
                      {isGenerating && (
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 animate-pulse"></div>
                      )}
                    </Button>
                  </div>
                  
                  {/* Enhanced LazAI Processing Indicator */}
                  {lazaiProcessing && lazaiStep && (
                    <div className="relative overflow-hidden flex items-center gap-3 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-fade-in-up">
                      <div className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-gradient-to-r from-blue-500 to-indigo-500"></span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                          🚀 LazAI Integration
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">{lazaiStep}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4 mt-6 animate-slide-in-left">
                <ExternalArtUpload
                  onImageSelected={handleExternalImageSelected}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Enhanced loading state */}
        {isRefining && (
          <Card className="animate-fade-in-up">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-500"></span>
                </div>
                <span className="font-medium">Alith is refining your prompt...</span>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full skeleton-pulse" />
                <Skeleton className="h-4 w-3/4 skeleton-pulse" />
                <Skeleton className="h-4 w-1/2 skeleton-pulse" />
              </div>
            </CardContent>
          </Card>
        )}

        {refinedResult?.reasoning && (
          <Alert className="animate-fade-in-up hover-glow">
             <Sparkles className="h-4 w-4 text-purple-500" />
            <AlertTitle className="flex items-center gap-2">
              {refinedResult.title || "Alith's Suggestion"}
              <Badge variant="outline" className="text-xs">Enhanced</Badge>
            </AlertTitle>
            <AlertDescription className="space-y-2">
                <div className="prose prose-sm max-w-none dark:prose-invert">{processMarkdown(refinedResult.reasoning)}</div>
                {/* Enhanced LazAI reasoning display */}
                {refinedResult.lazaiReasoning && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800 rounded-lg relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                        🚀 LazAI Enhanced Reasoning
                      </span>
                      <LazAIInfo />
                      {refinedResult.lazaiModel && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {refinedResult.lazaiModel}
                        </Badge>
                      )}
                      {refinedResult.lazaiConfidence && (
                        <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                          {Math.round(refinedResult.lazaiConfidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 prose prose-sm max-w-none dark:prose-invert">{processMarkdown(refinedResult.lazaiReasoning)}</div>
                    {refinedResult.lazaiTxHash && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Reasoning stored on-chain: 
                        <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded font-mono">
                          {refinedResult.lazaiTxHash.substring(0, 16)}...
                        </code>
                      </p>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                  </div>
                )}
            </AlertDescription>
          </Alert>
        )}

        <Card className="animate-fade-in-up animation-delay-400 hover-scale">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-500" />
              Your Artwork
            </CardTitle>
            <CardDescription>
              Mint your masterpiece as an NFT on the Hyperion testnet
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="aspect-square w-full max-w-md rounded-xl border-2 border-dashed border-muted-foreground/20 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 relative overflow-hidden group">
              {isGenerating ? (
                <div className="flex h-full w-full flex-col items-center justify-center text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-pulse"></div>
                  <div className="relative z-10">
                    <Wand2 className="mb-4 size-16 animate-bounce text-purple-500" />
                    <p className="text-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Creating your masterpiece...
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Our AI is painting with pixels 🎨
                    </p>
                    <div className="mt-4 flex justify-center">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce animation-delay-200"></div>
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce animation-delay-400"></div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                </div>
              ) : imageUrl ? (
                <div className="relative h-full w-full group">
                  <Image
                    src={imageUrl}
                    alt={prompt}
                    width={1024}
                    height={1024}
                    className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Badge className="bg-white/90 text-black backdrop-blur-sm">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Generated
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center group-hover:scale-105 transition-transform duration-300">
                  <div className="relative">
                    <Wand2 className="mb-4 size-16 text-muted-foreground/50 group-hover:text-purple-500 transition-colors duration-300" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    Your art will appear here
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-2 max-w-xs">
                    Start by entering a prompt and clicking "Generate Art" or upload external artwork
                  </p>
                </div>
              )}
            </div>

            <div className="flex w-full max-w-md flex-col items-center gap-4">
              {/* Enhanced LazAI Verification Section */}
              {imageUrl && currentGenerationId && (
                <div className="flex gap-3 flex-wrap justify-center animate-fade-in-up">
                  <LazAIVerification
                    artworkId={currentGenerationId}
                    imageUrl={imageUrl}
                    prompt={prompt}
                    currentScore={refinedResult?.qualityScore}
                    onVerified={(result) => {
                      updateGeneration(currentGenerationId, {
                        lazaiVerified: true,
                        lazaiScore: result.newScore,
                        lazaiTxHash: result.lazaiTxHash,
                        lazaiConsensus: result.consensusNodes
                      });
                      updateArtwork(currentGenerationId, {
                        lazaiVerified: true,
                        lazaiScore: result.newScore
                      });
                      toast({
                        title: "🏆 LazAI Verification Complete!",
                        description: `Quality Score: ${(result.newScore * 100).toFixed(1)}%`,
                      });
                    }}
                  />
                  {shareData && (
                    <SocialShare 
                      shareData={shareData} 
                      onShare={(platform) => trackSocialShare(currentGenerationId)}
                    />
                  )}
                </div>
              )}

              {!walletAddress && imageUrl && (
                  <Button 
                    size="lg" 
                    onClick={connectWallet} 
                    disabled={isCtaDisabled}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
                  >
                    <span className="mr-2">🔗</span>
                    Connect Wallet to Mint
                    <Sparkles className="ml-2 h-4 w-4 group-hover:animate-spin" />
                  </Button>
              )}

              {walletAddress && imageUrl && !lastMintTx && (
                  <div className="w-full space-y-4 animate-fade-in-up">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Connected Wallet</p>
                        <Badge variant="outline" className="font-mono text-xs">
                          {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                        </Badge>
                      </div>
                      <Button 
                        size="lg" 
                        onClick={handleMintNFT} 
                        disabled={isMinting}
                        className="w-full relative overflow-hidden group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isMinting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Minting in Progress...
                            </>
                          ) : (
                            <>
                              <span>🎨</span>
                              Mint as NFT
                              <Zap className="h-4 w-4 group-hover:text-yellow-300 transition-colors duration-300" />
                            </>
                          )}
                        </span>
                        {isMinting && (
                          <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-emerald-400/30 animate-pulse"></div>
                        )}
                      </Button>
                      {mintingStep && (
                          <div className="flex items-center justify-center gap-3 text-sm bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 animate-fade-in-up">
                              <div className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                              </div>
                              <span className="text-green-700 dark:text-green-300 font-medium">{mintingStep}</span>
                          </div>
                      )}
                  </div>
              )}

              {lastMintTx && (
                <div className="flex w-full flex-col items-center gap-4 rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 p-6 text-center animate-fade-in-up hover-glow">
                    <div className="relative">
                      <CheckCircle className="size-12 text-green-500 animate-bounce" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                      🎉 Minted Successfully!
                    </h3>
                    <p className="text-sm text-muted-foreground">Your artwork is permanently on the blockchain.</p>
                    <div className="flex w-full flex-col gap-2 sm:flex-row">
                      <Button asChild variant="outline" className="flex-1">
                          <Link href={`https://hyperion-testnet-explorer.metisdevops.link/tx/${lastMintTx}`} target="_blank">
                              View Transaction
                          </Link>
                      </Button>
                      {shareData && (
                        <SocialShare 
                          shareData={shareData} 
                          onShare={handleSocialShare}
                        />
                      )}
                      <Button onClick={handleCreateAnother} className="flex-1">
                          Create Another
                      </Button>
                    </div>
                </div>
              )}
              
              {/* Phase 4: Show Social Share for unminted artwork too */}
              {imageUrl && !lastMintTx && shareData && (
                <div className="flex w-full justify-center">
                  <SocialShare 
                    shareData={shareData} 
                    onShare={handleSocialShare}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
