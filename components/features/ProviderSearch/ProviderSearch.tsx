"use client";

import React, { useState, useEffect } from 'react'
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
  appointments: {
    date: string;
    start_time: string;
    length_minutes: number;
  }[];
}

export function ProviderSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Dummy provider data from the search results component
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
      appointments: [
        { date: "2025-07-26", start_time: "13:00", length_minutes: 30 },
        { date: "2025-07-27", start_time: "11:30", length_minutes: 45 },
        { date: "2025-07-29", start_time: "09:00", length_minutes: 30 },
        { date: "2025-07-30", start_time: "15:00", length_minutes: 30 },
      ],
    },
  ];

  useEffect(() => {
    setProviders(allProviders);
  }, [allProviders]);

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
          provider.practice_name.toLowerCase().includes(query)
        );
      });
      setFilteredProviders(filtered);
      setIsSearching(false);
    }, 500);
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

      <div className={styles['search-bar']}>
        <Search className={styles['search-icon']} />
        <input 
          type="text" 
          placeholder="Search by name, specialty, or location..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button 
          className={styles['search-button']}
          onClick={handleSearch}
          disabled={isSearching}
        >
          <Stethoscope className={styles['button-icon']} />
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

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
                    <span>{provider.languages_spoken.join(', ')}</span>
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