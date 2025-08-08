import { NextRequest, NextResponse } from 'next/server';
import { createLazAIAgent, isLazAIAvailable } from '@/lib/lazai-client';

export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check if LazAI is available
    if (!isLazAIAvailable()) {
      return NextResponse.json(
        { 
          error: 'LazAI SDK not configured',
          message: 'Please set PRIVATE_KEY and LLM_API_KEY (or OPENAI_API_KEY) environment variables'
        },
        { status: 503 }
      );
    }

    try {
      // Create LazAI agent and perform reasoning
      const lazaiAgent = createLazAIAgent();
      
      const result = await lazaiAgent.reason({
        prompt,
        context,
      });
      
      return NextResponse.json({
        success: true,
        reasoning: result.reasoning,
        confidence: result.confidence,
        model: result.model,
        timestamp: result.timestamp,
        lazaiNodeUrl: result.lazaiNodeUrl,
        transactionHash: result.transactionHash,
      });
    } catch (lazaiError) {
      console.error('LazAI reasoning failed:', lazaiError);
      
      return NextResponse.json(
        { 
          error: 'LazAI reasoning failed',
          message: lazaiError instanceof Error ? lazaiError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in LazAI API route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
