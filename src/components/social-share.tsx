/**
 * Phase 4: Social Share Component
 * Advanced social sharing interface with platform-specific optimizations
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Share2, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  Smartphone,
  Globe,
  Hash,
  MessageCircle,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  socialPlatforms,
  shareViaWebAPI,
  generateQRCode,
} from '@/lib/social-integration';

interface SocialShareProps {
  shareData: any;
  onShare?: (platform: string) => void;
}

export default function SocialShare({ shareData, onShare }: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async (platformKey: string) => {
    const platform = socialPlatforms[platformKey];
    if (!platform) return;

    try {
      setIsSharing(true);
      if (platformKey === 'instagram' || platformKey === 'discord') {
        await navigator.clipboard.writeText(platform.shareUrl(shareData));
        setCopiedPlatform(platformKey);
        toast({
          title: `📋 ${platform.name} Content Copied!`,
          description: "Content copied to clipboard. Paste it in your app!",
          duration: 3000,
        });
        setTimeout(() => setCopiedPlatform(null), 3000);
      } else {
        const shareUrl = platform.shareUrl(shareData);
        window.open(shareUrl, '_blank', 'width=600,height=400');
        toast({
          title: `🚀 Shared to ${platform.name}!`,
          description: "Share window opened successfully.",
          duration: 2000,
        });
      }
      onShare?.(platformKey);
    } catch (error) {
      console.error('Share error:', error);
      toast({
        variant: "destructive",
        title: "Share failed",
        description: `Failed to share to ${platform.name}. Please try again.`,
      });
    } finally {
      setIsSharing(false);
    }
  };




  // Show QR code
  const handleShowQR = async () => {
    setQrUrl(null);
    const url = await generateQRCode(window.location.href);
    setQrUrl(url);
    onShare?.('qr');
  };

  // Mobile Web Share API
  const handleMobileShare = async () => {
    if (!('share' in navigator)) {
      toast({
        title: "Sharing not supported",
        description: "Your device does not support the Web Share API.",
        variant: "destructive",
      });
      return;
    }
    setIsSharing(true);
    try {
      await shareViaWebAPI(shareData);
      toast({
        title: "� Shared via device!",
        description: "Mobile share sheet opened.",
        duration: 2000,
      });
      onShare?.('mobile');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Share failed",
        description: (error as Error).message || 'Unable to share via device.'
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "🔗 Link Copied!",
        description: "Share link copied to clipboard.",
        duration: 2000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy link to clipboard.",
      });
    }
  };

  // Platform icons mapping
  const platformIcons: Record<string, React.ReactNode> = {
    twitter: <MessageCircle className="w-4 h-4" />,
    instagram: <ImageIcon className="w-4 h-4" />,
    discord: <Hash className="w-4 h-4" />,
    reddit: <Globe className="w-4 h-4" />
  };

  const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2 px-4 py-2 text-base md:text-sm md:px-3 md:py-1" aria-label="Share Art">
          <Share2 className="w-5 h-5 md:w-4 md:h-4" />
          Share Art
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full p-2 md:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Share Your Art</DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            Spread your creation to the world! Tag <span className="font-bold text-blue-600">@AIArtifyMETIS</span> for a chance to be featured.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 md:py-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(socialPlatforms).map(([key, platform]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 text-base md:text-sm"
                onClick={() => handleShare(key)}
                disabled={isSharing}
                style={{ minWidth: 120 }}
                aria-label={`Share to ${platform.name}`}
              >
                <span className={`icon-${platform.icon} w-5 h-5`} />
                {platform.name}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink} disabled={isSharing} className="px-3 py-2 text-base md:text-sm" aria-label="Copy Link">
              <Copy className="w-4 h-4 mr-1" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={handleShowQR} disabled={isSharing} className="px-3 py-2 text-base md:text-sm" aria-label="Show QR Code">
              <Smartphone className="w-4 h-4 mr-1" /> Show QR
            </Button>
             {'share' in navigator && (
               <Button variant="default" size="sm" onClick={handleMobileShare} disabled={isSharing} className="px-3 py-2 text-base md:text-sm" aria-label="Share via Device">
                 <Share2 className="w-4 h-4 mr-1" /> Share via Device
               </Button>
             )}
          </div>
          {qrUrl && (
            <div className="flex flex-col items-center gap-2 mt-2">
              <img src={qrUrl} alt="QR Code" className="w-40 h-40 rounded" />
              <span className="text-xs text-muted-foreground">Scan to open on any device</span>
            </div>
          )}
          {/* Artwork preview */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sharing Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <p className="font-medium">{shareData.title}</p>
                <p className="text-muted-foreground text-xs line-clamp-2">
                  {shareData.description}
                </p>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Prompt: {shareData.prompt.substring(0, 40)}...</span>
                {shareData.qualityScore && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(shareData.qualityScore * 100)}% Quality
                  </Badge>
                )}
              </div>
              {shareData.mintTxHash && (
                <Badge variant="secondary" className="text-xs">
                  🔗 Minted on Blockchain
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
