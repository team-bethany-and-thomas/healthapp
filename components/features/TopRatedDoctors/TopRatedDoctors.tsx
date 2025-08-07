"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Provider {
  first_name: string;
  last_name: string;
  specialty: string;
  city: string;
  state: string;
  zip: string;
  education: string;
  practice_name: string;
  languages_spoken: string[];
  rating: number;
  imageUrl: string;
  appointments: {
    date: string;
    start_time: string;
    length_minutes: number;
  }[];
}

const allProviders: Provider[] = [
  {
    first_name: "Emily",
    last_name: "Chen",
    specialty: "Primary Care (Family or Internal Medicine)",
    city: "Dallas",
    state: "TX",
    zip: "75201",
    education: "MD - University of Texas Southwestern Medical School",
    practice_name: "Pulse Clinic - Downtown Dallas",
    languages_spoken: ["English", "Mandarin"],
    rating: 4.8,
    imageUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "09:00", length_minutes: 30 },
      { date: "2025-07-26", start_time: "10:30", length_minutes: 30 },
      { date: "2025-07-27", start_time: "08:00", length_minutes: 30 },
      { date: "2025-07-28", start_time: "14:00", length_minutes: 45 },
    ],
  },
  {
    first_name: "Marcus",
    last_name: "Patel",
    specialty: "Cardiology",
    city: "Plano",
    state: "TX",
    zip: "75023",
    education: "MD - Baylor College of Medicine",
    practice_name: "Pulse Clinic - Plano",
    languages_spoken: ["English", "Hindi", "Gujarati"],
    rating: 4.9,
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "11:00", length_minutes: 60 },
      { date: "2025-07-27", start_time: "09:30", length_minutes: 60 },
      { date: "2025-07-29", start_time: "13:00", length_minutes: 45 },
    ],
  },
  {
    first_name: "Rachel",
    last_name: "Nguyen",
    specialty: "Pediatrics",
    city: "Frisco",
    state: "TX",
    zip: "75034",
    education: "MD - Texas A&M Health Science Center",
    practice_name: "Pulse Clinic - Frisco",
    languages_spoken: ["English", "Vietnamese"],
    rating: 4.7,
    imageUrl:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "10:00", length_minutes: 30 },
      { date: "2025-07-26", start_time: "15:30", length_minutes: 30 },
      { date: "2025-07-28", start_time: "09:00", length_minutes: 30 },
      { date: "2025-07-29", start_time: "16:00", length_minutes: 30 },
    ],
  },
  {
    first_name: "Thomas",
    last_name: "Brooks",
    specialty: "Orthopedics",
    city: "Arlington",
    state: "TX",
    zip: "76010",
    education: "MD - University of Texas Medical Branch",
    practice_name: "Pulse Clinic - Arlington",
    languages_spoken: ["English"],
    rating: 4.6,
    imageUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-27", start_time: "08:30", length_minutes: 45 },
      { date: "2025-07-28", start_time: "10:15", length_minutes: 60 },
      { date: "2025-07-30", start_time: "14:30", length_minutes: 45 },
    ],
  },
  {
    first_name: "Aisha",
    last_name: "Roberts",
    specialty: "Obstetrics & Gynecology",
    city: "Fort Worth",
    state: "TX",
    zip: "76102",
    education: "MD - UT Health San Antonio",
    practice_name: "Pulse Clinic - Fort Worth",
    languages_spoken: ["English", "Spanish"],
    rating: 4.8,
    imageUrl:
      "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "13:00", length_minutes: 30 },
      { date: "2025-07-27", start_time: "11:30", length_minutes: 45 },
      { date: "2025-07-29", start_time: "09:00", length_minutes: 30 },
      { date: "2025-07-30", start_time: "15:00", length_minutes: 30 },
    ],
  },
  {
    first_name: "James",
    last_name: "Okafor",
    specialty: "Dermatology",
    city: "Irving",
    state: "TX",
    zip: "75038",
    education: "MD - University of Texas Medical Branch",
    practice_name: "Pulse Clinic - Irving",
    languages_spoken: ["English", "Igbo"],
    rating: 4.7,
    imageUrl:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "14:00", length_minutes: 30 },
      { date: "2025-07-27", start_time: "10:00", length_minutes: 30 },
      { date: "2025-07-28", start_time: "16:30", length_minutes: 30 },
    ],
  },
  {
    first_name: "Sofia",
    last_name: "Martinez",
    specialty: "Psychiatry & Mental Health",
    city: "Carrollton",
    state: "TX",
    zip: "75006",
    education: "MD - UT Health San Antonio",
    practice_name: "Pulse Clinic - Carrollton",
    languages_spoken: ["English", "Spanish"],
    rating: 4.9,
    imageUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "09:30", length_minutes: 60 },
      { date: "2025-07-27", start_time: "14:00", length_minutes: 60 },
      { date: "2025-07-29", start_time: "11:00", length_minutes: 60 },
    ],
  },
  {
    first_name: "Henry",
    last_name: "Kim",
    specialty: "Gastroenterology",
    city: "Garland",
    state: "TX",
    zip: "75040",
    education: "MD - Baylor College of Medicine",
    practice_name: "Pulse Clinic - Garland",
    languages_spoken: ["English", "Korean"],
    rating: 4.8,
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "08:00", length_minutes: 45 },
      { date: "2025-07-27", start_time: "13:30", length_minutes: 45 },
      { date: "2025-07-30", start_time: "10:00", length_minutes: 45 },
    ],
  },
  {
    first_name: "Olivia",
    last_name: "Adams",
    specialty: "Neurology",
    city: "Richardson",
    state: "TX",
    zip: "75080",
    education: "MD - University of Texas Southwestern Medical School",
    practice_name: "Pulse Clinic - Richardson",
    languages_spoken: ["English"],
    rating: 4.6,
    imageUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "11:30", length_minutes: 60 },
      { date: "2025-07-28", start_time: "09:00", length_minutes: 60 },
      { date: "2025-07-29", start_time: "15:30", length_minutes: 60 },
    ],
  },
  {
    first_name: "Noah",
    last_name: "Singh",
    specialty: "Endocrinology",
    city: "Grand Prairie",
    state: "TX",
    zip: "75050",
    education: "MD - Texas A&M Health Science Center",
    practice_name: "Pulse Clinic - Grand Prairie",
    languages_spoken: ["English", "Punjabi"],
    rating: 4.7,
    imageUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "10:30", length_minutes: 45 },
      { date: "2025-07-27", start_time: "16:00", length_minutes: 45 },
      { date: "2025-07-30", start_time: "08:30", length_minutes: 45 },
    ],
  },
  {
    first_name: "Catherine",
    last_name: "Scott",
    specialty: "Pulmonology",
    city: "McKinney",
    state: "TX",
    zip: "75070",
    education: "MD - University of Texas Health Science Center at Houston",
    practice_name: "Pulse Clinic - McKinney",
    languages_spoken: ["English", "Spanish"],
    rating: 4.9,
    imageUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "09:00", length_minutes: 60 },
      { date: "2025-07-27", start_time: "14:00", length_minutes: 60 },
      { date: "2025-07-28", start_time: "11:00", length_minutes: 60 },
      { date: "2025-07-29", start_time: "16:30", length_minutes: 60 },
    ],
  },
];

