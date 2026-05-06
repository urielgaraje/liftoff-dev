import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { StarField } from "@/components/shared/star-field";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liftoff",
  description: "Race multijugador de cohetes hacia un planeta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-primary font-sans">
        <div
          data-mobile-gate
          className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-primary p-8 text-center lg:hidden"
        >
          <p className="font-mono text-xs tracking-[0.3em] text-accent-cyan">
            5 · 4 · 3 · 2 · 1
          </p>
          <h1 className="text-3xl font-bold text-fg-primary">
            Abre esto en un portátil
          </h1>
          <p className="max-w-xs text-sm text-fg-secondary">
            Liftoff necesita teclado físico y pantalla de al menos 1024px.
          </p>
        </div>
        <div className="hidden lg:contents">
          <StarField />
          {children}
        </div>
      </body>
    </html>
  );
}
