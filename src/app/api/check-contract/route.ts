import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { contractConfig } from '@/lib/web3/config';
import { getRpcProvider } from '@/lib/web3/utils';

/**
 * Check if the contract exists and get basic info
 * Only available in development mode
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      error: 'Debug endpoints only available in development mode'
    }, { status: 404 });
  }
  
  try {
    const provider = getRpcProvider();
    const contractAddress = contractConfig.address;
    
    // Check if there's code at the address
    const code = await provider.getCode(contractAddress);
    const hasCode = code !== '0x';
    
    const result: any = {
      contractAddress,
      network: {
        chainId: Number((await provider.getNetwork()).chainId),
        blockNumber: await provider.getBlockNumber(),
        name: 'Metis Hyperion Testnet'
      },
      hasCode,
      codeLength: code.length,
      codePreview: code.substring(0, 100) + (code.length > 100 ? '...' : ''),
    };
    
    if (hasCode) {
      console.log('✅ Contract exists and has code');
      
      // Try to call a simple view function to test if it's a valid contract
      try {
        const contract = new ethers.Contract(contractAddress, contractConfig.abi, provider);
        
        // Try the most basic ERC721 functions
        const tests = {
          supportsInterface: null as any,
          name: null as any,
          symbol: null as any
        };
        
        try {
          // Test supportsInterface for ERC721 (0x80ac58cd)
          const supportsERC721 = await contract.supportsInterface('0x80ac58cd');
          tests.supportsInterface = { success: true, isERC721: supportsERC721 };
        } catch (e: any) {
          tests.supportsInterface = { success: false, error: e.message };
        }
        
        try {
          const name = await contract.name();
          tests.name = { success: true, value: name };
        } catch (e: any) {
          tests.name = { success: false, error: e.message };
        }
        
        try {
          const symbol = await contract.symbol();
          tests.symbol = { success: true, value: symbol };
        } catch (e: any) {
          tests.symbol = { success: false, error: e.message };
        }
        
        result.contractTests = tests;
      } catch (contractError: any) {
        result.contractError = contractError.message;
      }
    } else {
      console.log('❌ No contract code found at address');
    }
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Contract check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
