
"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Award, Gem, Medal, Trophy, Sparkles, Calendar, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { contractConfig } from "@/lib/web3/config";
import { getRpcProvider, safeContractCall } from "@/lib/web3/utils";
import { getStoredNfts } from "@/lib/nft-storage";

interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  nftCount: number;
  totalPoints: number;
  avgQualityScore: number;
  firstMintDate: number;
  lastMintDate: number;
  avatar: string;
  badges: string[];
}

interface CreatorStats {
  nftCount: number;
  totalPoints: number;
  avgQualityScore: number;
  firstMintDate: number;
  lastMintDate: number;
  tokenIds: string[];
}

const rankIcons = [
    { icon: Trophy, color: "text-yellow-400" },
    { icon: Medal, color: "text-gray-400" },
    { icon: Award, color: "text-yellow-600" }
];

export default function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalStats, setTotalStats] = useState({ totalNfts: 0, totalCreators: 0 });

    useEffect(() => {
        const fetchLeaderboard = async () => {
            console.log('=== LEADERBOARD DEBUG START ===');
            setIsLoading(true);
            setError(null);
            
            try {
                const provider = getRpcProvider();
                const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);

                console.log('=== STEP 1: Getting all mint events ===');
                const currentBlock = await provider.getBlockNumber();
                const fromBlock = Math.max(0, currentBlock - 50000); // Last ~50k blocks
                
                const mintFilter = contract.filters.Transfer(ethers.ZeroAddress, null, null);
                const allMints = await safeContractCall(() => 
                  contract.queryFilter(mintFilter, fromBlock, currentBlock)
                );
                
                console.log('Total mint events found:', allMints?.length || 0);
                
                if (!allMints || allMints.length === 0) {
                    setLeaderboardData([]);
                    setTotalStats({ totalNfts: 0, totalCreators: 0 });
                    setIsLoading(false);
                    return;
                }

                console.log('=== STEP 2: Getting local storage data for quality scores ===');
                const localNfts = getStoredNfts();
                console.log('Local NFTs available for scoring:', localNfts.length);

                console.log('=== STEP 3: Analyzing creator statistics ===');
                const creatorStats: { [address: string]: CreatorStats } = {};

                // Process each mint event
                for (const event of allMints) {
                    const eventLog = event as ethers.EventLog;
                    if (!eventLog.args) continue;

                    const to = eventLog.args[1].toLowerCase(); // recipient address
                    const tokenId = eventLog.args[2].toString(); // token ID
                    const blockNumber = eventLog.blockNumber;
                    
                    // Get block timestamp for minting date
                    const block = await provider.getBlock(blockNumber);
                    const mintTimestamp = block?.timestamp ? block.timestamp * 1000 : Date.now();

                    // Verify current ownership
                    const currentOwner = await safeContractCall(() => contract.ownerOf(tokenId));
                    if (!currentOwner || currentOwner.toLowerCase() !== to) {
                        console.log(`Token ${tokenId} no longer owned by original minter`);
                        continue; // Skip if token was transferred
                    }

                    // Initialize creator stats if not exists
                    if (!creatorStats[to]) {
                        creatorStats[to] = {
                            nftCount: 0,
                            totalPoints: 0,
                            avgQualityScore: 0,
                            firstMintDate: mintTimestamp,
                            lastMintDate: mintTimestamp,
                            tokenIds: []
                        };
                    }

                    const stats = creatorStats[to];
                    stats.nftCount++;
                    stats.tokenIds.push(tokenId);
                    stats.lastMintDate = Math.max(stats.lastMintDate, mintTimestamp);
                    stats.firstMintDate = Math.min(stats.firstMintDate, mintTimestamp);

                    // Calculate quality score based on available metadata
                    let qualityScore = 50; // Base score
                    
                    const localNft = localNfts.find(nft => nft.tokenId === tokenId);
                    if (localNft) {
                        // Quality factors:
                        // - Has refined prompt (Alith enhancement) +20
                        // - Has reasoning from Alith +15
                        // - Prompt length and complexity +0-15
                        // - Recent creation +0-10
                        
                        if (localNft.refinedPrompt && localNft.refinedPrompt !== localNft.originalPrompt) {
                            qualityScore += 20; // Used AI enhancement
                        }
                        
                        if (localNft.reasoning && localNft.reasoning.length > 10) {
                            qualityScore += 15; // Has Alith's reasoning
                        }
                        
                        // Prompt complexity score (0-15 based on length and keywords)
                        const promptLength = Math.max(localNft.originalPrompt.length, localNft.refinedPrompt.length);
                        const complexityKeywords = ['hyperrealistic', '8k', '4k', 'detailed', 'intricate', 'dramatic', 'lighting', 'composition'];
                        const keywordCount = complexityKeywords.filter(keyword => 
                            localNft.originalPrompt.toLowerCase().includes(keyword) || 
                            localNft.refinedPrompt.toLowerCase().includes(keyword)
                        ).length;
                        
                        qualityScore += Math.min(15, Math.floor(promptLength / 20) + keywordCount * 2);
                        
                        // Recency bonus (0-10 for NFTs minted in last 7 days)
                        const daysSinceMint = (Date.now() - mintTimestamp) / (1000 * 60 * 60 * 24);
                        if (daysSinceMint <= 7) {
                            qualityScore += Math.floor(10 * (7 - daysSinceMint) / 7);
                        }
                    }

                    stats.totalPoints += qualityScore;
                }

                // Calculate average quality scores
                Object.values(creatorStats).forEach(stats => {
                    stats.avgQualityScore = stats.nftCount > 0 ? stats.totalPoints / stats.nftCount : 0;
                });

                console.log('=== STEP 4: Creating leaderboard entries ===');
                const leaderboardEntries: LeaderboardEntry[] = Object.entries(creatorStats)
                    .map(([address, stats]) => {
                        // Generate badges based on achievements
                        const badges: string[] = [];
                        
                        if (stats.nftCount >= 10) badges.push("Prolific Creator");
                        if (stats.nftCount >= 5) badges.push("Active Artist");
                        if (stats.avgQualityScore >= 80) badges.push("Quality Master");
                        if (stats.avgQualityScore >= 70) badges.push("Expert Creator");
                        
                        const daysSinceFirst = (Date.now() - stats.firstMintDate) / (1000 * 60 * 60 * 24);
                        if (daysSinceFirst <= 1) badges.push("New Creator");
                        if (daysSinceFirst >= 30) badges.push("Veteran Artist");
                        
                        const daysSinceLast = (Date.now() - stats.lastMintDate) / (1000 * 60 * 60 * 24);
                        if (daysSinceLast <= 1) badges.push("Recently Active");

                        return {
                            rank: 0, // Will be set after sorting
                            address,
                            displayName: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
                            nftCount: stats.nftCount,
                            totalPoints: Math.floor(stats.totalPoints),
                            avgQualityScore: Math.floor(stats.avgQualityScore),
                            firstMintDate: stats.firstMintDate,
                            lastMintDate: stats.lastMintDate,
                            avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${address}`,
                            badges
                        };
                    })
                    .sort((a, b) => {
                        // Primary sort: total points (quality * quantity)
                        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
                        // Secondary sort: average quality
                        if (b.avgQualityScore !== a.avgQualityScore) return b.avgQualityScore - a.avgQualityScore;
                        // Tertiary sort: NFT count
                        return b.nftCount - a.nftCount;
                    })
                    .slice(0, 25) // Top 25
                    .map((entry, index) => ({ ...entry, rank: index + 1 }));

                console.log('=== LEADERBOARD RESULT ===');
                console.log('Total creators:', Object.keys(creatorStats).length);
                console.log('Total NFTs:', allMints.length);
                console.log('Leaderboard entries:', leaderboardEntries.length);

                setLeaderboardData(leaderboardEntries);
                setTotalStats({ 
                    totalNfts: allMints.length, 
                    totalCreators: Object.keys(creatorStats).length 
                });

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
        
        {/* Stats Overview */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total NFTs</p>
                  <p className="text-2xl font-bold">{totalStats.totalNfts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Creators</p>
                  <p className="text-2xl font-bold">{totalStats.totalCreators}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="w-full sm:rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Creators
          </CardTitle>
          <CardDescription>
            Rankings based on quality scores, creativity, and consistency. Points awarded for AI-enhanced prompts, complexity, and recent activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead className="text-center">NFTs</TableHead>
                <TableHead className="text-center">Avg Quality</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
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
                                <div className="space-y-1">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                             <Skeleton className="h-4 w-8 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                             <Skeleton className="h-4 w-8 mx-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                             <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                    </TableRow>
                 ))
              )}
              {!isLoading && error && (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-destructive">
                        {error}
                    </TableCell>
                 </TableRow>
              )}
               {!isLoading && !error && leaderboardData.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No creators yet. Be the first to mint an NFT!
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
                          <AvatarImage src={entry.avatar} alt={entry.displayName} />
                          <AvatarFallback>{entry.displayName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <span className="font-medium">{entry.displayName}</span>
                          <div className="flex flex-wrap gap-1">
                            {entry.badges.slice(0, 2).map((badge, i) => (
                              <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0.5">
                                {badge}
                              </Badge>
                            ))}
                            {entry.badges.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                +{entry.badges.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {entry.nftCount}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <div className="flex items-center justify-center gap-1">
                        <span>{entry.avgQualityScore}</span>
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          entry.avgQualityScore >= 80 ? "bg-green-500" :
                          entry.avgQualityScore >= 70 ? "bg-yellow-500" :
                          entry.avgQualityScore >= 60 ? "bg-orange-500" :
                          "bg-red-500"
                        )} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {entry.totalPoints.toLocaleString()}
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
