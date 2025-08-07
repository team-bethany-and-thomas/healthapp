"use client";

import React, { useState } from "react";
import {
  Search,
  Stethoscope,
  Hospital,
  Syringe,
  Activity,
  Star,
  MapPin,
  Clock,
  Calendar,
} from "lucide-react";
import styles from "./ProviderSearch.module.css";
import {
  providerService,
  type Doctor,
} from "../../../app/services/providerService";

export function ProviderSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProviders, setFilteredProviders] = useState<Doctor[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredProviders([]);
      return;
    }

    setIsSearching(true);

    try {
      // Use the provider service to search with proper filters
      const results = await providerService.fetchDoctors({
        searchTerm: searchQuery.trim(),
      });

      // Transform the results to match the expected format
      const transformedResults = results.map((doctor) => {
        const transformed = providerService.transformDoctorData(doctor);
        return {
          ...transformed,
          // Add imageUrl for display
          imageUrl: providerService.getProfileImageUrl(
            doctor.profile_picture_id
          ),
          // Generate realistic appointment slots based on doctor's availability
          appointments: generateNextAvailableSlots(doctor),
        };
      });

      setFilteredProviders(transformedResults);
    } catch (error) {
      console.error("Search error:", error);
      setFilteredProviders([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Generate next available appointment times based on doctor's schedule
  const generateNextAvailableSlots = (doctor: Doctor) => {
    const slots = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Helper function to parse time string (e.g., "09:00" to hours and minutes)
    const parseTime = (timeStr: string) => {
      if (!timeStr) return null;
      const [hours, minutes] = timeStr.split(":").map(Number);
      return { hours, minutes };
    };

    // Helper function to create date with specific time
    const createDateTime = (date: Date, timeStr: string) => {
      const time = parseTime(timeStr);
      if (!time) return null;
      const dateTime = new Date(date);
      dateTime.setHours(time.hours, time.minutes, 0, 0);
      return dateTime;
    };

    // Generate slots for the next 7 days
    for (let dayOffset = 0; dayOffset < 7 && slots.length < 3; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      let availableStart = null;
      let availableEnd = null;

      // Check if it's a weekend day (Saturday = 6, Sunday = 0)
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (
        isWeekend &&
        doctor.weekend_available &&
        doctor.weekend_start &&
        doctor.weekend_end
      ) {
        // Use weekend hours
        availableStart = doctor.weekend_start;
        availableEnd = doctor.weekend_end;
      } else if (
        !isWeekend &&
        doctor.availability_start &&
        doctor.availability_end
      ) {
        // Use weekday hours
        availableStart = doctor.availability_start;
        availableEnd = doctor.availability_end;
      }

      if (availableStart && availableEnd) {
        const startTime = createDateTime(currentDate, availableStart);
        const endTime = createDateTime(currentDate, availableEnd);

        if (startTime && endTime) {
          // If it's today, make sure the appointment is in the future
          if (dayOffset === 0) {
            const currentTime = new Date();
            if (startTime <= currentTime) {
              // Round up to next hour
              const nextHour = new Date(currentTime);
              nextHour.setHours(currentTime.getHours() + 1, 0, 0, 0);
              if (nextHour < endTime) {
                startTime.setTime(nextHour.getTime());
              } else {
                continue; // Skip today if no time available
              }
            }
          }

          // Generate 2-3 time slots for this day
          const slotDuration = 60; // 1 hour slots
          const currentSlot = new Date(startTime);
          let slotsForDay = 0;

          while (currentSlot < endTime && slotsForDay < 2 && slots.length < 3) {
            slots.push({
              $id: `${doctor.$id}-${slots.length}`,
              date: currentSlot.toISOString().split("T")[0],
              start_time: currentSlot.toTimeString().slice(0, 5),
              length_minutes: 30,
            });

            currentSlot.setMinutes(currentSlot.getMinutes() + slotDuration);
            slotsForDay++;
          }
        }
      }
    }

    return slots.length > 0
      ? slots
      : [
          {
            $id: "1",
            date: "2025-08-07",
            start_time: "09:00",
            length_minutes: 30,
          },
          {
            $id: "2",
            date: "2025-08-07",
            start_time: "14:00",
            length_minutes: 30,
          },
          {
            $id: "3",
            date: "2025-08-08",
            start_time: "10:00",
            length_minutes: 30,
          },
        ];
  };

  return (
    <div className={styles["provider-search-container"]}>
      <div className={styles["search-header"]}>
        <Hospital className={styles["hospital-icon"]} />
        <h1 className="text-black">Find a Healthcare Provider</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles["search-bar"]}>
        <Search className={styles["search-icon"]} />
        <input
          type="text"
          placeholder="Search by name, specialty, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          type="submit"
          className={styles["search-button"]}
          disabled={isSearching}
        >
          <Stethoscope className={styles["button-icon"]} />
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      <div className={styles["filter-chips"]}>
        <div
          className={styles.chip}
          onClick={async () => {
            setIsSearching(true);
            try {
              const results = await providerService.fetchDoctors({
                selectedSpecialty: "Primary Care (Family or Internal Medicine)",
              });
              const transformedResults = results.map((doctor) => {
                const transformed = providerService.transformDoctorData(doctor);
                return {
                  ...transformed,
                  imageUrl: providerService.getProfileImageUrl(
                    doctor.profile_picture_id
                  ),
                  appointments: generateNextAvailableSlots(doctor),
                };
              });
              setFilteredProviders(transformedResults);
            } catch (error) {
              console.error("Search error:", error);
              setFilteredProviders([]);
            } finally {
              setIsSearching(false);
            }
          }}
        >
          <Syringe size={16} />
          <span>Primary Care</span>
        </div>
        <div
          className={styles.chip}
          onClick={async () => {
            setIsSearching(true);
            try {
              // Get all doctors first, then filter out Primary Care to show specialists
              const allResults = await providerService.fetchDoctors({});
              const specialistResults = allResults.filter(
                (doctor) =>
                  doctor.specialty !==
                  "Primary Care (Family or Internal Medicine)"
              );
              const transformedResults = specialistResults.map((doctor) => {
                const transformed = providerService.transformDoctorData(doctor);
                return {
                  ...transformed,
                  imageUrl: providerService.getProfileImageUrl(
                    doctor.profile_picture_id
                  ),
                  appointments: generateNextAvailableSlots(doctor),
                };
              });
              setFilteredProviders(transformedResults);
            } catch (error) {
              console.error("Search error:", error);
              setFilteredProviders([]);
            } finally {
              setIsSearching(false);
            }
          }}
        >
          <Stethoscope size={16} />
          <span>Specialists</span>
        </div>
        <div
          className={styles.chip}
          onClick={async () => {
            setIsSearching(true);
            try {
              const results = await providerService.fetchDoctors({
                weekendFilter: true,
              });
              const transformedResults = results.map((doctor) => {
                const transformed = providerService.transformDoctorData(doctor);
                return {
                  ...transformed,
                  imageUrl: providerService.getProfileImageUrl(
                    doctor.profile_picture_id
                  ),
                  appointments: generateNextAvailableSlots(doctor),
                };
              });
              setFilteredProviders(transformedResults);
            } catch (error) {
              console.error("Search error:", error);
              setFilteredProviders([]);
            } finally {
              setIsSearching(false);
            }
          }}
        >
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
        <div className={styles["search-results"]}>
          <h2 className={styles["results-header"]}>
            Found {filteredProviders.length} provider
            {filteredProviders.length !== 1 ? "s" : ""}
          </h2>
          <div className={styles["results-grid"]}>
            {filteredProviders.map((provider, index) => (
              <div
                key={provider.$id || index}
                className={styles["provider-card"]}
              >
                <div className={styles["provider-header"]}>
                  <div className={styles["provider-info"]}>
                    <h3 className={styles["provider-name"]}>
                      {provider.first_name} {provider.last_name}
                    </h3>
                    <p className={styles["provider-specialty"]}>
                      {provider.specialty}
                    </p>
                    <p className={styles["provider-practice"]}>
                      {provider.practice_name}
                    </p>
                  </div>
                  <div className={styles["provider-rating"]}>
                    <Star size={16} className={styles["star-icon"]} />
                    <span>{provider.rating?.toFixed(1) || "4.5"}</span>
                  </div>
                </div>

                <div className={styles["provider-details"]}>
                  <div className={styles["detail-item"]}>
                    <MapPin size={14} />
                    <span>
                      {provider.city}, {provider.state} {provider.zip}
                    </span>
                  </div>
                  <div className={styles["detail-item"]}>
                    <Calendar size={14} />
                    <span>
                      {provider.appointments?.length || 0} appointments
                      available
                    </span>
                  </div>
                  <div className={styles["languages"]}>
                    <span className={styles["language-label"]}>Languages:</span>
                    <span>
                      {provider.languages_spoken?.join(", ") || "English"}
                    </span>
                  </div>
                </div>

                <div className={styles["appointments-preview"]}>
                  <h4 className={styles["appointments-title"]}>
                    Next Available:
                  </h4>
                  <div className={styles["appointment-slots"]}>
                    {(provider.appointments || [])
                      .slice(0, 3)
                      .map((appointment, appIndex) => (
                        <div
                          key={appIndex}
                          className={styles["appointment-slot"]}
                        >
                          <Clock size={12} />
                          <span>
                            {formatDate(appointment.date)} at{" "}
                            {appointment.start_time}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <button className={styles["book-button"]}>
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchQuery && filteredProviders.length === 0 && !isSearching && (
        <div className={styles["no-results"]}>
          <p>No providers found matching &quot;{searchQuery}&quot;</p>
          <p>Try adjusting your search terms or browse all providers</p>
        </div>
      )}
    </div>
  );
}
