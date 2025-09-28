import type { Metadata } from "next";
import "@/styles/globals.css";
import { sans, mono } from "@/styles/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "magin.it",
  description: "Imagine it!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          sans.variable,
          mono.variable,
          "h-screen w-full subpixel-antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}
