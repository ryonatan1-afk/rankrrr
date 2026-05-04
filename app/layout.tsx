import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
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
        <ClerkProvider>
          <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <span className="font-bold text-lg tracking-tight">Rankr</span>
            <div className="flex items-center gap-3">
              <Show when="signed-out">
                <SignInButton>
                  <button className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                    Get started
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
