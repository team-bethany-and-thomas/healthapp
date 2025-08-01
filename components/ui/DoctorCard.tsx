"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface DoctorCardProps {
  name?: string;
  specialty?: string;
  imageUrl?: string;
  onConsult?: () => void;
}

export function DoctorCard({ 
  name = "Dr. Robert Wood", 
  specialty = "Cardiac Surgeon", 
  imageUrl = "https://shelleefisher.com/site/wp-content/uploads/2024/08/RobertWood02-scaled-1.jpg",
  onConsult 
}: DoctorCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Fallback image - a simple placeholder
  const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='120' viewBox='0 0 180 120'%3E%3Crect width='180' height='120' fill='%23e5e7eb'/%3E%3Ctext x='90' y='60' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3EDoctor Photo%3C/text%3E%3C/svg%3E";

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="card bg-base-100 shadow-sm" style={{ width: "180px" }}>
      <figure>
        <Image
          src={imageError ? fallbackImage : imageUrl}
          alt={name}
          width={180}
          height={120}
          className="w-full h-auto"
          onError={handleImageError}
          unoptimized={imageError} // Skip optimization for fallback
        />
      </figure>
      <div className="card-body p-2">
        <h2 className="card-title text-secondary text-sm">{name}</h2>
        <p className="text-base-content text-primary text-xs">{specialty}</p>
        <div className="card-actions justify-center w-[90%] mt-1">
          <button 
            className="btn btn-primary btn-xs w-full"
            onClick={onConsult}
          >
            Consult Now
          </button>
        </div>
      </div>
    </div>
  );
}