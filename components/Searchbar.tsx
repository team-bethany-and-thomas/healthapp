"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { providerService, useProviders, type Doctor } from "../app/services/providerService";
import styles from './Searchbar.module.css';

const Searchbar = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    specialty: "",
    provider: "",
    location: "",
  });

  // Get all providers for autocomplete suggestions
  const { doctors: allProviders, loading } = useProviders({});
  const [dynamicProviders, setDynamicProviders] = useState<string[]>([]);
  const [dynamicLocations, setDynamicLocations] = useState<string[]>([]);

  // Update dynamic suggestions when providers data changes
  useEffect(() => {
    if (allProviders && allProviders.length > 0) {
      // Extract unique provider names
      const providerNames = allProviders
        .map(doctor => {
          const firstName = doctor.first_name || '';
          const lastName = doctor.last_name || '';
          return `${firstName} ${lastName}`.trim();
        })
        .filter(name => name.length > 0 && name !== ' ')
        .sort();

      const uniqueProviders = Array.from(new Set(providerNames));
      setDynamicProviders(uniqueProviders);

      // Extract unique locations (cities)
      const locations = allProviders
        .map(doctor => doctor.city || '')
        .filter(location => location && location.length > 0)
        .sort();

      const uniqueLocations = Array.from(new Set(locations));
      setDynamicLocations(uniqueLocations);
    }
  }, [allProviders]);

  // Search function
  const handleSearch = () => {
    const searchParams = new URLSearchParams();

    
    // Map form fields to search parameters
    if (formData.specialty) {
      searchParams.append('specialty', formData.specialty);
    }
    if (formData.provider) {
      searchParams.append('search', formData.provider);
    }
    if (formData.location) {
      searchParams.append('location', formData.location);
    }
    
    const searchUrl = `/search?${searchParams.toString()}`;
    router.push(searchUrl);
  };

  // Event handler for all inputs
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Key press handler
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };


  // Get specialties from provider service
  const specialties = useMemo(() => providerService.getSpecialties(), []);

  // Fallback static data for when dynamic data is loading
  const fallbackLocations = useMemo(() => [
    "Dallas", "Fort Worth", "Arlington", "Plano", "Frisco", "Irving",
    "Carrollton", "Garland", "Richardson", "Grand Prairie", "McKinney",
    "Allen", "The Colony", "Lewisville", "Mesquite", "Denton",
    "Flower Mound", "Euless", "Keller", "Southlake"
  ], []);


  // Use dynamic data if available, otherwise use fallback
  const providersToShow = dynamicProviders.length > 0 ? dynamicProviders : [];
  const locationsToShow = dynamicLocations.length > 0 ? dynamicLocations : fallbackLocations;

  return (
    <div className="w-full">

      <form onSubmit={handleSubmit} className={styles['search-form']}>
        <div className={styles['search-inputs']}>
          <div className={styles['input-group']}>
            <input
              id="specialty-input"
              name="specialty"
              type="text"
              className={`${styles['search-input']} input input-bordered w-full`}
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

          <div className={styles['input-group']}>
            <input
              id="provider-input"
              name="provider"
              type="text"
              className={`${styles['search-input']} input input-bordered w-full`}
              placeholder={loading ? "Loading providers..." : "Search by provider name"}
              list="providers"
              value={formData.provider}
              onChange={(e) => handleInputChange("provider", e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />

            <datalist id="providers">
              {providersToShow.map(provider => (
                <option key={provider} value={provider} />
              ))}
            </datalist>
          </div>

          <div className={styles['input-group']}>
            <input
              id="location-input"
              name="location"
              type="text"
              className={`${styles['search-input']} input input-bordered w-full`}
              placeholder="Where in the Dallas Metroplex are you?"
              list="locations"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              onKeyPress={handleKeyPress}
            />

            <datalist id="locations">
              {locationsToShow.map(location => (
                <option key={location} value={location} />
              ))}
            </datalist>
          </div>

          <button 
            type="submit" 
            className={`${styles['search-button']} btn btn-primary`}
            disabled={loading}
          >
            <Stethoscope className={`${styles['button-icon']} w-4 h-4`} />
            {loading ? "Loading..." : "Search"}
          </button>

        </div>
      </form>


      {/* Show loading indicator when fetching provider data */}
      {loading && (
        <div className="flex justify-center items-center py-2">
          <div className="loading loading-spinner loading-sm"></div>
          <span className="ml-2 text-sm text-gray-500">Loading provider data...</span>
        </div>
      )}

    </div>
  );
};

export default React.memo(Searchbar);
