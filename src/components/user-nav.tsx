
"use client";

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
import { useWallet } from "@/hooks/use-wallet";
import FaucetInfo from "./faucet-info";

function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function getDappUrl() {
  if (typeof window === 'undefined') return 'www.ai-artify.xyz';
  
  // For production deployments (custom domain or vercel), use the production URL
  if (window.location.hostname.includes('ai-artify.xyz') || 
      window.location.hostname.includes('vercel.app')) {
    return 'www.ai-artify.xyz';
  }
  
  // For localhost development, use a clean localhost format
  if (window.location.hostname === 'localhost') {
    return `localhost:${window.location.port || '3000'}`;
  }
  
  // Fallback to custom domain for any other case
  return 'www.ai-artify.xyz';
}

function getMetaMaskDeeplink() {
  const dappUrl = getDappUrl();
  // Use the standard MetaMask deeplink format
  // Important: No protocol, no encoding, no trailing slashes
  return `https://metamask.app.link/dapp/${dappUrl}`;
}

export default function UserNav() {
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();

  if (!walletAddress) {
    // If on mobile and no window.ethereum, show MetaMask deep link
    const isMobile = isMobileDevice();
    const hasEthereum = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
    if (isMobile && !hasEthereum) {
      const metamaskLink = getMetaMaskDeeplink();
      console.log('MetaMask deeplink generated:', metamaskLink); // Debug log
      return (
        <div className="flex items-center gap-2">
          <FaucetInfo />
          <a href={metamaskLink} target="_blank" rel="noopener noreferrer">
            <Button>
              <Wallet className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Open in MetaMask App</span>
            </Button>
          </a>
        </div>
      );
    }
    // Otherwise, show normal connect button with faucet info
    return (
      <div className="flex items-center gap-2">
        <FaucetInfo />
        <Button onClick={connectWallet}>
          <Wallet className="mr-0 sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
        </Button>
      </div>
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
