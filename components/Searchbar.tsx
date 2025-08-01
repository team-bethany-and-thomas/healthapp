"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope } from "lucide-react";

const Searchbar = () => {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    specialty: "",
    provider: "",
    location: ""
  });

  // Search function
  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, value);
      }
    });
    
    const searchUrl = `/search?${searchParams.toString()}`;
    router.push(searchUrl);
  };

  // Event handler for all inputs
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Key press handler
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  // Memoized datalist options to prevent re-renders
  const specialties = useMemo(() => [
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
    "Pulmonology"
  ], []);

  const providers = useMemo(() => [
    "Dr. Emily Chen",
    "Dr. Marcus Patel",
    "Dr. Rachel Nguyen",
    "Dr. Thomas Brooks",
    "Dr. Aisha Roberts",
    "Dr. James Okafor",
    "Dr. Sofia Martinez",
    "Dr. Henry Kim",
    "Dr. Olivia Adams",
    "Dr. Noah Singh",
    "Dr. Catherine Scott"
  ], []);

  const locations = useMemo(() => [
    "Dallas", "Fort Worth", "Arlington", "Plano", "Frisco", "Irving",
    "Carrollton", "Garland", "Richardson", "Grand Prairie", "McKinney",
    "Allen", "The Colony", "Lewisville", "Mesquite", "Denton",
    "Flower Mound", "Euless", "Keller", "Southlake"
  ], []);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 w-full">
        <div className="flex-1">
          <input
            id="specialty-input"
            name="specialty"
            type="text"
            className="input input-bordered w-full"
            placeholder="Medical Specialty"
            list="specialties"
            value={formData.specialty}
            onChange={(e) => handleInputChange("specialty", e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <datalist id="specialties">
            {specialties.map(specialty => (
              <option key={specialty} value={specialty} />
            ))}
          </datalist>
        </div>

        <div className="flex-1">
          <input
            id="provider-input"
            name="provider"
            type="text"
            className="input input-bordered w-full"
            placeholder="Search by provider name"
            list="providers"
            value={formData.provider}
            onChange={(e) => handleInputChange("provider", e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <datalist id="providers">
            {providers.map(provider => (
              <option key={provider} value={provider} />
            ))}
          </datalist>
        </div>

        <div className="flex-1">
          <input
            id="location-input"
            name="location"
            type="text"
            className="input input-bordered w-full"
            placeholder="Where in the Dallas Metroplex are you?"
            list="locations"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <datalist id="locations">
            {locations.map(location => (
              <option key={location} value={location} />
            ))}
          </datalist>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
        >
          <Stethoscope className="w-4 h-4 mr-2" />
          Search
        </button>
      </form>
    </div>
  );
};

export default Searchbar;
