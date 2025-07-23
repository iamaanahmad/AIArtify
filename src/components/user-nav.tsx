
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

export default function UserNav() {
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();

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
