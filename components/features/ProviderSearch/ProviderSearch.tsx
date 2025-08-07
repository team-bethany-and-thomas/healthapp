"use client";

import React, { useState } from 'react';
import { Search, Stethoscope, Hospital, Syringe, Activity, Star, MapPin, Clock, Calendar } from "lucide-react";
import styles from './ProviderSearch.module.css';

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

// Complete provider data with all 11 providers
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
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "12:00", length_minutes: 45 },
      { date: "2025-07-27", start_time: "15:30", length_minutes: 45 },
      { date: "2025-07-29", start_time: "10:00", length_minutes: 45 },
    ],
  },
];

export function ProviderSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const filtered = allProviders.filter(provider => {
        const query = searchQuery.toLowerCase();
        return (
          provider.first_name.toLowerCase().includes(query) ||
          provider.last_name.toLowerCase().includes(query) ||
          provider.specialty.toLowerCase().includes(query) ||
          provider.city.toLowerCase().includes(query) ||
          provider.practice_name.toLowerCase().includes(query) ||
          // Add language search functionality
          provider.languages_spoken.some(language => 
            language.toLowerCase().includes(query)
          )
        );
      });
      setFilteredProviders(filtered);
      setIsSearching(false);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={styles['provider-search-container']}>
      <div className={styles['search-header']}>
        <Hospital className={styles['hospital-icon']} />
        <h1 className="text-black">Find a Healthcare Provider</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles['search-bar']}>
        <Search className={styles['search-icon']} />
        <input 
          type="text" 
          placeholder="Search by name, specialty, location, or language..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button 
          type="submit"
          className={styles['search-button']}
          disabled={isSearching}
        >
          <Stethoscope className={styles['button-icon']} />
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className={styles['filter-chips']}>
        <div className={styles.chip}>
          <Syringe size={16} />
          <span>Primary Care</span>
        </div>
        <div className={styles.chip}>
          <Stethoscope size={16} />
          <span>Specialists</span>
        </div>
        <div className={styles.chip}>
          <Activity size={16} />
          <span>Available Today</span>
        </div>
        <div className={styles.chip}>
          <span>🌐</span>
          <span>Language Search</span>
        </div>
      </div>

      {/* Search Results */}
      {filteredProviders.length > 0 && (
        <div className={styles['search-results']}>
          <h2 className={styles['results-header']}>
            Found {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''}
          </h2>
          <div className={styles['results-grid']}>
            {filteredProviders.map((provider, index) => (
              <div key={index} className={styles['provider-card']}>
                <div className={styles['provider-header']}>
                  <div className={styles['provider-info']}>
                    <h3 className={styles['provider-name']}>
                      Dr. {provider.first_name} {provider.last_name}
                    </h3>
                    <p className={styles['provider-specialty']}>{provider.specialty}</p>
                    <p className={styles['provider-practice']}>{provider.practice_name}</p>
                  </div>
                  <div className={styles['provider-rating']}>
                    <Star size={16} className={styles['star-icon']} />
                    <span>{provider.rating}</span>
                  </div>
                </div>
                
                <div className={styles['provider-details']}>
                  <div className={styles['detail-item']}>
                    <MapPin size={14} />
                    <span>{provider.city}, {provider.state} {provider.zip}</span>
                  </div>
                  <div className={styles['detail-item']}>
                    <Calendar size={14} />
                    <span>{provider.appointments.length} appointments available</span>
                  </div>
                  <div className={styles['languages']}>
                    <span className={styles['language-label']}>Languages:</span>
                    <div className={styles['language-tags']}>
                      {provider.languages_spoken.map((language, langIndex) => (
                        <span key={langIndex} className={styles['language-tag']}>
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles['appointments-preview']}>
                  <h4 className={styles['appointments-title']}>Next Available:</h4>
                  <div className={styles['appointment-slots']}>
                    {provider.appointments.slice(0, 3).map((appointment, appIndex) => (
                      <div key={appIndex} className={styles['appointment-slot']}>
                        <Clock size={12} />
                        <span>{formatDate(appointment.date)} at {appointment.start_time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button className={styles['book-button']}>
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchQuery && filteredProviders.length === 0 && !isSearching && (
        <div className={styles['no-results']}>
          <p>No providers found matching &quot;{searchQuery}&quot;</p>
          <p>Try adjusting your search terms or browse all providers</p>
        </div>
      )}
    </div>
  );
}