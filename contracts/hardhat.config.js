require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    metisTestnet: {
      url: "https://sepolia.metisdevops.link",
      chainId: 59902,
      accounts: []  // Add your private key here for deployment
    },
    metisHyperion: {
      url: "https://andromeda.metis.io/?owner=1088",
      chainId: 1088,
      accounts: []  // Add your private key here for deployment
    }
  }
};
