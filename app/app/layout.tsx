import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Hạ tầng Kỹ thuật Đô thị tỉnh Quảng Trị",
  description: "Hệ thống quản lý hạ tầng kỹ thuật đô thị tỉnh Quảng Trị",
  icons: {
    icon: "/logo-htkt.png",
    apple: "/logo-htkt.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
