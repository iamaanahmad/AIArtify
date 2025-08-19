# 🤝 Contributing to AIArtify

Thank you for your interest in contributing to AIArtify! We welcome contributions from the community and are excited to see what you can bring to this AI-powered NFT creation platform.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- A MetaMask wallet for testing
- Basic knowledge of React/Next.js
- Understanding of Web3 concepts

### Setting Up Your Development Environment

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/iamaanahmad/AIArtify.git
   cd AIArtify
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Add your API keys
   echo "GEMINI_API_KEY=your_gemini_api_key
   PRIVATE_KEY=your_wallet_private_key
   LLM_API_KEY=your_llm_api_key" > .env.local
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # Visit http://localhost:9002
   ```

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- Use the [GitHub Issues](https://github.com/iamaanahmad/AIArtify/issues) to report bugs
- Include steps to reproduce the issue
- Provide screenshots or error messages when applicable
- Test on the [live demo](https://www.ai-artify.xyz/) first

### 💡 Feature Requests
- Open an issue with the "enhancement" label
- Describe the feature and its use case
- Explain how it would benefit users
- Consider the scope and complexity

### 🔧 Code Contributions
- Look for issues labeled "good first issue" or "help wanted"
- Follow our coding standards and conventions
- Write tests for new features
- Update documentation as needed

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add comments for complex logic
- Follow React and Next.js best practices

### Component Structure
```
src/
├── components/          # Reusable UI components
├── app/                # Next.js app router pages
├── lib/                # Utility functions and services
├── hooks/              # Custom React hooks
└── ai/                 # AI integration logic
```

### Commit Messages
Use conventional commit format:
```
feat: add new AI enhancement feature
fix: resolve minting gas estimation issue
docs: update README with new setup instructions
style: improve mobile responsiveness
refactor: optimize image generation flow
test: add unit tests for wallet integration
```

## 🧪 Testing

### Running Tests
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Guidelines
- Write unit tests for utility functions
- Test React components with React Testing Library
- Mock external APIs and blockchain interactions
- Test error handling and edge cases

## 🎨 UI/UX Contributions

### Design System
- Use existing Tailwind CSS classes
- Follow the ShadCN UI component patterns
- Maintain consistent spacing and typography
- Ensure mobile responsiveness
- Test with different screen sizes

### Accessibility
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain good color contrast

## 🔗 Blockchain Development

### Smart Contract Changes
- Test on Metis Hyperion testnet first
- Document gas usage and optimization
- Ensure backward compatibility
- Update deployment scripts if needed

### Web3 Integration
- Handle wallet connection errors gracefully
- Provide clear user feedback for transactions
- Test with different wallet providers
- Consider transaction pending states

## 📚 Documentation

### Types of Documentation
- **Code Comments**: Explain complex logic
- **README Updates**: Keep setup instructions current
- **API Documentation**: Document new endpoints
- **User Guides**: Help users understand features

### Documentation Standards
- Use clear, concise language
- Include code examples
- Add screenshots for UI changes
- Keep links up to date

## 🚀 Deployment and Release

### Pull Request Process
1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the development guidelines
   - Add tests for new functionality
   - Update documentation

3. **Test Thoroughly**
   ```bash
   npm run build  # Ensure it builds successfully
   npm test       # Run all tests
   ```

4. **Submit Pull Request**
   - Fill out the PR template completely
   - Link related issues
   - Request reviews from maintainers
   - Be responsive to feedback

### Review Process
- Code reviews focus on functionality, security, and maintainability
- All tests must pass before merging
- Documentation updates are required for new features
- Deployment testing on staging environment

## 🌟 Recognition

### Contributors
- All contributors are listed in our README
- Major contributors get special recognition
- Community contributions are highlighted in releases

### Rewards
- Active contributors may receive NFTs created with AIArtify
- Special badges for significant contributions
- Recognition in community announcements

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For general questions and ideas
- **Discord**: [Join our community server](#) (coming soon)

### Maintainer Contact
- **Primary Maintainer**: [@iamaanahmad](https://github.com/iamaanahmad)
- **Response Time**: Usually within 24-48 hours
- **Best Practices**: Use GitHub issues for trackable discussions

## 📋 Checklist for Contributors

Before submitting a pull request:

- [ ] I have read and followed the contributing guidelines
- [ ] My code follows the project's coding standards
- [ ] I have tested my changes thoroughly
- [ ] I have added tests for new functionality
- [ ] I have updated documentation as needed
- [ ] My commits follow the conventional commit format
- [ ] I have linked related issues in my PR
- [ ] I have requested appropriate reviewers

## 🎉 Thank You!

Your contributions make AIArtify better for everyone. Whether you're fixing a small bug, adding a major feature, or improving documentation, every contribution is valuable and appreciated.

**Together, let's build the future of AI-powered NFT creation!** 🚀

---

*For questions about contributing, please open an issue or contact the maintainers.*
