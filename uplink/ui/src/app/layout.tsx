// Fosstank: 24/7 live streaming platform
// Copyright (C) 2025 Pierre Morrel

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Toaster from "@/components/toaster";
import { JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["200", "400", "500", "600", "700"],
});

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
    <html lang="en" className={cn(jetBrainsMono.className, "text-shadow-[2px_2px_0px_rgb(0_0_0/0.75)] p-2")}>
      <body className="bg-zinc-950">
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
