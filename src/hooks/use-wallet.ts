
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

export function useWallet() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAccountsChanged = useCallback((accounts: string[]) => {
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
      } catch (error) {
        console.error("Error checking for wallet connection:", error);
      }
    };
    
    checkConnection();

    // Set up the event listener
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // Clean up the event listener on component unmount
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [handleAccountsChanged]);


  const connectWallet = useCallback(async () => {
    if (!isBrowser || !window.ethereum) {
      toast({
        variant: "destructive",
        title: "MetaMask not found",
        description: "Please install the MetaMask extension to connect your wallet.",
      });
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const newAddress = accounts[0];
      setWalletAddress(newAddress);
      sessionStorage.removeItem(DISCONNECTED_FLAG); // Clear disconnect flag on new connection
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
    }
  }, [toast]);

  const disconnectWallet = useCallback(() => {
      setWalletAddress(null);
      sessionStorage.setItem(DISCONNECTED_FLAG, "true"); // Set disconnect flag
      toast({
          title: "Wallet Disconnected",
          description: "You have successfully disconnected your wallet.",
      });
  }, [toast]);

  return { walletAddress, connectWallet, disconnectWallet, isBrowser };
}
