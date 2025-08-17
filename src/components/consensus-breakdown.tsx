/**
 * Phase 5: Multi-Node Consensus Visualization
 * Visual breakdown of the 5-node AI consensus system for Bonus Track showcase
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Cpu, 
  Palette, 
  Scale, 
  Shield, 
  Zap,
  ChevronDown,
  ChevronUp,
  Eye,
  Star,
  Award
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ConsensusNode {
  name: string;
  type: 'creative' | 'technical' | 'aesthetic' | 'balanced' | 'qa';
  score: number;
  confidence: number;
  reasoning: string;
  weight: number;
  processingTime: number;
  modelVersion: string;
}

interface ConsensusBreakdownProps {
  nodes: ConsensusNode[];
  finalScore: number;
  consensusConfidence: number;
  totalProcessingTime: number;
  timestamp: number;
  lazaiTxHash?: string;
  isExpanded?: boolean;
}

const nodeIcons = {
  creative: Brain,
  technical: Cpu,
  aesthetic: Palette,
  balanced: Scale,
  qa: Shield
};

const nodeColors = {
  creative: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  technical: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  aesthetic: 'text-pink-600 bg-pink-100 dark:bg-pink-900/20',
  balanced: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  qa: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
};

const nodeDescriptions = {
  creative: 'Evaluates artistic creativity, originality, and imaginative elements',
  technical: 'Analyzes technical execution, composition, and rendering quality',
  aesthetic: 'Assesses visual appeal, color harmony, and artistic merit',
  balanced: 'Provides holistic evaluation balancing all artistic aspects',
  qa: 'Validates output quality and ensures consistency with prompt requirements'
};

export default function ConsensusBreakdown({ 
  nodes, 
  finalScore, 
  consensusConfidence, 
  totalProcessingTime, 
  timestamp,
  lazaiTxHash,
  isExpanded = false 
}: ConsensusBreakdownProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const [selectedNode, setSelectedNode] = useState<ConsensusNode | null>(null);

  // Calculate consensus strength
  const consensusStrength = nodes.length > 0 
    ? 1 - (Math.max(...nodes.map(n => n.score)) - Math.min(...nodes.map(n => n.score)))
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-emerald-600';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    if (score >= 0.6) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return 'Exceptional';
    if (score >= 0.8) return 'High Quality';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    return 'Developing';
  };

  return (
    <Card className="w-full border-2 border-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">Multi-Node AI Consensus</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              5 Specialized Nodes
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {lazaiTxHash && (
              <Badge variant="outline" className="text-xs">
                <Award className="w-3 h-3 mr-1" />
                LazAI Verified
              </Badge>
            )}
            <Collapsible open={expanded} onOpenChange={setExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
        
        <CardDescription className="text-sm">
          Advanced distributed AI reasoning with specialized evaluation nodes for comprehensive quality assessment
        </CardDescription>
        
        {/* Quick Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(finalScore)}`}>
              {(finalScore * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Final Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(consensusConfidence * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(consensusStrength * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Consensus</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(totalProcessingTime / 1000).toFixed(1)}s
            </div>
            <div className="text-xs text-muted-foreground">Processing</div>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Node Breakdown */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Node Performance Breakdown
              </h4>
              
              <div className="grid gap-3">
                {nodes.map((node, index) => {
                  const Icon = nodeIcons[node.type];
                  const isSelected = selectedNode?.name === node.name;
                  
                  return (
                    <div
                      key={node.name}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        isSelected ? 'ring-2 ring-primary' : 'hover:bg-accent/50'
                      } ${nodeColors[node.type]}`}
                      onClick={() => setSelectedNode(isSelected ? null : node)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{node.name}</span>
                          <Badge variant="outline" className="text-xs">
                            Weight: {(node.weight * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getScoreColor(node.score)}`}>
                            {(node.score * 100).toFixed(1)}%
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {node.confidence > 0.9 ? 'High' : node.confidence > 0.7 ? 'Med' : 'Low'} Conf
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Progress value={node.score * 100} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {nodeDescriptions[node.type]}
                        </div>
                        
                        {isSelected && (
                          <div className="mt-3 p-3 bg-background/50 rounded border">
                            <div className="text-sm space-y-2">
                              <div><strong>Reasoning:</strong> {node.reasoning}</div>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Model: {node.modelVersion}</span>
                                <span>Time: {node.processingTime}ms</span>
                                <span>Confidence: {(node.confidence * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consensus Analysis */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Star className="w-4 h-4" />
                Consensus Analysis
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Agreement Level</span>
                      <span className={`font-bold ${consensusStrength > 0.8 ? 'text-green-600' : consensusStrength > 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {consensusStrength > 0.8 ? 'Strong' : consensusStrength > 0.6 ? 'Moderate' : 'Weak'}
                      </span>
                    </div>
                    <Progress value={consensusStrength * 100} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      How closely the nodes agree on quality assessment
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quality Tier</span>
                      <span className={`font-bold ${getScoreColor(finalScore)}`}>
                        {getScoreLabel(finalScore)}
                      </span>
                    </div>
                    <Progress value={finalScore * 100} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      Overall quality classification based on weighted consensus
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* LazAI Integration Highlight */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  LazAI Blockchain Integration
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Reasoning Storage:</strong>
                  <p className="text-muted-foreground">
                    All node reasoning and consensus data stored immutably on-chain via LazAI
                  </p>
                </div>
                <div>
                  <strong>Verification:</strong>
                  <p className="text-muted-foreground">
                    {lazaiTxHash ? (
                      <>Transaction: <code className="text-xs bg-background px-1 rounded">{lazaiTxHash.substring(0, 16)}...</code></>
                    ) : (
                      'Ready for on-chain verification'
                    )}
                  </p>
                </div>
              </div>
              
              {lazaiTxHash && (
                <div className="mt-3">
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                    <Eye className="w-4 h-4 mr-2" />
                    View LazAI Transaction
                  </Button>
                </div>
              )}
            </div>

            {/* Technical Details */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Generated: {new Date(timestamp).toLocaleString()}</div>
              <div>Nodes: {nodes.length} specialized AI evaluators</div>
              <div>Total Processing: {totalProcessingTime}ms across distributed network</div>
              <div>Consensus Algorithm: Weighted Democratic Voting with Reliability Scoring</div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
