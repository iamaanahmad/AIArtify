
"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Award, Gem, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { contractConfig } from "@/lib/web3/config";

interface LeaderboardEntry {
  rank: number;
  user: string;
  points: number;
  avatar: string;
}

const rankIcons = [
    { icon: Trophy, color: "text-yellow-400" },
    { icon: Medal, color: "text-gray-400" },
    { icon: Award, color: "text-yellow-600" }
];

const getRpcProvider = () => {
    return new ethers.JsonRpcProvider("https://hyperion-testnet.metisdevops.link", 599);
};


export default function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const provider = getRpcProvider();
                const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);

                const events = await contract.queryFilter(contract.filters.Transfer(ethers.ZeroAddress));
                const totalSupply = events.length;
                
                if (totalSupply === 0) {
                    setLeaderboardData([]);
                    setIsLoading(false);
                    return;
                }

                const ownerCounts: { [address: string]: number } = {};
                const ownerPromises = [];

                for (let i = 1; i <= totalSupply; i++) {
                    ownerPromises.push(contract.ownerOf(i).catch(() => null));
                }

                const owners = await Promise.all(ownerPromises);
                
                owners.forEach(owner => {
                    if (owner) {
                        ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
                    }
                });

                const sortedCreators = Object.entries(ownerCounts)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .slice(0, 10); // Top 10

                const data: LeaderboardEntry[] = sortedCreators.map(([address, count], index) => ({
                    rank: index + 1,
                    user: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
                    points: count * 100, // Assign points per NFT
                    avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${address}`,
                }));

                setLeaderboardData(data);

            } catch (err) {
                console.error("Failed to fetch leaderboard data:", err);
                setError("Could not load the leaderboard. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);


  return (
    <div className="w-full space-y-8">
      <div className="px-4 sm:px-6">
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
          Leaderboard
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          See who's leading the creative charge in the AIArtify community.
        </p>
      </div>

      <Card className="w-full sm:rounded-none">
        <CardHeader>
          <CardTitle>Top Creators</CardTitle>
          <CardDescription>
            Rankings are based on the number of NFTs minted on-chain.
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
              {isLoading && (
                 Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                                <Skeleton className="h-6 w-10" />
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                             <Skeleton className="h-5 w-16 ml-auto" />
                        </TableCell>
                    </TableRow>
                 ))
              )}
              {!isLoading && error && (
                 <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-destructive">
                        {error}
                    </TableCell>
                 </TableRow>
              )}
               {!isLoading && !error && leaderboardData.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        No creators yet. Be the first!
                    </TableCell>
                 </TableRow>
              )}
              {!isLoading && !error && leaderboardData.map((entry, index) => {
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
