# 🎨 AIArtify

**AIArtify** is a revolutionary dApp that empowers users to become digital artists by transforming their text prompts into unique, mintable NFTs on the blockchain. Leveraging the power of cutting-edge generative AI, this platform provides a seamless and intuitive experience for creating, refining, and owning verifiably unique digital art.

This project was built for a hackathon, showcasing a full-featured, modern Web3 application.

**[➡️ LIVE DEMO](https://art-chain-ai-gamma.vercel.app/)**

---

![AIArtify Screenshot](https://i.ibb.co/TByzgxrn/image.png)

## ✨ Key Features

- **AI-Powered Art Generation**: Describe any vision, and our integrated Genkit flow with Google's Gemini model will generate a high-quality image.
- **AI-Assisted Prompt Engineering**: Features "Alith," an AI prompt engineer that helps users refine their creative ideas, suggesting more descriptive and effective prompts for better results.
- **Seamless NFT Minting**: Mint your generated artwork directly to the **Metis Hyperion Testnet** as an `ERC721` token with a single click.
- **Full Web3 Wallet Integration**: Connect your MetaMask wallet with our custom `useWallet` hook, which provides a smooth experience for connecting, disconnecting, and changing accounts.
- **On-Chain Metadata**: NFT metadata is stored on-chain, including the creative title, original prompt, and the AI's refinement suggestions, adding depth and provenance to each piece.
- **Personal NFT Collection**: View all the art you've minted in a personal, organized gallery.
- **Community-Driven Content**: Explore a public gallery of creations from the entire community and a leaderboard ranking top artists.
- **Modern, Responsive UI**: Built with Next.js, ShadCN UI, and Tailwind CSS for a polished, professional, and mobile-friendly user experience.

## 🛠️ Technology Stack

| Technology | Description |
| :--- | :--- |
| **Framework** | Next.js (App Router) |
| **Styling** | Tailwind CSS, ShadCN UI |
| **Generative AI**| Genkit, Google Gemini |
| **Blockchain** | Solidity, Hardhat |
| **Web3 Library** | Ethers.js |
| **Deployment** | Vercel, Metis Hyperion Testnet |

## 🚀 How It Works

The user journey is designed to be simple and powerful:

1.  **Describe Your Vision**: The user enters a text prompt for the art they want to create.
2.  **Refine with Alith (Optional)**: The user can ask "Alith," our AI assistant, to refine their prompt. Alith suggests an improved prompt, a creative title, and explains its reasoning.
3.  **Generate Art**: The final prompt is sent to a Genkit flow that uses the Gemini image generation model to create the artwork.
4.  **Connect Wallet**: The user connects their MetaMask wallet to the dApp.
5.  **Mint as NFT**: With one click, the user initiates a transaction to mint the artwork. The metadata (including title and prompts) is stored on the Metis Hyperion testnet as a new NFT owned by the user.

## Local Development

To run this project on your local machine, follow these steps:

**1. Clone the repository:**
```bash
git clone https://github.com/iamaanahmad/ArtChain-AI.git
cd ArtChain-AI
```

**2. Install dependencies:**
```bash
npm install
```

**3. Set up environment variables:**
Create a `.env` file in the root of the project and add your Genkit/Google AI API key.
```
GEMINI_API_KEY=your_google_ai_api_key
```

**4. Run the development server:**
```bash
npm run dev
```
The application will be available at `http://localhost:9002`.

## 🚀 Deploy to Vercel

You can deploy this Next.js application to Vercel with a single click.

1.  Push your code to a GitHub repository.
2.  Go to [vercel.com](https://vercel.com) and sign up or log in.
3.  Click "Add New..." -> "Project".
4.  Import your GitHub repository.
5.  Under "Environment Variables," add your `GEMINI_API_KEY`.
6.  Click "Deploy". Vercel will automatically build and deploy your application.

## 📜 Smart Contract Details

The `AIArtifyNFT` smart contract is an `ERC721` token with `Ownable` and `ERC721URIStorage` extensions from OpenZeppelin.

- **Network**: Metis Hyperion Testnet
- **Contract Address**: `0x401fab91bde961cfcac8c54f5466ab39c7203803`
- **[View on Hyperion Explorer](https://hyperion-explorer.metis.io/address/0x401fab91bde961cfcac8c54f5466ab39c7203803)**

## 🔮 Future Roadmap

- **Functional Galleries**: Query the blockchain in real-time to populate the "My Collection" and "Public Gallery" pages.
- **Functional Leaderboard**: Implement a backend (like Firestore) to track user points for generating and minting, and display real rankings.
- **IPFS Integration**: Store image assets on IPFS for decentralized, permanent storage.
- **Social Features**: Allow users to "like" and comment on artworks in the public gallery.
- **Advanced AI Controls**: Give users options to select different AI models, styles, or aspect ratios.

---

*This project was developed with the assistance of an AI coding partner in Firebase Studio.*
