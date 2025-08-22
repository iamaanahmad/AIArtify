// Quick test script for LazAI verification API
const testData = {
  artworkId: 'test_' + Date.now(),
  imageUrl: 'data:image/png;base64,test',
  prompt: 'Test artwork for verification',
  requestType: 'quality_verification',
  consensusMode: 'full_analysis',
  timestamp: Date.now()
};

console.log('🧪 Testing LazAI Verification API...');

fetch('http://localhost:9002/api/verify-with-lazai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('✅ API Response:');
  console.log('  - Success:', data.success);
  console.log('  - Quality Score:', (data.qualityScore * 100).toFixed(1) + '%');
  console.log('  - LazAI Transaction:', data.lazaiTxHash);
  console.log('  - Blockchain Network:', data.blockchain?.network);
  console.log('  - Contract Address:', data.blockchain?.contractAddress);
  console.log('  - Explorer URL:', data.blockchain?.explorerUrl);
  console.log('  - Stored on Blockchain:', data.blockchain?.stored);
  console.log('');
  console.log('🔗 Transaction Link: ' + data.blockchain?.explorerUrl);
  console.log('');
  if (data.blockchain?.explorerUrl?.includes('testnet-explorer.lazai.network')) {
    console.log('✅ SUCCESS: LazAI Verification now provides real transaction links!');
  } else {
    console.log('❌ Issue: Transaction link not pointing to LazAI explorer');
  }
})
.catch(err => console.error('❌ Test failed:', err));
