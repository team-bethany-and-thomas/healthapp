// services/providerService.ts
import { Client, Databases, Storage, Query } from "appwrite";

// Types
export interface Doctor {
  $id: string;
  provider_id: number;
  first_name: string;
  last_name: string;
  gender: string;
  specialty: string;
  city: string;
  state: string;
  zipcode: string;
  phone: string;
  availability: string;
  availability_start: string;
  availability_end: string;
  availability_day: number[];
  weekend_available: boolean;
  weekend_start: string;
  weekend_end: string;
  bio: string;
  profile_picture_id: string;
  is_accepting_patients: boolean;
  language_spoken: string;
  education: string;
  rating: number;
  practice_name: string;
  appointments?: {
    $id: string;
    date: string;
    start_time: string;
    length_minutes: number;
  }[]; // Relationship field
  // Computed fields for compatibility
  name?: string;
  location?: string;
  languages_spoken?: string[];
  zip?: string;
}

export interface SearchFilters {
  searchTerm?: string;
  selectedSpecialty?: string;
  weekendFilter?: boolean | null;
  city?: string;
  state?: string;
}

// Appwrite configuration using environment variables
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);
const storage = new Storage(client);

// Environment variables for Appwrite configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID!;
const PROVIDERS_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_BUCKET_ID!;

class ProviderService {
  // Fetch doctors with optional filters
  async fetchDoctors(filters: SearchFilters = {}): Promise<Doctor[]> {
    try {
      // Build queries based on filters
      const queries: string[] = [];

      // Search by name (first_name or last_name), specialty, city, or zipcode
      if (filters.searchTerm) {
        // Try to search in multiple fields - Appwrite will handle OR logic
        try {
          // Search in first_name, last_name, specialty, city, and zipcode
          queries.push(Query.or([
            Query.contains("first_name", filters.searchTerm),
            Query.contains("last_name", filters.searchTerm),
            Query.contains("specialty", filters.searchTerm),
            Query.contains("city", filters.searchTerm),
            Query.contains("zipcode", filters.searchTerm)
          ]));
        } catch {
          // Fallback to simple search if OR is not supported
          queries.push(Query.contains("specialty", filters.searchTerm));
        }
      }

      if (filters.selectedSpecialty) {
        queries.push(Query.equal("specialty", filters.selectedSpecialty));
      }

      if (filters.weekendFilter !== null && filters.weekendFilter !== undefined) {
        queries.push(Query.equal("weekend_available", filters.weekendFilter));
      }

      if (filters.city) {
        queries.push(Query.equal("city", filters.city));
      }

      if (filters.state) {
        queries.push(Query.equal("state", filters.state));
      }

      // Only show providers accepting patients
      queries.push(Query.equal("is_accepting_patients", true));

      // Add limit to ensure we get all doctors (default is 25)
      queries.push(Query.limit(50));

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      return response.documents as unknown as Doctor[];
    } catch (error) {
      console.error("Error fetching doctors:", error);
      throw new Error("Failed to fetch doctors. Please try again.");
    }
  }

  // Fetch all doctors without filters
  async fetchAllDoctors(): Promise<Doctor[]> {
    return this.fetchDoctors();
  }

  // Search doctors by name or specialty
  async searchDoctors(query: string): Promise<Doctor[]> {
    return this.fetchDoctors({ searchTerm: query });
  }

  // Get doctors by specialty
  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    return this.fetchDoctors({ selectedSpecialty: specialty });
  }

  // Get top rated doctors (random selection for now)
  async getTopRatedDoctors(limit: number = 5): Promise<Doctor[]> {
    try {
      const allDoctors = await this.fetchAllDoctors();
      
      // Sort by rating if available, otherwise return random selection
      const sortedDoctors = allDoctors.sort((a, b) => {
        const ratingA = a.rating || 4.5;
        const ratingB = b.rating || 4.5;
        return ratingB - ratingA;
      });

      return sortedDoctors.slice(0, limit);
    } catch (error) {
      console.error("Error fetching top rated doctors:", error);
      throw new Error("Failed to fetch top rated doctors.");
    }
  }

  // Get profile image URL
  getProfileImageUrl(profilePictureId: string): string {
    if (!profilePictureId) {
      return "/default-avatar.svg"; // Fallback image
    }

    try {
      return storage
        .getFilePreview(
          PROVIDERS_BUCKET_ID,
          profilePictureId,
          300, // width
          300, // height
          undefined, // gravity
          85, // quality
          0, // borderWidth
          "000000", // borderColor
          0, // borderRadius
          1, // opacity
          0, // rotation
          "ffffff" // background
        )
        .toString();
    } catch (error) {
      console.error("Error getting image URL:", error);
      return "/default-avatar.svg";
    }
  }

  // Get available specialties (you might want to make this configurable)
  getSpecialties(): string[] {
    return [
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
  }

  // Convert backend doctor format to frontend format if needed
  transformDoctorData(doctor: Doctor): Doctor {
    return {
      ...doctor,
      // Add computed fields for compatibility
      name: `${doctor.first_name} ${doctor.last_name}`.trim(),
      location: `${doctor.city}, ${doctor.state}`,
      zip: doctor.zipcode,
      languages_spoken: doctor.language_spoken ? [doctor.language_spoken] : ['English'],
      // Ensure all required fields have defaults
      first_name: doctor.first_name || '',
      last_name: doctor.last_name || '',
      city: doctor.city || '',
      state: doctor.state || '',
      rating: doctor.rating || 4.5,
      appointments: doctor.appointments || [],
    };
  }
}

// Create singleton instance
export const providerService = new ProviderService();

// Custom hooks for React components
import { useState, useEffect } from 'react';

export const useProviders = (filters: SearchFilters = {}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await providerService.fetchDoctors(filters);
        const transformedDoctors = result.map(doctor => providerService.transformDoctorData(doctor));
        setDoctors(transformedDoctors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    filters.searchTerm,
    filters.selectedSpecialty,
    filters.weekendFilter,
    filters.city,
    filters.state,
  ]);

  return { doctors, loading, error };
};

export const useTopRatedDoctors = (limit: number = 5) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await providerService.getTopRatedDoctors(limit);
        const transformedDoctors = result.map(doctor => providerService.transformDoctorData(doctor));
        setDoctors(transformedDoctors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [limit]);

  return { doctors, loading, error };
};
