import { Client, Databases, Query, ID } from "appwrite";

export interface AppointmentBooking {
  $id: string;
  appointment_id: number;
  patient_id: number;
  provider_id: number;
  appointment_type_id: number;
  appointment_date: string; // Datetime in your schema
  appointment_time: string; // Datetime in your schema
  status:
    | "pending"
    | "confirmed"
    | "cancelled"
    | "completed"
    | "rescheduled"
    | "no_show";
  reason_for_visit: string;
  notes?: string;
  created_at: string; // Datetime
  updated_at: string; // Datetime
  // Relationship fields (if configured)
  provider?: {
    $id: string;
    first_name: string;
    last_name: string;
    specialty: string;
    practice_name: string;
    phone: string;
  };
  appointment_type?: {
    type_name: string;
    duration_minutes: number;
    base_cost: number;
  };
}

export interface CreateAppointmentData {
  patient_id: number;
  provider_id: number;
  appointment_type_id: number;
  appointment_date: string;
  appointment_time: string;
  reason_for_visit: string;
  notes?: string;
}

export interface UpdateAppointmentData {
  appointment_date?: string;
  appointment_time?: string;
  appointment_type_id?: number;
  reason_for_visit?: string;
  notes?: string;
  status?:
    | "pending"
    | "confirmed"
    | "cancelled"
    | "completed"
    | "rescheduled"
    | "no_show";
}

// Appwrite configuration using environment variables
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

// Environment variables for Appwrite configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPOINTMENTS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!;

class AppointmentBookingService {
  // ===== CREATE APPOINTMENT =====
  async createAppointment(
    appointmentData: CreateAppointmentData
  ): Promise<AppointmentBooking> {
    try {
      const now = new Date().toISOString();

      // Combine date and time for the datetime fields
      const appointmentDateTime = new Date(
        `${appointmentData.appointment_date}T${appointmentData.appointment_time}`
      ).toISOString();

      const documentData = {
        appointment_id: Date.now(), // Generate unique ID
        patient_id: appointmentData.patient_id,
        provider_id: appointmentData.provider_id,
        appointment_type_id: appointmentData.appointment_type_id,
        appointment_date: appointmentDateTime,
        appointment_time: appointmentDateTime,
        status: "pending", // Default status
        reason_for_visit: appointmentData.reason_for_visit,
        notes: appointmentData.notes || "",
        created_at: now,
        updated_at: now,
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        APPOINTMENTS_COLLECTION_ID,
        ID.unique(),
        documentData
      );

      return response as unknown as AppointmentBooking;
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw new Error("Failed to create appointment. Please try again.");
    }
  }

  // ===== GET APPOINTMENTS =====
  async getPatientAppointments(
    patientId: number
  ): Promise<AppointmentBooking[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        APPOINTMENTS_COLLECTION_ID,
        [
          Query.equal("patient_id", patientId),
          Query.orderDesc("appointment_date"),
          Query.limit(100),
        ]
      );

