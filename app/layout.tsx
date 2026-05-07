import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Script from "next/script";
import { NavLogo } from "@/components/nav-logo";
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
  title: "Rankr — Rank Everything",
  description: "Crowd-powered 1v1 bracket rankings for anything.",
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
    >
      <body className="min-h-full flex flex-col">
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-K2Z9CNWEBE" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-K2Z9CNWEBE');
        `}</Script>
        <ClerkProvider>
          <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 backdrop-blur-md bg-[#0A0A0F]/70">
            <NavLogo />
            <div className="ml-auto flex items-center gap-3">
              <Show when="signed-out">
                <SignInButton>
                  <button className="text-sm font-medium text-white/50 hover:text-white transition-colors">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                    Get started
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9 ring-1 ring-white/20 hover:ring-indigo-400/60 transition-all rounded-full",
                    },
                  }}
                />
              </Show>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
