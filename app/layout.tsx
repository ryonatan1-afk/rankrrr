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
          <style>{`.skip-link:not(:focus){position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}.skip-link:focus{position:fixed;top:12px;left:12px;z-index:100;padding:8px 16px;border-radius:8px;font-size:14px;font-weight:600;color:#fff;background:var(--accent);text-decoration:none;outline:2px solid rgba(255,255,255,0.5);outline-offset:2px}`}</style>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <header className="sticky top-0 z-50 flex items-center px-6 py-3 backdrop-blur-md bg-[#0A0A0F]/70">
            <div className="flex-1"><NavLogo /></div>
            <div className="flex items-center gap-3">
              <Show when="signed-out">
                <SignInButton>
                  <button className="min-h-[44px] px-2 text-sm font-medium text-white/50 hover:text-white transition-colors">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="min-h-[44px] rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
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
          <div id="main-content" style={{ display: "contents" }}>
            {children}
          </div>
          <div aria-hidden="true" style={{
            position: "fixed", inset: 0,
            boxShadow: "inset 0 0 0 8px #000",
            borderRadius: 24, pointerEvents: "none", zIndex: 50,
          }} />
        </ClerkProvider>
      </body>
    </html>
  );
}