export function TopRatedDoctors() {
  const [topRatedDoctors, setTopRatedDoctors] = useState<Provider[]>([]);

  useEffect(() => {
    // 5 rando doctors from the list
    const getRandomDoctors = () => {
      const shuffled = [...allProviders].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 5);
    };

    setTopRatedDoctors(getRandomDoctors());
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-primary mb-2">Top Rated</h2>
        <h2 className="text-3xl font-bold text-secondary mb-4">
          Doctors Near You
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {topRatedDoctors.map((doctor, index) => (
          <div
            key={index}
            className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-200 group h-80"
          >
            <div className="card-body p-6 flex flex-col h-full">
              {/* Doctor Image */}
              <div className="flex justify-center mb-4">
                <div className="avatar">
                  <div className="w-16 h-16 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
                    <Image
                      src={doctor.imageUrl}
                      alt={`Dr. ${doctor.first_name} ${doctor.last_name}`}
                      width={64}
                      height={64}
                      className="object-cover rounded-full"
                      onError={(e) => {
                        // Fallback to a placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e5e7eb'/%3E%3Ctext x='32' y='32' font-family='Arial' font-size='8' fill='%236b7280' text-anchor='middle' dy='.3em'%3EDr%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="text-center space-y-2 mb-4 flex-1">
                <h3 className="font-semibold text-base-content text-lg leading-tight">
                  Dr. {doctor.first_name} {doctor.last_name}
                </h3>
                <p className="text-sm text-base-content/70 leading-relaxed min-h-[2.5rem] flex items-center justify-center">
                  {doctor.specialty}
                </p>
                <div className="flex items-center justify-center gap-1">
                  <div className="rating rating-sm">
                    {[...Array(5)].map((_, i) => (
                      <input
                        key={i}
                        id={`rating-${index}-${i}`}
                        type="radio"
                        name={`rating-${index}`}
                        className="mask mask-star-2 bg-orange-400"
                        checked={i < Math.floor(doctor.rating)}
                        readOnly
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-base-content/80">
                    {doctor.rating}
                  </span>
                </div>
                <p className="text-xs text-base-content/60">
                  {doctor.city}, {doctor.state}
                </p>
              </div>

              {/* Action Button */}
              <Link
                href={`/search?specialty=${encodeURIComponent(
                  doctor.specialty
                )}&search=${encodeURIComponent(
                  `${doctor.first_name} ${doctor.last_name}`
                )}`}
                className="btn btn-primary w-full group-hover:btn-secondary transition-all duration-300 mt-auto"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Consult Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center mt-8">
        <Link
          href="/search"
          className="btn btn-outline btn-secondary hover:btn-secondary"
        >
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
