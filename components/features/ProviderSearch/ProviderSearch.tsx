"use client";

import React, { useState } from 'react'
import { useForm } from "react-hook-form";
import { Search, Stethoscope, Hospital, Syringe, Activity, Star, MapPin, Clock, Calendar } from "lucide-react";
import styles from './ProviderSearch.module.css';
import searchbarStyles from '../../Searchbar.module.css';

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

type FormData = {
  specialty?: string;
  provider?: string;
  location?: string;
};

// Provider data matching the datalist options from Searchbar
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
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1594824475545-9d0c7c4951c1?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1594824475545-9d0c7c4951c1?w=180&h=120&fit=crop&crop=face",
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
    imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=180&h=120&fit=crop&crop=face",
    appointments: [
      { date: "2025-07-26", start_time: "10:30", length_minutes: 45 },
      { date: "2025-07-27", start_time: "16:00", length_minutes: 45 },
      { date: "2025-07-30", start_time: "08:30", length_minutes: 45 },
    ],
  },
];

export function ProviderSearch() {
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormData>();
  const watchedValues = watch();

  const handleFieldChange = (fieldName: keyof FormData, value: string) => {
    // Clear other fields when a new field is selected
    if (fieldName !== activeField) {
      if (activeField && activeField !== fieldName) {
        setValue(activeField as keyof FormData, '');
      }
      setActiveField(fieldName);
    }
    
    // Reset search results when switching fields
    setFilteredProviders([]);
    setHasSearched(false);
  };

  const onSubmit = (formData: FormData) => {
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const filtered = allProviders.filter(provider => {
        const specialty = formData.specialty?.toLowerCase() || '';
        const providerName = formData.provider?.toLowerCase() || '';
        const location = formData.location?.toLowerCase() || '';
        
        const providerFullName = `dr. ${provider.first_name} ${provider.last_name}`.toLowerCase();
        
        const matchesSpecialty = !specialty || provider.specialty.toLowerCase().includes(specialty);
        const matchesProvider = !providerName || providerFullName.includes(providerName);
        const matchesLocation = !location || provider.city.toLowerCase().includes(location);
        
        return matchesSpecialty && matchesProvider && matchesLocation;
      });
      
      setFilteredProviders(filtered);
      setIsSearching(false);
    }, 500);
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

      <form onSubmit={handleSubmit(onSubmit)} className={searchbarStyles['search-form']}>
        <div className={searchbarStyles['search-inputs']}>
          <div className={searchbarStyles['input-group']}>
            <input
              {...register("specialty")}
              type="text"
              placeholder="Medical Specialty"
              list="specialties"
              className={searchbarStyles['search-input']}
              onChange={(e) => handleFieldChange("specialty", e.target.value)}
            />
            <datalist id="specialties">
              <option value="Primary Care (Family or Internal Medicine)"></option>
              <option value="Pediatrics"></option>
              <option value="Obstetrics & Gynecology"></option>
              <option value="Cardiology"></option>
              <option value="Dermatology"></option>
              <option value="Orthopedics"></option>
              <option value="Psychiatry & Mental Health"></option>
              <option value="Gastroenterology"></option>
              <option value="Neurology"></option>
              <option value="Endocrinology"></option>
            </datalist>
          </div>

          <div className={searchbarStyles['input-group']}>
            <input
              {...register("provider")}
              type="text"
              placeholder="Search by provider name"
              list="providers"
              className={searchbarStyles['search-input']}
              onChange={(e) => handleFieldChange("provider", e.target.value)}
            />
            <datalist id="providers">
              <option value="Dr. Emily Chen"></option>
              <option value="Dr. Marcus Patel"></option>
              <option value="Dr. Rachel Nguyen"></option>
              <option value="Dr. Thomas Brooks"></option>
              <option value="Dr. Aisha Roberts"></option>
              <option value="Dr. James Okafor"></option>
              <option value="Dr. Sofia Martinez"></option>
              <option value="Dr. Henry Kim"></option>
              <option value="Dr. Olivia Adams"></option>
              <option value="Dr. Noah Singh"></option>
            </datalist>
          </div>

          <div className={searchbarStyles['input-group']}>
            <input
              {...register("location")}
              type="text"
              placeholder="Where in the Dallas Metroplex are you?"
              list="locations"
              className={searchbarStyles['search-input']}
              onChange={(e) => handleFieldChange("location", e.target.value)}
            />
            <datalist id="locations">
              <option value="Dallas"></option>
              <option value="Fort Worth"></option>
              <option value="Arlington"></option>
              <option value="Plano"></option>
              <option value="Frisco"></option>
              <option value="Irving"></option>
              <option value="Carrollton"></option>
              <option value="Garland"></option>
              <option value="Richardson"></option>
              <option value="Grand Prairie"></option>
              <option value="McKinney"></option>
              <option value="Allen"></option>
              <option value="The Colony"></option>
              <option value="Lewisville"></option>
              <option value="Mesquite"></option>
              <option value="Denton"></option>
              <option value="Flower Mound"></option>
              <option value="Euless"></option>
              <option value="Keller"></option>
              <option value="Southlake"></option>
            </datalist>
          </div>
        </div>

        <button 
          type="submit"
          className={searchbarStyles['search-button']}
          disabled={isSearching}
        >
          <Stethoscope className={searchbarStyles['button-icon']} />
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
      </div>

      {/* Search Results */}
      {hasSearched && filteredProviders.length > 0 && (
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

      {hasSearched && filteredProviders.length === 0 && !isSearching && (
        <div className={styles['no-results']}>
          <p>No providers found matching your search criteria</p>
          <p>Try adjusting your search terms or browse all providers</p>
        </div>
      )}
    </div>
  );
}