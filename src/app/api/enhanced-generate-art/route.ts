import { NextRequest, NextResponse } from 'next/server';
import { enhancedGenerateArt, batchGenerateArt, getQualityPreset, EnhancedGenerateArtInput } from '@/ai/flows/enhanced-generate-art-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API] Enhanced generation request:', { 
      prompt: body.prompt?.substring(0, 50) + '...', 
      qualityLevel: body.qualityLevel,
      batch: body.batch 
    });

    // Handle batch generation
    if (body.batch && Array.isArray(body.prompts)) {
      const batchOptions: Partial<EnhancedGenerateArtInput> = {
        style: body.style,
        qualityLevel: body.qualityLevel || 'standard',
        enhancePrompt: body.enhancePrompt !== false,
        validateResult: body.validateResult !== false,
        metadata: body.metadata
      };

      const results = await batchGenerateArt(body.prompts, batchOptions);
      
      return NextResponse.json({
        success: true,
        results,
        summary: {
          total: body.prompts.length,
          successful: results.length,
          failed: body.prompts.length - results.length,
          averageQuality: results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length,
          averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
        }
      });
    }

    // Single generation
    const input: EnhancedGenerateArtInput = {
      prompt: body.prompt,
      style: body.style,
      qualityLevel: body.qualityLevel || 'standard',
      enhancePrompt: body.enhancePrompt !== false,
      validateResult: body.validateResult !== false,
      metadata: body.metadata
    };

    // Apply quality preset if specified
    if (body.preset && ['standard', 'high', 'premium'].includes(body.preset)) {
      const preset = getQualityPreset(body.preset);
      Object.assign(input, preset);
    }

    const result = await enhancedGenerateArt(input);

    return NextResponse.json({
      success: true,
      ...result,
      performance: {
        qualityScore: result.qualityScore,
        confidence: result.confidence,
        consensusNodes: result.consensusData.participatingNodes,
        agreementLevel: result.consensusData.agreementLevel,
        processingTime: result.consensusData.processingTime
      }
    });

  } catch (error) {
    console.error('[API] Enhanced generation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate enhanced art',
        details: error instanceof Error ? error.message : 'Unknown error',
        fallbackAvailable: true
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'presets':
        return NextResponse.json({
          success: true,
          presets: {
            standard: getQualityPreset('standard'),
            high: getQualityPreset('high'),
            premium: getQualityPreset('premium')
          }
        });

      case 'stats':
        // Import consensus engine to get stats
        const { consensusEngine } = await import('@/ai/flows/enhanced-generate-art-flow');
        const nodeStats = consensusEngine.getNodeStats();
        const history = consensusEngine.getConsensusHistory();

        return NextResponse.json({
          success: true,
          stats: {
            nodes: nodeStats.map(node => ({
              id: node.id,
              name: node.name,
              specialty: node.specialty,
              reliability: node.reliability,
              weight: node.weight
            })),
            totalConsensusOperations: history.size,
            nodePerformance: nodeStats.reduce((acc, node) => {
              acc[node.id] = {
                reliability: node.reliability,
                specialty: node.specialty,
                lastActive: node.lastResponse ? new Date(node.lastResponse).toISOString() : null
              };
              return acc;
            }, {} as Record<string, any>)
          }
        });

      case 'health':
        return NextResponse.json({
          success: true,
          status: 'healthy',
          features: {
            enhancedGeneration: true,
            consensusValidation: true,
            batchProcessing: true,
            qualityPresets: true
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Available actions: presets, stats, health' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[API] Enhanced generation GET failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
