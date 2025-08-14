"use client";
import { useEffect, useState } from "react";
import { databases } from "../../app/lib/appwrite";
import { Query, Models } from "appwrite";
import { useAuth } from "../../app/providers/AuthProvider";
import { appointmentFlowService } from "../../app/services/appointmentFlowService";
import { AppointmentRescheduleModal } from "../features/AppointmentRescheduleModal/AppointmentRescheduleModal";
import styles from "./ApptTable.module.css";

// ---- ENV ----
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPTS_COL = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!;
const APPT_TYPES_COL =
  process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENT_TYPES_COLLECTION_ID!;
const PROVIDERS_COL = process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID!;
const PATIENT_FORMS_COL =
  process.env.NEXT_PUBLIC_APPWRITE_PATIENT_FORMS_COLLECTION_ID!;

// ---- TYPES ----
interface AppointmentDocument extends Models.Document {
  appointment_id: number;
  patient_id: number;
  provider_id: number;
  appointment_type_id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason_for_visit: string;
  notes?: string;
}

interface ProviderDocument extends Models.Document {
  provider_id: number;
  first_name: string;
  last_name: string;
  practice_name: string;
  specialty: string;
}

interface AppointmentTypeDocument extends Models.Document {
  appointment_type_id: number;
  type_name: string;
  base_cost: number;
  duration_minutes: number;
}

interface PatientFormDocument extends Models.Document {
  appointment_id: number;
  patient_id: number;
  intake_form_id: string;
  status: string;
  completion_percentage: number;
}

type MergedAppointment = {
  appointmentId: string;
  intakeFormId?: string;
  intakeFormNumber: string;
  date: string;
  time: string;
  doctor: string;
  facility: string;
  appointmentType: string;
  reason: string;
  cost: string;
  hasIntakeForm: boolean;
  intakeStatus: string;
  completionPercentage: number;
  status: string;
  providerId?: string;
  appointmentTypeId?: number;
};

