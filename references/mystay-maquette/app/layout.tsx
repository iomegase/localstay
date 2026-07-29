import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Story_Script } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const storyScript = Story_Script({
  variable: "--font-story",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "MyStay — Chaque séjour commence ici",
  description: "Guides d'arrivée privés et sélection de logements en Haute-Savoie.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${jakartaSans.variable} ${geistMono.variable} ${storyScript.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
