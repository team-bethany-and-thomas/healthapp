"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Stethoscope, Search, MapPin, Star, Calendar, Clock } from 'lucide-react';

interface Doctor {
  $id: string;
  name: string;
  gender: string;
  specialty: string;
  location: string;
  phone: string;
  availability: string;
  weekend_available: boolean;
  bio: string;
  profile_picture_id: string;
}


const mockDoctors: Doctor[] = [
  {
    $id: "1",
    name: "Dr. Emily Chen",
    gender: "Female",
    specialty: "Primary Care (Family or Internal Medicine)",
    location: "Dallas, TX",
    phone: "(214) 555-0101",
    availability: "Mon-Fri 8AM-5PM",
    weekend_available: false,
    bio: "Experienced primary care physician with over 10 years of practice.",
    profile_picture_id: "emily_chen.jpg"
  },
  {
    $id: "2",
    name: "Dr. Marcus Patel",
    gender: "Male",
    specialty: "Cardiology",
    location: "Plano, TX",
    phone: "(972) 555-0202",
    availability: "Mon-Fri 9AM-6PM",
    weekend_available: true,
    bio: "Board-certified cardiologist specializing in preventive cardiology.",
    profile_picture_id: "marcus_patel.jpg"
  },
  {
    $id: "3",
    name: "Dr. Catherine Scott",
    gender: "Female",
    specialty: "Pulmonology",
    location: "McKinney, TX",
    phone: "(469) 555-0303",
    availability: "Mon-Fri 8AM-5PM",
    weekend_available: false,
    bio: "Pulmonologist with expertise in respiratory conditions and sleep medicine.",
    profile_picture_id: "catherine_scott.jpg"
  },
  {
    $id: "4",
    name: "Dr. Rachel Nguyen",
    gender: "Female",
    specialty: "Pediatrics",
    location: "Frisco, TX",
    phone: "(972) 555-0404",
    availability: "Mon-Fri 8AM-6PM",
    weekend_available: true,
    bio: "Pediatrician dedicated to providing comprehensive care for children.",
    profile_picture_id: "rachel_nguyen.jpg"
  },
  {
    $id: "5",
    name: "Dr. Thomas Brooks",
    gender: "Male",
    specialty: "Orthopedics",
    location: "Arlington, TX",
    phone: "(817) 555-0505",
    availability: "Mon-Fri 9AM-5PM",
    weekend_available: false,
    bio: "Orthopedic surgeon specializing in sports medicine and joint replacement.",
    profile_picture_id: "thomas_brooks.jpg"
  },
  {
    $id: "6",
    name: "Dr. Aisha Roberts",
    gender: "Female",
    specialty: "Obstetrics & Gynecology",
    location: "Fort Worth, TX",
    phone: "(817) 555-0606",
    availability: "Mon-Fri 8AM-6PM",
    weekend_available: true,
    bio: "OB/GYN specialist providing comprehensive women's healthcare services.",
    profile_picture_id: "aisha_roberts.jpg"
  },
  {
    $id: "7",
    name: "Dr. James Okafor",
    gender: "Male",
    specialty: "Dermatology",
    location: "Irving, TX",
    phone: "(972) 555-0707",
    availability: "Mon-Fri 9AM-5PM",
    weekend_available: false,
    bio: "Board-certified dermatologist specializing in medical and cosmetic dermatology.",
    profile_picture_id: "james_okafor.jpg"
  },
  {
    $id: "8",
    name: "Dr. Sofia Martinez",
    gender: "Female",
    specialty: "Psychiatry & Mental Health",
    location: "Carrollton, TX",
    phone: "(972) 555-0808",
    availability: "Mon-Fri 9AM-6PM",
    weekend_available: false,
    bio: "Psychiatrist specializing in adult and adolescent mental health treatment.",
    profile_picture_id: "sofia_martinez.jpg"
  },
  {
    $id: "9",
    name: "Dr. Henry Kim",
    gender: "Male",
    specialty: "Gastroenterology",
    location: "Garland, TX",
    phone: "(972) 555-0909",
    availability: "Mon-Fri 8AM-5PM",
    weekend_available: false,
    bio: "Gastroenterologist with expertise in digestive disorders and endoscopy.",
    profile_picture_id: "henry_kim.jpg"
  },
  {
    $id: "10",
    name: "Dr. Olivia Adams",
    gender: "Female",
    specialty: "Neurology",
    location: "Richardson, TX",
    phone: "(972) 555-1010",
    availability: "Mon-Fri 9AM-6PM",
    weekend_available: false,
    bio: "Neurologist specializing in neurological disorders and stroke treatment.",
    profile_picture_id: "olivia_adams.jpg"
  },
  {
    $id: "11",
    name: "Dr. Noah Singh",
    gender: "Male",
    specialty: "Endocrinology",
    location: "Grand Prairie, TX",
    phone: "(972) 555-1111",
    availability: "Mon-Fri 8AM-5PM",
    weekend_available: false,
    bio: "Endocrinologist specializing in diabetes management and hormone disorders.",
    profile_picture_id: "noah_singh.jpg"
  }
];

