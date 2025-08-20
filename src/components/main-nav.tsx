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
  useSidebar,
} from "@/components/ui/sidebar";
import { useEffect, useRef } from "react";

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
  const { setOpenMobile } = useSidebar();
  const previousPathname = useRef(pathname);

  // Helper function to check if we're on mobile
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768; // Mobile breakpoint
  };

  // Auto-close sidebar on mobile ONLY when pathname actually changes (navigation completed)
  useEffect(() => {
    // Only close if we're on mobile and the pathname has actually changed
    if (isMobileDevice() && pathname !== previousPathname.current) {
      console.log('📱 Mobile navigation detected, closing sidebar');
      // Small delay to ensure smooth transition
      setTimeout(() => setOpenMobile(false), 150);
      previousPathname.current = pathname;
    }
  }, [pathname, setOpenMobile]);

  // Handle window resize to close sidebar if resized to mobile
  useEffect(() => {
    const handleResize = () => {
      if (isMobileDevice()) {
        // Only close if user manually resizes to mobile while sidebar is likely open
        console.log('📱 Window resized to mobile, closing sidebar');
        setOpenMobile(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setOpenMobile]);

  // Handle navigation click - let the navigation happen naturally
  const handleNavClick = (href: string) => {
    // Only set up mobile close if we're actually navigating to a different page
    if (isMobileDevice() && pathname !== href) {
      console.log('📱 Navigation initiated on mobile to:', href);
      // Don't close immediately - let useEffect handle it after route change
    }
  };

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
                  <Link href={item.href} onClick={() => handleNavClick(item.href)}>
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
                  <Link href={item.href} onClick={() => handleNavClick(item.href)}>
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
                  <Link href={item.href} onClick={() => handleNavClick(item.href)}>
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
