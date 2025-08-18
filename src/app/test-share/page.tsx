"use client";

import { useState } from "react";
import SocialShare from "@/components/social-share";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestSharePage() {
  const [isOpen, setIsOpen] = useState(false);

  const mockShareData = {
    imageUrl: "/placeholder-nft.png",
    title: "Cyberpunk Sunset Dreams",
    description: "A stunning AI-generated artwork showcasing neon-lit cityscapes",
    prompt: "A cyberpunk city at dawn with floating cars, neon signs, and holographic advertisements reflecting in rain-soaked streets",
    mintTxHash: "0x1234567890abcdef",
    chainData: { 
      network: "Metis", 
      contractAddress: "0x9D24b503F3abde31F6861D33e8e20F523f63c6Eb", 
      tokenId: "1" 
    },
    qualityScore: 0.89
  };

  // Test caption generation
  const [sampleCaptions, setSampleCaptions] = useState<string[]>([]);

  const generateSampleCaptions = () => {
    const captions = [];
    // Generate 5 sample captions to show variety
    for (let i = 0; i < 5; i++) {
      // This would normally call the getRandomCaption function
      // For demo purposes, we'll show different styles
      const styles = [
        "🔥 Minted creativity on-chain. This isn't just art — it's permanence.\n\nPrompt: \"A cyberpunk city at dawn with floating cars...\"\n\nTry it: ai-artify.vercel.app\n\n#AIArtify @MetisL2 #HyperHack #AIArt",
        "🎨 I whispered a prompt, AIArtify painted a universe.\n\nPrompt: \"A cyberpunk city at dawn with floating cars...\"\n\nTry it: ai-artify.vercel.app\n\n#AIArtify @MetisL2 #HyperHack #AIArt",
        "😍 Just minted some cool AI art 😍 Check this out!\n\nPrompt: \"A cyberpunk city at dawn with floating cars...\"\n\nTry it: ai-artify.vercel.app\n\n#AIArtify @MetisL2 #HyperHack #AIArt",
        "📈 Exploring the future of AI art & blockchain with AIArtify.\n\nPrompt: \"A cyberpunk city at dawn with floating cars...\"\n\nTry it: ai-artify.vercel.app\n\n#AIArtify @MetisL2 #HyperHack #AIArt",
        "⚡ AI + Blockchain = Unstoppable Art! Verified by 5 specialized nodes and secured forever.\n\nPrompt: \"A cyberpunk city at dawn with floating cars...\"\n\nTry it: ai-artify.vercel.app\n\n#AIArtify @MetisL2 #HyperHack #AIArt"
      ];
      captions.push(styles[i]);
    }
    setSampleCaptions(captions);
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
          Share Test Page
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Test the social sharing functionality with mock data.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Test Share Component</CardTitle>
          <CardDescription>
            Click the button below to test the social sharing modal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Title:</strong> {mockShareData.title}</p>
            <p><strong>Prompt:</strong> {mockShareData.prompt}</p>
            <p><strong>Quality Score:</strong> {Math.round(mockShareData.qualityScore * 100)}%</p>
            <p><strong>Network:</strong> {mockShareData.chainData.network}</p>
          </div>
          
          <SocialShare
            shareData={mockShareData}
            onShare={(platform) => {
              console.log(`Shared to ${platform}`);
            }}
          />

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Enhanced Caption System:</p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-3">
              <li>• 🔥 <strong>Powerful:</strong> "Minted creativity on-chain. This isn't just art — it's permanence."</li>
              <li>• 🎨 <strong>Creative:</strong> "I whispered a prompt, AIArtify painted a universe."</li>
              <li>• 😎 <strong>Casual:</strong> "Just minted some cool AI art 😍 Check this out!"</li>
              <li>• 📈 <strong>Professional:</strong> "Exploring the future of AI art & blockchain with AIArtify."</li>
            </ul>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateSampleCaptions}
              className="mb-3"
            >
              Generate Sample Captions
            </Button>
            {sampleCaptions.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sampleCaptions.map((caption, index) => (
                  <div key={index} className="text-xs p-2 bg-background rounded border">
                    <strong>Style {index + 1}:</strong>
                    <div className="mt-1 whitespace-pre-wrap">{caption}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm font-medium mb-2">🚀 Sharing Features:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 📱 Always includes image preview</li>
              <li>• ✍️ Shortened prompt (50 chars max)</li>
              <li>• 🔗 Project link: ai-artify.vercel.app</li>
              <li>• 🏷️ Tags: #AIArtify @MetisL2 #HyperHack</li>
              <li>• 🎯 20+ caption variations for uniqueness</li>
              <li>• 📏 Twitter-optimized (280 char limit)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
