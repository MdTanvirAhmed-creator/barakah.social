import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipToMain } from "@/components/accessibility/SkipToMain";
import { Toaster } from "sonner";
import Script from "next/script";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Barakah.Social - Connect with Purpose",
    template: "%s | Barakah.Social",
  },
  description: "A modern Islamic social platform for meaningful connections, knowledge sharing, and spiritual growth",
  keywords: ["Islam", "Muslim", "Social Network", "Halaqas", "Islamic Knowledge", "Community"],
  authors: [{ name: "Barakah.Social Team" }],
  creator: "Barakah.Social",
  publisher: "Barakah.Social",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Barakah.Social",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://barakah.social",
    siteName: "Barakah.Social",
    title: "Barakah.Social - Islamic Social Platform",
    description: "Connect with Muslims worldwide, share beneficial knowledge, and grow spiritually",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Barakah.Social",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Barakah.Social - Islamic Social Platform",
    description: "Connect with Muslims worldwide and share beneficial knowledge",
    images: ["/og-image.png"],
    creator: "@barakahsocial",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d9488" },
    { media: "(prefers-color-scheme: dark)", color: "#134e4a" },
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
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className={inter.className}>
        <SkipToMain />
        <ErrorBoundary>
          <ReactQueryProvider>
            {children}
            <ToastProvider />
            <Toaster position="top-right" richColors />
          </ReactQueryProvider>
        </ErrorBoundary>

        {/* Structured Data for SEO */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Barakah.Social",
              url: "https://barakah.social",
              description: "A modern Islamic social platform for meaningful connections, knowledge sharing, and spiritual growth",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://barakah.social/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
              sameAs: [
                "https://twitter.com/barakahsocial",
                "https://facebook.com/barakahsocial",
                "https://instagram.com/barakahsocial",
              ],
            }),
          }}
        />

        {/* Organization Schema */}
        <Script
          id="organization-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Barakah.Social",
              url: "https://barakah.social",
              logo: "https://barakah.social/icons/icon-512x512.png",
              description: "Islamic social networking platform",
              foundingDate: "2024",
              sameAs: [
                "https://twitter.com/barakahsocial",
                "https://facebook.com/barakahsocial",
              ],
            }),
          }}
        />

        {/* Service Worker Registration */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registered:', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
        
        {/* Viewport height fix for mobile */}
        <Script
          id="viewport-fix"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function setVH() {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', \`\${vh}px\`);
              }
              setVH();
              window.addEventListener('resize', setVH);
              window.addEventListener('orientationchange', setVH);
            `,
          }}
        />
      </body>
    </html>
  );
}

