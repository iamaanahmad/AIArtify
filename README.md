<p align="center">
  <a href="https://ai-artify.vercel.app/" target="_blank">
    <img src="https://i.ibb.co/93dZ5qdH/Art-Chain-AILogo.png" alt="AIArtify Logo" width="120">
  </a>
</p>

<h1 align="center">🎨 AIArtify</h1>

<p align="center">
  <strong>A revolutionary dApp that empowers users to become digital artists by transforming their text prompts into unique, mintable NFTs on the blockchain.</strong>
  <br />
  This project was built for a hackathon, showcasing a full-featured, modern Web3 application.
</p>

<p align="center">
  <a href="https://ai-artify.vercel.app/"><strong>➡️ LIVE DEMO</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity"/>
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
</p>

---

<p align="center">
  <img src="https://i.ibb.co/TByzgxrn/image.png" alt="AIArtify Screenshot" width="100%">
</p>

## ✨ Key Features

- **🤖 AI-Powered Art Generation**: Describe any vision, and our integrated Genkit flow with Google's Gemini 2.0 flash preview model will generate a high-quality image.
- **✍️ AI-Assisted Prompt Engineering**: Features "Alith," an AI prompt engineer that helps users refine their creative ideas, suggesting more descriptive and effective prompts for better results.
- **🔗 Seamless NFT Minting**: Mint your generated artwork directly to the **Metis Hyperion Testnet** as an `ERC721` token with a single click.
- **🔒 Full Web3 Wallet Integration**: Connect your MetaMask wallet with our custom `useWallet` hook, which provides a smooth experience for connecting, disconnecting, and changing accounts.
- **🏪 Hybrid Storage Architecture**: Revolutionary dual-storage system combining on-chain verification with local storage backup and transaction-based metadata recovery for maximum reliability.
- **🖼️ Personal NFT Collection**: View all the art you've minted in a personal, organized gallery with real artwork display powered by our hybrid storage system.
- **🌍 Public Community Gallery**: Explore a dynamic public gallery showcasing all community creations with multi-source data aggregation and creator attribution.
- **🏆 Advanced Leaderboard System**: Sophisticated creator ranking with quality scoring algorithm, achievement badges, and comprehensive statistics tracking.
- **📊 Quality Assessment Engine**: Smart scoring system evaluating artwork based on AI enhancement, reasoning depth, complexity, and recency factors.
- **💾 Resilient Data Recovery**: Transaction-based metadata recovery system that ensures no artwork is ever lost, even if contract storage fails.
- **📱 Modern, Responsive UI**: Built with Next.js 15.3.3, ShadCN UI, and Tailwind CSS for a polished, professional, and mobile-friendly user experience.

## 🛠️ Technology Stack

| Technology | Description |
| :--- | :--- |
| **Framework** | Next.js 15.3.3 (App Router, Turbopack) |
| **Styling** | Tailwind CSS, ShadCN UI Components |
| **Generative AI**| Google Genkit, Gemini 2.0 Flash Preview |
| **Blockchain** | Ethers.js v6, Metis Hyperion Testnet |
| **Storage** | Hybrid Architecture (Local + ImgBB + Blockchain) |
| **Deployment** | Vercel, Chain ID 133717 |

## 🚀 How It Works

The user journey is designed to be simple yet powerful:

1.  **🔮 Describe Your Vision**: The user enters a text prompt for the art they want to create.
2.  **💡 Refine with Alith (Optional)**: The user can ask "Alith," our AI assistant, to refine their prompt. Alith suggests an improved prompt, a creative title, and explains its reasoning.
3.  **🎨 Generate Art**: The final prompt is sent to a Genkit flow that uses the Gemini 2.0 flash preview model to create stunning artwork.
4.  **🦊 Connect Wallet**: The user connects their MetaMask wallet to the dApp with automatic network switching to Metis Hyperion.
5.  **💎 Mint as NFT**: With one click, the user initiates a transaction to mint the artwork. The metadata is stored using our hybrid storage system for maximum reliability.
6.  **🏪 Multi-Source Display**: Artwork appears instantly in your collection through our innovative storage architecture that combines local storage, blockchain verification, and transaction recovery.
7.  **🌟 Community Recognition**: Your creations automatically appear in the public gallery and contribute to your leaderboard ranking with our advanced quality scoring system.

## Local Development

To run this project on your local machine, follow these steps:

**1. Clone the repository:**
```bash
git clone https://github.com/iamaanahmad/AIArtify.git
cd AIArtify
```

**2. Install dependencies:**
```bash
npm install
```

**3. Set up environment variables:**
Create a `.env.local` file in the root of the project and add your Google AI API key:
```env
GEMINI_API_KEY=your_google_ai_api_key
IMGBB_API_KEY=your_imgbb_api_key
```

**4. Run the development server:**
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## 🚀 Deploy to Vercel

This Next.js application is production-ready and can be deployed to Vercel with ease:

