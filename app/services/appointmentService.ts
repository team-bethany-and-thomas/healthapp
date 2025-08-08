import { Client, Databases, Query } from "appwrite";

// Types for Appointment Types
export interface AppointmentType {
  $id: string;
  appointment_type_id: number;
  description: string;
  duration_minutes: number;
  base_cost: number;
  created_at: string;
  is_activate: boolean;
  type_name: string;
  appointments?: Appointment[]; // Relationship field
}

// Types for Appointments
export interface Appointment {
  $id: string;
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
  provider_id: number;
  language_spoken: string;
  education: string;
  rating: number;
  practice_name: string;
  // Computed fields for compatibility
  name?: string;
  location?: string;
  languages_spoken?: string[];
  zip?: string;
}

export interface AppointmentFilters {
  searchTerm?: string;
  appointmentTypeId?: number;
  specialty?: string;
  city?: string;
  state?: string;
  weekendAvailable?: boolean | null;
  providerId?: number;
  isAcceptingPatients?: boolean;
}

export interface AppointmentTypeFilters {
  searchTerm?: string;
  isActive?: boolean;
  minDuration?: number;
  maxDuration?: number;
  maxCost?: number;
}

// Appwrite configuration using environment variables
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

// Environment variables for Appwrite configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPOINTMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!;
const APPOINTMENT_TYPES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENT_TYPES_COLLECTION_ID!;

class AppointmentService {
  // ===== APPOINTMENT TYPES METHODS =====

  // Fetch appointment types with optional filters
  async fetchAppointmentTypes(filters: AppointmentTypeFilters = {}): Promise<AppointmentType[]> {
    try {
      const queries: string[] = [];

      // Search by description or type_name
      if (filters.searchTerm) {
        try {
          queries.push(Query.or([
            Query.contains("description", filters.searchTerm),
            Query.contains("type_name", filters.searchTerm)
          ]));
        } catch {
          // Fallback to simple search if OR is not supported
          queries.push(Query.contains("description", filters.searchTerm));
        }
      }

      // Filter by active status
      if (filters.isActive !== undefined) {
        queries.push(Query.equal("is_activate", filters.isActive));
      }

      // Filter by duration range
      if (filters.minDuration) {
        queries.push(Query.greaterThanEqual("duration_minutes", filters.minDuration));
      }

      if (filters.maxDuration) {
        queries.push(Query.lessThanEqual("duration_minutes", filters.maxDuration));
      }

      // Filter by maximum cost
      if (filters.maxCost) {
        queries.push(Query.lessThanEqual("base_cost", filters.maxCost));
      }

      // Add limit and ordering
      queries.push(Query.limit(100));
      queries.push(Query.orderAsc("duration_minutes"));

      const response = await databases.listDocuments(
        DATABASE_ID,
        APPOINTMENT_TYPES_COLLECTION_ID,
        queries
      );

      return response.documents as unknown as AppointmentType[];
    } catch (error) {
      console.error("Error fetching appointment types:", error);
      throw new Error("Failed to fetch appointment types. Please try again.");
    }
  }

  // Get all active appointment types
  async getActiveAppointmentTypes(): Promise<AppointmentType[]> {
    return this.fetchAppointmentTypes({ isActive: true });
  }

