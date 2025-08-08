/**
 * Mock NFT data generator for testing
 * This simulates locally stored NFT metadata for tokens that were minted
 */

// Add this to browser console to test NFT display:
const mockNFTs = [
  {
    tokenId: "20",
    name: "Celestial King",
    description: "An AI-generated artwork from AIArtify, enhanced with LazAI reasoning.",
    image: "https://i.ibb.co/placeholder/placeholder-nft.png", // Replace with actual image
    originalPrompt: "A majestic lion with a crown of stars, roaring amidst a cosmic nebula",
    refinedPrompt: "A majestic lion with a crown of stars, roaring amidst a cosmic nebula, hyperrealistic, 4k, intricate details, volumetric lighting, celestial dust, vibrant colors, dramatic composition, art by Artgerm and Greg Rutkowski",
    reasoning: "Enhanced the original prompt by adding details to enrich the visual texture and lighting. 'Roaring' adds dynamism, 'intricate details', 'volumetric lighting', and 'celestial dust' will enhance realism and visual interest.",
    lazaiReasoning: "This analysis combines traditional art principles with AI-powered insights to optimize visual impact while preserving creative intent.",
    lazaiModel: "gemini-pro (via LazAI logic)",
    lazaiConfidence: "0.95",
    lazaiTxHash: "0x1234567890abcdef",
    txHash: "0xabcdef1234567890", // Replace with actual transaction hash
    mintedAt: Date.now() - 3600000, // 1 hour ago
    walletAddress: "0xYourWalletAddress"
  },
  {
    tokenId: "19",
    name: "Futuristic Cityscape",
    description: "An AI-generated artwork from AIArtify, enhanced with LazAI reasoning.",
    image: "https://i.ibb.co/placeholder/placeholder-nft-2.png",
    originalPrompt: "A futuristic cityscape at sunset",
    refinedPrompt: "A futuristic cityscape at sunset, neon lights reflecting on glass towers, cyberpunk aesthetic, dramatic lighting, high contrast, cinematic composition",
    reasoning: "Added cyberpunk elements and lighting details to create a more compelling futuristic atmosphere.",
    lazaiReasoning: "Enhanced with architectural principles and color theory for maximum visual impact.",
    lazaiModel: "gemini-pro (via LazAI logic)",
    lazaiConfidence: "0.92",
    lazaiTxHash: "0x2345678901bcdefg",
    txHash: "0xbcdefg2345678901",
    mintedAt: Date.now() - 7200000, // 2 hours ago
    walletAddress: "0xYourWalletAddress"
  }
];

// Function to add mock data to localStorage
function addMockNFTData() {
  mockNFTs.forEach(nft => {
    const key = `nft_metadata_${nft.tokenId}`;
    localStorage.setItem(key, JSON.stringify(nft));
    console.log(`Added mock NFT #${nft.tokenId}: ${nft.name}`);
  });
  console.log('🎉 Mock NFT data added! Refresh the collection page to see your NFTs.');
}

// Function to clear mock data
function clearMockNFTData() {
  mockNFTs.forEach(nft => {
    const key = `nft_metadata_${nft.tokenId}`;
    localStorage.removeItem(key);
  });
  console.log('🗑️ Mock NFT data cleared');
}

console.log('Mock NFT Data Generator loaded!');
console.log('Run addMockNFTData() to add test NFTs');
console.log('Run clearMockNFTData() to remove test NFTs');
