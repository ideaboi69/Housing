import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AuthHydrator } from "@/components/AuthHydrator";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "cribb — Student Housing, Finally Done Right",
  description:
    "Find trusted, verified student housing near University of Guelph. Real reviews, transparent pricing, and a Health Score on every listing.",
  openGraph: {
    title: "cribb — Student Housing for UofG",
    description: "Trusted listings, real reviews, Health Scores. Find your Guelph cribb.",
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
        <AuthHydrator />
        <Navbar />
        <main>{children}</main>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
