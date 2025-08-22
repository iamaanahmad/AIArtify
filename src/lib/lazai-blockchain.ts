/**
 * LazAI Blockchain Integration Service
 * 
 * This service handles real blockchain interactions with LazAI testnet:
 * - Stores verification data on-chain
 * - Anchors prompt hashes for tamper-proof verification
 * - Provides real transaction links to LazAI explorer
 */

import { ethers } from 'ethers';
import { LAZAI_TESTNET_CONFIG } from './lazai-testnet-config';

// Contract ABI for the deployed verification contract
const VERIFICATION_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "artworkId", "type": "string"},
      {"internalType": "bytes32", "name": "promptHash", "type": "bytes32"},
      {"internalType": "bytes32", "name": "reasoningHash", "type": "bytes32"},
      {"internalType": "uint256", "name": "qualityScore", "type": "uint256"},
      {"internalType": "uint256", "name": "consensusNodes", "type": "uint256"},
      {"internalType": "string", "name": "metadataUri", "type": "string"}
    ],
    "name": "storeVerification",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "artworkId", "type": "string"}],
    "name": "getVerification",
    "outputs": [
      {
        "components": [
          {"internalType": "bytes32", "name": "promptHash", "type": "bytes32"},
          {"internalType": "bytes32", "name": "reasoningHash", "type": "bytes32"},
          {"internalType": "uint256", "name": "qualityScore", "type": "uint256"},
          {"internalType": "uint256", "name": "consensusNodes", "type": "uint256"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "address", "name": "verifier", "type": "address"},
          {"internalType": "string", "name": "metadataUri", "type": "string"},
          {"internalType": "bool", "name": "isVerified", "type": "bool"}
        ],
        "internalType": "struct AIArtifyVerification.VerificationRecord",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalArtworks", "type": "uint256"},
      {"internalType": "uint256", "name": "totalVerified", "type": "uint256"},
      {"internalType": "uint256", "name": "averageQuality", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "string", "name": "artworkId", "type": "string"},
      {"indexed": true, "internalType": "bytes32", "name": "promptHash", "type": "bytes32"},
      {"indexed": false, "internalType": "uint256", "name": "qualityScore", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "consensusNodes", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "verifier", "type": "address"}
    ],
    "name": "VerificationStored",
    "type": "event"
  }
];

export interface LazAIVerificationData {
  artworkId: string;
  prompt: string;
  reasoning: string;
  qualityScore: number; // 0-100
  consensusNodes: number;
  metadataUri?: string;
}

export interface LazAIBlockchainResult {
  success: boolean;
  transactionHash?: string;
  contractAddress?: string;
  explorerUrl?: string;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

class LazAIBlockchainService {
  private provider: ethers.Provider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize the blockchain service
   */
  async initialize(): Promise<boolean> {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(LAZAI_TESTNET_CONFIG.network.rpcUrl);
      
      // Check if we have a deployed contract address
      const contractAddress = LAZAI_TESTNET_CONFIG.contracts.verificationContract;
      if (contractAddress === '0x0000000000000000000000000000000000000000') {
        console.warn('⚠️ LazAI verification contract not deployed yet');
        return false;
      }
      
      // Initialize contract (read-only for now)
      this.contract = new ethers.Contract(
        contractAddress,
        VERIFICATION_CONTRACT_ABI,
        this.provider
      );
      
      // Test connection
      await this.provider.getBlockNumber();
      console.log('✅ LazAI blockchain service initialized');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize LazAI blockchain service:', error);
      return false;
    }
  }

