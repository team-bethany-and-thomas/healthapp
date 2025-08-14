"use client";


import React from 'react';
import Link from 'next/link';
import { useTopRatedDoctors, providerService } from '../../../app/services/providerService';
import styles from './TopRatedDoctors.module.css';


export function TopRatedDoctors() {
  const { doctors: topRatedDoctors, loading, error } = useTopRatedDoctors(5);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">Top Rated</h2>
          <h2 className="text-3xl font-bold text-secondary mb-4">Doctors Near You</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-2xl"></div>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">Top Rated</h2>
          <h2 className="text-3xl font-bold text-secondary mb-4">Doctors Near You</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-2xl"></div>
        </div>
        <div className="alert alert-error max-w-md mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-primary mb-2">Top Rated</h2>
        <h2 className="text-3xl font-bold text-secondary mb-4">
          Doctors Near You
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-2xl"></div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {topRatedDoctors.map((doctor, index) => (

                      <div key={doctor.$id || index} className="flex flex-col">
            <div className="card bg-base-100 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 border border-gray-200 group h-80 hover:-translate-y-1">
              <div className="card-body p-6 flex flex-col h-full">
                {/* Doctor Image */}
                <div className="flex justify-center">
                  <div className="avatar">
                    <div className="w-16 h-16 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
                      <img 
                        src={providerService.getProfileImageUrl(doctor.profile_picture_id)} 
                        alt={`${doctor.first_name || doctor.name} ${doctor.last_name || ''}`}
                        width={64}
                        height={64}
                        className="object-cover rounded-full"
                        onError={(e) => {
                          // Fallback to a placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e5e7eb'/%3E%3Ctext x='32' y='32' font-family='Arial' font-size='8' fill='%236b7280' text-anchor='middle' dy='.3em'%3EDr%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>

                  </div>
                </div>

                {/* Doctor Info */}
                <div className="text-center flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-base-content text-lg leading-tight  h-12 flex items-center justify-center">
                      {doctor.first_name || 'Doctor'} {doctor.last_name || ''}
                    </h3>
                    <p className="doctor-specialty">
                      {doctor.specialty}
                    </p>
                  </div>
                  <div>
                <div className="flex items-center justify-center gap-1 mb-2">
  <div className="rating rating-sm">
    {[...Array(5)].map((_, i) => (
      <input
        key={i}
        id={`rating-${index}-${i}`}
        type="radio"
        name={`rating-${index}`}
        className="mask mask-star-2 bg-orange-400"
        checked={i < Math.floor(doctor.rating || 4.5)}
        readOnly
        title={`Doctor rating star ${i + 1}`}
        disabled
      />
    ))}
  </div>
</div>
<div className="flex items-center justify-center gap-1 mb-2">
  <div className="rating rating-sm">
    {[...Array(5)].map((_, i) => (
      <input
        key={i}
        id={`rating-${index}-${i}`}
        type="radio"
        name={`rating-${index}`}
        className="mask mask-star-2 bg-orange-400"
        checked={i < Math.floor(doctor.rating || 4.5)}
        readOnly
        title={`Doctor rating star ${i + 1}`}
        disabled
      />
    ))}
  </div>
</div>


                           title={`Doctor rating star ${i} + 1`}
                          
                    
                      </div>
                   

                    </div>
                    <p className="doctor-location text-xs text-base-content/60">
                      {doctor.city || 'Local'}, {doctor.state || 'TX'}
                    </p>
                  </div>
                </div>
              </div>

           
            
           
            <Link 
              href={`/search?specialty=${encodeURIComponent(doctor.specialty)}&search=${encodeURIComponent(`${doctor.first_name} ${doctor.last_name}`)}`}
              className={`${styles.viewAllButton} mt-4 rounded-full`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Consult Now
            </Link>
          </div>
        ))}
      </div>

    

      <div className="text-center mt-8">
        <Link href="/search" className="btn btn-outline btn-secondary hover:btn-secondary rounded-lg">

          View All Doctors
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
