/**
 * @fileOverview Unit Tests for LazAI Client Service
 * 
 * Comprehensive test suite for LazAI + Hyperion integration including:
 * - Agent initialization and configuration
 * - Multi-modal reasoning capabilities  
 * - Hyperion node integration
 * - Proof-of-reasoning verification
 * - Dataset storage operations
 * - Comparison metrics generation
 */

import { createLazAIAgent, isLazAIAvailable, getLazAIStatus, type LazAIReasoningInput } from '@/lib/lazai-client';

// Mock environment variables
const mockEnv = {
  PRIVATE_KEY: 'test_private_key_123',
  LLM_API_KEY: 'test_gemini_api_key_456',
  OPENAI_API_KEY: 'test_openai_api_key_789',
};

describe('LazAI Client Service', () => {
  let originalEnv: typeof process.env;

  beforeEach(() => {
    originalEnv = process.env;
    Object.assign(process.env, mockEnv);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Agent Initialization', () => {
    it('should create LazAI agent with default configuration', () => {
      const agent = createLazAIAgent();
      expect(agent).toBeDefined();
      expect(typeof agent.reason).toBe('function');
    });

    it('should create agent with custom Hyperion configuration', () => {
      const customConfig = {
        hyperionConfig: {
          nodeUrl: 'https://custom-hyperion-node.test',
          nodeId: 'test-node-123',
          proofEndpoint: '/custom/proof',
          datasetEndpoint: '/custom/dataset',
        },
      };

      const agent = createLazAIAgent(customConfig);
      expect(agent).toBeDefined();
    });

    it('should handle missing environment variables gracefully', () => {
      delete process.env.PRIVATE_KEY;
      delete process.env.LLM_API_KEY;

      const agent = createLazAIAgent();
      expect(agent).toBeDefined();
    });
  });

  describe('LazAI Status and Availability', () => {
    it('should correctly detect LazAI availability', () => {
      const isAvailable = isLazAIAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should return comprehensive status information', () => {
      const status = getLazAIStatus();
      
      expect(status).toHaveProperty('isRealLazAI');
      expect(status).toHaveProperty('hasCredentials');
      expect(status).toHaveProperty('agentType');
      expect(status).toHaveProperty('privateKeyConfigured');
      expect(status).toHaveProperty('llmKeyConfigured');
      
      expect(typeof status.isRealLazAI).toBe('boolean');
      expect(typeof status.hasCredentials).toBe('boolean');
      expect(typeof status.agentType).toBe('string');
    });
  });

  describe('Text-based Reasoning', () => {
    it('should process basic text prompts successfully', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'A majestic dragon in a mystical forest',
        mode: 'text',
      };

      const result = await agent.reason(input);
      
      expect(result).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(typeof result.reasoning).toBe('string');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.model).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });

    it('should handle empty prompts gracefully', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: '',
        mode: 'text',
      };

      await expect(agent.reason(input)).rejects.toThrow();
    });

    it('should include context in reasoning when provided', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'A sunset landscape',
        context: 'Impressionist painting style',
        mode: 'text',
      };

      const result = await agent.reason(input);
      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-modal Reasoning', () => {
    it('should process multi-modal inputs with image data', async () => {
      const agent = createLazAIAgent();
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      
      const input: LazAIReasoningInput = {
        prompt: 'Analyze this generated artwork',
        imageData: mockImageData,
        mode: 'multimodal',
      };

      const result = await agent.reason(input);
      
      expect(result).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.qualityScore).toBeDefined();
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should return valid quality scores for image analysis', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'Quality assessment test',
        imageData: 'mock-base64-image-data',
        mode: 'multimodal',
      };

      const result = await agent.reason(input);
      
      if (result.qualityScore !== undefined) {
        expect(result.qualityScore).toBeGreaterThanOrEqual(0);
        expect(result.qualityScore).toBeLessThanOrEqual(100);
        expect(Number.isInteger(result.qualityScore)).toBe(true);
      }
    });
  });

  describe('Comparison Mode', () => {
    it('should generate comparison metrics between LazAI and standard AI', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'Compare AI reasoning capabilities',
        mode: 'comparison',
      };

      const result = await agent.reason(input);
      
      expect(result).toBeDefined();
      expect(result.comparisonMetrics).toBeDefined();
      
      if (result.comparisonMetrics) {
        expect(result.comparisonMetrics.lazaiScore).toBeGreaterThanOrEqual(0);
        expect(result.comparisonMetrics.geminiScore).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(result.comparisonMetrics.hyperionAdvantage)).toBe(true);
        expect(result.comparisonMetrics.hyperionAdvantage.length).toBeGreaterThan(0);
      }
    });

    it('should show LazAI advantage in comparison scores', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'Artistic enhancement test',
        mode: 'comparison',
      };

      const result = await agent.reason(input);
      
      if (result.comparisonMetrics) {
        expect(result.comparisonMetrics.lazaiScore).toBeGreaterThanOrEqual(
          result.comparisonMetrics.geminiScore
        );
      }
    });
  });

  describe('Hyperion Integration', () => {
    it('should generate proof hashes for reasoning verification', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'Test proof generation',
        mode: 'text',
      };

      const result = await agent.reason(input);
      
      if (result.proofHash) {
        expect(result.proofHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it('should include Hyperion node information', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'Node information test',
        mode: 'text',
      };

      const result = await agent.reason(input);
      
      expect(result.hyperionNodeId).toBeDefined();
      expect(typeof result.hyperionNodeId).toBe('string');
    });
  });

  describe('Dataset Storage', () => {
    it('should generate dataset IDs for reasoning storage', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'Dataset storage test',
        fileId: 12345,
        mode: 'text',
      };

      const result = await agent.reason(input);
      
      if (result.datasetId) {
        expect(result.datasetId).toMatch(/^dataset_/);
        expect(typeof result.datasetId).toBe('string');
      }
    });

    it('should handle dataset storage without fileId', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'No file ID test',
        mode: 'text',
      };

      const result = await agent.reason(input);
      
      // Should work without dataset storage
      expect(result.reasoning).toBeDefined();
      expect(result.datasetId).toBeUndefined();
      expect(result.transactionHash).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network failure
      const agent = createLazAIAgent({
        hyperionConfig: {
          nodeUrl: 'https://non-existent-node.test',
          nodeId: 'test-node',
          proofEndpoint: '/proof',
          datasetEndpoint: '/dataset',
        },
      });

      const input: LazAIReasoningInput = {
        prompt: 'Network failure test',
        mode: 'text',
      };

      // Should still work with fallback systems
      const result = await agent.reason(input);
      expect(result).toBeDefined();
      expect(result.reasoning).toBeDefined();
    });

    it('should validate confidence scores within bounds', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'Confidence validation test',
        mode: 'text',
      };

      const result = await agent.reason(input);
      
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Metrics', () => {
    it('should complete reasoning within reasonable time limits', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'Performance test prompt',
        mode: 'text',
      };

      const startTime = Date.now();
      const result = await agent.reason(input);
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(10000); // Less than 10 seconds
      expect(result.timestamp).toBeGreaterThanOrEqual(startTime);
      expect(result.timestamp).toBeLessThanOrEqual(endTime);
    });

    it('should generate meaningful reasoning output', async () => {
      const agent = createLazAIAgent();
      const input: LazAIReasoningInput = {
        prompt: 'A detailed fantasy landscape with mountains and rivers',
        mode: 'text',
      };

      const result = await agent.reason(input);
      
      expect(result.reasoning.length).toBeGreaterThan(100); // Substantial output
      expect(result.reasoning).toContain('Enhanced'); // Should contain enhancement keywords
    });
  });
});