      return response.documents as unknown as AppointmentBooking[];
    } catch (error) {
      console.error("Error fetching patient appointments:", error);
      throw new Error("Failed to fetch appointments. Please try again.");
    }
  }

  async getUpcomingAppointments(
    patientId: number
  ): Promise<AppointmentBooking[]> {
    try {
      const now = new Date().toISOString();

      const response = await databases.listDocuments(
        DATABASE_ID,
        APPOINTMENTS_COLLECTION_ID,
        [
          Query.equal("patient_id", patientId),
          Query.greaterThanEqual("appointment_date", now),
          Query.or([
            Query.equal("status", "pending"),
            Query.equal("status", "confirmed"),
            Query.equal("status", "rescheduled"),
          ]),
          Query.orderAsc("appointment_date"),
          Query.limit(50),
        ]
      );

      return response.documents as unknown as AppointmentBooking[];
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
      throw new Error(
        "Failed to fetch upcoming appointments. Please try again."
      );
    }
  }

  async getPastAppointments(patientId: number): Promise<AppointmentBooking[]> {
    try {
      const now = new Date().toISOString();

      const response = await databases.listDocuments(
        DATABASE_ID,
        APPOINTMENTS_COLLECTION_ID,
        [
          Query.equal("patient_id", patientId),
          Query.lessThan("appointment_date", now),
          Query.orderDesc("appointment_date"),
          Query.limit(50),
        ]
      );

      return response.documents as unknown as AppointmentBooking[];
    } catch (error) {
      console.error("Error fetching past appointments:", error);
      throw new Error("Failed to fetch past appointments. Please try again.");
    }
  }

  async getAppointmentById(
    appointmentId: string
  ): Promise<AppointmentBooking | null> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        APPOINTMENTS_COLLECTION_ID,
        appointmentId
      );

      return response as unknown as AppointmentBooking;
    } catch (error) {
      console.error("Error fetching appointment by ID:", error);
      return null;
    }
  }

  // ===== UPDATE APPOINTMENT =====
  async updateAppointment(
    appointmentId: string,
    updateData: UpdateAppointmentData
  ): Promise<AppointmentBooking> {
    try {
      const documentData: {
        updated_at: string;
        appointment_date?: string;
        appointment_time?: string;
        appointment_type_id?: number;
        reason_for_visit?: string;
        notes?: string;
        status?:
          | "pending"
          | "confirmed"
          | "cancelled"
          | "completed"
          | "rescheduled"
          | "no_show";
      } = {
        updated_at: new Date().toISOString(),
      };

      // Handle datetime fields
      if (updateData.appointment_date && updateData.appointment_time) {
        const appointmentDateTime = new Date(
          `${updateData.appointment_date}T${updateData.appointment_time}`
        ).toISOString();
        documentData.appointment_date = appointmentDateTime;
        documentData.appointment_time = appointmentDateTime;
      }

      // Add other fields
      if (updateData.appointment_type_id) {
        documentData.appointment_type_id = updateData.appointment_type_id;
      }
      if (updateData.reason_for_visit) {
        documentData.reason_for_visit = updateData.reason_for_visit;
      }
      if (updateData.notes !== undefined) {
        documentData.notes = updateData.notes;
      }
      if (updateData.status) {
        documentData.status = updateData.status;
      }

      const response = await databases.updateDocument(
        DATABASE_ID,
        APPOINTMENTS_COLLECTION_ID,
        appointmentId,
        documentData
      );

      return response as unknown as AppointmentBooking;
    } catch (error) {
      console.error("Error updating appointment:", error);
      throw new Error("Failed to update appointment. Please try again.");
    }
  }

  // ===== RESCHEDULE APPOINTMENT =====
  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    newAppointmentTypeId?: number
  ): Promise<AppointmentBooking> {
    try {
      const updateData: UpdateAppointmentData = {
        appointment_date: newDate,
        appointment_time: newTime,
        status: "rescheduled", // Mark as rescheduled
      };

      if (newAppointmentTypeId) {
        updateData.appointment_type_id = newAppointmentTypeId;
      }

      return await this.updateAppointment(appointmentId, updateData);
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      throw new Error("Failed to reschedule appointment. Please try again.");
    }
  }

  // ===== CANCEL APPOINTMENT =====
  async cancelAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<AppointmentBooking> {
    try {
      const updateData: UpdateAppointmentData = {
        status: "cancelled",
      };

      if (reason) {
        updateData.notes = reason;
      }

      return await this.updateAppointment(appointmentId, updateData);
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      throw new Error("Failed to cancel appointment. Please try again.");
    }
  }

  // ===== UTILITY METHODS =====

  // Check if appointment can be cancelled (e.g., not within 24 hours)
  canCancelAppointment(appointment: AppointmentBooking): boolean {
    const appointmentDateTime = new Date(appointment.appointment_date);
    const now = new Date();
    const timeDifference = appointmentDateTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 3600);

    return (
      hoursDifference > 24 &&
      (appointment.status === "pending" ||
        appointment.status === "confirmed" ||
        appointment.status === "rescheduled")
    );
  }

  // Check if appointment can be rescheduled
  canRescheduleAppointment(appointment: AppointmentBooking): boolean {
    const appointmentDateTime = new Date(appointment.appointment_date);
    const now = new Date();
    const timeDifference = appointmentDateTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 3600);

    return (
      hoursDifference > 24 &&
      (appointment.status === "pending" || appointment.status === "confirmed")
    );
  }

  // Format appointment for display
  formatAppointmentDateTime(appointment: AppointmentBooking): string {
    const date = new Date(appointment.appointment_date);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Get appointment status badge color
  getStatusBadgeColor(status: string): string {
    switch (status.toLowerCase()) {
      case "pending":
        return "badge-warning";
      case "confirmed":
        return "badge-success";
      case "cancelled":
        return "badge-error";
      case "completed":
        return "badge-info";
      case "rescheduled":
        return "badge-secondary";
      case "no_show":
        return "badge-ghost";
      default:
        return "badge-neutral";
    }
  }

  // Check for appointment conflicts with duration overlap
  async checkAppointmentConflict(
    patientId: number,
    providerId: number,
    appointmentDate: string,
    appointmentTime: string,
    appointmentDuration: number = 30,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      const appointmentDateTime = new Date(
        `${appointmentDate}T${appointmentTime}`
      );
      const appointmentEndTime = new Date(
        appointmentDateTime.getTime() + appointmentDuration * 60000
      );

      // Get all appointments for this provider on this date
      const queries = [
        Query.equal("provider_id", providerId),
        Query.greaterThanEqual(
          "appointment_date",
          `${appointmentDate}T00:00:00.000Z`
        ),
        Query.lessThan("appointment_date", `${appointmentDate}T23:59:59.999Z`),
        Query.notEqual("status", "cancelled"),
        Query.notEqual("status", "no_show"),
      ];

      if (excludeAppointmentId) {
        queries.push(Query.notEqual("$id", excludeAppointmentId));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        APPOINTMENTS_COLLECTION_ID,
        queries
      );

      // Check for time overlaps
      for (const existingAppointment of response.documents) {
        const existingStart = new Date(existingAppointment.appointment_date);
        // Assume 30 minutes if duration not specified
        const existingDuration = 30; // You might want to get this from appointment type
        const existingEnd = new Date(
          existingStart.getTime() + existingDuration * 60000
        );

        // Check if appointments overlap
        const hasOverlap =
          (appointmentDateTime >= existingStart &&
            appointmentDateTime < existingEnd) ||
          (appointmentEndTime > existingStart &&
            appointmentEndTime <= existingEnd) ||
          (appointmentDateTime <= existingStart &&
            appointmentEndTime >= existingEnd);

        if (hasOverlap) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking appointment conflict:", error);
      return false;
    }
  }

  // Get appointment statistics for a patient
  async getAppointmentStats(patientId: number): Promise<{
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
  }> {
    try {
      const allAppointments = await this.getPatientAppointments(patientId);

      return {
        total: allAppointments.length,
        upcoming: allAppointments.filter(
          (apt) =>
            apt.status === "pending" ||
            apt.status === "confirmed" ||
            apt.status === "rescheduled"
        ).length,
        completed: allAppointments.filter((apt) => apt.status === "completed")
          .length,
        cancelled: allAppointments.filter((apt) => apt.status === "cancelled")
          .length,
      };
    } catch (error) {
      console.error("Error getting appointment stats:", error);
      return { total: 0, upcoming: 0, completed: 0, cancelled: 0 };
    }
  }

  // Extract date and time from datetime field for display
  extractDateTime(datetimeString: string): { date: string; time: string } {
    const datetime = new Date(datetimeString);
    return {
      date: datetime.toISOString().split("T")[0], // YYYY-MM-DD
      time: datetime.toTimeString().slice(0, 5), // HH:MM
    };
  }
}

// Create singleton instance
export const appointmentBookingService = new AppointmentBookingService();

// Custom hooks for React components
import { useState, useEffect } from "react";

export const usePatientAppointments = (patientId: number | null) => {
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await appointmentBookingService.getPatientAppointments(
          patientId
        );
        setAppointments(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  const refreshAppointments = async () => {
    if (!patientId) return;

    try {
      setError(null);
      const result = await appointmentBookingService.getPatientAppointments(
        patientId
      );
      setAppointments(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return { appointments, loading, error, refreshAppointments };
};

export const useUpcomingAppointments = (patientId: number | null) => {
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await appointmentBookingService.getUpcomingAppointments(
          patientId
        );
        setAppointments(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  return { appointments, loading, error };
};

export const useAppointmentStats = (patientId: number | null) => {
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) {
        setStats({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await appointmentBookingService.getAppointmentStats(
          patientId
        );
        setStats(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  return { stats, loading, error };
};
