# 🔧 AIArtify Technical Documentation

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   AI Services    │    │   Blockchain    │
│   (Next.js)     │◄──►│   (LazAI/Gemini) │    │   (Metis)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │    │   Image Storage  │    │   NFT Storage   │
│   (ShadCN)      │    │   (ImgBB)        │    │   (IPFS)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Architecture
```
src/
├── app/                 # Next.js App Router
│   ├── page.tsx        # Main art generation
│   ├── layout.tsx      # Root layout
│   ├── globals.css     # Global styles
│   ├── api/            # API routes
│   ├── collection/     # NFT collection view
│   ├── gallery/        # Public gallery
│   └── leaderboard/    # User rankings
├── components/         # Reusable UI components
│   ├── ui/            # ShadCN UI components
│   ├── main-nav.tsx   # Navigation
│   └── user-nav.tsx   # User profile
├── lib/               # Core services
│   ├── utils.ts       # Utility functions
│   ├── nft-storage.ts # NFT operations
│   └── web3/          # Blockchain utilities
├── hooks/             # Custom React hooks
│   ├── use-wallet.ts  # Wallet integration
│   └── use-toast.ts   # Notification system
└── ai/                # AI integration
    ├── genkit.ts      # Google Genkit
    └── flows/         # AI workflows
```

## 🧠 AI Integration Layer

### LazAI Service Architecture
```typescript
interface LazAIService {
  // Core reasoning interface
  reason(input: LazAIReasoningInput): Promise<LazAIReasoningOutput>
  
  // Hyperion node integration
  callHyperionNode(input: ReasoningInput): Promise<HyperionResult>
  
  // Multi-modal analysis
  analyzeImage(imageData: string, prompt: string): Promise<QualityScore>
  
  // Comparison metrics
  compareWithTraditionalAI(prompt: string): Promise<ComparisonMetrics>
}
```

### AI Flow Implementation
```typescript
// AI Enhancement Flow
export const generateArtFlow = defineFlow(
  {
    name: 'generateArt',
    inputSchema: z.object({
      prompt: z.string(),
      enhanceWithLazAI: z.boolean().optional()
    }),
    outputSchema: z.object({
      enhancedPrompt: z.string(),
      reasoning: z.string(),
      imageUrl: z.string()
    })
  },
  async (input) => {
    // 1. Enhanced prompt generation with LazAI
    const enhancedPrompt = await enhance(input.prompt)
    
    // 2. Generate image with enhanced prompt
    const imageUrl = await generateImage(enhancedPrompt)
    
    // 3. Return comprehensive result
    return {
      enhancedPrompt,
      reasoning: lazaiResult.reasoning,
      imageUrl
    }
  }
)
```

## 🔗 Blockchain Integration

### Web3 Configuration
```typescript
// Chain configuration for Metis Hyperion
export const chainConfig = {
  chainId: 1088,
  name: 'Metis Hyperion',
  currency: 'METIS',
  explorerUrl: 'https://andromeda-explorer.metis.io',
  rpcUrl: 'https://andromeda.metis.io/?owner=1088'
}

// Smart contract configuration
export const nftContractConfig = {
  address: '0x...',
  abi: [...],
  methods: {
    mint: 'safeMint',
    transfer: 'safeTransferFrom',
    approve: 'approve'
  }
}
```

### NFT Minting Flow
```typescript
async function mintNFT(metadata: NFTMetadata): Promise<string> {
  try {
    // 1. Upload metadata to IPFS
    const metadataUri = await uploadToIPFS(metadata)
    
    // 2. Estimate gas with fallback strategy
    const gasLimit = await estimateGasWithFallback(
      contract,
      'safeMint',
      [userAddress, metadataUri]
    )
    
    // 3. Execute minting transaction
    const tx = await contract.safeMint(userAddress, metadataUri, {
      gasLimit: gasLimit
    })
    
    // 4. Wait for confirmation
    const receipt = await tx.wait()
    
    return receipt.transactionHash
  } catch (error) {
    throw new Error(`Minting failed: ${error.message}`)
  }
}
```

## 🎨 Frontend Architecture

### State Management Pattern
```typescript
// Custom hook for art generation state
export function useArtGeneration() {
  const [state, setState] = useState<ArtGenerationState>({
    prompt: '',
    isGenerating: false,
    isRefining: false,
    isMinting: false,
    result: null,
    error: null
  })
  
  const generateArt = useCallback(async (prompt: string) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))
    
    try {
      const result = await generateArtFlow({ prompt, enhanceWithLazAI: true })
      setState(prev => ({ ...prev, result, isGenerating: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error.message, 
        isGenerating: false 
      }))
    }
  }, [])
  
  return { state, generateArt }
}
```

### Component Design Patterns
```typescript
// Compound component pattern for art generation
export function ArtGenerator({ children }: ArtGeneratorProps) {
  const context = useArtGeneration()
  
  return (
    <ArtGenerationContext.Provider value={context}>
      <div className="art-generator">
        {children}
      </div>
    </ArtGenerationContext.Provider>
  )
}

ArtGenerator.PromptInput = PromptInput
ArtGenerator.GenerateButton = GenerateButton
ArtGenerator.ResultDisplay = ResultDisplay
ArtGenerator.MintButton = MintButton
```

