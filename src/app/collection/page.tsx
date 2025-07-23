
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const myNfts = [
  {
    id: "1",
    prompt: "A stoic robot meditating in a cherry blossom garden",
    imageUrl: "https://placehold.co/600x600.png",
    mintDate: "2024-05-20",
    aiHint: "robot meditation",
  },
  {
    id: "2",
    prompt: "Gothic library with endless shelves reaching into a swirling vortex",
    imageUrl: "https://placehold.co/600x600.png",
    mintDate: "2024-05-18",
    aiHint: "gothic library",
  },
  {
    id: "3",
    prompt: "Solar-powered desert ship sailing across sand dunes of glass",
    imageUrl: "https://placehold.co/600x600.png",
    mintDate: "2024-05-15",
    aiHint: "desert ship",
  },
  {
    id: "4",
    prompt: "Bioluminescent mushrooms in a hidden cavern behind a waterfall",
    imageUrl: "https://placehold.co/600x600.png",
    mintDate: "2024-05-12",
    aiHint: "bioluminescent mushrooms",
  },
];

export default function CollectionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
          My Collection
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Here are the unique artworks you've created and minted on the blockchain.
        </p>
      </div>

      {myNfts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {myNfts.map((nft) => (
            <Card key={nft.id} className="flex flex-col">
              <CardContent className="p-0">
                <Image
                  src={nft.imageUrl}
                  alt={nft.prompt}
                  width={600}
                  height={600}
                  className="aspect-square w-full rounded-t-lg object-cover"
                  data-ai-hint={nft.aiHint}
                />
              </CardContent>
              <CardHeader className="flex-grow p-4">
                <CardTitle className="text-base">{nft.prompt}</CardTitle>
              </CardHeader>
              <CardFooter className="flex justify-between p-4 pt-0 text-xs text-muted-foreground">
                <span>Minted: {nft.mintDate}</span>
                <Button variant="link" size="sm" className="p-0 h-auto">View on Explorer</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
                <h3 className="text-xl font-semibold">Your collection is empty</h3>
                <p className="mt-2 text-muted-foreground">Start creating and minting art to build your collection.</p>
                <Button className="mt-4">Generate Art</Button>
            </div>
        </div>
      )}
    </div>
  );
}
