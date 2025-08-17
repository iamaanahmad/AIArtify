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

// Random caption generator for X and Telegram
function getRandomCaption(data: SocialShareData, platform: 'twitter' | 'telegram'): string {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const baseCaptions = [
    `Minted on AIArtify! 🎨✨ Check it out: ${url} @MetisL2 @AIArtifyMETIS`,
    `My latest AI NFT on-chain! ${url} @MetisL2 @AIArtifyMETIS`,
    `AI + Blockchain = Forever Art. See my creation: ${url} @MetisL2 @AIArtifyMETIS`,
    `Proud to mint this on AIArtify. View: ${url} @MetisL2 @AIArtifyMETIS`,
    `Just dropped a new AI NFT! ${url} @MetisL2 @AIArtifyMETIS`,
    `AI art, on-chain, mine forever. ${url} @MetisL2 @AIArtifyMETIS`,
    `Created with AI, secured by Metis. ${url} @MetisL2 @AIArtifyMETIS`,
    `Explore my AI NFT: ${url} @MetisL2 @AIArtifyMETIS`,
    `Prompt: "${data.prompt.substring(0, 60)}..." ${url} @MetisL2 @AIArtifyMETIS`,
    `Title: ${data.title} | ${url} @MetisL2 @AIArtifyMETIS`,
  ];
  // X (Twitter) character limit is 280
  let caption = baseCaptions[Math.floor(Math.random() * baseCaptions.length)];
  if (platform === 'twitter' && caption.length > 280) {
    caption = caption.substring(0, 277) + '...';
  }
  return caption;
}

export const socialPlatforms: Record<string, SocialPlatform> = {
  twitter: {
    name: "X (Twitter)",
    icon: "twitter",
    shareUrl: (data: SocialShareData) => {
      const tweetText = encodeURIComponent(getRandomCaption(data, 'twitter'));
      return `https://twitter.com/intent/tweet?text=${tweetText}`;
    },
    features: ["tweets"],
  },
  telegram: {
    name: "Telegram",
    icon: "telegram",
    shareUrl: (data: SocialShareData) => {
      const text = encodeURIComponent(getRandomCaption(data, 'telegram'));
      return `https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${text}`;
    },
    features: ["channels", "groups", "direct"],
  },
  export: {
    name: "Export (Save)",
    icon: "download",
    shareUrl: (data: SocialShareData) => data.imageUrl,
    features: ["download"],
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
    content = getRandomCaption(data, 'twitter');
  } else if (platform === 'telegram') {
    content = getRandomCaption(data, 'telegram');
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