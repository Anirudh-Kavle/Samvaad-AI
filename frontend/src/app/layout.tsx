// src/app/layout.tsx

import type { Metadata } from "next";
import { Figtree } from "next/font/google"; // Import Figtree
import "./globals.css";

// Configure Figtree
const figtree = Figtree({
  variable: "--font-figtree", // This creates the CSS variable
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Samvaad.AI",
  description: "Debates That Shouldn't Exist... Until Now",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the new Figtree variable to the <body> */}
      <body className={`${figtree.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}