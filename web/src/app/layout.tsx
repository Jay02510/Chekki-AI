import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chekki | The Homework Helper for Korean Parents",
  description: "Empower your child's education. A homework helper tailored for Korean parents, plus resources for educators.",
  openGraph: {
    title: "Chekki | The Homework Helper for Korean Parents",
    description: "Empower your child's education. A homework helper tailored for Korean parents, plus resources for educators.",
    url: "https://chekki-ai.vercel.app",
    siteName: "Chekki",
    images: [
      {
        url: "https://res.cloudinary.com/dginphpy4/image/upload/v1771381888/Chekki_Splash_1_nrpzaj.png",
        width: 1200,
        height: 630,
        alt: "Chekki App Splash Screen",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased bg-slate-950 text-slate-50 min-h-[100dvh] flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
