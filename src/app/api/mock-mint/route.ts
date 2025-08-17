import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { recipient, tokenURI } = await request.json();
    
    console.log('Mock minting NFT for:', recipient);
    console.log('Token URI:', tokenURI);
    
    // Simulate successful minting with a random token ID
    const tokenId = Math.floor(Math.random() * 1000000);
    const mockTxHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
    
    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return NextResponse.json({
      success: true,
      tokenId,
      transactionHash: mockTxHash,
      contractAddress: '0x401fab91bde961cfcac8c54f5466ab39c7203803',
      message: 'NFT minted successfully (mock mode)',
      blockExplorer: `https://hyperion-explorer.metis.io/tx/${mockTxHash}`
    });
    
  } catch (error) {
    console.error('Mock minting error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Mock minting failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
