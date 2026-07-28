import type { Metadata, Viewport } from "next";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/authz";
import Navbar from "@/components/Navbar/Navbar";
import SearchProvider from "@/components/Search/SearchProvider";

import "@/styles/styles.css";
import "@/styles/settings.css";
import "@/styles/scrollbars.css";
import "@/styles/tags.css";
import "@/styles/Navbar.css";
import "@/styles/MobileNavbar.css";
import "@/styles/RecentSkins.css";
import "@/styles/Users.css";
import "@/styles/Socials.css";
import "@/styles/PlaystyleSection.css";

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
    <html lang="en">
      <head>
        <link
          href="https://unpkg.com/boxicons@2.0.9/css/boxicons.min.css"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextTopLoader color="#6ba2ed" showSpinner={false} height={3} />
        <SessionProvider session={session}>
          <SearchProvider>
            <Navbar session={session} isAdmin={admin} />
            {children}
          </SearchProvider>
        </SessionProvider>

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
