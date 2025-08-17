// Multi-Node Consensus Engine for AI
// Implements distributed AI reasoning with quality validation and consensus mechanisms

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export interface ConsensusNode {
  id: string;
  name: string;
  endpoint?: string;
  weight: number;
  specialty: 'creative' | 'technical' | 'aesthetic' | 'balanced';
  lastResponse?: number;
  reliability: number; // 0-1 score based on historical performance
}

export interface ConsensusRequest {
  type: 'generate' | 'analyze' | 'enhance' | 'validate';
  prompt: string;
  image?: string;
  metadata?: Record<string, any>;
  requiredConfidence: number; // 0-1 threshold for consensus
  maxNodes?: number;
  timeout?: number;
}

export interface NodeResponse {
  nodeId: string;
  response: any;
  confidence: number;
  processingTime: number;
  reasoning?: string;
  metadata?: Record<string, any>;
}

export interface ConsensusResult {
  finalResult: any;
  confidence: number;
  consensusScore: number; // How much nodes agreed (0-1)
  participatingNodes: number;
  responses: NodeResponse[];
  reasoning: string;
  metadata: {
    totalProcessingTime: number;
    averageConfidence: number;
    agreementLevel: 'high' | 'medium' | 'low';
    qualityScore: number;
  };
}

// Define specialized LazAI node configurations
const CONSENSUS_NODES: ConsensusNode[] = [
  {
    id: 'creative_specialist',
    name: 'Creative AI Specialist',
    weight: 1.2,
    specialty: 'creative',
    reliability: 0.95
  },
  {
    id: 'technical_analyst',
    name: 'Technical Analysis Engine',
    weight: 1.0,
    specialty: 'technical',
    reliability: 0.92
  },
  {
    id: 'aesthetic_validator',
    name: 'Aesthetic Quality Validator',
    weight: 1.1,
    specialty: 'aesthetic',
    reliability: 0.88
  },
  {
    id: 'balanced_reasoner',
    name: 'Balanced AI Reasoner',
    weight: 1.0,
    specialty: 'balanced',
    reliability: 0.90
  },
  {
    id: 'quality_assurance',
    name: 'Quality Assurance Engine',
    weight: 0.9,
    specialty: 'technical',
    reliability: 0.93
  }
];

export class MultiNodeConsensus {
  private ai = ai; // Use existing Genkit AI instance
  private nodes: ConsensusNode[];
  private consensusHistory: Map<string, ConsensusResult> = new Map();

  constructor() {
    this.nodes = [...CONSENSUS_NODES];
  }

