import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { contractConfig } from '@/lib/web3/config';
import { getRpcProvider, safeContractCall, tokenExists, getTokenMetadata } from '@/lib/web3/utils';

/**
 * Debug endpoint to test contract interaction and identify minting issues
 * GET /api/debug-contract?test=minting
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('test') || 'basic';
    
    const provider = new ethers.JsonRpcProvider('https://hyperion-testnet.metisdevops.link');
    const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);
    
    console.log(`🔍 Contract Debug Test: ${testType}`);
    
    const debug = {
      contractAddress: contractConfig.address,
      testType,
      timestamp: new Date().toISOString(),
      network: await provider.getNetwork(),
      tests: {} as any
    };
    
    // Test 1: Basic contract info
    try {
      const code = await provider.getCode(contractConfig.address);
      debug.tests.contractExists = {
        success: code !== '0x',
        codeLength: code.length
      };
    } catch (error: any) {
      debug.tests.contractExists = {
        success: false,
        error: error.message
      };
    }
    
    // Test 2: Try basic contract calls
    const basicCalls = ['name', 'symbol', 'owner'];
    for (const method of basicCalls) {
      try {
        const result = await contract[method]();
        debug.tests[`${method}Call`] = {
          success: true,
          result: result.toString()
        };
      } catch (error: any) {
        debug.tests[`${method}Call`] = {
          success: false,
          error: error.message,
          code: error.code
        };
      }
    }
    
    if (testType === 'minting') {
      // Test 3: Analyze mintNFT function
      try {
        const fragment = contract.interface.getFunction('mintNFT');
        if (fragment) {
          debug.tests.mintNFTFunction = {
            success: true,
            signature: fragment.format(),
            inputs: fragment.inputs.map(input => ({ name: input.name, type: input.type })),
            outputs: fragment.outputs.map(output => ({ name: output.name, type: output.type }))
          };
        } else {
          debug.tests.mintNFTFunction = {
            success: false,
            error: 'mintNFT function not found'
          };
        }
      } catch (error: any) {
        debug.tests.mintNFTFunction = {
          success: false,
          error: error.message
        };
      }
      
      // Test 4: Try static call to mintNFT (simulation)
      try {
        const testAddress = '0x1234567890123456789012345678901234567890';
        const testURI = 'data:application/json;base64,eyJ0ZXN0IjoidHJ1ZSJ9';
        
        const result = await contract.mintNFT.staticCall(testAddress, testURI);
        debug.tests.mintNFTSimulation = {
          success: true,
          result: result.toString(),
          note: 'Simulation succeeded - function should work'
        };
      } catch (error: any) {
        debug.tests.mintNFTSimulation = {
          success: false,
          error: error.message,
          code: error.code,
          data: error.data,
          reason: error.reason,
          note: 'This error explains why minting fails'
        };
      }
      
      // Test 5: Check if contract has any access control
      try {
        // Try to check if there's an access control error
        const testError = await contract.mintNFT.staticCall(
          '0x0000000000000000000000000000000000000000', // Invalid address
          'invalid-uri'
        ).catch((e: any) => e);
        
        debug.tests.accessControl = {
          errorType: testError.code,
          errorMessage: testError.message,
          note: 'Analyzing error type to understand restrictions'
        };
      } catch (error: any) {
        debug.tests.accessControl = {
          error: error.message
        };
      }
      
      // Test 6: Check recent minting activity
      try {
        const transferFilter = contract.filters.Transfer(ethers.ZeroAddress, null, null);
        const recentMints = await contract.queryFilter(transferFilter, -1000);
        
        debug.tests.recentMints = {
          success: true,
          count: recentMints.length,
          lastMints: recentMints.slice(-5).map(event => ({
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            to: 'args' in event ? event.args?.[1] : 'N/A',
            tokenId: 'args' in event ? event.args?.[2]?.toString() : 'N/A'
          }))
        };
      } catch (error: any) {
        debug.tests.recentMints = {
          success: false,
          error: error.message
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: JSON.parse(JSON.stringify(debug, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      ))
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