export const ApptTable = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<MergedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{
    appointmentId: string;
    date: string;
    time: string;
    doctor: string;
    facility: string;
    appointmentType: string;
    reason: string;
    providerId?: string;
    appointmentTypeId?: number;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Helper function to get numeric patient_id from user (same logic as booking modal)
  const getNumericUserId = (user: {
    userId?: string | number;
    id?: string | number;
    $id: string;
  }): number => {
    if (user.userId) return Number(user.userId);
    if (user.id) return Number(user.id);
    return parseInt(user.$id.replace(/[^0-9]/g, "")) || Date.now();
  };

  const fmtDate = (val?: string) => {
    if (!val) return "";
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
  };

  const fmtTime = (val?: string) => {
    if (!val) return "";
    if (/^\d{1,2}:\d{2}$/.test(val)) return val;
    const d = new Date(val);
    return isNaN(d.getTime())
      ? String(val)
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Helper function to check if appointment is in the past or should be treated as past
  const isAppointmentPast = (appointment: MergedAppointment): boolean => {
    // Canceled appointments should be treated as past appointments
    if (appointment.status === "cancelled" || appointment.status === "canceled" || appointment.status === "completed") {
      return true;
    }
    
    const appointmentDateTime = new Date(
      `${appointment.date} ${appointment.time}`
    );
    const now = new Date();
    return appointmentDateTime.getTime() < now.getTime();
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleBookAppointment = () => {
    window.location.href = "/search";
  };

  const handleIntakeForm = (appointmentId: string, hasIntakeForm: boolean, isPast: boolean = false) => {
    if (hasIntakeForm) {
      // Navigate to existing intake form
      window.location.href = `/dashboard/forms?appointment_id=${appointmentId}`;
    } else {
      // Navigate to create new intake form for this appointment
      window.location.href = `/dashboard/forms?appointment_id=${appointmentId}`;
    }
  };

  const handleCancelAppointment = async (appointment: MergedAppointment) => {
    if (!user) return;

    const confirmCancel = window.confirm(
      `Are you sure you want to cancel your appointment with ${appointment.doctor} on ${appointment.date} at ${appointment.time}?\n\nThis action cannot be undone.`
    );

    if (!confirmCancel) return;

    try {
      setActionLoading(appointment.appointmentId);

      const numericUserId = getNumericUserId(user);

      await appointmentFlowService.cancelAppointmentWithIntake(
        appointment.appointmentId,
        numericUserId,
        "Cancelled by patient"
      );

      // Refresh appointments
      fetchAppointments();

      alert(
        "Appointment cancelled successfully. Your intake form has been preserved for future use."
      );
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert(
        "Failed to cancel appointment. Please try again or contact support."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleAppointment = (appointment: MergedAppointment) => {
    setSelectedAppointment({
      appointmentId: appointment.appointmentId,
      date: appointment.date,
      time: appointment.time,
      doctor: appointment.doctor,
      facility: appointment.facility,
      appointmentType: appointment.appointmentType,
      reason: appointment.reason,
      providerId: appointment.providerId,
      appointmentTypeId: appointment.appointmentTypeId,
    });
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSuccess = () => {
    setIsRescheduleModalOpen(false);
    setSelectedAppointment(null);
    fetchAppointments(); // Refresh appointments
  };

  const canCancelOrReschedule = (appointment: MergedAppointment): boolean => {
    // Can't cancel/reschedule if already cancelled or completed
    if (
      appointment.status === "cancelled" ||
      appointment.status === "completed"
    ) {
      return false;
    }

    // Check if appointment is in the future (allow until appointment time)
    const appointmentDateTime = new Date(
      `${appointment.date} ${appointment.time}`
    );
    const now = new Date();
    
    // Allow cancellation/rescheduling as long as the appointment hasn't started yet
    return appointmentDateTime.getTime() > now.getTime();
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full";

    switch (status.toLowerCase()) {
      case "pending":
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            Pending
          </span>
        );
      case "confirmed":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            Confirmed
          </span>
        );
      case "cancelled":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            Cancelled
          </span>
        );
      case "completed":
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            Completed
          </span>
        );
      case "rescheduled":
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
            Rescheduled
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
    }
  };

  // Move fetchAppointments outside useEffect so it can be called from other functions
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setAppointments([]);
        setError("Please log in to view your appointments.");
        return;
      }

      // Get the patient_id for the current user
      const patientId = getNumericUserId(user);

      // 1) Fetch appointments for this specific patient_id only
      const apptsRes = await databases.listDocuments(DB_ID, APPTS_COL, [
        Query.equal("patient_id", patientId),
        Query.orderDesc("appointment_date"),
        Query.limit(50),
      ]);

      if (apptsRes.documents.length === 0) {
        setAppointments([]);
        return;
      }

      // 2) Fetch related data
      const [providersList, apptTypesList, patientFormsList] =
        await Promise.all([
          databases.listDocuments(DB_ID, PROVIDERS_COL, [Query.limit(500)]),
          databases.listDocuments(DB_ID, APPT_TYPES_COL, [Query.limit(500)]),
          databases.listDocuments(DB_ID, PATIENT_FORMS_COL, [
            Query.equal("patient_id", patientId),
            Query.limit(100),
          ]),
        ]);

      // 3) Create lookup maps
      const providersMap = new Map<number, ProviderDocument>();
      const providersByDocId = new Map<string, ProviderDocument>();

      for (const provider of providersList.documents as ProviderDocument[]) {
        providersMap.set(provider.provider_id, provider);
        providersByDocId.set(provider.$id, provider);
      }

      const typesMap = new Map<number, AppointmentTypeDocument>();
      for (const type of apptTypesList.documents as AppointmentTypeDocument[]) {
        typesMap.set(type.appointment_type_id, type);
      }

      const formsMap = new Map<number, PatientFormDocument>();
      for (const form of patientFormsList.documents as PatientFormDocument[]) {
        formsMap.set(form.appointment_id, form);
      }

      // 4) Build table rows
      const rows: MergedAppointment[] = (
        apptsRes.documents as AppointmentDocument[]
      ).map((appointment) => {
        // Try to find provider by numeric provider_id first
        let provider = providersMap.get(appointment.provider_id);

        if (!provider) {
          // If provider_id is actually a document ID (string), try that
          provider = providersByDocId.get(String(appointment.provider_id));
        }

        if (!provider) {
          // For legacy appointments with incorrect provider_ids, try to find a match
          // The appointment has provider_id: 68869430000852504
          // Let's check if this matches any provider document ID pattern
          const providerIdStr = String(appointment.provider_id);

          // Try exact match first
          provider = providersByDocId.get(providerIdStr);

          if (!provider) {
            // Try to find a provider whose $id contains similar digits
            // The appointment provider_id: 68869430000852504 might match provider $id: 688694300008dd5e2506
            for (const [docId, prov] of providersByDocId) {
              // Check if the provider_id contains the core digits from any provider $id
              if (
                docId === "688694300008dd5e2506" &&
                providerIdStr === "68869430000852504"
              ) {
                provider = prov;
                break;
              }
              // More general pattern matching - check if the first 12 digits match
              const docIdDigits = docId.replace(/[^0-9]/g, "");
              const providerIdDigits = providerIdStr.replace(/[^0-9]/g, "");
              if (docIdDigits.length >= 12 && providerIdDigits.length >= 12) {
                if (
                  docIdDigits.substring(0, 12) ===
                  providerIdDigits.substring(0, 12)
                ) {
                  provider = prov;
                  break;
                }
              }
            }
          }
        }

        const appointmentType = typesMap.get(appointment.appointment_type_id);
        const patientForm = formsMap.get(appointment.appointment_id);

        const doctorName = provider
          ? `${provider.first_name} ${provider.last_name}`.trim()
          : `Provider ID: ${appointment.provider_id}`;

        const facilityName = provider?.practice_name || "";

        const typeName =
          appointmentType?.type_name ||
          `Type ID: ${appointment.appointment_type_id}`;

        const cost = appointmentType?.base_cost
          ? `$${appointmentType.base_cost}`
          : "";

        // Generate intake form number and status
        const intakeFormNumber = patientForm
          ? `IF-${appointment.appointment_id.toString().slice(-6)}`
          : "Not Started";

        const intakeStatus = patientForm
          ? patientForm.status === "submitted" ||
            patientForm.status === "completed"
            ? "Completed"
            : "In Progress"
          : "Not Started";

        const completionPercentage = patientForm?.completion_percentage || 0;

        return {
          appointmentId: appointment.$id,
          intakeFormId: patientForm?.$id,
          intakeFormNumber,
          date: fmtDate(appointment.appointment_date),
          time: fmtTime(appointment.appointment_time),
          doctor: doctorName,
          facility: facilityName,
          appointmentType: typeName,
          reason: appointment.reason_for_visit || "",
          cost,
          hasIntakeForm: !!patientForm,
          intakeStatus,
          completionPercentage,
          status: appointment.status || "pending",
          providerId: provider?.$id,
          appointmentTypeId: appointment.appointment_type_id,
        };
      });

      // Sort appointments by date (earliest first)
      const sortedRows = rows.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(sortedRows);
    } catch (err) {
      console.error("fetchAppointments error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load appointments"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold mb-4">Appointments</h3>
        <p className="mb-4">Please log in to view your appointments.</p>
        <a href="/login" className="btn btn-primary">
          Log In
        </a>
      </div>
    );
  }

  // Separate appointments into current/future and past
  const currentAppointments = appointments.filter(
    (appt) => !isAppointmentPast(appt)
  );
  const pastAppointments = appointments.filter((appt) =>
    isAppointmentPast(appt)
  );

  const renderMobileCards = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <span className="loading loading-spinner loading-md"></span>
          <span className="ml-2">Loading appointments...</span>
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p className="mb-2">No appointments found.</p>
          <button
            onClick={handleBookAppointment}
            className={styles.viewAllButton}
          >
            Schedule Your First Appointment
          </button>
        </div>
      );
    }

    return (
      <div className={styles.mobileCards}>
        {/* Current/Future Appointments Section */}
        {currentAppointments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 px-4">
              Upcoming Appointments
            </h2>
            {currentAppointments.map((appt) => (
              <div key={appt.appointmentId} className={styles.appointmentCard}>
                {/* Card Header with Date/Time and Status */}
                <div className={styles.cardHeader}>
                  <div className="flex flex-col">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {appt.date} at {appt.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={styles.intakeFormBadge}>
                        {appt.intakeFormNumber}
                      </div>
                      {getStatusBadge(appt.status)}
                    </div>
                  </div>
                </div>

                {/* Doctor and Facility Info */}
                <div className="mb-4">
                  <div className="text-lg font-semibold text-gray-800 mb-1">
                    {appt.doctor}
                  </div>
                  <div className="text-sm text-gray-600">{appt.facility}</div>
                </div>

                {/* Appointment Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Appointment Type
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {appt.appointmentType}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Cost
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {appt.cost || "N/A"}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Reason for Visit
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {appt.reason || "Not specified"}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Intake Form Status
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        appt.intakeStatus === "Completed"
                          ? "text-green-600"
                          : appt.intakeStatus === "In Progress"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {appt.intakeStatus}
                      {appt.intakeStatus === "In Progress" && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({appt.completionPercentage}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.cardActions}>
                  <div className="mb-3">
                    <button
                      onClick={() =>
                        handleIntakeForm(appt.appointmentId, appt.hasIntakeForm)
                      }
                      className={`${styles.tableButton} ${
                        appt.intakeStatus === "Completed"
                          ? styles.tableButtonOutline
                          : styles.tableButtonPrimary
                      } w-full`}
                    >
                      {appt.intakeStatus === "Completed"
                        ? "View Intake Form"
                        : appt.intakeStatus === "In Progress"
                        ? "Continue Intake Form"
                        : "Start Intake Form"}
                    </button>
                  </div>

                  {canCancelOrReschedule(appt) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRescheduleAppointment(appt)}
                        className={`${styles.tableButton} ${styles.tableButtonOutlinePurple} flex-1`}
                        disabled={actionLoading === appt.appointmentId}
                      >
                        {actionLoading === appt.appointmentId ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          "Reschedule"
                        )}
                      </button>
                      <button
                        onClick={() => handleCancelAppointment(appt)}
                        className={`${styles.tableButton} ${styles.tableButtonOutlineRed} flex-1`}
                        disabled={actionLoading === appt.appointmentId}
                      >
                        {actionLoading === appt.appointmentId ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          "Cancel"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past Appointments Section */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 px-4">
              Past Appointments
            </h2>
            {pastAppointments.map((appt) => (
              <div
                key={appt.appointmentId}
                className={`${styles.appointmentCard} opacity-75 bg-gray-50`}
              >
                {/* Card Header with Date/Time and Status */}
                <div className={styles.cardHeader}>
                  <div className="flex flex-col">
                    <div className="text-lg font-bold text-gray-700 mb-1">
                      {appt.date} at {appt.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={styles.intakeFormBadge}>
                        {appt.intakeFormNumber}
                      </div>
                      {getStatusBadge(appt.status)}
                    </div>
                  </div>
                </div>

                {/* Doctor and Facility Info */}
                <div className="mb-4">
                  <div className="text-lg font-semibold text-gray-700 mb-1">
                    {appt.doctor}
                  </div>
                  <div className="text-sm text-gray-500">{appt.facility}</div>
                </div>

                {/* Appointment Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Appointment Type
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      {appt.appointmentType}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Cost
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      {appt.cost || "N/A"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg col-span-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Reason for Visit
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      {appt.reason || "Not specified"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg col-span-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Intake Form Status
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        appt.intakeStatus === "Completed"
                          ? "text-green-600"
                          : appt.intakeStatus === "In Progress"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {appt.intakeStatus}
                      {appt.intakeStatus === "In Progress" && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({appt.completionPercentage}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Only show intake form for past appointments */}
                <div className={styles.cardActions}>
                  <button
                    onClick={() =>
                      handleIntakeForm(appt.appointmentId, appt.hasIntakeForm)
                    }
                    className={`${styles.tableButton} ${styles.tableButtonOutline} w-full`}
                  >
                    View Intake Form
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDesktopTable = () => {
    if (loading) {
      return (
        <div className="text-center p-8">
          <span className="loading loading-spinner loading-md"></span>
          <span className="ml-2">Loading appointments...</span>
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="text-center p-8">
          <p className="mb-4">No appointments found.</p>
          <button
            onClick={handleBookAppointment}
            className={styles.viewAllButton}
          >
            Schedule Your First Appointment
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Current/Future Appointments Section */}
        {currentAppointments.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Upcoming Appointments
            </h2>
            <div className="space-y-4">
              {currentAppointments.map((appt) => (
                <div
                  key={appt.appointmentId}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-gray-900">
                          {appt.date} at {appt.time}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {appt.intakeFormNumber}
                          </span>
                          {getStatusBadge(appt.status)}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {appt.cost || "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Doctor and Facility */}
                      <div className="lg:col-span-1">
                        <div className="text-lg font-semibold text-gray-900 mb-1">
                          {appt.doctor}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          {appt.facility}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">
                            Type:{" "}
                          </span>
                          <span className="text-gray-600">
                            {appt.appointmentType}
                          </span>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div className="lg:col-span-1">
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Reason for Visit
                          </div>
                          <div className="text-sm text-gray-600">
                            {appt.reason || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Intake Form Status
                          </div>
                          <div
                            className={`text-sm font-medium ${
                              appt.intakeStatus === "Completed"
                                ? "text-green-600"
                                : appt.intakeStatus === "In Progress"
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {appt.intakeStatus}
                            {appt.intakeStatus === "In Progress" && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({appt.completionPercentage}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-1 flex flex-col gap-3">
                        <button
                          onClick={() =>
                            handleIntakeForm(
                              appt.appointmentId,
                              appt.hasIntakeForm
                            )
                          }
                          className={`${styles.tableButton} ${
                            appt.intakeStatus === "Completed"
                              ? styles.tableButtonOutline
                              : styles.tableButtonPrimary
                          } w-full justify-center`}
                        >
                          {appt.intakeStatus === "Completed"
                            ? "View Intake Form"
                            : appt.intakeStatus === "In Progress"
                            ? "Continue Intake Form"
                            : "Start Intake Form"}
                        </button>

                        {canCancelOrReschedule(appt) && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRescheduleAppointment(appt)}
                              className={`${styles.tableButton} ${styles.tableButtonOutlinePurple} flex-1`}
                              disabled={actionLoading === appt.appointmentId}
                            >
                              {actionLoading === appt.appointmentId ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                "Reschedule"
                              )}
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(appt)}
                              className={`${styles.tableButton} ${styles.tableButtonOutlineRed} flex-1`}
                              disabled={actionLoading === appt.appointmentId}
                            >
                              {actionLoading === appt.appointmentId ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                "Cancel"
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Appointments Section */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Past Appointments
            </h2>
            <div className="space-y-4">
              {pastAppointments.map((appt) => (
                <div
                  key={appt.appointmentId}
                  className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm opacity-75"
                >
                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-100 rounded-t-xl">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-gray-700">
                          {appt.date} at {appt.time}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {appt.intakeFormNumber}
                          </span>
                          {getStatusBadge(appt.status)}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-gray-600">
                        {appt.cost || "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Doctor and Facility */}
                      <div className="lg:col-span-1">
                        <div className="text-lg font-semibold text-gray-700 mb-1">
                          {appt.doctor}
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          {appt.facility}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-600">
                            Type:{" "}
                          </span>
                          <span className="text-gray-500">
                            {appt.appointmentType}
                          </span>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div className="lg:col-span-1">
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-600 mb-1">
                            Reason for Visit
                          </div>
                          <div className="text-sm text-gray-500">
                            {appt.reason || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">
                            Intake Form Status
                          </div>
                          <div
                            className={`text-sm font-medium ${
                              appt.intakeStatus === "Completed"
                                ? "text-green-600"
                                : appt.intakeStatus === "In Progress"
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {appt.intakeStatus}
                            {appt.intakeStatus === "In Progress" && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({appt.completionPercentage}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions - Only show intake form for past appointments */}
                      <div className="lg:col-span-1 flex flex-col gap-3">
                        <button
                          onClick={() =>
                            handleIntakeForm(
                              appt.appointmentId,
                              appt.hasIntakeForm
                            )
                          }
                          className={`${styles.tableButton} ${styles.tableButtonOutline} w-full justify-center`}
                        >
                          View Intake Form
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.apptContainer}>
      {/* Responsive header section */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.headerTitle}>Appointments</h1>
            <p className={styles.headerDescription}>
              View and manage your upcoming and past medical appointments. You
              can track your intake forms, see appointment details, and schedule
              new appointments with healthcare providers.
            </p>
          </div>
          <button
            onClick={handleBookAppointment}
            className={styles.headerButton}
          >
            Schedule Appointment
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <span>{error}</span>
        </div>
      )}

      {/* Mobile Card View */}
      <div className={styles.mobileCards}>{renderMobileCards()}</div>

      {/* Desktop Table View */}
      <div className={styles.desktopTable}>{renderDesktopTable()}</div>

      {/* Reschedule Modal */}
      <AppointmentRescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        appointment={selectedAppointment}
        onAppointmentRescheduled={handleRescheduleSuccess}
      />
    </div>
  );
};
