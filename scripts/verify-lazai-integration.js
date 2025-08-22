#!/usr/bin/env node

/**
 * LazAI Integration Verification Script
 * 
 * This script verifies that all LazAI testnet components are properly configured
 * and ready for deployment without disrupting the production environment.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 LazAI Integration Verification\n');

const checks = [];

// Check 1: Configuration files exist
function checkConfigFiles() {
  const configPath = path.join(__dirname, '..', 'src', 'lib', 'lazai-testnet-config.ts');
  const blockchainPath = path.join(__dirname, '..', 'src', 'lib', 'lazai-blockchain.ts');
  
  if (fs.existsSync(configPath) && fs.existsSync(blockchainPath)) {
    checks.push({ name: 'Configuration files', status: '✅', details: 'All config files present' });
  } else {
    checks.push({ name: 'Configuration files', status: '❌', details: 'Missing config files' });
  }
}

// Check 2: Contract file exists
function checkContractFiles() {
  const contractPath = path.join(__dirname, '..', 'contracts', 'AIArtifyVerification.sol');
  
  if (fs.existsSync(contractPath)) {
    checks.push({ name: 'Smart contract', status: '✅', details: 'Verification contract ready' });
  } else {
    checks.push({ name: 'Smart contract', status: '❌', details: 'Contract file missing' });
  }
}

// Check 3: Environment variables
function checkEnvironmentVariables() {
  const hasPrivateKey = !!process.env.PRIVATE_KEY;
  const hasLLMKey = !!(process.env.LLM_API_KEY || process.env.OPENAI_API_KEY);
  
  if (hasPrivateKey && hasLLMKey) {
    checks.push({ name: 'Environment variables', status: '✅', details: 'All required keys configured' });
  } else {
    checks.push({ 
      name: 'Environment variables', 
      status: '⚠️', 
      details: `Missing: ${!hasPrivateKey ? 'PRIVATE_KEY ' : ''}${!hasLLMKey ? 'LLM_API_KEY' : ''}` 
    });
  }
}

// Check 4: API routes exist
function checkAPIRoutes() {
  const lazaiBlockchainAPI = path.join(__dirname, '..', 'src', 'app', 'api', 'lazai-blockchain', 'route.ts');
  
  if (fs.existsSync(lazaiBlockchainAPI)) {
    checks.push({ name: 'API routes', status: '✅', details: 'LazAI blockchain API ready' });
  } else {
    checks.push({ name: 'API routes', status: '❌', details: 'Missing API routes' });
  }
}

// Check 5: Components exist
function checkComponents() {
  const statusComponent = path.join(__dirname, '..', 'src', 'components', 'lazai-testnet-status.tsx');
  const verificationComponent = path.join(__dirname, '..', 'src', 'components', 'lazai-verification.tsx');
  
  if (fs.existsSync(statusComponent) && fs.existsSync(verificationComponent)) {
    checks.push({ name: 'React components', status: '✅', details: 'All LazAI components ready' });
  } else {
    checks.push({ name: 'React components', status: '❌', details: 'Missing components' });
  }
}

// Check 6: Main page integration
function checkMainPageIntegration() {
  const mainPagePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
  
  if (fs.existsSync(mainPagePath)) {
    const content = fs.readFileSync(mainPagePath, 'utf8');
    
    if (content.includes('LazAITestnetStatus')) {
      checks.push({ name: 'Main page integration', status: '✅', details: 'LazAI status component integrated' });
    } else {
      checks.push({ name: 'Main page integration', status: '⚠️', details: 'Status component not integrated' });
    }
  } else {
    checks.push({ name: 'Main page integration', status: '❌', details: 'Main page not found' });
  }
}

// Check 7: Explorer links updated
function checkExplorerLinks() {
  const verificationPath = path.join(__dirname, '..', 'src', 'components', 'lazai-verification.tsx');
  
  if (fs.existsSync(verificationPath)) {
    const content = fs.readFileSync(verificationPath, 'utf8');
    
    if (content.includes('lazai-testnet-explorer.metisdevops.link')) {
      checks.push({ name: 'Explorer links', status: '✅', details: 'Real LazAI explorer URLs configured' });
    } else {
      checks.push({ name: 'Explorer links', status: '⚠️', details: 'Still using demo explorer URLs' });
    }
  } else {
    checks.push({ name: 'Explorer links', status: '❌', details: 'Verification component not found' });
  }
}

// Run all checks
function runVerification() {
  console.log('Running verification checks...\n');
  
  checkConfigFiles();
  checkContractFiles();
  checkEnvironmentVariables();
  checkAPIRoutes();
  checkComponents();
  checkMainPageIntegration();
  checkExplorerLinks();
  
  // Display results
  console.log('📋 Verification Results:\n');
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}: ${check.details}`);
  });
  
  // Summary
  const passed = checks.filter(c => c.status === '✅').length;
  const warnings = checks.filter(c => c.status === '⚠️').length;
  const failed = checks.filter(c => c.status === '❌').length;
  
  console.log(`\n📊 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('🎉 LazAI integration is ready for deployment!');
    console.log('\n🚀 Next steps:');
    console.log('1. Deploy contract: npm run deploy:lazai');
    console.log('2. Update contract address in config');
    console.log('3. Test integration in browser');
    console.log('4. Showcase to judges');
  } else {
    console.log('⚠️  Please fix the failed checks before deploying.');
  }
  
  return failed === 0;
}

// Execute verification
if (require.main === module) {
  try {
    const success = runVerification();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  }
}

module.exports = { runVerification };
