# Fix for "missing revert data" Error

## Problem Description
The application was throwing an error: `Error: missing revert data (code=CALL_EXCEPTION)` when calling `tokenURI(tokenId)` on non-existent NFT tokens.

## Root Cause
In ethers.js v6, when a smart contract call reverts without providing a specific revert reason, it throws a generic "missing revert data" error instead of a more descriptive error. This was happening when:

1. The gallery page tried to call `tokenURI()` on token IDs that don't exist
2. The collection page made similar calls on burned or non-existent tokens

The specific error in the issue showed:
- Function call: `0xc87b56dd` (tokenURI function selector) 
- Token ID: `0x000000000000000000000000000000000000000000000000000000000000000b` (token ID 11)
- Contract: `0x401FAb91BdE961cfcac8c54F5466aB39c7203803`

## Solution
Created a robust error handling mechanism:

1. **Added `safeContractCall` utility function** in `/src/lib/web3/utils.ts` that:
   - Catches `CALL_EXCEPTION` errors
   - Handles "missing revert data" errors specifically
   - Returns `null` for non-existent tokens instead of throwing

2. **Updated contract interaction pattern**:
   - Check token existence with `ownerOf()` first
   - Use `safeContractCall` wrapper for all contract calls
   - Handle null returns gracefully

3. **Fixed TypeScript errors**:
   - Added proper type guards for event.args access
   - Improved type safety for contract interactions

## Files Modified
- `src/app/gallery/page.tsx` - Added error handling for gallery NFT loading
- `src/app/collection/page.tsx` - Added error handling for user collection loading  
- `src/lib/web3/utils.ts` - New utility module for Web3 error handling

## Result
The application now gracefully handles non-existent tokens without throwing confusing errors, providing a better user experience.