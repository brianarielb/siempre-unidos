import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Centro de Jubilados — Gestión de socios y cuotas",
  description: "Sistema administrativo de socios y cobro de cuotas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
