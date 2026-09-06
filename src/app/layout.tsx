import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Garud Netra Dashboard",
  description: "AI-Enabled Real-Time Digital Twin System for Health Monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Navigation */}
        <nav className="bg-background/80 backdrop-blur-sm border-b border-border-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="-m-px px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/live-health" className="-m-px px-3 py-2 ml-4 text-sm font-medium">
                  Live Health
                </Link>
                <Link href="/alerts" className="-m-px px-3 py-2 ml-4 text-sm font-medium">
                  Alerts
                </Link>
                <Link href="/rul" className="-m-px px-3 py-2 ml-4 text-sm font-medium">
                  RUL
                </Link>
                <Link href="/replay" className="-m-px px-3 py-2 ml-4 text-sm font-medium">
                  Replay
                </Link>
                <Link href="/what-if" className="-m-px px-3 py-2 ml-4 text-sm font-medium">
                  What-If
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pb-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border-subtle bg-background/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted">
            Garud Netra - AI-Enabled Real-Time Digital Twin System for Health Monitoring • Update Rate: ~2Hz
          </div>
        </footer>
      </body>
    </html>
  );
}