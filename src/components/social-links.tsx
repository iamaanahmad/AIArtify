"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Twitter } from "lucide-react";

const socialLinks = [
  {
    name: "Telegram",
    url: "https://t.me/AIArtifyCommunity",
    icon: MessageCircle,
    color: "text-blue-500 hover:text-blue-600"
  },
  {
    name: "Twitter", 
    url: "https://x.com/AIArtifyMETIS",
    icon: Twitter,
    color: "text-black hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
  }
];

interface SocialLinksProps {
  variant?: "default" | "footer" | "compact";
  className?: string;
}

export default function SocialLinks({ variant = "default", className = "" }: SocialLinksProps) {
  if (variant === "footer") {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <span className="text-sm text-muted-foreground">Follow us:</span>
        {socialLinks.map((social) => (
          <Button
            key={social.name}
            variant="ghost"
            size="sm"
            onClick={() => window.open(social.url, '_blank')}
            className={`gap-2 ${social.color}`}
          >
            <social.icon className="w-4 h-4" />
            {social.name}
          </Button>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {socialLinks.map((social) => (
          <Button
            key={social.name}
            variant="outline"
            size="sm"
            onClick={() => window.open(social.url, '_blank')}
            className={`gap-2 ${social.color}`}
            title={`Follow us on ${social.name}`}
          >
            <social.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{social.name}</span>
          </Button>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm font-medium">Join our community:</span>
      {socialLinks.map((social) => (
        <Button
          key={social.name}
          variant="outline"
          size="sm"
          onClick={() => window.open(social.url, '_blank')}
          className={`gap-2 ${social.color}`}
        >
          <social.icon className="w-4 h-4" />
          {social.name}
        </Button>
      ))}
    </div>
  );
}
