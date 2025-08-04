
"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

// Add a declaration for the ethereum object to the global window interface
declare global {
    interface Window {
        ethereum?: any;
    }
}

const isBrowser = typeof window !== "undefined";
const DISCONNECTED_FLAG = "aiartify_disconnected";
const METIS_HYPERION_TESTNET = {
  chainId: '0x20a55', // 133717 in hex
  chainName: 'Metis Hyperion Testnet',
  nativeCurrency: {
    name: 'TMETIS',
    symbol: 'TMETIS',
    decimals: 18,
  },
  rpcUrls: ['https://hyperion-testnet.metisdevops.link'],
  blockExplorerUrls: ['https://hyperion-testnet-explorer.metisdevops.link/'],
};

export function useWallet() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    console.log('Accounts changed:', accounts);
    if (accounts.length > 0) {
      const newAddress = accounts[0];
      setWalletAddress(newAddress);
      // Avoid showing toast if it's the initial connection on page load
      if (walletAddress && newAddress !== walletAddress) {
          toast({
              title: "Account Switched",
              description: `Connected to ${newAddress.substring(0, 6)}...${newAddress.substring(newAddress.length - 4)}`,
          });
      }
    } else {
      // This case handles when the user disconnects from MetaMask settings
      setWalletAddress(null);
      sessionStorage.setItem(DISCONNECTED_FLAG, "true");
      toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected.",
      });
    }
  }, [toast, walletAddress]);

  const handleChainChanged = useCallback((chainId: string) => {
    console.log('Chain changed to:', chainId);
    setCurrentNetwork(chainId);
    const isCorrectNetwork = chainId === METIS_HYPERION_TESTNET.chainId;
    
    if (!isCorrectNetwork && walletAddress) {
      toast({
        variant: "destructive",
        title: "Wrong Network",
        description: "Please switch to Metis Hyperion Testnet to use this dApp.",
      });
    }
  }, [walletAddress, toast]);

  const addMetisNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [METIS_HYPERION_TESTNET],
      });
      return true;
    } catch (error) {
      console.error('Error adding Metis network:', error);
      return false;
    }
  };

  const switchToMetisNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: METIS_HYPERION_TESTNET.chainId }],
      });
      return true;
    } catch (error: any) {
      // If the network is not added, add it
      if (error.code === 4902) {
        return await addMetisNetwork();
      }
      console.error('Error switching to Metis network:', error);
      return false;
    }
  };

  useEffect(() => {
    if (!isBrowser || !window.ethereum) return;
    
    const wasDisconnected = sessionStorage.getItem(DISCONNECTED_FLAG) === "true";

    const checkConnection = async () => {
      if (wasDisconnected) return; // Don't auto-reconnect if user explicitly disconnected
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
        
        // Get current chain ID
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setCurrentNetwork(chainId);
      } catch (error) {
        console.error("Error checking for wallet connection:", error);
      }
    };
    
    checkConnection();

    // Set up event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Clean up event listeners on component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);


  const connectWallet = useCallback(async () => {
    if (!isBrowser || !window.ethereum) {
      toast({
        variant: "destructive",
        title: "MetaMask not found",
        description: "Please install the MetaMask extension to connect your wallet.",
      });
      return;
    }
    
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const newAddress = accounts[0];
      setWalletAddress(newAddress);
      sessionStorage.removeItem(DISCONNECTED_FLAG); // Clear disconnect flag on new connection
      
      // Check if we're on the correct network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setCurrentNetwork(chainId);
      
      if (chainId !== METIS_HYPERION_TESTNET.chainId) {
        const switched = await switchToMetisNetwork();
        if (!switched) {
          toast({
            variant: "destructive",
            title: "Network Switch Required",
            description: "Please manually switch to Metis Hyperion Testnet in your wallet.",
          });
        }
      }
      
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been successfully connected.",
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        variant: "destructive",
        title: "Wallet Connection Failed",
        description: "Could not connect to your wallet. Please try again.",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast, switchToMetisNetwork]);

  const disconnectWallet = useCallback(() => {
      setWalletAddress(null);
      setCurrentNetwork(null);
      sessionStorage.setItem(DISCONNECTED_FLAG, "true"); // Set disconnect flag
      toast({
          title: "Wallet Disconnected",
          description: "You have successfully disconnected your wallet.",
      });
  }, [toast]);

  const isCorrectNetwork = currentNetwork === METIS_HYPERION_TESTNET.chainId;

  return { 
    walletAddress, 
    connectWallet, 
    disconnectWallet, 
    isBrowser, 
    isConnecting,
    currentNetwork,
    isCorrectNetwork,
    switchToMetisNetwork 
  };
}
