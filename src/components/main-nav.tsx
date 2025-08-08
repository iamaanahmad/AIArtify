"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  GalleryHorizontal, 
  Grid3x3, 
  Trophy, 
  Wand2, 
  Network, 
  BarChart3, 
  Users,
  Sparkles,
  BookOpen,
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

const coreItems = [
  { href: "/", label: "Generate Art", icon: Wand2 },
  { href: "/gallery", label: "Gallery", icon: GalleryHorizontal },
  { href: "/collection", label: "My Collection", icon: Grid3x3 },
];

const lazaiItems = [
  { href: "/onboarding", label: "LazAI Onboarding", icon: BookOpen },
  { href: "/comparison", label: "LazAI vs AI", icon: BarChart3 },
  { href: "/battles", label: "Art Battles", icon: Users },
];

const competitiveItems = [
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function MainNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {/* Core Features */}
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Core Features
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {coreItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* LazAI Features */}
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <Network className="w-4 h-4 text-blue-600" />
          LazAI + Hyperion
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {lazaiItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Competitive Features */}
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-600" />
          Community
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {competitiveItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
}
