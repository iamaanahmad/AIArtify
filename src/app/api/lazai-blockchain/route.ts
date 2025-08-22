import { NextRequest, NextResponse } from 'next/server';
import { lazaiBlockchain, type LazAIVerificationData } from '@/lib/lazai-blockchain';

/**
 * LazAI Blockchain Integration API
 * 
 * POST /api/lazai-blockchain/store - Store verification on LazAI testnet
 * GET /api/lazai-blockchain/stats - Get blockchain statistics
 * GET /api/lazai-blockchain/verify/[artworkId] - Get verification from blockchain
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artworkId, prompt, reasoning, qualityScore, consensusNodes } = body;

    // Validate input
    if (!artworkId || !prompt || !reasoning || qualityScore === undefined || !consensusNodes) {
      return NextResponse.json(
        { error: 'Missing required fields: artworkId, prompt, reasoning, qualityScore, consensusNodes' },
        { status: 400 }
      );
    }

    // Initialize blockchain service
    const initialized = await lazaiBlockchain.initialize();
    if (!initialized) {
      return NextResponse.json(
        { 
          error: 'LazAI blockchain service not available',
          message: 'Contract not deployed yet - using demo mode' 
        },
        { status: 503 }
      );
    }

    // Store verification data
    const verificationData: LazAIVerificationData = {
      artworkId,
      prompt,
      reasoning,
      qualityScore,
      consensusNodes
    };

    // For now, simulate blockchain storage since we need user wallet for actual transactions
    // In production, this would require the user to sign the transaction
    const result = {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Mock transaction hash
      contractAddress: lazaiBlockchain.getNetworkInfo().contractAddress,
      explorerUrl: lazaiBlockchain.getLazAIExplorerUrl(`0x${Math.random().toString(16).substr(2, 64)}`),
      blockNumber: Math.floor(Math.random() * 1000000) + 500000,
      gasUsed: '89234',
      note: 'Demo transaction - real blockchain integration requires user wallet signing'
    };

    return NextResponse.json({
      success: true,
      blockchain: result,
      network: lazaiBlockchain.getNetworkInfo(),
      message: 'Verification prepared for LazAI blockchain storage'
    });

  } catch (error) {
    console.error('LazAI blockchain API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';

    // Initialize blockchain service
    const initialized = await lazaiBlockchain.initialize();
    if (!initialized) {
      return NextResponse.json({
        error: 'LazAI blockchain service not available',
        network: lazaiBlockchain.getNetworkInfo(),
        isAvailable: false
      });
    }

    if (action === 'stats') {
      const stats = await lazaiBlockchain.getStats();
      return NextResponse.json({
        success: true,
        stats,
        network: lazaiBlockchain.getNetworkInfo(),
        isAvailable: lazaiBlockchain.isAvailable()
      });
    }

    if (action === 'network') {
      return NextResponse.json({
        success: true,
        network: lazaiBlockchain.getNetworkInfo(),
        isAvailable: lazaiBlockchain.isAvailable()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=stats or ?action=network' },
      { status: 400 }
    );

  } catch (error) {
    console.error('LazAI blockchain GET API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
