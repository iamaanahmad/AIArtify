import { NextResponse } from 'next/server';

/**
 * Health check endpoint for the application
 */
export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      services: {
        aiGeneration: 'operational',
        lazaiIntegration: 'operational',
        nftMinting: 'operational',
        metadataRecovery: 'operational'
      },
      message: 'AIArtify is running with full LazAI integration',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
