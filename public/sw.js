// AIArtify Service Worker
// Provides offline functionality, caching, and background sync

const CACHE_NAME = 'aiartify-v1.0.0';
const STATIC_CACHE = 'aiartify-static-v1';
const DYNAMIC_CACHE = 'aiartify-dynamic-v1';
const IMAGE_CACHE = 'aiartify-images-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/gallery',
  '/collection',
  '/leaderboard',
  '/onboarding',
  '/logo.png',
  '/favicon.ico',
  '/placeholder-nft.png',
  '/placeholder-nft.svg'
];

// Assets to cache dynamically
const DYNAMIC_ASSETS = [
  '/api/generate-art',
  '/api/alith-prompt-helper',
  '/api/analyze-external-art'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(IMAGE_CACHE).then((cache) => {
        console.log('[SW] Image cache initialized');
        return cache;
      })
    ])
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE &&
              cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method === 'GET') {
    // Handle page requests
    if (request.headers.get('accept')?.includes('text/html')) {
      event.respondWith(handlePageRequest(request));
    }
    // Handle image requests
    else if (request.headers.get('accept')?.includes('image/')) {
      event.respondWith(handleImageRequest(request));
    }
    // Handle API requests
    else if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleAPIRequest(request));
    }
    // Handle other static assets
    else {
      event.respondWith(handleStaticRequest(request));
    }
  }
});

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, serving from cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback to main page
    const mainPageCache = await caches.match('/');
    if (mainPageCache) {
      return mainPageCache;
    }
    
    // If nothing is cached, return a basic offline page
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>AIArtify - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
            }
            .container {
              background: rgba(255,255,255,0.1);
              padding: 2rem;
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            h1 { margin-bottom: 1rem; }
            button {
              background: #6366f1;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎨 AIArtify</h1>
            <p>You're currently offline. Some features may be limited.</p>
            <p>You can still browse your cached NFT collection!</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  // Check cache first for images
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const response = await fetch(request);
    
    // Cache images for offline access
    if (response.status === 200) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Image request failed:', request.url);
    
    // Return placeholder for failed images
    return new Response(
      `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af">
          Image unavailable offline
        </text>
      </svg>`,
      {
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    );
  }
}

// Handle API requests with network-first and offline queue
async function handleAPIRequest(request) {
  try {
    // Always try network for API calls
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] API request failed:', request.url);
    
    // For GET requests, try to serve from cache
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // For POST requests (like minting), queue for later
    if (request.method === 'POST') {
      await queueFailedRequest(request);
    }
    
    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'This action will be retried when connection is restored',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  // Cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    // Cache static assets
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Static asset request failed:', request.url);
    return new Response('Asset unavailable offline', { status: 404 });
  }
}

// Queue failed requests for retry when online
async function queueFailedRequest(request) {
  try {
    const body = await request.text();
    const queuedRequest = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now()
    };
    
    // Store in IndexedDB or localStorage
    const existingQueue = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
    existingQueue.push(queuedRequest);
    localStorage.setItem('pendingRequests', JSON.stringify(existingQueue));
    
    console.log('[SW] Queued request for retry:', request.url);
  } catch (error) {
    console.error('[SW] Failed to queue request:', error);
  }
}

// Background sync for queued requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processQueuedRequests());
  }
});

// Process queued requests when online
async function processQueuedRequests() {
  try {
    const queuedRequests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
    const successfulRequests = [];
    
    for (const queuedRequest of queuedRequests) {
      try {
        const response = await fetch(queuedRequest.url, {
          method: queuedRequest.method,
          headers: queuedRequest.headers,
          body: queuedRequest.body
        });
        
        if (response.ok) {
          successfulRequests.push(queuedRequest);
          console.log('[SW] Successfully processed queued request:', queuedRequest.url);
        }
      } catch (error) {
        console.log('[SW] Queued request still failing:', queuedRequest.url);
      }
    }
    
    // Remove successful requests from queue
    const remainingRequests = queuedRequests.filter(
      req => !successfulRequests.includes(req)
    );
    localStorage.setItem('pendingRequests', JSON.stringify(remainingRequests));
    
  } catch (error) {
    console.error('[SW] Error processing queued requests:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_NFT') {
    // Cache NFT data for offline access
    cacheNFTData(event.data.nft);
  }
});

// Cache NFT data for offline gallery viewing
async function cacheNFTData(nftData) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    
    // Cache the NFT image
    if (nftData.image) {
      await cache.add(nftData.image);
    }
    
    // Store NFT metadata
    const nftCache = await caches.open('nft-metadata');
    const response = new Response(JSON.stringify(nftData));
    await nftCache.put(`/nft/${nftData.tokenId}`, response);
    
    console.log('[SW] Cached NFT data:', nftData.tokenId);
  } catch (error) {
    console.error('[SW] Failed to cache NFT data:', error);
  }
}

// Cleanup old cache entries periodically (less aggressive)
setInterval(() => {
  caches.open(DYNAMIC_CACHE).then(cache => {
    cache.keys().then(keys => {
      // Keep entries for 7 days instead of 24 hours to prevent data loss
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      keys.forEach(key => {
        cache.match(key).then(response => {
          const dateHeader = response?.headers.get('date');
          if (dateHeader && new Date(dateHeader).getTime() < sevenDaysAgo) {
            // Only delete non-NFT cached content
            if (!key.url.includes('nft') && !key.url.includes('image')) {
              cache.delete(key);
            }
          }
        });
      });
    });
  });
}, 12 * 60 * 60 * 1000); // Run every 12 hours instead of every hour

console.log('[SW] AIArtify Service Worker loaded successfully!');
