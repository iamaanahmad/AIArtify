"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Droplets, Info, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FaucetInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const networkInfo = {
    name: "Hyperion Testnet",
    chainId: "133717",
    symbol: "tMETIS",
    rpc: "https://hyperion-testnet.metisdevops.link",
    explorer: "https://hyperion-testnet-explorer.metisdevops.link",
    faucets: [
      {
        name: "Telegram Bot",
        url: "https://t.me/hyperion_testnet_bot",
        description: "Get test tokens via Telegram"
      },
      {
        name: "Web Faucet", 
        url: "https://hype-faucet.metis.io/",
        description: "Alternative web-based faucet"
      }
    ]
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Droplets className="w-4 h-4" />
          Get Test Tokens
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            Hyperion Testnet Faucet
          </DialogTitle>
          <DialogDescription>
            Get free test tokens to mint NFTs on Hyperion Testnet
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Network Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Network Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Network:</span>
                  <p className="text-muted-foreground">{networkInfo.name}</p>
                </div>
                <div>
                  <span className="font-medium">Chain ID:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{networkInfo.chainId}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(networkInfo.chainId, "Chain ID")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Symbol:</span>
                  <p className="text-muted-foreground">{networkInfo.symbol}</p>
                </div>
                <div>
                  <span className="font-medium">RPC URL:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {networkInfo.rpc}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(networkInfo.rpc, "RPC URL")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Faucet Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Available Faucets</CardTitle>
              <CardDescription>
                Choose your preferred method to get test tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {networkInfo.faucets.map((faucet, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{faucet.name}</h4>
                    <p className="text-sm text-muted-foreground">{faucet.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(faucet.url, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(networkInfo.explorer, '_blank')}
              className="gap-2 flex-1"
            >
              <ExternalLink className="w-4 h-4" />
              Block Explorer
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Got It!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
