"use client";

import React, { useState, useCallback, useMemo } from "react";
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
import { AppointmentBookingModal } from "@/components/features/AppointmentBookingModal/AppointmentBookingModal";

interface AppointmentSlot {
  $id: string;
  date: string;
  start_time: string;
  length_minutes: number;
}

export function ProviderSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProviders, setFilteredProviders] = useState<Doctor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");

  const generateNextAvailableSlots = useCallback((doctor: Doctor) => {
    const slots: AppointmentSlot[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Helper function to parse time string (e.g., "09:00" or "8am" to hours and minutes)
    const parseTime = (timeStr: string) => {
      if (!timeStr) return null;

      // Handle format like "8am", "5pm", "12pm", "12am"
      const amPmMatch = timeStr.match(/(\d{1,2})(am|pm)/i);
      if (amPmMatch) {
        let hours = parseInt(amPmMatch[1]);
        const period = amPmMatch[2].toLowerCase();

        // Convert to 24-hour format
        if (period === "pm" && hours !== 12) {
          hours += 12;
        } else if (period === "am" && hours === 12) {
          hours = 0;
        }

        return { hours, minutes: 0 };
      }

      // Handle format like "09:00", "17:30"
      if (timeStr.includes(":")) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return { hours, minutes };
      }

      return null;
    };

    // Helper function to create date with specific time
    const createDateTime = (date: Date, timeStr: string) => {
      const time = parseTime(timeStr);
      if (!time) return null;
      const dateTime = new Date(date);
      dateTime.setHours(time.hours, time.minutes, 0, 0);
      return dateTime;
    };

    // If no availability data, generate dynamic future-only slots
    if (!doctor.availability_start && !doctor.weekend_start) {
      const fallbackSlots = [];
      let slotsGenerated = 0;

      // Generate slots for the next few days until we have 3 slots
      for (
        let dayOffset = 0;
        dayOffset < 7 && slotsGenerated < 3;
        dayOffset++
      ) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + dayOffset);

        // Define typical business hours for fallback
        const businessHours = [9, 10, 11, 14, 15, 16, 17]; // 9am-5pm with lunch break

        for (const hour of businessHours) {
          if (slotsGenerated >= 3) break;

          const slotDateTime = new Date(checkDate);
          slotDateTime.setHours(hour, 0, 0, 0);

          // Only add if this slot is in the future
          if (slotDateTime > now) {
            fallbackSlots.push({
              $id: `fallback-${slotsGenerated}`,
              date: checkDate.toISOString().split("T")[0],
              start_time: `${hour.toString().padStart(2, "0")}:00`,
              length_minutes: 30,
            });
            slotsGenerated++;
          }
        }
      }

      return fallbackSlots;
    }

    // Generate slots for the next 7 days, but only future times
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
          // If it's today and the start time is in the past, adjust to next available hour
          if (dayOffset === 0 && startTime <= now) {
            // Round up to next hour after current time
            const nextHour = new Date(now);
            nextHour.setHours(now.getHours() + 1, 0, 0, 0);

            // If the next hour is still within business hours, use it
            if (nextHour < endTime) {
              startTime.setTime(nextHour.getTime());
            } else {
              // No more time available today, skip to next day
              continue;
            }
          } else if (dayOffset > 0 && startTime <= now) {
            // For future days, if somehow the start time is still in the past, skip
            continue;
          }

          // Generate time slots for this day in 30-minute intervals
          const slotDuration = 30; // 30 minute slots
          const currentSlot = new Date(startTime);
          let slotsForDay = 0;

          while (currentSlot < endTime && slotsForDay < 3 && slots.length < 3) {
            // Double-check that this specific slot is in the future
            if (currentSlot > now) {
              const newSlot: AppointmentSlot = {
                $id: `${doctor.$id}-${slots.length}`,
                date: currentSlot.toISOString().split("T")[0],
                start_time: currentSlot.toTimeString().slice(0, 5),
                length_minutes: 30,
              };
              slots.push(newSlot);
              slotsForDay++;
            }

            currentSlot.setMinutes(currentSlot.getMinutes() + slotDuration);
          }
        }
      }
    }

    // If no slots were generated, use the same dynamic logic as the primary fallback
    if (slots.length === 0) {
      const fallbackSlots = [];
      let slotsGenerated = 0;

      // Generate slots for the next few days until we have 3 slots
      for (
        let dayOffset = 0;
        dayOffset < 7 && slotsGenerated < 3;
        dayOffset++
      ) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + dayOffset);

        // Define typical business hours for fallback
        const businessHours = [9, 10, 11, 14, 15, 16, 17]; // 9am-5pm with lunch break

        for (const hour of businessHours) {
          if (slotsGenerated >= 3) break;

          const slotDateTime = new Date(checkDate);
          slotDateTime.setHours(hour, 0, 0, 0);

          // Only add if this slot is in the future
          if (slotDateTime > now) {
            fallbackSlots.push({
              $id: `secondary-fallback-${slotsGenerated}`,
              date: checkDate.toISOString().split("T")[0],
              start_time: `${hour.toString().padStart(2, "0")}:00`,
              length_minutes: 30,
            });
            slotsGenerated++;
          }
        }
      }

      return fallbackSlots;
    }

    return slots;
  }, []);

  // Memoize the search function to prevent unnecessary re-renders
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setFilteredProviders([]);
      return;
    }

    setIsSearching(true);

    try {
      // Get all doctors to search through
      const allResults = await providerService.fetchDoctors({});

      const searchTerm = searchQuery.trim().toLowerCase();

      // Optimize search by using more efficient string operations
      const matchingResults = allResults.filter((doctor) => {
        const fullName = `${doctor.first_name || ""} ${
          doctor.last_name || ""
        }`.toLowerCase();
        const specialty = (doctor.specialty || "").toLowerCase();
        const city = (doctor.city || "").toLowerCase();
        const state = (doctor.state || "").toLowerCase();
        const practice = (doctor.practice_name || "").toLowerCase();
        const language = (doctor.language_spoken || "").toLowerCase();

        return (
          fullName.includes(searchTerm) ||
          specialty.includes(searchTerm) ||
          city.includes(searchTerm) ||
          state.includes(searchTerm) ||
          practice.includes(searchTerm) ||
          language.includes(searchTerm)
        );
      });

      // Transform the results to match the expected format
      const transformedResults = matchingResults.map((doctor) => {
        const transformed = providerService.transformDoctorData(doctor);
        // Always override appointments with dynamically generated slots
        const dynamicAppointments = generateNextAvailableSlots(doctor);
        return {
          ...transformed,
          imageUrl: providerService.getProfileImageUrl(
            doctor.profile_picture_id
          ),
          appointments: dynamicAppointments, // Always use our generated slots
        };
      });

      setFilteredProviders(transformedResults);
    } catch (error) {
      console.error("Search error:", error);
      setFilteredProviders([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, generateNextAvailableSlots]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSearch();
    },
    [handleSearch]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  // Memoize the date formatting function
  const formatDate = useCallback((dateString: string) => {
    // Parse the date as local time to avoid timezone issues
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Memoize the provider list for the modal
  const providerListForModal = useMemo(
    () =>
      filteredProviders.map((provider) => ({
        $id: provider.$id,
        name: `${provider.first_name} ${provider.last_name}`.trim(),
        gender: provider.gender,
        specialty: provider.specialty,
        location: `${provider.city}, ${provider.state}`,
        phone: provider.phone,
        availability: provider.availability,
        availability_start: provider.availability_start,
        availability_end: provider.availability_end,
        weekend_available: provider.weekend_available,
        weekend_start: provider.weekend_start,
        weekend_end: provider.weekend_end,
        bio: provider.bio,
        profile_picture_id: provider.profile_picture_id,
        provider_id: provider.provider_id,
      })),
    [filteredProviders]
  );

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
          placeholder="Search by name, specialty, location, or language..."
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
                // Always override appointments with dynamically generated slots
                const dynamicAppointments = generateNextAvailableSlots(doctor);
                return {
                  ...transformed,
                  imageUrl: providerService.getProfileImageUrl(
                    doctor.profile_picture_id
                  ),
                  appointments: dynamicAppointments, // Always use our generated slots
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
                // Always override appointments with dynamically generated slots
                const dynamicAppointments = generateNextAvailableSlots(doctor);
                return {
                  ...transformed,
                  imageUrl: providerService.getProfileImageUrl(
                    doctor.profile_picture_id
                  ),
                  appointments: dynamicAppointments, // Always use our generated slots
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
                // Always override appointments with dynamically generated slots
                const dynamicAppointments = generateNextAvailableSlots(doctor);
                return {
                  ...transformed,
                  imageUrl: providerService.getProfileImageUrl(
                    doctor.profile_picture_id
                  ),
                  appointments: dynamicAppointments, // Always use our generated slots
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
        <div
          className={styles.chip}
          onClick={async () => {
            setIsSearching(true);
            try {
              // Get all doctors and filter by common languages
              const allResults = await providerService.fetchDoctors({});
              const multilingualResults = allResults.filter(
                (doctor) =>
                  doctor.language_spoken &&
                  doctor.language_spoken.toLowerCase() !== "english" &&
                  doctor.language_spoken.toLowerCase() !== ""
              );
              const transformedResults = multilingualResults.map((doctor) => {
                const transformed = providerService.transformDoctorData(doctor);
                // Always override appointments with dynamically generated slots
                const dynamicAppointments = generateNextAvailableSlots(doctor);
                return {
                  ...transformed,
                  imageUrl: providerService.getProfileImageUrl(
                    doctor.profile_picture_id
                  ),
                  appointments: dynamicAppointments, // Always use our generated slots
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
          <span>🌐</span>
          <span>Multilingual Providers</span>
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
                    <div className={styles["language-tags"]}>
                      {provider.languages_spoken?.map((language, langIndex) => (
                        <span
                          key={langIndex}
                          className={styles["language-tag"]}
                        >
                          {language}
                        </span>
                      )) || (
                        <span className={styles["language-tag"]}>English</span>
                      )}
                    </div>
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

                <button
                  className={styles["book-button"]}
                  onClick={() => {
                    setSelectedProviderId(provider.$id);
                    setIsModalOpen(true);
                  }}
                >
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

      <AppointmentBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        providerId={selectedProviderId}
        providerList={providerListForModal}
      />
    </div>
  );
}
