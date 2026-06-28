import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthHydrator } from "@/components/AuthHydrator";
import { OnboardingProvider } from "@/components/OnboardingProvider";
import { MotionProvider } from "@/components/MotionProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "cribb — Student Housing, Finally Done Right",
  description:
    "Find trusted, verified student housing in Guelph. Real reviews, transparent pricing, and a Cribb Score on every listing.",
  openGraph: {
    title: "cribb — Student Housing in Guelph",
    description: "Trusted listings, real reviews, Cribb Scores. Find your Guelph cribb.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" sizes="180x180" type="image/png" />
      </head>
      <body className="bg-white text-[#1B2D45] antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <MotionProvider>
          <AuthHydrator />
          <OnboardingProvider />
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          <main id="main-content">{children}</main>
          <Footer />
        </MotionProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
