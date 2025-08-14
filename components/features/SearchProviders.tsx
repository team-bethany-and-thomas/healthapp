"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "../../app/hooks/useAuth";
import {
  providerService,
  SearchFilters,
  useProviders,
} from "../../app/services/providerService";
import { MapPin, Calendar, Clock, Stethoscope } from "lucide-react";
import { AppointmentBookingModal } from "./AppointmentBookingModal/AppointmentBookingModal";

const SearchProviders: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [weekendFilter, setWeekendFilter] = useState<boolean | null>(null);

  // Modal state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null
  );

  const filters: SearchFilters = useMemo(
    () => ({
      searchTerm: searchTerm || undefined,
      selectedSpecialty: selectedSpecialty || undefined,
      weekendFilter,
    }),
    [searchTerm, selectedSpecialty, weekendFilter]
  );

  const { doctors, loading, error } = useProviders(filters);

  // Get specialties from the service
  const specialties = providerService.getSpecialties();

  // Get locations from doctors for location filter
  const locations = React.useMemo(() => {
    const uniqueLocations = new Set<string>();
    doctors.forEach((doctor) => {
      if (doctor.location) {
        uniqueLocations.add(doctor.location);
      }
    });
    return Array.from(uniqueLocations).sort();
  }, [doctors]);

  // Filter doctors based on location (client-side filtering for location)
  const filteredDoctors = React.useMemo(() => {
    if (!selectedLocation) return doctors;
    return doctors.filter((doctor) => doctor.location === selectedLocation);
  }, [doctors, selectedLocation]);

  // Transform doctors for modal compatibility
  const transformedDoctors = React.useMemo(() => {
    return filteredDoctors.map((doctor) => ({
      ...doctor,
      name: doctor.name || `${doctor.first_name} ${doctor.last_name}`,
      location: doctor.location || `${doctor.city}, ${doctor.state}`,
      availability:
        doctor.availability ||
        `${doctor.availability_start} - ${doctor.availability_end}`,
      provider_id: doctor.provider_id,
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      practice_name: doctor.practice_name,
      availability_day: doctor.availability_day, // Preserve availability_day field
    }));
  }, [filteredDoctors]);

  // Handler functions
  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSpecialtyChange = (value: string) => {
    setSelectedSpecialty(value);
  };

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
  };

  // Get doctor image with fallback
  const getDoctorImage = (doctorName: string): string => {
    // You can implement a more sophisticated image mapping here
    return "/default-avatar.png";
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialty("");
    setSelectedLocation("");
    setWeekendFilter(null);
  };

  // Modal handler functions
  const handleBookAppointment = (providerId: string) => {
    setSelectedProviderId(providerId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProviderId(null);
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  // Show auth error
  if (!user) {
    return (
      <div className="alert alert-warning max-w-md mx-auto mt-8">
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <span>Please log in to view healthcare providers.</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="alert alert-error max-w-md mx-auto mt-8">
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "#0d9488" }}>
          Find Healthcare Providers
        </h1>
        <p className="text-secondary text-lg font-semibold">
          Search and filter through our network of qualified doctors
        </p>
      </div>

      {/* Search Section */}

  

      <div className="bg-gradient-to-br from-teal-200/80 via-white/95 to-purple-200/80 p-6 rounded-xl mb-8 shadow-2xl border-2 border-primary/20 backdrop-blur-sm">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filter by specialty */}
          <div className="form-control">
            <label className="label" htmlFor="specialty-select">
              <span className="label-text">Specialty</span>
            </label>
            <select
              id="specialty-select"
              name="specialty"
              className="select select-bordered w-full rounded-lg"
              value={selectedSpecialty}
              onChange={(e) => handleSpecialtyChange(e.target.value)}
              aria-label="Filter by specialty"
              title="Select a medical specialty to filter providers"
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
            <label className="label" htmlFor="location-select">
              <span className="label-text">Location</span>
            </label>
            <select
              id="location-select"
              name="location"
              className="select select-bordered w-full rounded-lg"
              value={selectedLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              aria-label="Filter by location"
              title="Select a location to filter providers"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          {/* Search by name/specialty */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Search</span>
            </label>
            <div className="join w-full">
              <input
                id="search-term"
                name="searchTerm"
                type="text"
                placeholder="Doctor name or specialty..."
                className="input input-bordered join-item w-full rounded-lg"
                value={searchTerm}
                onChange={(e) => handleSearchTermChange(e.target.value)}
              />
              <button
                className="btn btn-primary join-item rounded-r-lg"
                type="button"
                aria-label="Search providers"
                title="Search for healthcare providers"
              >
                <Stethoscope/>
              </button>
            </div>
          </div>
          {/* Clear filters button */}
          <div className="form-control pt-6">
            <label className="label">
              <span className="label-text">&nbsp;</span>
            </label>
            <button
              className="btn btn-outline rounded-lg"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6 bg-base-100 p-4 rounded-lg shadow-lg border border-base-300">
        <p className="text-base-content/70">
          Found {filteredDoctors.length} provider
          {filteredDoctors.length !== 1 ? "s" : ""}
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
        <div className="text-center py-12 bg-base-100 rounded-xl shadow-xl border border-base-300">
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
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-300 hover:border-primary/30 rounded-xl overflow-hidden"
            >
              <div className="card-body p-6">
                {/* Doctor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="avatar">
                      <div className="w-16 h-16 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
                        <img
                          src={providerService.getProfileImageUrl(
                            doctor.profile_picture_id
                          )}
                          alt={
                            doctor.name ||
                            `${doctor.first_name} ${doctor.last_name}`
                          }
                          width={64}
                          height={64}
                          className="object-cover rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/default-avatar.svg";
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {doctor.name ||
                          `${doctor.first_name} ${doctor.last_name}`}
                      </h3>
                      <p className="text-sm text-primary font-medium">
                        {doctor.specialty}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div
                      className="rating rating-sm"
                      role="img"
                      aria-label={`Rating: ${
                        doctor.rating || 4.5
                      } out of 5 stars`}
                    >
                      {[...Array(5)].map((_, i) => (
                        <input
                          key={i}
                          id={`rating-${doctor.$id}-${i}`}
                          type="radio"
                          name={`rating-${doctor.$id}`}
                          className="mask mask-star-2 bg-orange-400"
                          checked={i < Math.floor(doctor.rating || 4.5)}
                          readOnly
                          aria-label={`${i + 1} star${i !== 0 ? "s" : ""}`}
                          title={`${i + 1} star${i !== 0 ? "s" : ""} out of 5`}
                        />
                      ))}
                    </div>

                  </div>
                </div>

                {/* Doctor Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-base-content/70">
                    <MapPin className="w-4 h-4 mr-2" />
                    {doctor.location || `${doctor.city}, ${doctor.state}`}
                  </div>
                  <div className="flex items-center text-sm text-base-content/70">
                    <Calendar className="w-4 h-4 mr-2" />
                    {doctor.availability ||
                      `${doctor.availability_start} - ${doctor.availability_end}`}
                  </div>
                  <div className="flex items-center text-sm text-base-content/70">
                    <Clock className="w-4 h-4 mr-2" />
                    {doctor.weekend_available
                      ? "Weekend Available"
                      : "Weekdays Only"}
                  </div>
                  {doctor.practice_name && (
                    <div className="flex items-center text-sm text-base-content/70">
                      <span className="font-medium mr-2">Practice:</span>
                      {doctor.practice_name}
                    </div>
                  )}
                  <p className="text-sm text-base-content/70">{doctor.bio}</p>
                </div>

                {/* Action Buttons */}
                <div className="card-actions justify-between">
                  <button className="btn btn-outline btn-sm">
                    View Profile
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleBookAppointment(doctor.$id)}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Booking Modal */}
      <AppointmentBookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        providerId={selectedProviderId || ""}
        providerList={transformedDoctors}
      />
    </div>
  );
};

export default SearchProviders;
