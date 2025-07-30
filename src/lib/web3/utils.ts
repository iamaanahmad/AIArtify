/**
 * Utility functions for handling Web3/contract interactions
 */

/**
 * Safely call contract methods that might revert due to non-existent tokens
 * This specifically handles the "missing revert data" error that occurs with ethers v6
 * when calling functions like tokenURI() or ownerOf() on non-existent tokens
 */
export const safeContractCall = async (contractCall: () => Promise<any>): Promise<any> => {
  try {
    return await contractCall();
  } catch (error: any) {
    // Handle specific ethers errors for non-existent tokens
    if (error.code === 'CALL_EXCEPTION' || 
        error.reason?.includes('ERC721NonexistentToken') ||
        error.message?.includes('missing revert data')) {
      return null;
    }
    throw error; // Re-throw other errors
  }
};