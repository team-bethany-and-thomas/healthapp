import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/ui";
import { AuthProvider } from "./providers/AuthProvider";
import { Footer } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pulse Clinic - Your Health, Our Priority",
  description: "Pulse Clinic provides comprehensive healthcare services with a focus on community wellness and quality care.",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="healthapp">
      <body
        className="antialiased"
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <NavBar />
            <main className="flex-1 bg-teal-100">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
