import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/Navbar'
import Providers from '@/components/Providers';

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
  title: "C2 - Boersensaufen 📈🍺",
  description: "Saufen, Börse, C2",
  applicationName: "c2_boersensaufen",
  authors: [{ name: "Linus Tom Wiggering" }],
  generator: "Next.js",
  keywords: ["Saufen", "Börse", "C2", "Boersensaufen", "Party", "Event"],
  referrer: "origin-when-cross-origin",
  themeColor: "#111827",
  colorScheme: "dark",
  creator: "Studentische Initiative Campusleben Garching e.V.",
  publisher: "Studentische Initiative Campusleben Garching e.V.",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1.0",
  manifest: "/site.webmanifest",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
  ],
  openGraph: {
    title: "C2 - Boersensaufen",
    description: "Saufen, Börse, C2",
    url: "https://c2.tum.de/boersensaufen",
    siteName: "C2 - Boersensaufen",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "C2 - Boersensaufen",
    description: "Saufen, Börse, C2",
    creator: "@Studentische Initiative Campusleben Garching e.V.",
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
            <p>
              <a href="https://www.c2.tum.de/impressum/" className="underline hover:text-gray-300">Impressum </a>{" "}
              |{" "}
              <a href="https://www.c2.tum.de/datenschutz/" className="underline hover:text-gray-300">Datenschutz </a>
            </p>
            © {new Date().getFullYear()} Studentische Initiative Campusleben Garching e.V. – Campus Cneipe
          </footer>
        </Providers>
      </body>
    </html>
  );
}
