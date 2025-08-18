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

// Enhanced random caption generator with 20+ unique styles for maximum variety
function getRandomCaption(data: SocialShareData, platform: 'twitter' | 'telegram'): string {
  const appUrl = 'https://www.ai-artify.xyz'; // Primary custom domain
  const promptSnippet = data.prompt.length > 50 ? data.prompt.substring(0, 47) + '...' : data.prompt;
  
  // 🔥 Powerful & Bold captions (6 variations)
  const powerfulCaptions = [
    `🔥 Minted creativity on-chain. This isn't just art — it's permanence.`,
    `⚡ Where imagination meets the blockchain. Powered by @MetisL2.`,
    `💎 AI. Provenance. Forever.`,
    `🚀 Revolutionary 5-node AI consensus validates every pixel of my masterpiece!`,
    `⚡ AI + Blockchain = Unstoppable Art! Verified by 5 specialized nodes and secured forever.`,
    `� Breaking boundaries with verified AI art! Every detail analyzed by our AI jury.`
  ];
  
  // 🎨 Creative & Artistic captions (6 variations)
  const creativeCaptions = [
    `🎨 I whispered a prompt, AIArtify painted a universe.`,
    `✨ From thought → pixels → NFT. #AIArtify magic ✨`,
    `🌟 A dream turned into digital permanence.`,
    `🎭 When AI becomes your creative partner! Born from: "${promptSnippet}"`,
    `🎨 Art meets AI meets forever! My vision transformed into permanent beauty.`,
    `✨ Creative magic happening! AI helped birth this masterpiece with 5-node validation.`
  ];
  
  // 😎 Casual & Fun captions (4 variations)
  const casualCaptions = [
    `😍 Just minted some cool AI art 😍 Check this out!`,
    `🚀 Hyperion vibes → AI art → NFT drop �`,
    `👀 Had fun playing with AIArtify — look at this piece 👀`,
    `🎨 Look what I created! AI + blockchain = permanent art 🎨`
  ];
  
  // 📈 Professional captions (4 variations)
  const professionalCaptions = [
    `📈 Exploring the future of AI art & blockchain with AIArtify.`,
    `🔗 On-chain provenance + AI creativity = trustable NFTs.`,
    `💼 Minted my artwork as a permanent digital asset on @MetisL2.`,
    `🏢 Demonstrating the future of verified AI art with blockchain permanence.`
  ];
  
  // Combine all 20 caption styles for maximum variety
  const allCaptions = [...powerfulCaptions, ...creativeCaptions, ...casualCaptions, ...professionalCaptions];
  
  // Pick random caption
  let baseCaption = allCaptions[Math.floor(Math.random() * allCaptions.length)];
  
  // Add prompt snippet and project link
  let fullCaption = `${baseCaption}\n\nPrompt: "${promptSnippet}"\n\nTry it: ${appUrl}\n\n#AIArtify @MetisL2 #HyperHack #AIArt`;
  
  // Handle X (Twitter) character limit of 280
  if (platform === 'twitter' && fullCaption.length > 280) {
    // Optimize for Twitter by shortening components
    const shorterPrompt = data.prompt.length > 30 ? data.prompt.substring(0, 27) + '...' : data.prompt;
    fullCaption = `${baseCaption}\n\nPrompt: "${shorterPrompt}"\n\n${appUrl}\n\n#AIArtify @MetisL2 #HyperHack`;
    
    // Final check and truncate if still too long
    if (fullCaption.length > 280) {
      fullCaption = fullCaption.substring(0, 277) + '...';
    }
  }
  
  return fullCaption;
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
  
  // Use our enhanced caption system for mobile sharing
  const shareText = getRandomCaption(data, 'telegram'); // Telegram format allows more characters
  
  const shareObj: any = {
    title: `${data.title} | AIArtify`,
    text: shareText,
    url: typeof window !== 'undefined' ? window.location.href : 'https://www.ai-artify.xyz'
  };
  
  // Try to attach image if supported (most modern browsers, including MetaMask in-app browser)
  if (navigator.canShare && data.imageUrl) {
    try {
      const response = await fetch(data.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${data.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'AIArtify'}-artwork.png`, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        shareObj.files = [file];
      }
    } catch (e) {
      // fallback: ignore image if can't fetch
      console.log('Could not attach image to share, continuing with text only');
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
    url: typeof window !== 'undefined' ? window.location.href : 'https://www.ai-artify.xyz',
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