import { Award, Gem, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const leaderboardData = [
  { rank: 1, user: "StellarArt", points: 15280, avatar: "https://placehold.co/40x40.png" },
  { rank: 2, user: "PixelPioneer", points: 12500, avatar: "https://placehold.co/40x40.png" },
  { rank: 3, user: "NeonNoir", points: 11950, avatar: "https://placehold.co/40x40.png" },
  { rank: 4, user: "Cogsmith", points: 10800, avatar: "https://placehold.co/40x40.png" },
  { rank: 5, user: "MysticGrove", points: 9750, avatar: "https://placehold.co/40x40.png" },
  { rank: 6, user: "AquaRegalia", points: 8900, avatar: "https://placehold.co/40x40.png" },
  { rank: 7, user: "TranquilZen", points: 8120, avatar: "https://placehold.co/40x40.png" },
  { rank: 8, user: "SkyArchitect", points: 7640, avatar: "https://placehold.co/40x40.png" },
  { rank: 9, user: "CosmoExplorer", points: 6880, avatar: "https://placehold.co/40x40.png" },
  { rank: 10, user: "ArtisanAI", points: 6100, avatar: "https://placehold.co/40x40.png" },
];

const rankIcons = [
    { icon: Trophy, color: "text-yellow-400" },
    { icon: Medal, color: "text-gray-400" },
    { icon: Award, color: "text-yellow-600" }
];


export default function LeaderboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
          Leaderboard
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          See who's leading the creative charge in the ArtChain AI community.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Creators</CardTitle>
          <CardDescription>
            Rankings are updated in real-time based on creative activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((entry, index) => {
                const RankIcon = index < 3 ? rankIcons[index].icon : Gem;
                const iconColor = index < 3 ? rankIcons[index].color : "text-muted-foreground/60";

                return (
                  <TableRow key={entry.rank} className={cn(index < 3 && "bg-card-foreground/5")}>
                    <TableCell className="text-center font-bold">
                        <div className="flex items-center justify-center gap-2">
                            <RankIcon className={cn("size-5", iconColor)} />
                            <span>{entry.rank}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={entry.avatar} alt={entry.user} />
                          <AvatarFallback>{entry.user.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{entry.user}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {entry.points.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
