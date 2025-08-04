/**
 * Recovery utility to reconstruct NFT metadata from transaction data
 */

export async function recoverNftMetadataFromTx(txHash: string): Promise<any | null> {
  try {
    console.log('🔄 Attempting to recover metadata from transaction:', txHash);
    
    // Get transaction data from Metis Hyperion testnet
    const response = await fetch('https://hyperion-testnet.metisdevops.link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [txHash]
      })
    });
    
    const data = await response.json();
    if (!data.result) {
      console.log('❌ Transaction not found:', txHash);
      return null;
    }
    
    const tx = data.result;
    console.log('📄 Transaction data retrieved');
    
    // The input data contains the ABI-encoded call to mintNFT(address, string)
    // We need to decode the string parameter which contains the base64 metadata
    const inputData = tx.input;
    
    if (!inputData || inputData === '0x') {
      console.log('❌ No input data in transaction');
      return null;
    }
    
    // The function signature for mintNFT(address,string) is the first 4 bytes
    // Then we have the ABI-encoded parameters
    try {
      // Import ethers for ABI decoding
      const { ethers } = await import('ethers');
      
      // Create an interface for our contract
      const contractInterface = new ethers.Interface([
        "function mintNFT(address to, string tokenURI) returns (uint256)"
      ]);
      
      // Decode the transaction input
      const decoded = contractInterface.parseTransaction({ data: inputData });
      
      if (decoded && decoded.name === 'mintNFT') {
        const tokenURI = decoded.args[1]; // The second parameter is the tokenURI
        console.log('🎯 Found tokenURI in transaction data');
        
        if (tokenURI.startsWith('data:application/json;base64,')) {
          // Decode the base64 metadata
          const base64String = tokenURI.split(',')[1];
          const jsonString = atob(base64String); // Browser-compatible base64 decode
          const metadata = JSON.parse(jsonString);
          
          console.log('✅ Successfully recovered metadata:', metadata);
          return metadata;
        }
      }
    } catch (decodeError) {
      console.error('Failed to decode transaction data:', decodeError);
    }
    
    return null;
  } catch (error) {
    console.error('Error recovering metadata from transaction:', error);
    return null;
  }
}