function SearchPage() {
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(mockDoctors);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const specialties = [
    "Primary Care (Family or Internal Medicine)",
    "Pediatrics",
    "Obstetrics & Gynecology",
    "Cardiology",
    "Dermatology",
    "Orthopedics",
    "Psychiatry & Mental Health",
    "Gastroenterology",
    "Neurology",
    "Endocrinology",
    "Pulmonology",
  ];

  const locations = [
    "Dallas", "Fort Worth", "Arlington", "Plano", "Frisco", "Irving",
    "Carrollton", "Garland", "Richardson", "Grand Prairie", "McKinney",
    "Allen", "The Colony", "Lewisville", "Mesquite", "Denton",
    "Flower Mound", "Euless", "Keller", "Southlake"
  ];

  // Handle initial URL parameters
  useEffect(() => {
    if (searchParams) {
      const specialty = searchParams.get('specialty');
      const search = searchParams.get('search');
      const location = searchParams.get('location');

      if (specialty) setSelectedSpecialty(specialty);
      if (search) setSearchTerm(search);
      if (location) setSelectedLocation(location);
    }
  }, [searchParams]);

  // Filter doctors based on search criteria
  useEffect(() => {
    setLoading(true);
    
    const filtered = mockDoctors.filter(doctor => {
      // Only use the first non-empty filter
      if (searchTerm) {
        const trimmedSearchTerm = searchTerm.trim().toLowerCase();
        const normalizedDoctorName = doctor.name.toLowerCase().replace(/\s+/g, ' ');
        const normalizedSpecialty = doctor.specialty.toLowerCase().replace(/\s+/g, ' ');
        
        return normalizedDoctorName.includes(trimmedSearchTerm) ||
               normalizedSpecialty.includes(trimmedSearchTerm);
      } else if (selectedSpecialty) {
        return doctor.specialty === selectedSpecialty;
      } else if (selectedLocation) {
        return doctor.location.toLowerCase().includes(selectedLocation.toLowerCase());
      }
      
      // If no filters are active, show all doctors
      return true;
    });
    
    setFilteredDoctors(filtered);
    setLoading(false);
  }, [searchTerm, selectedSpecialty, selectedLocation]);

  const getDoctorImage = (doctorName: string) => {
    const imageMap: { [key: string]: string } = {
      "Dr. Emily Chen": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=180&h=120&fit=crop&crop=face",
      "Dr. Marcus Patel": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&h=120&fit=crop&crop=face",
      "Dr. Catherine Scott": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=180&h=120&fit=crop&crop=face",
      "Dr. Rachel Nguyen": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=180&h=120&fit=crop&crop=face",
      "Dr. Thomas Brooks": "https://images.unsplash.com/photo-1594824475545-9d0c7c4951c1?w=180&h=120&fit=crop&crop=face",
      "Dr. Aisha Roberts": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=180&h=120&fit=crop&crop=face",
      "Dr. James Okafor": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=180&h=120&fit=crop&crop=face",
      "Dr. Sofia Martinez": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=180&h=120&fit=crop&crop=face",
      "Dr. Henry Kim": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&h=120&fit=crop&crop=face",
      "Dr. Olivia Adams": "https://images.unsplash.com/photo-1594824475545-9d0c7c4951c1?w=180&h=120&fit=crop&crop=face",
      "Dr. Noah Singh": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=180&h=120&fit=crop&crop=face"
    };
    
    return imageMap[doctorName] || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=180&h=120&fit=crop&crop=face";
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    // Clear other fields when search term is used
    if (value) {
      setSelectedSpecialty('');
      setSelectedLocation('');
    }
  };

  const handleSpecialtyChange = (value: string) => {
    setSelectedSpecialty(value);
    // Clear other fields when specialty is selected
    if (value) {
      setSearchTerm('');
      setSelectedLocation('');
    }
  };

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    // Clear other fields when location is selected
    if (value) {
      setSearchTerm('');
      setSelectedSpecialty('');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecialty('');
    setSelectedLocation('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Find Healthcare Providers</h1>
        <p className="text-base-content/70">
          Search and filter through our network of qualified doctors
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-base-200 p-6 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search by name/specialty */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Search</span>
            </label>
            <div className="join w-full">
              <input
                type="text"
                placeholder="Doctor name or specialty..."
                className="input input-bordered join-item w-full"
                value={searchTerm}
                onChange={(e) => handleSearchTermChange(e.target.value)}
              />
              <button className="btn btn-primary join-item">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter by specialty */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Specialty</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedSpecialty}
              onChange={(e) => handleSpecialtyChange(e.target.value)}
            >
              <option value="">All Specialties</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by location */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Location</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters button */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">&nbsp;</span>
            </label>
            <button className="btn btn-outline" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6">
        <p className="text-base-content/70">
          Found {filteredDoctors.length} provider{filteredDoctors.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {/* Doctors Grid */}
      {!loading && filteredDoctors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-semibold mb-2">No providers found</h3>
          <p className="text-base-content/70">
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.$id}
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="card-body p-6">
                {/* Doctor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="avatar">
                      <div className="w-16 h-16 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
                        <img 
                          src={getDoctorImage(doctor.name)}
                          alt={doctor.name}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{doctor.name}</h3>
                      <p className="text-sm text-primary font-medium">{doctor.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="rating rating-sm">
                      {[...Array(5)].map((_, i) => (
                        <input
                          key={i}
                          type="radio"
                          name={`rating-${doctor.$id}`}
                          className="mask mask-star-2 bg-orange-400"
                          checked={i < 4}
                          readOnly
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                </div>

                {/* Doctor Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-base-content/70">
                    <MapPin className="w-4 h-4 mr-2" />
                    {doctor.location}
                  </div>
                  <div className="flex items-center text-sm text-base-content/70">
                    <Calendar className="w-4 h-4 mr-2" />
                    {doctor.availability}
                  </div>
                  <div className="flex items-center text-sm text-base-content/70">
                    <Clock className="w-4 h-4 mr-2" />
                    {doctor.weekend_available ? "Weekend Available" : "Weekdays Only"}
                  </div>
                  <p className="text-sm text-base-content/70">{doctor.bio}</p>
                </div>

                {/* Action Buttons */}
                <div className="card-actions justify-between">
                  <button className="btn btn-outline btn-sm">
                    View Profile
                  </button>
                  <button className="btn btn-primary btn-sm">
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchPage;

