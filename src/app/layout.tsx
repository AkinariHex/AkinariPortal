import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/authz";
import Navbar from "@/components/Navbar/Navbar";
import { NavbarSurfaceProvider } from "@/components/Navbar/NavbarSurface";
import SearchProvider from "@/components/Search/SearchProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

import "@/styles/globals.css";
// styles.css now holds only the :root theme variables that tags.css consumes.
import "@/styles/styles.css";
import "@/styles/tags.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://akinariportal.vercel.app"),
  title: { default: "Akinari Portal", template: "%s | Akinari Portal" },
  description: "Another osu! skins website!",
  authors: [{ name: "Akinari" }],
  keywords: ["Akinari Portal", "Portal", "Akinari", "osu"],
  robots: "index, follow",
  manifest: "/manifest.json",
  icons: { icon: "/img/favicon.ico", apple: "/icon-512x512.png" },
  appleWebApp: { capable: true },
  openGraph: {
    type: "website",
    url: "https://akinariportal.vercel.app/",
    title: "Akinari Portal",
    description: "Another osu! skins website!",
    images: ["https://akinariosu.s-ul.eu/7Gcmq9qk"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Akinari Portal",
    description: "Another osu! skins website!",
    images: ["https://akinariosu.s-ul.eu/7Gcmq9qk"],
    site: "@Akinari_osu",
  },
};

export const viewport: Viewport = {
  themeColor: "#232931",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, admin] = await Promise.all([auth(), isAdmin()]);

  return (
    <html lang="en" className={`dark ${poppins.variable}`}>
      <body>
        <NextTopLoader color="#6ba2ed" showSpinner={false} height={3} />
        <TooltipProvider delayDuration={200}>
          <SessionProvider session={session}>
            <SearchProvider>
              <NavbarSurfaceProvider>
                <Navbar session={session} isAdmin={admin} />
                {children}
              </NavbarSurfaceProvider>
            </SearchProvider>
          </SessionProvider>
        </TooltipProvider>
        <Toaster richColors position="bottom-right" />

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RXYZ8EPLR2"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-RXYZ8EPLR2');`}
        </Script>
      </body>
    </html>
  );
}
