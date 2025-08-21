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

// Enhanced random caption generator with creative, viral, and engaging captions
function getRandomCaption(data: SocialShareData, platform: 'twitter' | 'telegram'): string {
  const appUrl = 'https://ai-artify.xyz'; // Primary domain
  const promptSnippet = data.prompt.length > 60 ? data.prompt.substring(0, 57) + '...' : data.prompt;
  
  // 🔥 Creative / Viral captions (8 variations)
  const creativeViralCaptions = [
    `🎨 Just minted my AI masterpiece on #AIArtify ✨ What do you think? 👇`,
    `💫 Turned my imagination into on-chain art → Minted on #Metis with AIArtify 🚀`,
    `� From words to NFT in seconds. Meet my latest creation`,
    `� Proof that AI + imagination = magic`,
    `🚀 This might be my wildest AI creation yet...`,
    `✨ When your prompt hits different 🎯`,
    `🎨 Okay, this AI art came out better than expected 👀`,
    `💎 Fresh mint alert! What vibe does this give you? 👇`
  ];
  
  // 🎨 Artistic / Emotional captions (6 variations)
  const artisticEmotionalCaptions = [
    `✨ Every prompt tells a story. Here's mine, now living forever on-chain`,
    `🔗 Minted art powered by AI + secured by blockchain. Creativity meets provenance!`,
    `💫 Dreamt it, prompted it, minted it. Immortalized on #Metis`,
    `🎨 Where art meets blockchain. My vision, now permanent`,
    `✨ AI helped birth this masterpiece, blockchain made it eternal`,
    `🔗 Digital art with real provenance. This is the future`
  ];
  
  // ⚡ Professional / Hackathon captions (6 variations)
  const professionalCaptions = [
    `� Exploring the future of AI + Web3 creativity with AIArtify. Here's my latest NFT →`,
    `� AI-powered art + on-chain provenance = true digital ownership`,
    `🎨 Minted with AI, verified with LazAI, secured on Hyperion. Next-gen art is here`,
    `⚡ Building the future of creative AI on #Metis. Check out this piece`,
    `🔗 Demonstrating AI + blockchain convergence with permanent art`,
    `🚀 This is what happens when AI meets decentralized creativity`
  ];
  
  // � Fun / Casual captions (6 variations)
  const funCasualCaptions = [
    `✨ I just created this wild AI art... should I list it?`,
    `🎯 Okay, this might be my favorite prompt yet`,
    `❤️‍🔥 Not gonna lie, this came out pretty fire`,
    `✨ When the AI understands the assignment perfectly`,
    `🌿 Tell me this doesn't look like it belongs in a gallery`,
    `👇 Made this in seconds. Technology is wild`
  ];
  
  // Combine all caption styles for maximum variety (26 total)
  const allCaptions = [
    ...creativeViralCaptions,
    ...artisticEmotionalCaptions, 
    ...professionalCaptions,
    ...funCasualCaptions
  ];
  
  // Pick random caption
  const baseCaption = allCaptions[Math.floor(Math.random() * allCaptions.length)];
  
  // Build platform-specific content
  if (platform === 'twitter') {
    // X (Twitter) - Keep under 200 chars for links, optimized for engagement
    let caption = `${baseCaption}`;
    
    // Add prompt if space allows
    const promptText = `\n\n🖼️ Prompt: "${promptSnippet}"`;
    const linkText = `\n\n🔗 Try AIArtify: ${appUrl}`;
    const hashtagText = `\n\n#AIArtify #AIArt #NFT #MetisHyperion`;
    
    // Check if we can fit everything under 280 chars
    const testLength = caption + promptText + linkText + hashtagText;
    if (testLength.length <= 280) {
      return caption + promptText + linkText + hashtagText;
    } else {
      // Shorter version without prompt details
      const shortVersion = caption + linkText + `\n\n#AIArtify #AIArt #NFT`;
      if (shortVersion.length <= 280) {
        return shortVersion;
      } else {
        // Ultra-short version
        return caption + `\n\n${appUrl}\n\n#AIArtify #NFT`;
      }
    }
  } else {
    // Telegram - More space, include everything + extras
    let fullCaption = `${baseCaption}\n\n🖼️ Prompt: "${promptSnippet}"\n\n🔗 Try AIArtify: ${appUrl}`;
    
    // Add explorer link if minted
    if (data.mintTxHash && data.mintTxHash !== 'N/A') {
      fullCaption += `\n\n🧾 View on Explorer: https://hyperion-testnet-explorer.metisdevops.link/tx/${data.mintTxHash}`;
    }
    
    // Add quality score if available
    if (data.qualityScore && data.qualityScore > 0) {
      fullCaption += `\n\n⭐ Quality Score: ${Math.round(data.qualityScore * 100)}%`;
    }
    
    // Add project tags and community invite
    fullCaption += `\n\n#AIArtify #AIArt #NFT #MetisHyperion #LazAI #Web3Art`;
    fullCaption += `\n\n💬 Join our community: t.me/aiartify`;
    
    return fullCaption;
  }
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
  // Using QR Server API - a reliable, modern QR code service
  // Alternative: We could implement client-side QR generation with qrcode library
  const size = 300;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=png&margin=10`;
  
  // Fallback options in order of preference:
  // 1. QR Server API (most reliable)
  // 2. QRcode.js client-side generation (if we add the library)
  // 3. Simple URL sharing (no QR code)
  
  try {
    // Test if the service is available
    const testResponse = await fetch(qrUrl, { method: 'HEAD' });
    if (testResponse.ok) {
      return qrUrl;
    } else {
      throw new Error('QR service unavailable');
    }
  } catch (error) {
    console.warn('QR code generation failed, falling back to URL sharing:', error);
    // Fallback: return a data URL with a simple message
    return `data:text/plain;charset=utf-8,QR Code unavailable. Share this URL: ${url}`;
  }
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