## 🔧 Error Handling Strategy

### Hierarchical Error Handling
```typescript
// Global error boundary
export class GlobalErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    console.error('Global error:', error, errorInfo)
    
    // Show user-friendly message
    toast({
      title: "Something went wrong",
      description: "Please refresh the page and try again.",
      variant: "destructive"
    })
  }
}

// Service-level error handling
export async function handleServiceError(
  operation: () => Promise<any>,
  fallback?: () => Promise<any>
): Promise<any> {
  try {
    return await operation()
  } catch (error) {
    console.error('Service error:', error)
    
    if (fallback) {
      try {
        return await fallback()
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError)
        throw error // Throw original error
      }
    }
    
    throw error
  }
}
```

### Gas Estimation Fallback Strategy
```typescript
async function estimateGasWithFallback(
  contract: Contract,
  method: string,
  args: any[]
): Promise<bigint> {
  try {
    // Primary: Smart estimation with buffer
    const estimated = await contract[method].estimateGas(...args)
    return estimated * 120n / 100n // 20% buffer
  } catch (error) {
    console.warn('Gas estimation failed, using fallback')
    
    try {
      // Secondary: Fixed high limit
      return 500000n
    } catch (fallbackError) {
      // Tertiary: Let provider handle it
      return undefined as any
    }
  }
}
```

## 📊 Performance Optimization

### Image Optimization
```typescript
// Progressive image loading with fallbacks
export function OptimizedImage({ src, alt, ...props }: ImageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  return (
    <div className="relative">
      {loading && <ImageSkeleton />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true)
          setLoading(false)
        }}
        className={cn(
          "transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100"
        )}
        {...props}
      />
      {error && <ImageErrorFallback />}
    </div>
  )
}
```

### Caching Strategy
```typescript
// React Query for API caching
export function useGalleryData() {
  return useQuery({
    queryKey: ['gallery'],
    queryFn: fetchGalleryData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

// Local storage caching for user preferences
export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  })
  
  const setValue = useCallback((value: T) => {
    setState(value)
    localStorage.setItem(key, JSON.stringify(value))
  }, [key])
  
  return [state, setValue]
}
```

## 🔒 Security Implementation

### Input Sanitization
```typescript
// Prompt sanitization for AI safety
export function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .slice(0, 1000) // Limit length
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/javascript:/gi, '') // Remove JS protocols
    .replace(/data:/gi, '') // Remove data URIs
}

// Wallet address validation
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
```

### API Rate Limiting
```typescript
// Client-side rate limiting
class RateLimiter {
  private requests: number[] = []
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  canMakeRequest(): boolean {
    const now = Date.now()
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    )
    
    // Check if we can make a new request
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now)
      return true
    }
    
    return false
  }
}

export const aiApiLimiter = new RateLimiter(10, 60000) // 10 requests per minute
```

## 📱 Responsive Design System

### Breakpoint Strategy
```typescript
// Tailwind breakpoint configuration
export const breakpoints = {
  'sm': '640px',   // Small devices
  'md': '768px',   // Medium devices
  'lg': '1024px',  // Large devices
  'xl': '1280px',  // Extra large devices
  '2xl': '1536px'  // 2X large devices
}

// Responsive component pattern
export function ResponsiveGrid({ children }: GridProps) {
  return (
    <div className="
      grid gap-4
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-3
      xl:grid-cols-4
    ">
      {children}
    </div>
  )
}
```

### Mobile-First Approach
```css
/* Mobile-first CSS approach */
.art-generator {
  @apply p-4 space-y-4;
}

@screen sm {
  .art-generator {
    @apply p-6 space-y-6;
  }
}

@screen lg {
  .art-generator {
    @apply p-8 space-y-8 max-w-6xl mx-auto;
  }
}
```

## 🚀 Deployment Architecture

### Vercel Configuration
```javascript
// next.config.ts
export default {
  output: 'standalone',
  images: {
    domains: ['i.ibb.co', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif']
  },
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/genkit']
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false
    }
    return config
  }
}
```

### Environment Configuration
```bash
# Production environment variables
NEXT_PUBLIC_CHAIN_ID=1088
NEXT_PUBLIC_CHAIN_NAME="Metis Hyperion"
NEXT_PUBLIC_RPC_URL="https://andromeda.metis.io/?owner=1088"

# API Keys (Server-side only)
GEMINI_API_KEY=your_gemini_key
LLM_API_KEY=your_llm_key
IMGBB_API_KEY=your_imgbb_key

# Optional services
PRIVATE_KEY=wallet_private_key
HYPERION_NODE_URL=custom_node_url
```

## 📈 Monitoring and Analytics

### Error Tracking
```typescript
// Custom error tracking
export function trackError(error: Error, context: string) {
  console.error(`[${context}]`, error)
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // sendToSentry(error, context)
  }
}

// Performance monitoring
export function trackPerformance(name: string, fn: () => Promise<any>) {
  return async (...args: any[]) => {
    const start = performance.now()
    
    try {
      const result = await fn.apply(this, args)
      const duration = performance.now() - start
      
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }
}
```

---

*This technical documentation provides a comprehensive overview of AIArtify's architecture, implementation patterns, and best practices. For specific implementation details, refer to the source code and inline documentation.*
