"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Search } from "lucide-react";

const Searchbar = () => {
  const router = useRouter();
  
  const [specialty, setSpecialty] = useState("");
  const [provider, setProvider] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = () => {
    // Build search parameters
    const searchParams = new URLSearchParams();
    
    if (specialty) {
      searchParams.append('specialty', specialty);
    }
    
    if (provider) {
      searchParams.append('search', provider);
    }
    
    if (location) {
      searchParams.append('location', location);
    }
    
    // Navigate to search page with parameters
    const searchUrl = `/search?${searchParams.toString()}`;
    router.push(searchUrl);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 w-full">
        <div className="flex-1">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Medical Specialty"
            list="specialties"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            onKeyPress={handleKeyPress}
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
            <option value="Pulmonology"></option>
          </datalist>
        </div>

        <div className="flex-1">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Search by provider name"
            list="providers"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            onKeyPress={handleKeyPress}
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
            <option value="Dr. Catherine Scott"></option>
          </datalist>
        </div>

        <div className="flex-1">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Where in the Dallas Metroplex are you?"
            list="locations"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
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
