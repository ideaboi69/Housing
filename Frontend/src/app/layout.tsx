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