  /**
   * Initialize with user's wallet for write operations
   */
  async initializeWithWallet(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not available');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await browserProvider.getSigner();
      
      // Initialize contract with signer for write operations
      const contractAddress = LAZAI_TESTNET_CONFIG.contracts.verificationContract;
      if (contractAddress !== '0x0000000000000000000000000000000000000000') {
        this.contract = new ethers.Contract(
          contractAddress,
          VERIFICATION_CONTRACT_ABI,
          this.signer
        );
      }
      
      console.log('✅ LazAI blockchain service initialized with wallet');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize with wallet:', error);
      return false;
    }
  }

  /**
   * Store verification data on LazAI blockchain
   */
  async storeVerification(data: LazAIVerificationData): Promise<LazAIBlockchainResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Blockchain service not initialized with wallet');
      }

      console.log('📝 Storing verification on LazAI blockchain...', data.artworkId);

      // Create hashes
      const promptHash = ethers.keccak256(ethers.toUtf8Bytes(data.prompt));
      const reasoningHash = ethers.keccak256(ethers.toUtf8Bytes(data.reasoning));
      
      // Convert quality score to contract format (0-10000)
      const qualityScoreScaled = Math.round(data.qualityScore * 100);
      
      // Prepare metadata URI (could be IPFS in production)
      const metadataUri = data.metadataUri || `data:application/json,${encodeURIComponent(JSON.stringify({
        artworkId: data.artworkId,
        prompt: data.prompt,
        reasoning: data.reasoning,
        timestamp: Date.now()
      }))}`;

      // Execute transaction
      const tx = await this.contract.storeVerification(
        data.artworkId,
        promptHash,
        reasoningHash,
        qualityScoreScaled,
        data.consensusNodes,
        metadataUri,
        {
          gasLimit: LAZAI_TESTNET_CONFIG.gas.limit,
          gasPrice: LAZAI_TESTNET_CONFIG.gas.price
        }
      );

      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      const result: LazAIBlockchainResult = {
        success: true,
        transactionHash: tx.hash,
        contractAddress: await this.contract.getAddress(),
        explorerUrl: `${LAZAI_TESTNET_CONFIG.network.explorerUrl}/tx/${tx.hash}`,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      console.log('✅ Verification stored on LazAI blockchain:', result);
      return result;

    } catch (error) {
      console.error('❌ Failed to store verification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Retrieve verification data from blockchain
   */
  async getVerification(artworkId: string): Promise<any> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const verification = await this.contract.getVerification(artworkId);
      
      return {
        promptHash: verification.promptHash,
        reasoningHash: verification.reasoningHash,
        qualityScore: Number(verification.qualityScore) / 100, // Convert back to 0-100
        consensusNodes: Number(verification.consensusNodes),
        timestamp: Number(verification.timestamp),
        verifier: verification.verifier,
        metadataUri: verification.metadataUri,
        isVerified: verification.isVerified
      };

    } catch (error) {
      console.error('❌ Failed to get verification:', error);
      return null;
    }
  }

  /**
   * Get blockchain statistics
   */
  async getStats(): Promise<any> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const stats = await this.contract.getStats();
      
      return {
        totalArtworks: Number(stats[0]),
        totalVerified: Number(stats[1]),
        averageQuality: Number(stats[2]) / 100 // Convert to 0-100
      };

    } catch (error) {
      console.error('❌ Failed to get stats:', error);
      return {
        totalArtworks: 0,
        totalVerified: 0,
        averageQuality: 0
      };
    }
  }

  /**
   * Generate LazAI explorer URL for a transaction
   */
  getLazAIExplorerUrl(transactionHash: string): string {
    return `${LAZAI_TESTNET_CONFIG.network.explorerUrl}/tx/${transactionHash}`;
  }

  /**
   * Check if LazAI integration is available
   */
  isAvailable(): boolean {
    return LAZAI_TESTNET_CONFIG.contracts.verificationContract !== '0x0000000000000000000000000000000000000000';
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      name: LAZAI_TESTNET_CONFIG.network.name,
      chainId: LAZAI_TESTNET_CONFIG.network.chainId,
      explorerUrl: LAZAI_TESTNET_CONFIG.network.explorerUrl,
      contractAddress: LAZAI_TESTNET_CONFIG.contracts.verificationContract
    };
  }
}

// Export singleton instance
export const lazaiBlockchain = new LazAIBlockchainService();

// Helper function to check if user is on correct network
export async function ensureLazAINetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainId, 16);
    
    if (currentChainId !== LAZAI_TESTNET_CONFIG.network.chainId) {
      // Try to switch to LazAI testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${LAZAI_TESTNET_CONFIG.network.chainId.toString(16)}` }],
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to switch to LazAI network:', error);
    return false;
  }
}
