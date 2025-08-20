"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

// Custom X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Custom Telegram icon component  
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.58 7.44c-.12.539-.432.672-.864.42l-2.388-1.764-1.152 1.116c-.132.132-.24.24-.492.24l.18-2.52L15.864 9.6c.18-.156-.036-.252-.288-.096L11.04 12.48l-2.34-.732c-.504-.156-.516-.504.12-.744l9.12-3.516c.42-.156.792.096.648.672z"/>
  </svg>
);

const socialLinks = [
  {
    name: "Telegram",
    url: "https://t.me/AIArtifyCommunity",
    icon: TelegramIcon,
    color: "text-blue-500 hover:text-blue-600"
  },
  {
    name: "X", 
    url: "https://x.com/AIArtifyMETIS",
    icon: XIcon,
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
        <span className="text-sm text-muted-foreground">Connect with us:</span>
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
        <span className="text-xs text-muted-foreground hidden sm:inline">Connect with us:</span>
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
      <span className="text-sm font-medium">Connect with us:</span>
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