  // Main consensus execution method
  async executeConsensus(request: ConsensusRequest): Promise<ConsensusResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[Consensus] Starting ${request.type} consensus with ${this.nodes.length} nodes`);
      
      // Select optimal nodes for this request
      const selectedNodes = this.selectOptimalNodes(request);
      console.log(`[Consensus] Selected ${selectedNodes.length} optimal nodes`);

      // Execute requests in parallel with timeout
      const responses = await this.executeParallelRequests(selectedNodes, request);
      console.log(`[Consensus] Received ${responses.length} responses`);

      // Calculate consensus
      const consensusResult = this.calculateConsensus(responses, request);
      
      // Update node reliability scores
      this.updateNodeReliability(responses, consensusResult);

      // Store in history for learning
      const requestHash = this.hashRequest(request);
      this.consensusHistory.set(requestHash, consensusResult);

      const totalTime = Date.now() - startTime;
      console.log(`[Consensus] Completed in ${totalTime}ms with confidence ${consensusResult.confidence}`);

      return {
        ...consensusResult,
        metadata: {
          ...consensusResult.metadata,
          totalProcessingTime: totalTime
        }
      };

    } catch (error) {
      console.error('[Consensus] Execution failed:', error);
      
      // Fallback to single LazAI call
      return this.fallbackToSingleNode(request);
    }
  }

  // Select optimal nodes based on request type and node specialties
  private selectOptimalNodes(request: ConsensusRequest): ConsensusNode[] {
    const maxNodes = request.maxNodes || 4;
    
    // Sort nodes by relevance to request type and reliability
    const scoredNodes = this.nodes.map(node => ({
      node,
      score: this.calculateNodeScore(node, request)
    }));

    scoredNodes.sort((a, b) => b.score - a.score);
    
    return scoredNodes
      .slice(0, maxNodes)
      .map(scored => scored.node);
  }

  // Calculate relevance score for node selection
  private calculateNodeScore(node: ConsensusNode, request: ConsensusRequest): number {
    let score = node.reliability * node.weight;

    // Boost score based on specialty match
    switch (request.type) {
      case 'generate':
        if (node.specialty === 'creative') score *= 1.3;
        if (node.specialty === 'balanced') score *= 1.1;
        break;
      case 'analyze':
        if (node.specialty === 'technical') score *= 1.3;
        if (node.specialty === 'aesthetic') score *= 1.2;
        break;
      case 'enhance':
        if (node.specialty === 'aesthetic') score *= 1.3;
        if (node.specialty === 'creative') score *= 1.2;
        break;
      case 'validate':
        if (node.specialty === 'technical') score *= 1.3;
        if (node.specialty === 'balanced') score *= 1.1;
        break;
    }

    // Penalize recently failed nodes
    if (node.lastResponse && Date.now() - node.lastResponse < 30000) {
      score *= 0.8; // Reduce score for recently used nodes
    }

    return score;
  }

  // Execute requests to multiple nodes in parallel
  private async executeParallelRequests(
    nodes: ConsensusNode[], 
    request: ConsensusRequest
  ): Promise<NodeResponse[]> {
    const timeout = request.timeout || 30000;
    const promises = nodes.map(node => this.executeNodeRequest(node, request, timeout));
    
    // Wait for all requests or timeout
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<NodeResponse> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  // Execute single node request with timeout
  private async executeNodeRequest(
    node: ConsensusNode, 
    request: ConsensusRequest,
    timeout: number
  ): Promise<NodeResponse | null> {
    const startTime = Date.now();
    
    try {
      console.log(`[Consensus] Executing request on node: ${node.name}`);
      
      // Create specialized prompt based on node specialty
      const specializedPrompt = this.createSpecializedPrompt(node, request);
      
      // Execute with timeout
      const response = await Promise.race([
        this.executeLazAIRequest(specializedPrompt, request),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
      ]);

      const processingTime = Date.now() - startTime;
      node.lastResponse = Date.now();

      return {
        nodeId: node.id,
        response,
        confidence: this.calculateResponseConfidence(response, node),
        processingTime,
        reasoning: this.extractReasoning(response),
        metadata: {
          nodeSpecialty: node.specialty,
          nodeWeight: node.weight
        }
      };

    } catch (error) {
      console.error(`[Consensus] Node ${node.name} failed:`, error);
      return null;
    }
  }

  // Create specialized prompts based on node specialty
  private createSpecializedPrompt(node: ConsensusNode, request: ConsensusRequest): string {
    const basePrompt = request.prompt;
    
    switch (node.specialty) {
      case 'creative':
        return `As a creative AI specialist, focus on innovative and artistic aspects. ${basePrompt}\n\nEmphasize creativity, originality, and artistic value in your response.`;
        
      case 'technical':
        return `As a technical analyst, focus on technical quality and feasibility. ${basePrompt}\n\nProvide detailed technical analysis and quality metrics.`;
        
      case 'aesthetic':
        return `As an aesthetic validator, focus on visual appeal and composition. ${basePrompt}\n\nEvaluate visual quality, composition, and aesthetic appeal.`;
        
      case 'balanced':
        return `As a balanced reasoner, provide comprehensive analysis across all aspects. ${basePrompt}\n\nConsider creative, technical, and aesthetic factors equally.`;
        
      default:
        return basePrompt;
    }
  }

  // Execute actual AI request using Genkit
  private async executeLazAIRequest(prompt: string, request: ConsensusRequest): Promise<any> {
    switch (request.type) {
      case 'generate':
        return this.ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });
        
      case 'analyze':
        return this.ai.generate({
          model: 'googleai/gemini-2.0-flash',
          prompt: `Analyze this image: ${prompt}`,
          config: {
            responseModalities: ['TEXT'],
          },
        });
        
      case 'enhance':
        return this.ai.generate({
          model: 'googleai/gemini-2.0-flash',
          prompt: `Enhance this prompt for better AI art generation: ${prompt}`,
          config: {
            responseModalities: ['TEXT'],
          },
        });
        
      case 'validate':
        return this.ai.generate({
          model: 'googleai/gemini-2.0-flash',
          prompt: `Validate and score this AI art concept: ${prompt}`,
          config: {
            responseModalities: ['TEXT'],
          },
        });
        
      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }
  }

  // Calculate response confidence based on node and response quality
  private calculateResponseConfidence(response: any, node: ConsensusNode): number {
    let confidence = node.reliability;
    
    // Adjust based on response characteristics
    if (response?.confidence) {
      confidence = (confidence + response.confidence) / 2;
    }
    
    if (response?.quality_score) {
      confidence = (confidence + response.quality_score) / 2;
    }
    
    // Boost confidence for detailed responses
    if (response?.reasoning || response?.explanation) {
      confidence = Math.min(1.0, confidence * 1.1);
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // Extract reasoning from response
  private extractReasoning(response: any): string {
    return response?.reasoning || 
           response?.explanation || 
           response?.analysis || 
           'No reasoning provided';
  }

  // Calculate final consensus result
  private calculateConsensus(responses: NodeResponse[], request: ConsensusRequest): ConsensusResult {
    if (responses.length === 0) {
      throw new Error('No valid responses received');
    }

    // Calculate weighted consensus
    const totalWeight = responses.reduce((sum, r) => {
      const node = this.nodes.find(n => n.id === r.nodeId);
      return sum + (node?.weight || 1.0) * r.confidence;
    }, 0);

    const averageConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    
    // Determine agreement level
    const confidenceVariance = this.calculateVariance(responses.map(r => r.confidence));
    const agreementLevel = confidenceVariance < 0.1 ? 'high' : 
                          confidenceVariance < 0.25 ? 'medium' : 'low';

    // Select best response or create hybrid
    const finalResult = this.selectBestResponse(responses);
    
    // Calculate consensus score
    const consensusScore = this.calculateConsensusScore(responses);
    
    // Calculate overall quality score
    const qualityScore = this.calculateQualityScore(responses, consensusScore);

    return {
      finalResult,
      confidence: Math.min(1.0, totalWeight / responses.length),
      consensusScore,
      participatingNodes: responses.length,
      responses,
      reasoning: this.generateConsensusReasoning(responses, agreementLevel),
      metadata: {
        totalProcessingTime: 0, // Set by caller
        averageConfidence,
        agreementLevel,
        qualityScore
      }
    };
  }

  // Calculate variance in confidence scores
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Select best response or create hybrid result
  private selectBestResponse(responses: NodeResponse[]): any {
    // Sort by confidence and node weight
    const sortedResponses = responses.sort((a, b) => {
      const nodeA = this.nodes.find(n => n.id === a.nodeId);
      const nodeB = this.nodes.find(n => n.id === b.nodeId);
      
      const scoreA = a.confidence * (nodeA?.weight || 1.0);
      const scoreB = b.confidence * (nodeB?.weight || 1.0);
      
      return scoreB - scoreA;
    });

    // Return the highest scoring response
    return sortedResponses[0].response;
  }

  // Calculate consensus score (how much nodes agreed)
  private calculateConsensusScore(responses: NodeResponse[]): number {
    if (responses.length <= 1) return 1.0;

    // Compare responses for similarity (simplified)
    let agreementCount = 0;
    let totalComparisons = 0;

    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        totalComparisons++;
        
        // Simple agreement check based on confidence similarity
        const confidenceDiff = Math.abs(responses[i].confidence - responses[j].confidence);
        if (confidenceDiff < 0.2) {
          agreementCount++;
        }
      }
    }

    return totalComparisons > 0 ? agreementCount / totalComparisons : 1.0;
  }

  // Calculate overall quality score
  private calculateQualityScore(responses: NodeResponse[], consensusScore: number): number {
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    const participationScore = Math.min(1.0, responses.length / 4); // Optimal 4 nodes
    
    return (avgConfidence * 0.4) + (consensusScore * 0.4) + (participationScore * 0.2);
  }

  // Generate reasoning explanation for consensus
  private generateConsensusReasoning(responses: NodeResponse[], agreementLevel: string): string {
    const nodeCount = responses.length;
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    
    let reasoning = `Consensus reached with ${nodeCount} AI nodes (${agreementLevel} agreement). `;
    reasoning += `Average confidence: ${(avgConfidence * 100).toFixed(1)}%. `;
    
    // Add specialty insights
    const specialties = responses.map(r => {
      const node = this.nodes.find(n => n.id === r.nodeId);
      return node?.specialty || 'unknown';
    });
    
    const uniqueSpecialties = [...new Set(specialties)];
    reasoning += `Perspectives from: ${uniqueSpecialties.join(', ')} specialists.`;
    
    return reasoning;
  }

  // Update node reliability scores based on performance
  private updateNodeReliability(responses: NodeResponse[], result: ConsensusResult): void {
    responses.forEach(response => {
      const node = this.nodes.find(n => n.id === response.nodeId);
      if (!node) return;

      // Adjust reliability based on how well this node's response aligned with consensus
      const alignmentScore = response.confidence * result.consensusScore;
      const adjustment = (alignmentScore - 0.5) * 0.05; // Small adjustments
      
      node.reliability = Math.max(0.1, Math.min(1.0, node.reliability + adjustment));
    });
  }

  // Fallback to single AI node when consensus fails
  private async fallbackToSingleNode(request: ConsensusRequest): Promise<ConsensusResult> {
    console.log('[Consensus] Falling back to single node execution');
    
    try {
      const response = await this.executeLazAIRequest(request.prompt, request);
      
      return {
        finalResult: response,
        confidence: 0.7, // Lower confidence for single node
        consensusScore: 1.0, // No disagreement possible
        participatingNodes: 1,
        responses: [{
          nodeId: 'fallback',
          response,
          confidence: 0.7,
          processingTime: 0,
          reasoning: 'Fallback single node execution'
        }],
        reasoning: 'Consensus failed, executed with single AI node',
        metadata: {
          totalProcessingTime: 0,
          averageConfidence: 0.7,
          agreementLevel: 'high',
          qualityScore: 0.7
        }
      };
    } catch (error) {
      throw new Error(`Both consensus and fallback failed: ${error}`);
    }
  }

  // Create hash for request caching
  private hashRequest(request: ConsensusRequest): string {
    const str = JSON.stringify({
      type: request.type,
      prompt: request.prompt,
      image: request.image ? 'has_image' : 'no_image'
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString();
  }

  // Get consensus history for analysis
  getConsensusHistory(): Map<string, ConsensusResult> {
    return new Map(this.consensusHistory);
  }

  // Get node performance statistics
  getNodeStats(): ConsensusNode[] {
    return this.nodes.map(node => ({ ...node }));
  }
}

console.log('[Consensus] Multi-Node Consensus Engine initialized');
