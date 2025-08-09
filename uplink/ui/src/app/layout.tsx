import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Toaster from "@/components/toaster";

export const metadata: Metadata = {
  title: "Fosstank",
  description: "24/7 live streaming reality show",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
