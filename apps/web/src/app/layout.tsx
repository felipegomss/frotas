import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Sans, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@frotas/ui/lib/utils";
import { Providers } from "./providers";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const interHeading = Inter({
  subsets: ["latin"],
  variable: "--font-heading",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "AMPARO Frota",
  description: "Gestão de frota pública",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        "h-full font-sans antialiased",
        ibmPlexSans.variable,
        interHeading.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
