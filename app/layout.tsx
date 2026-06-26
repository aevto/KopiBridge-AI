import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KopiBridge AI",
  description: "Turn your resume into a roadmap for your next AI tech role."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
