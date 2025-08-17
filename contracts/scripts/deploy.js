const hre = require("hardhat");

async function main() {
  console.log("Deploying AIArtifyNFT contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy the contract
  const AIArtifyNFT = await hre.ethers.getContractFactory("AIArtifyNFT");
  const nftContract = await AIArtifyNFT.deploy(deployer.address);

  await nftContract.waitForDeployment();

  const contractAddress = await nftContract.getAddress();
  console.log("AIArtifyNFT deployed to:", contractAddress);
  console.log("Owner:", deployer.address);

  // Verify the deployment
  const name = await nftContract.name();
  const symbol = await nftContract.symbol();
  const owner = await nftContract.owner();

  console.log("Contract details:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Owner:", owner);

  console.log("\nUpdate your config.ts file with:");
  console.log(`address: '${contractAddress}',`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
