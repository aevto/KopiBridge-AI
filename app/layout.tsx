import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KopiBridge AI",
  description:
    "Evidence-led resume-to-role analysis with honest claim guidance and a practical action roadmap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
