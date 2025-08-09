"use client";
import React from 'react';
import { DoctorCard } from '@/components/ui/DoctorCard';
import  NavBar from '@/components/ui/NavBar';
import { Footer } from '@/components/ui/Footer';

const Results = () => {
  return (
    <>
    <div>
        <NavBar />
      <h2>Provider Matches</h2>
      <div>
        <DoctorCard />
      </div>
      <Footer />
    </div>
    </>
  );
}

export default Results;