  // Get appointment type by ID
  async getAppointmentTypeById(appointmentTypeId: number): Promise<AppointmentType | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        APPOINTMENT_TYPES_COLLECTION_ID,
        [Query.equal("appointment_type_id", appointmentTypeId)]
      );

      return response.documents.length > 0 ? response.documents[0] as unknown as AppointmentType : null;
    } catch (error) {
      console.error("Error fetching appointment type by ID:", error);
      throw new Error("Failed to fetch appointment type.");
    }
  }

  // Search appointment types by name or description
  async searchAppointmentTypes(query: string): Promise<AppointmentType[]> {
    return this.fetchAppointmentTypes({ searchTerm: query });
  }

  // Get appointment types by duration range
  async getAppointmentTypesByDuration(minDuration: number, maxDuration?: number): Promise<AppointmentType[]> {
    return this.fetchAppointmentTypes({ 
      minDuration, 
      maxDuration,
      isActive: true 
    });
  }

  // ===== APPOINTMENTS METHODS =====

  // Fetch appointments with optional filters
  async fetchAppointments(filters: AppointmentFilters = {}): Promise<Appointment[]> {
    try {
      const queries: string[] = [];

      // Search by name, specialty, city, or zipcode
      if (filters.searchTerm) {
        try {
          queries.push(Query.or([
            Query.contains("first_name", filters.searchTerm),
            Query.contains("last_name", filters.searchTerm),
            Query.contains("specialty", filters.searchTerm),
            Query.contains("city", filters.searchTerm),
            Query.contains("zipcode", filters.searchTerm),
            Query.contains("practice_name", filters.searchTerm)
          ]));
        } catch {
          // Fallback to simple search if OR is not supported
          queries.push(Query.contains("specialty", filters.searchTerm));
        }
      }

      if (filters.specialty) {
        queries.push(Query.equal("specialty", filters.specialty));
      }

      if (filters.city) {
        queries.push(Query.equal("city", filters.city));
      }

      if (filters.state) {
        queries.push(Query.equal("state", filters.state));
      }

      if (filters.weekendAvailable !== null && filters.weekendAvailable !== undefined) {
        queries.push(Query.equal("weekend_available", filters.weekendAvailable));
      }

      if (filters.providerId) {
        queries.push(Query.equal("provider_id", filters.providerId));
      }

      // Filter by accepting patients status (default to true)
      if (filters.isAcceptingPatients !== false) {
        queries.push(Query.equal("is_accepting_patients", true));
      }

      // Add limit to ensure we get all appointments
      queries.push(Query.limit(100));
      queries.push(Query.orderDesc("rating"));

      const response = await databases.listDocuments(
        DATABASE_ID,
        APPOINTMENTS_COLLECTION_ID,
        queries
      );

      return response.documents as unknown as Appointment[];
    } catch (error) {
      console.error("Error fetching appointments:", error);
      throw new Error("Failed to fetch appointments. Please try again.");
    }
  }

  // Get all appointments
  async getAllAppointments(): Promise<Appointment[]> {
    return this.fetchAppointments();
  }

  // Search appointments by provider name or specialty
  async searchAppointments(query: string): Promise<Appointment[]> {
    return this.fetchAppointments({ searchTerm: query });
  }

  // Get appointments by specialty
  async getAppointmentsBySpecialty(specialty: string): Promise<Appointment[]> {
    return this.fetchAppointments({ specialty });
  }

  // Get appointments by provider ID
  async getAppointmentsByProvider(providerId: number): Promise<Appointment[]> {
    return this.fetchAppointments({ providerId });
  }

  // Get appointments by location
  async getAppointmentsByLocation(city: string, state?: string): Promise<Appointment[]> {
    return this.fetchAppointments({ city, state });
  }

  // Get weekend available appointments
  async getWeekendAppointments(): Promise<Appointment[]> {
    return this.fetchAppointments({ weekendAvailable: true });
  }

  // ===== UTILITY METHODS =====

  // Get available specialties from appointments
  async getAvailableSpecialties(): Promise<string[]> {
    try {
      const appointments = await this.getAllAppointments();
      const specialties = [...new Set(appointments.map(apt => apt.specialty).filter(Boolean))];
      return specialties.sort();
    } catch (error) {
      console.error("Error fetching specialties:", error);
      // Return default specialties as fallback
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
  }

  // Get available cities from appointments
  async getAvailableCities(): Promise<string[]> {
    try {
      const appointments = await this.getAllAppointments();
      const cities = [...new Set(appointments.map(apt => apt.city).filter(Boolean))];
      return cities.sort();
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  }

  // Transform appointment data for frontend compatibility
  transformAppointmentData(appointment: Appointment): Appointment {
    return {
      ...appointment,
      // Add computed fields for compatibility
      name: `${appointment.first_name} ${appointment.last_name}`.trim(),
      location: `${appointment.city}, ${appointment.state}`,
      zip: appointment.zipcode,
      languages_spoken: appointment.language_spoken ? [appointment.language_spoken] : ['English'],
      // Ensure all required fields have defaults
      first_name: appointment.first_name || '',
      last_name: appointment.last_name || '',
      city: appointment.city || '',
      state: appointment.state || '',
      rating: appointment.rating || 4.5,
    };
  }

  // Format appointment type for display
  formatAppointmentType(appointmentType: AppointmentType): string {
    return `${appointmentType.type_name} (${appointmentType.duration_minutes} mins)`;
  }

  // Get appointment type options for dropdowns
  async getAppointmentTypeOptions(): Promise<{ value: number; label: string; duration: number; cost: number }[]> {
    try {
      const appointmentTypes = await this.getActiveAppointmentTypes();
      return appointmentTypes.map(type => ({
        value: type.appointment_type_id,
        label: this.formatAppointmentType(type),
        duration: type.duration_minutes,
        cost: type.base_cost
      }));
    } catch (error) {
      console.error("Error fetching appointment type options:", error);
      return [];
    }
  }
}

// Create singleton instance
export const appointmentService = new AppointmentService();

// Custom hooks for React components
import { useState, useEffect } from 'react';

export const useAppointments = (filters: AppointmentFilters = {}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await appointmentService.fetchAppointments(filters);
        const transformedAppointments = result.map(appointment => 
          appointmentService.transformAppointmentData(appointment)
        );
        setAppointments(transformedAppointments);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    filters.searchTerm,
    filters.appointmentTypeId,
    filters.specialty,
    filters.city,
    filters.state,
    filters.weekendAvailable,
    filters.providerId,
    filters.isAcceptingPatients,
  ]);

  return { appointments, loading, error };
};

export const useAppointmentTypes = (filters: AppointmentTypeFilters = {}) => {
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await appointmentService.fetchAppointmentTypes(filters);
        setAppointmentTypes(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    filters.searchTerm,
    filters.isActive,
    filters.minDuration,
    filters.maxDuration,
    filters.maxCost,
  ]);

  return { appointmentTypes, loading, error };
};

export const useAppointmentTypeOptions = () => {
  const [options, setOptions] = useState<{ value: number; label: string; duration: number; cost: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await appointmentService.getAppointmentTypeOptions();
        setOptions(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { options, loading, error };
};