1.  **Fork or clone** this repository to your GitHub account.
2.  Go to [vercel.com](https://vercel.com) and sign up or log in.
3.  Click "Add New..." → "Project".
4.  Import your GitHub repository.
5.  Under "Environment Variables," add:
    - `GEMINI_API_KEY`: Your Google AI API key
    - `IMGBB_API_KEY`: Your ImgBB API key
6.  Click "Deploy". Vercel will automatically build and deploy your application.

The app is optimized for Vercel deployment with proper Next.js 15.3.3 configuration and Turbopack integration.

## 🏅 Technical Achievements

### 🧠 Problem-Solving Innovation
This project showcases advanced problem-solving in Web3 development:

**Challenge**: Smart contract `tokenURI()` function returning null, breaking traditional NFT metadata retrieval.

**Solution**: Engineered a sophisticated hybrid storage architecture that:
- Maintains local storage for instant access
- Implements transaction-based metadata recovery
- Provides seamless fallback mechanisms
- Ensures zero data loss regardless of contract issues

### 🔧 Advanced Implementation Details
- **Chunked Blockchain Querying**: Overcomes RPC rate limits with intelligent batch processing
- **Multi-Source Data Aggregation**: Combines local storage, blockchain events, and transaction data
- **Automatic Network Management**: Seamless Metis Hyperion testnet integration
- **Error-Resilient Architecture**: Comprehensive error handling and recovery systems
- **Real-Time Synchronization**: Live updates across all platform components

### 📊 Performance Optimizations
- **Lazy Loading**: Efficient image loading in galleries
- **Caching Strategies**: Smart local storage management
- **Batch Operations**: Optimized blockchain interactions
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 📜 Smart Contract Details

The `AIArtifyNFT` smart contract is an `ERC721` token with `Ownable` and `ERC721URIStorage` extensions from OpenZeppelin.

- **Network**: Metis Hyperion Testnet (Chain ID: 133717)
- **Contract Address**: `0x401fab91bde961cfcac8c54f5466ab39c7203803`
- **[View on Hyperion Explorer](https://hyperion-testnet-explorer.metisdevops.link/tx/0x31e2a735e99b547194ede6fa64c7c66e268d1e220a48296c0f0b6f9fb5989f1f)**

Note: Due to contract limitations with `tokenURI()`, we've implemented a robust hybrid storage solution that ensures full functionality regardless of contract behavior.

---

## 🤝 Contributing

We welcome contributions to AIArtify! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### 🐛 Bug Reports
Found a bug? Please open an issue with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

### 💡 Feature Requests
Have ideas for improvements? We'd love to hear them! Open an issue with the `enhancement` label.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Genkit & Gemini**: For providing cutting-edge AI image generation
- **Metis Network**: For the robust testnet infrastructure
- **OpenZeppelin**: For secure smart contract libraries
- **ShadCN**: For beautiful UI components
- **Next.js Team**: For the amazing React framework
- **Vercel**: For seamless deployment platform

---

<p align="center">
  <strong>Built with ❤️ for the Web3 community</strong>
  <br />
  <a href="https://ai-artify.vercel.app/">🌐 Live Demo</a> • 
  <a href="https://github.com/iamaanahmad/AIArtify/issues">🐛 Report Bug</a> • 
  <a href="https://github.com/iamaanahmad/AIArtify/issues">💡 Request Feature</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/iamaanahmad/AIArtify?style=social" alt="GitHub Stars"/>
  <img src="https://img.shields.io/github/forks/iamaanahmad/AIArtify?style=social" alt="GitHub Forks"/>
  <img src="https://img.shields.io/github/watchers/iamaanahmad/AIArtify?style=social" alt="GitHub Watchers"/>
</p>

## 🔮 Advanced Features

### 🏪 Hybrid Storage Architecture
Our revolutionary storage system combines multiple data sources for maximum reliability:
- **Local Storage**: Instant access to your creations
- **Blockchain Verification**: On-chain proof of ownership
- **Transaction Recovery**: Metadata extraction from blockchain transactions
- **ImgBB Integration**: Reliable image hosting and backup

### 🏆 Quality Scoring Algorithm
Our sophisticated leaderboard uses a multi-factor scoring system:
- **Base Score**: 50 points for each minted NFT
- **AI Enhancement**: +20 points for using Alith prompt refinement
- **Reasoning Depth**: +15 points for detailed AI explanations
- **Complexity Bonus**: 0-15 points based on prompt sophistication
- **Recency Factor**: 0-10 points for recent activity

### 🎖️ Achievement System
Earn badges and recognition:
- **🎨 Artist**: 1+ NFTs minted
- **🔥 Creator**: 5+ NFTs minted
- **⭐ Master**: 10+ NFTs minted
- **👑 Legend**: 20+ NFTs minted
- **🚀 Pioneer**: Top 10 on leaderboard

### 💡 Smart Features
- **Automatic Network Switching**: Seamless MetaMask integration
- **Real-time Updates**: Live gallery and leaderboard refresh
- **Creator Attribution**: Full provenance tracking
- **Multi-Wallet Support**: Works across different wallet addresses
