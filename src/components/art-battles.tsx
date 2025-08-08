/**
 * @fileOverview Collaborative Art Battles - Multi-user LazAI Reasoning Chains
 * 
 * INNOVATION DOMINANCE: Users collaborate to create art through chained LazAI reasoning,
 * where each participant builds upon the previous person's enhanced prompt using Hyperion nodes.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Plus, 
  Zap, 
  Crown, 
  Trophy, 
  ArrowRight,
  Network,
  Sparkles,
  Timer,
  Target,
} from 'lucide-react';

interface BattleParticipant {
  id: string;
  name: string;
  avatar: string;
  contribution: string;
  lazaiEnhancement: string;
  confidence: number;
  timestamp: Date;
  hyperionProof?: string;
}

interface ArtBattle {
  id: string;
  title: string;
  theme: string;
  participants: BattleParticipant[];
  maxParticipants: number;
  timeLimit: number; // minutes
  startTime: Date;
  status: 'waiting' | 'active' | 'completed';
  finalPrompt?: string;
  winnerScore?: number;
}

export default function CollaborativeArtBattles() {
  const [activeBattles, setActiveBattles] = useState<ArtBattle[]>([]);
  const [selectedBattle, setSelectedBattle] = useState<ArtBattle | null>(null);
  const [userContribution, setUserContribution] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize with sample battles
  useEffect(() => {
    setActiveBattles([
      {
        id: 'battle_1',
        title: 'Cosmic Landscapes',
        theme: 'Create an otherworldly landscape with cosmic elements',
        participants: [
          {
            id: 'user_1',
            name: 'ArtMaster',
            avatar: 'AM',
            contribution: 'A vast alien landscape with twin moons',
            lazaiEnhancement: 'Enhanced with bioluminescent flora, crystalline formations reflecting moonlight, and atmospheric particles creating ethereal glow effects.',
            confidence: 0.92,
            timestamp: new Date(Date.now() - 300000),
            hyperionProof: '0xabc123...',
          },
          {
            id: 'user_2', 
            name: 'CosmicDreamer',
            avatar: 'CD',
            contribution: 'Adding nebula clouds in the sky with shooting stars',
            lazaiEnhancement: 'Integrated spiral nebula formations with particle systems, meteor trails creating dynamic light streaks, and stellar nurseries with newborn stars.',
            confidence: 0.88,
            timestamp: new Date(Date.now() - 180000),
            hyperionProof: '0xdef456...',
          },
        ],
        maxParticipants: 5,
        timeLimit: 30,
        startTime: new Date(Date.now() - 600000),
        status: 'active',
      },
      {
        id: 'battle_2',
        title: 'Cyberpunk Cities',
        theme: 'Build a futuristic cyberpunk metropolis',
        participants: [],
        maxParticipants: 4,
        timeLimit: 45,
        startTime: new Date(),
        status: 'waiting',
      },
    ]);
  }, []);

  const joinBattle = (battle: ArtBattle) => {
    setSelectedBattle(battle);
  };

  const submitContribution = async () => {
    if (!selectedBattle || !userContribution.trim()) return;

    setIsProcessing(true);

    try {
      // Build the chained prompt from all previous contributions
      const previousContributions = selectedBattle.participants
        .map(p => p.lazaiEnhancement)
        .join(' | ');
      
      const chainedPrompt = `${selectedBattle.theme}

PREVIOUS ENHANCEMENTS:
${previousContributions}

NEW CONTRIBUTION: ${userContribution}

Please build upon the previous LazAI enhancements to create a cohesive, evolved prompt that incorporates all elements harmoniously.`;

      // Call LazAI reasoning with chained context
      const response = await fetch('/api/hyperion-reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: chainedPrompt,
          mode: 'text',
          context: 'Collaborative art battle - chain reasoning',
        }),
      });

      const result = await response.json();

      // Create new participant entry
      const newParticipant: BattleParticipant = {
        id: `user_${Date.now()}`,
        name: 'You',
        avatar: 'YU',
        contribution: userContribution,
        lazaiEnhancement: result.reasoning.reasoning,
        confidence: result.reasoning.confidence,
        timestamp: new Date(),
        hyperionProof: result.reasoning.proofHash,
      };

      // Update battle with new participant
      const updatedBattle = {
        ...selectedBattle,
        participants: [...selectedBattle.participants, newParticipant],
      };

      setActiveBattles(prev => 
        prev.map(battle => 
          battle.id === selectedBattle.id ? updatedBattle : battle
        )
      );

      setSelectedBattle(updatedBattle);
      setUserContribution('');

      // Check if battle is complete
      if (updatedBattle.participants.length >= updatedBattle.maxParticipants) {
        completeArtBattle(updatedBattle);
      }

    } catch (error) {
      console.error('Failed to submit contribution:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const completeArtBattle = (battle: ArtBattle) => {
    // Generate final chained prompt
    const finalPrompt = battle.participants
      .map(p => p.lazaiEnhancement)
      .join(' | Combined with: ');

    // Calculate winner based on confidence scores and community metrics
    const winner = battle.participants.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    const completedBattle = {
      ...battle,
      status: 'completed' as const,
      finalPrompt,
      winnerScore: winner.confidence,
    };

    setActiveBattles(prev => 
      prev.map(b => b.id === battle.id ? completedBattle : b)
    );
  };

  const createNewBattle = () => {
    const themes = [
      'Underwater civilizations with bioluminescent architecture',
      'Steampunk airships floating through cloud cities',
      'Post-apocalyptic gardens reclaiming ancient ruins',
      'Interdimensional portals in mystical forests',
      'AI-governed utopian societies',
    ];

    const newBattle: ArtBattle = {
      id: `battle_${Date.now()}`,
      title: `Creative Challenge ${activeBattles.length + 1}`,
      theme: themes[Math.floor(Math.random() * themes.length)],
      participants: [],
      maxParticipants: Math.floor(Math.random() * 3) + 3, // 3-5 participants
      timeLimit: Math.floor(Math.random() * 30) + 20, // 20-50 minutes
      startTime: new Date(),
      status: 'waiting',
    };

    setActiveBattles(prev => [newBattle, ...prev]);
  };

  const getBattleProgress = (battle: ArtBattle) => {
    return (battle.participants.length / battle.maxParticipants) * 100;
  };

  const getTimeRemaining = (battle: ArtBattle) => {
    const elapsed = Date.now() - battle.startTime.getTime();
    const remaining = battle.timeLimit * 60000 - elapsed;
    return Math.max(0, Math.floor(remaining / 60000));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Collaborative Art Battles
        </h1>
        <p className="text-lg text-muted-foreground">
          Chain LazAI reasoning with other creators to build epic collaborative prompts
        </p>
        <Button onClick={createNewBattle} className="bg-gradient-to-r from-purple-600 to-pink-600">
          <Plus className="w-4 h-4 mr-2" />
          Start New Battle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Battles List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Active Battles
          </h2>
          
          {activeBattles.map((battle) => (
            <Card key={battle.id} className={`cursor-pointer transition-all ${
              selectedBattle?.id === battle.id ? 'ring-2 ring-primary' : ''
            }`} onClick={() => joinBattle(battle)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{battle.title}</CardTitle>
                  <Badge variant={
                    battle.status === 'active' ? 'default' : 
                    battle.status === 'completed' ? 'secondary' : 'outline'
                  }>
                    {battle.status}
                  </Badge>
                </div>
                <CardDescription>{battle.theme}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {battle.participants.length}/{battle.maxParticipants} participants
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      {battle.status === 'active' ? `${getTimeRemaining(battle)}m left` : `${battle.timeLimit}m`}
                    </div>
                  </div>
                  
                  <Progress value={getBattleProgress(battle)} className="w-full" />
                  
                  <div className="flex -space-x-2">
                    {battle.participants.map((participant) => (
                      <Avatar key={participant.id} className="border-2 border-background">
                        <AvatarFallback className="text-xs">{participant.avatar}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>

                  {battle.status === 'completed' && (
                    <Alert>
                      <Crown className="h-4 w-4" />
                      <AlertDescription>
                        Winner: {battle.participants.find(p => p.confidence === battle.winnerScore)?.name} 
                        (Score: {Math.round((battle.winnerScore || 0) * 100)}%)
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Battle Details */}
        <div className="space-y-4">
          {selectedBattle ? (
            <>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Target className="w-6 h-6" />
                {selectedBattle.title}
              </h2>

              <Card>
                <CardHeader>
                  <CardTitle>Battle Theme</CardTitle>
                  <CardDescription>{selectedBattle.theme}</CardDescription>
                </CardHeader>
              </Card>

              {/* Reasoning Chain */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">LazAI Reasoning Chain</h3>
                
                {selectedBattle.participants.map((participant, index) => (
                  <Card key={participant.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{participant.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-sm">{participant.name}</CardTitle>
                            <CardDescription className="text-xs">
                              Step {index + 1} • {participant.timestamp.toLocaleTimeString()}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {Math.round(participant.confidence * 100)}%
                          </Badge>
                          <Network className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Original Contribution:</p>
                          <p className="text-sm text-muted-foreground">{participant.contribution}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">LazAI Enhancement:</p>
                          <p className="text-sm">{participant.lazaiEnhancement}</p>
                        </div>
                        {participant.hyperionProof && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Network className="w-3 h-3" />
                            Proof: {participant.hyperionProof.substring(0, 12)}...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add Contribution */}
                {selectedBattle.status === 'active' && selectedBattle.participants.length < selectedBattle.maxParticipants && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Your Contribution
                      </CardTitle>
                      <CardDescription>
                        Build upon the existing LazAI reasoning chain
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={userContribution}
                        onChange={(e) => setUserContribution(e.target.value)}
                        placeholder="Add your creative element to the collaborative prompt..."
                        rows={3}
                      />
                      <Button 
                        onClick={submitContribution}
                        disabled={!userContribution.trim() || isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                            Processing with LazAI...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Submit & Enhance with LazAI
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Final Result */}
                {selectedBattle.status === 'completed' && selectedBattle.finalPrompt && (
                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Final Collaborative Prompt
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedBattle.finalPrompt}</p>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm">
                          Generate Final Artwork
                        </Button>
                        <Button size="sm" variant="outline">
                          Mint Collaborative NFT
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <div className="text-center space-y-4 py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">Select a Battle</h3>
              <p className="text-muted-foreground">
                Choose an active battle to join the collaborative reasoning chain
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Network className="w-4 h-4" />
              Chained Reasoning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Each contribution builds upon previous LazAI enhancements for exponentially better results.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4" />
              Competitive Scoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              LazAI confidence scores and community voting determine the best contributions.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" />
              Collective Innovation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Harness the collective creativity of multiple minds enhanced by LazAI reasoning.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
