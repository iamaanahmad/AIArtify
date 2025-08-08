import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { contractConfig } from '@/lib/web3/config';
import { getRpcProvider, safeContractCall, tokenExists, getTokenMetadata } from '@/lib/web3/utils';

/**
 * Debug endpoint to test contract interaction and identify issues
 * Only available in development mode
 * GET /api/debug-contract?tokenId=20
 */
export async function GET(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      error: 'Debug endpoints only available in development mode'
    }, { status: 404 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const tokenIdParam = searchParams.get('tokenId');
    
    if (!tokenIdParam) {
      return NextResponse.json({
        error: 'tokenId parameter is required',
        example: '/api/debug-contract?tokenId=20'
      }, { status: 400 });
    }
    
    const tokenId = parseInt(tokenIdParam);
    const provider = getRpcProvider();
    const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);
    
    console.log(`🔍 Debugging contract interaction for token ${tokenId}`);
    
    const debug = {
      tokenId,
      contractAddress: contractConfig.address,
      networkInfo: {
        chainId: await provider.getNetwork().then(n => n.chainId),
        blockNumber: await provider.getBlockNumber(),
      },
      tests: {} as any
    };
    
    // Test 1: Check if contract exists and is responsive
    try {
      const contractName = await safeContractCall(() => contract.name());
      const contractSymbol = await safeContractCall(() => contract.symbol());
      debug.tests.contractInfo = {
        success: true,
        name: contractName,
        symbol: contractSymbol
      };
    } catch (error: any) {
      debug.tests.contractInfo = {
        success: false,
        error: error.message
      };
    }
    
    // Test 2: Check if token exists
    try {
      const exists = await tokenExists(contract, tokenId);
      debug.tests.tokenExists = {
        success: true,
        exists
      };
      
      if (exists) {
        // Test 3: Get token owner
        try {
          const owner = await safeContractCall(() => contract.ownerOf(tokenId));
          debug.tests.tokenOwner = {
            success: true,
            owner
          };
        } catch (error: any) {
          debug.tests.tokenOwner = {
            success: false,
            error: error.message
          };
        }
        
        // Test 4: Try to get tokenURI with different methods
        const uriTests = {
          standard: null as any,
          bigint: null as any,
          staticCall: null as any,
          enhanced: null as any
        };
        
        // Standard call
        try {
          const uri = await safeContractCall(() => contract.tokenURI(tokenId));
          uriTests.standard = { success: true, uri: uri?.substring(0, 100) + '...' };
        } catch (error: any) {
          uriTests.standard = { success: false, error: error.message };
        }
        
        // BigInt call
        try {
          const uri = await safeContractCall(() => contract.tokenURI(BigInt(tokenId)));
          uriTests.bigint = { success: true, uri: uri?.substring(0, 100) + '...' };
        } catch (error: any) {
          uriTests.bigint = { success: false, error: error.message };
        }
        
        // Static call
        try {
          const uri = await contract.tokenURI.staticCall(tokenId);
          uriTests.staticCall = { success: true, uri: uri?.substring(0, 100) + '...' };
        } catch (error: any) {
          uriTests.staticCall = { success: false, error: error.message };
        }
        
        // Enhanced method
        try {
          const uri = await getTokenMetadata(contract, tokenId);
          uriTests.enhanced = { success: true, uri: uri?.substring(0, 100) + '...' };
        } catch (error: any) {
          uriTests.enhanced = { success: false, error: error.message };
        }
        
        debug.tests.tokenURI = uriTests;
        
      } else {
        debug.tests.tokenURI = { message: 'Skipped - token does not exist' };
      }
    } catch (error: any) {
      debug.tests.tokenExists = {
        success: false,
        error: error.message
      };
    }
    
    // Test 5: Try to get recent Transfer events
    try {
      const transferFilter = contract.filters.Transfer(null, null, tokenId);
      const events = await contract.queryFilter(transferFilter, -1000); // Last 1000 blocks
      debug.tests.transferEvents = {
        success: true,
        eventCount: events.length,
        events: events.map(e => ({
          blockNumber: e.blockNumber,
          transactionHash: e.transactionHash,
          from: 'args' in e ? e.args?.[0] : 'N/A',
          to: 'args' in e ? e.args?.[1] : 'N/A',
          tokenId: 'args' in e ? e.args?.[2]?.toString() : 'N/A'
        }))
      };
    } catch (error: any) {
      debug.tests.transferEvents = {
        success: false,
        error: error.message
      };
    }
    
    return NextResponse.json({
      success: true,
      debug: JSON.parse(JSON.stringify(debug, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      )),
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
