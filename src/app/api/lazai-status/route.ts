import { NextResponse } from 'next/server';
import { getLazAIStatus } from '@/lib/lazai-client';

/**
 * API endpoint to check LazAI integration status
 * Useful for debugging and showing integration health
 */
export async function GET() {
  try {
    const status = getLazAIStatus();
    
    return NextResponse.json({
      success: true,
      status,
      message: status.isRealLazAI 
        ? '✅ Real LazAI SDK is active and ready'
        : '⚠️ Using enhanced fallback mode with Gemini AI',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: {
        isRealLazAI: false,
        hasCredentials: false,
        agentType: 'Error - Could not initialize',
      },
    }, { status: 500 });
  }
}
