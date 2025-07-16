import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fosstank Control Plane",
  description: "Control server for managing a fosstank server",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
