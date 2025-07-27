"use client";

import React from 'react';
import NavBar from '@/components/ui/NavBar';
import { Footer } from '@/components/ui/Footer';

interface LandingPageLayoutProps {
  children: React.ReactNode;
}

export function LandingPageLayout({ children }: LandingPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
} 