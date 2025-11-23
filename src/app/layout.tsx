import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/Navbar'
import Providers from '@/components/Providers';
import { ChatWidget } from '@/components/ChatWidget';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "rent2own",
  description: "Every payment brings you home!",
  applicationName: "rent2own",
  authors: [{ name: "Linus Tom Wiggering" }, { name: "Sarah Weber" }, { name: "Anna Weber" }, { name: "Konstantin Zeck" }],
  generator: "Next.js",
  keywords: ["rent", "home", "own", "living", "Munich", "investment"],
  referrer: "origin-when-cross-origin",
  themeColor: "#111827",
  colorScheme: "dark",
  creator: "Bubu.dev",
  publisher: "Bubu.dev",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1.0",
  manifest: "/site.webmanifest",
  icons: [
    { rel: "icon", url: "/logo.png", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/logo.svg" },
  ],
  openGraph: {
    title: "rent2own",
    description: "Every payment brings you home!",
    url: "https://hackatum.wiggering.online",
    siteName: "rent2own",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "rent2own",
    description: "Every payment brings you home!",
    creator: "@BubuDev",
  },
  category: "event",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrains.variable} antialiased flex flex-col`}>
        <Providers>
          <Navbar />

          <main className="flex-grow min-h-screen">{children}</main>

          <footer className="w-full py-6 text-center text-sm text-gray-400 mt-auto">
            © {new Date().getFullYear()} Bubu.dev
          </footer>

          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
