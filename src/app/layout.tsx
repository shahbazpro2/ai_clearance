import AxiosWrapper from "@/components/utils/AxiosWrapper";
import FeedbackWrapper from "@/components/utils/FeedbackWrapper";
import TokenWrapper from "@/components/utils/TokenWrapper";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MeWrapper from "@/components/utils/MeWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ai Clerance",
  description: "AI-powered clearance and identification platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
        <AxiosWrapper />
        <FeedbackWrapper />
        <TokenWrapper />
        <MeWrapper />
      </body>
    </html>
  );
}
