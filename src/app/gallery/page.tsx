import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const publicNfts = [
  {
    id: "1",
    prompt: "Cosmic jellyfish dreaming in a sea of stars",
    creator: "StellarArt",
    imageUrl: "https://placehold.co/600x600.png",
    avatarUrl: "https://placehold.co/40x40.png",
    aiHint: "cosmic jellyfish",
  },
  {
    id: "2",
    prompt: "Cyberpunk city skyline at dusk, neon reflections on wet streets",
    creator: "NeonNoir",
    imageUrl: "https://placehold.co/600x600.png",
    avatarUrl: "https://placehold.co/40x40.png",
    aiHint: "cyberpunk city",
  },
  {
    id: "3",
    prompt: "Ancient tree with glowing runes in an enchanted forest",
    creator: "MysticGrove",
    imageUrl: "https://placehold.co/600x600.png",
    avatarUrl: "https://placehold.co/40x40.png",
    aiHint: "enchanted forest",
  },
  {
    id: "4",
    prompt: "Steampunk owl with intricate clockwork wings",
    creator: "Cogsmith",
    imageUrl: "https://placehold.co/600x600.png",
    avatarUrl: "https://placehold.co/40x40.png",
    aiHint: "steampunk owl",
  },
  {
    id: "5",
    prompt: "A serene minimalist landscape of a Japanese zen garden",
    creator: "TranquilZen",
    imageUrl: "https://placehold.co/600x600.png",
    avatarUrl: "https://placehold.co/40x40.png",
    aiHint: "zen garden",
  },
  {
    id: "6",
    prompt: "Portrait of a queen from a forgotten underwater civilization",
    creator: "AquaRegalia",
    imageUrl: "https://placehold.co/600x600.png",
    avatarUrl: "https://placehold.co/40x40.png",
    aiHint: "underwater queen",
  },
    {
    id: "7",
    prompt: "Floating islands connected by shimmering light bridges",
    creator: "SkyArchitect",
    imageUrl: "https://placehold.co/600x600.png",
    avatarUrl: "https://placehold.co/40x40.png",
    aiHint: "floating islands",
  },
  {
    id: "8",
    prompt: "A lone astronaut discovering a crystal cave on a distant planet",
    creator: "CosmoExplorer",
    imageUrl: "https://placehold.co/600x600.png",
    avatarUrl: "https://placehold.co/40x40.png",
    aiHint: "astronaut cave",
  },
];

export default function GalleryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
          Public Gallery
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore the incredible creations from the ArtChain AI community.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {publicNfts.map((nft) => (
          <Card key={nft.id} className="overflow-hidden">
            <CardContent className="p-0">
              <Image
                src={nft.imageUrl}
                alt={nft.prompt}
                width={600}
                height={600}
                className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
                data-ai-hint={nft.aiHint}
              />
            </CardContent>
            <CardHeader className="p-4">
              <CardTitle className="truncate text-base">{nft.prompt}</CardTitle>
            </CardHeader>
            <CardFooter className="p-4 pt-0">
                <div className="flex w-full items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={nft.avatarUrl} alt={nft.creator} />
                        <AvatarFallback>{nft.creator.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">by {nft.creator}</span>
                </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
