"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, Twitter, MessageCircle, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface CollectionSocialShareProps {
  nft: {
    id: string;
    title: string;
    prompt: string;
    imageUrl: string;
    txHash?: string;
  };
  variant?: "default" | "icon" | "compact";
}

export default function CollectionSocialShare({ nft, variant = "default" }: CollectionSocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://ai-artify.xyz'}/gallery?highlight=${nft.id}`;
  const shareTitle = `Check out my AI artwork: "${nft.title}"`;
  const shareDescription = `Created with AIArtify's 5-node consensus system. Prompt: "${nft.prompt.slice(0, 100)}${nft.prompt.length > 100 ? '...' : ''}"`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard!",
        description: "Share link copied successfully.",
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try again.",
      });
    }
  };

  const shareOnTwitter = () => {
    console.log('Twitter share clicked for NFT:', nft.id);
    const twitterText = `${shareTitle}\n\n${shareDescription}\n\n#AIArt #NFT #MetisHyperion #LazAI\n\n${shareUrl}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
    
    console.log('Opening Twitter URL:', twitterUrl);
    
    // Open in new window/tab
    const newWindow = window.open(twitterUrl, '_blank', 'width=600,height=500,scrollbars=yes,resizable=yes');
    
    if (!newWindow) {
      // Fallback if popup was blocked
      console.log('Popup blocked, using fallback');
      window.location.href = twitterUrl;
    }
    
    toast({
      title: "Sharing on Twitter!",
      description: "Opening Twitter to share your artwork.",
      duration: 3000,
    });
    
    // Close the dialog after sharing
    setIsOpen(false);
  };

  const shareOnTelegram = () => {
    console.log('Telegram share clicked for NFT:', nft.id);
    const telegramText = `${shareTitle}\n\n${shareDescription}\n\n${shareUrl}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(telegramText)}`;
    
    console.log('Opening Telegram URL:', telegramUrl);
    
    // Open in new window/tab
    const newWindow = window.open(telegramUrl, '_blank', 'width=600,height=500,scrollbars=yes,resizable=yes');
    
    if (!newWindow) {
      // Fallback if popup was blocked
      console.log('Popup blocked, using fallback');
      window.location.href = telegramUrl;
    }
    
    toast({
      title: "Sharing on Telegram!",
      description: "Opening Telegram to share your artwork.",
      duration: 3000,
    });
    
    // Close the dialog after sharing
    setIsOpen(false);
  };

  const openInExplorer = () => {
    if (nft.txHash && nft.txHash !== 'N/A') {
      window.open(`https://hyperion-testnet-explorer.metisdevops.link/tx/${nft.txHash}`, '_blank');
    }
  };

  const TriggerButton = () => {
    const handleClick = () => {
      console.log('Share trigger clicked for NFT:', nft.id);
      setIsOpen(true);
    };

    switch (variant) {
      case "icon":
        return (
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleClick}
            type="button"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        );
      case "compact":
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClick}
            type="button"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        );
      default:
        return (
          <Button 
            variant="outline"
            onClick={handleClick}
            type="button"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Artwork
          </Button>
        );
    }
  };

  return (
    <>
      <TriggerButton />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Your Artwork
            </DialogTitle>
            <DialogDescription>
              Share your AI-generated NFT with the community and showcase your creativity.
            </DialogDescription>
          </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
            <Image
              src={nft.imageUrl}
              alt={nft.title}
              width={60}
              height={60}
              className="rounded object-cover"
              unoptimized
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{nft.title}</h4>
              <p className="text-sm text-muted-foreground truncate">
                Token #{nft.id}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {nft.prompt.slice(0, 60)}...
              </p>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={shareOnTwitter}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              onClick={shareOnTelegram}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Telegram
            </Button>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(shareUrl)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Blockchain Explorer */}
          {nft.txHash && nft.txHash !== 'N/A' && (
            <Button
              variant="outline"
              onClick={openInExplorer}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Metis Explorer
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
