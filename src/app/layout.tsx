
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import MainNav from '@/components/main-nav';
import UserNav from '@/components/user-nav';
import { Icons } from '@/components/icons';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AIArtify | AI-Powered NFTs',
  description: 'Generate and mint AI art as NFTs on Algorand blockchain with LazAI integration.',
  keywords: ['AI art', 'NFT', 'Algorand', 'blockchain', 'generative art', 'digital collectibles'],
  authors: [{ name: 'AIArtify Team' }],
  creator: 'AIArtify',
  publisher: 'AIArtify',
  applicationName: 'AIArtify',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AIArtify',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'AIArtify',
    title: 'AIArtify | AI-Powered NFTs',
    description: 'Generate and mint AI art as NFTs on Algorand blockchain',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'AIArtify - AI-Powered NFT Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIArtify | AI-Powered NFTs',
    description: 'Generate and mint AI art as NFTs on Algorand blockchain',
    images: ['/logo.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" />
        
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AIArtify" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/logo.png" as="image" />
        <link rel="preload" href="/placeholder-nft.png" as="image" />
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background font-sans')}>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <Link href="/" className="flex items-center gap-2">
                <Icons.logo className="size-8" />
                <h1 className="font-headline text-xl font-bold">AIArtify</h1>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <MainNav />
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
              <SidebarTrigger className="sm:hidden" />
              <div className="flex-1" />
              <UserNav />
            </header>
            <main className="flex flex-1 p-4 sm:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[PWA] Service Worker registered successfully:', registration.scope);
                      
                      // Check for updates
                      registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              // New content is available, prompt user to refresh
                              if (confirm('New version available! Refresh to update?')) {
                                window.location.reload();
                              }
                            }
                          });
                        }
                      });
                    })
                    .catch(function(error) {
                      console.log('[PWA] Service Worker registration failed:', error);
                    });
                });
              }
              
              // Install prompt handling
              let deferredPrompt;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                deferredPrompt = e;
                
                // Show custom install button after a delay
                setTimeout(function() {
                  if (deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
                    const installBanner = document.createElement('div');
                    installBanner.innerHTML = \`
                      <div style="
                        position: fixed; 
                        bottom: 20px; 
                        left: 20px; 
                        right: 20px; 
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: white; 
                        padding: 16px; 
                        border-radius: 12px; 
                        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
                        z-index: 9999;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255,255,255,0.1);
                      ">
                        <div>
                          <div style="font-weight: 600; margin-bottom: 4px;">🎨 Install AIArtify</div>
                          <div style="font-size: 14px; opacity: 0.9;">Get the full app experience!</div>
                        </div>
                        <div>
                          <button id="install-btn" style="
                            background: rgba(255,255,255,0.2); 
                            border: none; 
                            color: white; 
                            padding: 8px 16px; 
                            border-radius: 6px; 
                            cursor: pointer;
                            margin-right: 8px;
                            font-weight: 500;
                          ">Install</button>
                          <button id="dismiss-btn" style="
                            background: none; 
                            border: none; 
                            color: white; 
                            cursor: pointer;
                            opacity: 0.7;
                            font-size: 18px;
                          ">×</button>
                        </div>
                      </div>
                    \`;
                    
                    document.body.appendChild(installBanner);
                    
                    document.getElementById('install-btn').addEventListener('click', function() {
                      deferredPrompt.prompt();
                      deferredPrompt.userChoice.then(function(choiceResult) {
                        console.log('[PWA] Install prompt result:', choiceResult.outcome);
                        deferredPrompt = null;
                        document.body.removeChild(installBanner);
                      });
                    });
                    
                    document.getElementById('dismiss-btn').addEventListener('click', function() {
                      document.body.removeChild(installBanner);
                    });
                  }
                }, 3000); // Show after 3 seconds
              });
              
              // Track if app is installed
              window.addEventListener('appinstalled', function(e) {
                console.log('[PWA] App was installed successfully');
                // Track installation analytics
                if (typeof gtag !== 'undefined') {
                  gtag('event', 'pwa_install', {
                    event_category: 'engagement',
                    event_label: 'PWA Installation'
                  });
                }
              });
              
              // Handle offline/online status
              function updateOnlineStatus() {
                const isOnline = navigator.onLine;
                const statusIndicator = document.getElementById('network-status');
                
                if (!statusIndicator) {
                  const indicator = document.createElement('div');
                  indicator.id = 'network-status';
                  indicator.style.cssText = \`
                    position: fixed;
                    top: 70px;
                    right: 20px;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    z-index: 9998;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                  \`;
                  document.body.appendChild(indicator);
                }
                
                const indicator = document.getElementById('network-status');
                if (isOnline) {
                  indicator.textContent = '🟢 Online';
                  indicator.style.background = 'rgba(34, 197, 94, 0.9)';
                  indicator.style.color = 'white';
                  indicator.style.opacity = '0';
                  setTimeout(() => indicator.style.display = 'none', 300);
                } else {
                  indicator.textContent = '🔴 Offline Mode';
                  indicator.style.background = 'rgba(239, 68, 68, 0.9)';
                  indicator.style.color = 'white';
                  indicator.style.opacity = '1';
                  indicator.style.display = 'block';
                }
              }
              
              window.addEventListener('online', updateOnlineStatus);
              window.addEventListener('offline', updateOnlineStatus);
              updateOnlineStatus(); // Initial check
            `,
          }}
        />
      </body>
    </html>
  );
}
