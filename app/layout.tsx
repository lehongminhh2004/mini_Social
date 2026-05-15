import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

import Providers from "./providers";
import { ChatProvider } from "./lib/ChatContext"; // Import Provider
import { FloatingChat } from "./components/FloatingChat"; // Import Khung chat

export const metadata: Metadata = {
  title: "MiniSocial Threads",
  description: "A minimalist social media platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {/* BỌC THÊM CHAT PROVIDER Ở ĐÂY */}
          <ChatProvider>
            {children}
            {/* ĐẶT KHUNG CHAT Ở NGOÀI CÙNG ĐỂ NÓ LUÔN TRÔI NỔI */}
            <FloatingChat />
          </ChatProvider>
        </Providers>
      </body>
    </html>
  );
}