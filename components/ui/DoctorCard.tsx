"use client";

import React from 'react';
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
  return (
    <div className="card bg-base-100 shadow-sm" style={{ width: "180px" }}>
      <figure>
        <Image
          src={imageUrl}
          alt={name}
          width={180}
          height={120}
          className="w-full h-auto"
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