/**
 * Phase 4: Social Integration Hooks
 * Advanced social sharing and integration features for AIArtify
 */

export interface SocialShareData {
  imageUrl: string;
  title: string;
  description: string;
  prompt: string;
  qualityScore?: number;
  mintTxHash?: string;
  chainData?: {
    network: string;
    contractAddress: string;
    tokenId?: string;
  };
}

export interface SocialPlatform {
  name: string;
  icon: string;
  shareUrl: (data: SocialShareData) => string;
  features: string[];
}

export const socialPlatforms: Record<string, SocialPlatform> = {
  telegram: {
    name: "Telegram",
    icon: "telegram",
    shareUrl: (data: SocialShareData) => {
      const text = encodeURIComponent(
        `🎨 ${data.title}\n\n${data.description}\n\nPrompt: "${data.prompt}"\n\nMinted on Metis Hyperion\n${typeof window !== 'undefined' ? window.location.href : ''}\n@AIArtifyMETIS #AIArtify #NFT #Metis #AIArt`
      );
      return `https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${text}`;
    },
    features: ["channels", "groups", "direct"],
  },
  export: {
    name: "Export (Save)",
    icon: "download",
    shareUrl: (data: SocialShareData) => {
      return data.imageUrl;
    },
    features: ["download"],
  },
  twitter: {
    name: "X (Twitter)",
    icon: "twitter",
    shareUrl: (data: SocialShareData) => {
      // Only @MetisL2 and @AIArtifyMETIS, no extra hashtags
      const tweetText = encodeURIComponent(
        `Just minted my AI masterpiece on AIArtify 🎨✨\nOn-chain. Permanent. Mine forever.\nTry creating your own 👉 ${typeof window !== 'undefined' ? window.location.href : ''}\n@MetisL2 @AIArtifyMETIS`
      );
      return `https://twitter.com/intent/tweet?text=${tweetText}`;
    },
    features: ["tweets", "threads", "spaces"],
  },
  instagram: {
    name: "Instagram Stories",
    icon: "instagram",
    shareUrl: (data: SocialShareData) => {
      return `instagram://story-camera`;
    },
    features: ["stories", "reels", "posts"],
  },
  discord: {
    name: "Discord",
    icon: "discord",
    shareUrl: (data: SocialShareData) => {
      const webhookMessage = {
        embeds: [{
          title: `🎨 ${data.title}`,
          description: `**Prompt:** ${data.prompt}\n\n${data.description}`,
          color: 0x6366f1,
          image: { url: data.imageUrl },
          fields: [
            ...(data.qualityScore ? [{
              name: "Quality Score",
              value: `${Math.round(data.qualityScore * 100)}%`,
              inline: true
            }] : []),
            ...(data.mintTxHash ? [{
              name: "Blockchain",
              value: `[View Transaction](https://hyperion-testnet-explorer.metisdevops.link/tx/${data.mintTxHash})`,
              inline: true
            }] : [])
          ],
          footer: {
            text: "Created with AIArtify • Powered by LazAI",
            icon_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/logo.png`
          },
          timestamp: new Date().toISOString()
        }]
      };
      return `data:application/json,${encodeURIComponent(JSON.stringify(webhookMessage))}`;
    },
    features: ["embeds", "webhooks", "bots"],
  },
  reddit: {
    name: "Reddit",
    icon: "reddit",
    shareUrl: (data: SocialShareData) => {
      const title = encodeURIComponent(`🎨 AI-Generated Art: ${data.title}`);
      const text = encodeURIComponent(
        `Created this with AIArtify using the prompt: "${data.prompt}"\n\n` +
        `${data.description}\n\n` +
        `${data.qualityScore ? `Quality Score: ${Math.round(data.qualityScore * 100)}%\n` : ''}` +
        `${data.mintTxHash ? `Minted as NFT on Metis Hyperion\n` : ''}` +
        `\nWhat do you think?`
      );
      return `https://www.reddit.com/submit?title=${title}&text=${text}&url=${encodeURIComponent(data.imageUrl)}`;
    },
    features: ["communities", "crosspost", "discussions"],
  },
};

export function canUseWebShare() {
  return typeof window !== 'undefined' && !!(navigator.share);
}

export async function shareViaWebAPI(data: SocialShareData) {
  if (!canUseWebShare()) throw new Error('Web Share API not supported');
  const shareObj: any = {
    title: data.title,
    text: `Just minted my AI masterpiece on AIArtify 🎨✨\nOn-chain. Permanent. Mine forever.\nTry creating your own 👉 ${typeof window !== 'undefined' ? window.location.href : ''}\n@MetisL2 @AIArtifyMETIS`,
    url: typeof window !== 'undefined' ? window.location.href : ''
  };
  // Try to attach image if supported (most modern browsers, including MetaMask in-app browser)
  if (navigator.canShare && data.imageUrl) {
    try {
      const response = await fetch(data.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'artwork.png', { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        shareObj.files = [file];
      }
    } catch (e) {
      // fallback: ignore image if can't fetch
    }
  }
  await navigator.share(shareObj);
}

export async function generateQRCode(url: string): Promise<string> {
  return `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(url)}`;
}

export function generatePreviewMetadata(data: SocialShareData) {
  return {
    title: `${data.title} | AIArtify`,
    description: data.description || `AI-generated artwork: "${data.prompt.substring(0, 160)}${data.prompt.length > 160 ? '...' : ''}"`,
    image: data.imageUrl,
    url: typeof window !== 'undefined' ? window.location.href : '',
    type: "article",
    site_name: "AIArtify",
    card: "summary_large_image",
    creator: "@AIArtifyMETIS",
    "twitter:site": "@AIArtifyMETIS",
    "twitter:creator": "@AIArtifyMETIS",
    ...(data.chainData && {
      "blockchain:network": data.chainData.network,
      "blockchain:contract": data.chainData.contractAddress,
      "blockchain:token": data.chainData.tokenId || "pending"
    })
  };
}

export async function copyShareableContent(data: SocialShareData, platform: string): Promise<string> {
  const platformConfig = socialPlatforms[platform];
  if (!platformConfig) throw new Error(`Platform ${platform} not supported`);
  let content = "";
  if (platform === 'twitter') {
    content = `Just minted my AI masterpiece on AIArtify 🎨✨\nOn-chain. Permanent. Mine forever.\nTry creating your own 👉 ${typeof window !== 'undefined' ? window.location.href : ''}\n@MetisL2 @AIArtifyMETIS`;
  } else if (platform === 'discord') {
    content = `🔥 Just created and minted new AI art on AIArtify!\n🎨 Title: ${data.title}\n🔗 View it: ${typeof window !== 'undefined' ? window.location.href : ''}\nCome join and mint yours 🚀`;
  } else if (platform === 'reddit') {
    content = `I just minted my first AI-generated NFT on AIArtify!\n\nPrompt: "${data.prompt}"\n\nTitle: ${data.title}\n\nBlockchain: Metis Hyperion\n\nNFT: ${typeof window !== 'undefined' ? window.location.href : ''}\nWhat do you think of this piece? 🎨`;
  } else if (platform === 'instagram') {
    content = `🎨 ${data.title}\n\n${data.description}\n\nPrompt: ${data.prompt}\n\n@AIArtifyMETIS @MetisL2`;
  } else if (platform === 'telegram') {
    content = `🎨 ${data.title}\n\n${data.description}\n\nPrompt: "${data.prompt}"\n\nMinted on Metis Hyperion\n${typeof window !== 'undefined' ? window.location.href : ''}\n@AIArtifyMETIS @MetisL2`;
  } else if (platform === 'export') {
    content = data.imageUrl;
  } else {
    content = platformConfig.shareUrl(data);
  }
  await navigator.clipboard.writeText(content);
  return content;
}

export function trackSocialShare(platform: string, data: SocialShareData) {
  const shareEvent = {
    action: "social_share",
    platform: platform,
    artwork_id: data.mintTxHash || "generated",
    quality_score: data.qualityScore,
    prompt_length: data.prompt.length,
    timestamp: Date.now(),
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };
  
  if (typeof localStorage !== 'undefined') {
    const existingShares = JSON.parse(localStorage.getItem("aiartify_social_shares") || "[]");
    existingShares.push(shareEvent);
    localStorage.setItem("aiartify_social_shares", JSON.stringify(existingShares.slice(-100)));
  }
  
  console.log("📊 Social share tracked:", shareEvent);
}

export function getSocialStats() {
  if (typeof localStorage === 'undefined') {
    return { total: 0, platforms: {}, avgQuality: 0 };
  }
  
  const shares = JSON.parse(localStorage.getItem("aiartify_social_shares") || "[]");
  
  const stats = shares.reduce((acc: any, share: any) => {
    acc.total++;
    acc.platforms[share.platform] = (acc.platforms[share.platform] || 0) + 1;
    acc.avgQuality += share.quality_score || 0;
    return acc;
  }, { total: 0, platforms: {}, avgQuality: 0 });
  
  if (stats.total > 0) {
    stats.avgQuality = stats.avgQuality / stats.total;
  }
  
  return stats;
}