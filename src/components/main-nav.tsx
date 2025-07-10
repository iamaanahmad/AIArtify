"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GalleryHorizontal, Grid3x3, Trophy, Wand2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/", label: "Generate", icon: Wand2 },
  { href: "/gallery", label: "Gallery", icon: GalleryHorizontal },
  { href: "/collection", label: "My Collection", icon: Grid3x3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={{
                children: item.label,
              }}
            >
              <a>
                <item.icon />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
