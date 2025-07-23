"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { Gem, LifeBuoy, LogOut, User, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// A simple check if the code is running in a browser environment
const isBrowser = typeof window !== "undefined";

export default function UserNav() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkConnection = async () => {
      if (isBrowser && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking for wallet connection:", error);
        }

        window.ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length > 0) {
                setWalletAddress(accounts[0]);
                toast({
                    title: "Account Switched",
                    description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
                });
            } else {
                setWalletAddress(null);
                toast({
                    title: "Wallet Disconnected",
                    description: "Your wallet has been disconnected.",
                });
            }
        });
      }
    };
    checkConnection();
  }, [toast]);

  const connectWallet = async () => {
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
      setWalletAddress(accounts[0]);
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
  };

    const disconnectWallet = () => {
        setWalletAddress(null);
        toast({
            title: "Wallet Disconnected",
            description: "You have successfully disconnected your wallet.",
        });
        // Note: This does not fully disconnect from Metamask, just from the app's state.
        // A full disconnect is not possible via a dApp for security reasons.
    }

  if (!walletAddress) {
    return (
      <Button onClick={connectWallet}>
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-auto justify-start gap-2 px-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${walletAddress}`} alt="Avatar" />
                <AvatarFallback>{walletAddress.substring(2,4).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">My Wallet</p>
                <p className="text-xs leading-none text-muted-foreground">{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</p>
            </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Connected Wallet</p>
            <p className="text-xs leading-none text-muted-foreground">
                {`${walletAddress.substring(0, 10)}...${walletAddress.substring(walletAddress.length - 4)}`}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={connectWallet}>
            <User className="mr-2 h-4 w-4" />
            <span>Change Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Gem className="mr-2 h-4 w-4" />
            <span>Upgrade</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LifeBuoy className="mr-2 h-4 w-4" />
          <span>Support</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          API
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnectWallet}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