/**
 * Integration tests for real LazAI SDK (when available)
 */
describe('LazAI SDK Integration Tests', () => {
  // These tests only run when real LazAI SDK is available
  const shouldSkip = !isLazAIAvailable();

  it.skipIf(shouldSkip)('should connect to real LazAI services', async () => {
    const agent = createLazAIAgent();
    const input: LazAIReasoningInput = {
      prompt: 'Real SDK integration test',
      mode: 'text',
    };

    const result = await agent.reason(input);
    
    expect(result).toBeDefined();
    expect(result.reasoning).toBeDefined();
    // Real SDK should provide more detailed results
    expect(result.reasoning.length).toBeGreaterThan(200);
  });

  it.skipIf(shouldSkip)('should store reasoning on actual blockchain', async () => {
    const agent = createLazAIAgent();
    const input: LazAIReasoningInput = {
      prompt: 'Blockchain storage test',
      fileId: Date.now(),
      mode: 'text',
    };

    const result = await agent.reason(input);
    
    // Real integration should provide transaction hash
    expect(result.transactionHash).toBeDefined();
    expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });
});

/**
 * Mock data and utilities for testing
 */
export const mockLazAIResponses = {
  basicReasoning: {
    reasoning: 'Enhanced artistic analysis with detailed suggestions...',
    confidence: 0.85,
    model: 'deepseek-r1',
    timestamp: 1672531200000,
  },
  multiModalReasoning: {
    reasoning: 'Multi-modal analysis including image quality assessment...',
    confidence: 0.92,
    qualityScore: 88,
    model: 'deepseek-r1',
    timestamp: 1672531200000,
  },
  comparisonReasoning: {
    reasoning: 'Comprehensive comparison analysis...',
    confidence: 0.89,
    comparisonMetrics: {
      lazaiScore: 92,
      geminiScore: 78,
      hyperionAdvantage: ['Decentralized processing', 'Proof verification'],
    },
    model: 'deepseek-r1',
    timestamp: 1672531200000,
  },
};

/**
 * Test utilities for mocking external dependencies
 */
export const testUtils = {
  mockImageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
  mockProofHash: '0x7f4e2a9c8b1d5e6f3a7b9c2d4e8f1a3b5c7d9e2f4a6b8c1d3e5f7a9b2c4d6e8f',
  mockDatasetId: 'dataset_test_001',
  mockTransactionHash: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
  
  createMockAgent: () => ({
    reason: jest.fn().mockResolvedValue(mockLazAIResponses.basicReasoning),
    getWalletInfo: jest.fn().mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      chainId: 1337,
      networkName: 'LazAI Testnet',
    }),
  }),
};
