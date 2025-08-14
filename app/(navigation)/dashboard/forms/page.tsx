"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IntakeForm } from "@/components/features/IntakeForm/IntakeForm";
import { useAuth } from "@/app/providers/AuthProvider";
import { databases } from "@/app/lib/appwrite";
import { Query, Models } from "appwrite";
import styles from "@/components/ui/ApptTable.module.css";
import formsStyles from "./FormsPage.module.css";

// Environment variables with fallbacks
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const APPTS_COL = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID || '';
const PROVIDERS_COL = process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID || '';
const PATIENT_FORMS_COL = process.env.NEXT_PUBLIC_APPWRITE_PATIENT_FORMS_COLLECTION_ID || '';
const APPT_TYPES_COL = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENT_TYPES_COLLECTION_ID || '';

// Types
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

type AppointmentWithIntakeStatus = {
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
  appointmentStatus?: string;
};

function FormsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams?.get("appointment_id") || null;
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<
    AppointmentWithIntakeStatus[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);

  // Helper function to get numeric patient_id from user
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
  const isAppointmentPast = (appointment: AppointmentWithIntakeStatus): boolean => {
    // Canceled/completed appointments should be treated as past appointments
    if (appointment.appointmentStatus === "cancelled" || 
        appointment.appointmentStatus === "canceled" || 
        appointment.appointmentStatus === "completed") {
      return true;
    }
    
    const appointmentDateTime = new Date(
      `${appointment.date} ${appointment.time}`
    );
    const now = new Date();
    return appointmentDateTime.getTime() < now.getTime();
  };

  useEffect(() => {
    // If appointmentId is provided in URL, show the intake form directly
    if (appointmentId) {
      setSelectedAppointmentId(appointmentId);
      setShowIntakeForm(true);
      return;
    }

    // Otherwise, load appointments and intake form status
    if (user) {
      fetchAppointmentsWithIntakeStatus();
    }
  }, [user, appointmentId]);

  const fetchAppointmentsWithIntakeStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setAppointments([]);
        setError("Please log in to view your intake forms.");
        return;
      }

      // Check if required environment variables are available
      if (!DB_ID || !APPTS_COL || !PROVIDERS_COL || !PATIENT_FORMS_COL || !APPT_TYPES_COL) {
        setError("Application configuration error. Please contact support.");
        return;
      }

      const patientId = getNumericUserId(user);

      // 1) Fetch appointments for this patient
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
      const rows: AppointmentWithIntakeStatus[] = (
        apptsRes.documents as AppointmentDocument[]
      ).map((appointment) => {
        // Find provider (same logic as ApptTable)
        let provider = providersMap.get(appointment.provider_id);

        if (!provider) {
          provider = providersByDocId.get(String(appointment.provider_id));
        }

        if (!provider) {
          const providerIdStr = String(appointment.provider_id);
          provider = providersByDocId.get(providerIdStr);

          if (!provider) {
            for (const [docId, prov] of providersByDocId) {
              if (
                docId === "688694300008dd5e2506" &&
                providerIdStr === "68869430000852504"
              ) {
                provider = prov;
                break;
              }
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

        // Check if appointment is canceled
        const isAppointmentCanceled = appointment.status?.toLowerCase() === "cancelled" || 
                                     appointment.status?.toLowerCase() === "canceled";

        // Generate intake form number and status
        const intakeFormNumber = patientForm
          ? `IF-${appointment.appointment_id.toString().slice(-6)}`
          : "Not Started";

        // Determine intake status based on appointment status
        let intakeStatus: string;
        if (isAppointmentCanceled) {
          intakeStatus = "Canceled";
        } else if (patientForm) {
          intakeStatus = patientForm.status === "submitted" ||
            patientForm.status === "completed"
            ? "Completed"
            : "In Progress";
        } else {
          intakeStatus = "Not Started";
        }

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
          appointmentStatus: appointment.status, // Add appointment status to the row data
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
      console.error("fetchAppointmentsWithIntakeStatus error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load appointments and intake forms"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIntakeForm = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setShowIntakeForm(true);
  };

  const handleBackToList = () => {
    setShowIntakeForm(false);
    setSelectedAppointmentId(null);
    // Clear URL parameters and navigate back to forms page
    router.push('/dashboard/forms');
    // Refresh the list to show updated status
    fetchAppointmentsWithIntakeStatus();
  };

  const handleBookAppointment = () => {
    router.push("/search");
  };

  // If showing intake form, render it
  if (showIntakeForm && selectedAppointmentId) {
    // Find the appointment to determine if it should be read-only
    const selectedAppointment = appointments.find(appt => appt.appointmentId === selectedAppointmentId);
    const shouldBeReadOnly = selectedAppointment ? isAppointmentPast(selectedAppointment) : false;

    return (
      <div className="h-full">
        <div className="mb-4">
          <button 
            onClick={handleBackToList} 
            className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            ← Back to Intake Forms List
          </button>
        </div>
        <IntakeForm 
          appointmentId={selectedAppointmentId} 
          readOnly={shouldBeReadOnly}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600">
            Please log in to access your intake forms.
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full";
    
    switch (status.toLowerCase()) {
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>;
      case 'in progress':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>In Progress</span>;
      case 'not started':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Not Started</span>;
      case 'canceled':
      case 'cancelled':
        return <span className={`${baseClasses} bg-gray-100 text-gray-600`}>Canceled</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const renderMobileCards = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <span className="loading loading-spinner loading-md"></span>
          <span className="ml-2">Loading intake forms...</span>
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className="text-center p-8">
            <p>No appointments found.</p>
          </div>
        </div>
      );
    }

    // Separate appointments into current and past
    const currentAppointments = appointments.filter(appt => !isAppointmentPast(appt));
    const pastAppointments = appointments.filter(appt => isAppointmentPast(appt));

    const renderAppointmentCard = (appt: AppointmentWithIntakeStatus, isPast: boolean = false) => (
      <div key={appt.appointmentId} className={`${styles.appointmentCard} ${isPast ? 'opacity-75 bg-gray-50' : ''}`}>
        {/* Card Header with Date/Time and Status */}
        <div className={styles.cardHeader}>
          <div className="flex flex-col">
            <div className={`text-lg font-bold mb-1 ${isPast ? 'text-gray-700' : 'text-gray-900'}`}>
              {appt.date} at {appt.time}
            </div>
            <div className="flex items-center gap-2">
              <div className={styles.intakeFormBadge}>
                {appt.intakeFormNumber}
              </div>
              {getStatusBadge(appt.intakeStatus)}
            </div>
          </div>
        </div>
        
        {/* Doctor and Facility Info */}
        <div className="mb-4">
          <div className={`text-lg font-semibold mb-1 ${isPast ? 'text-gray-700' : 'text-gray-800'}`}>
            {appt.doctor}
          </div>
          <div className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
            {appt.facility}
          </div>
        </div>
        
        {/* Appointment Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-3 rounded-lg ${isPast ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Appointment Type
            </div>
            <div className={`text-sm font-medium ${isPast ? 'text-gray-700' : 'text-gray-900'}`}>
              {appt.appointmentType}
            </div>
          </div>
          
          <div className={`p-3 rounded-lg col-span-2 ${isPast ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Progress
            </div>
            <div className="flex items-center gap-2">
              {appt.intakeStatus === "In Progress" ? (
                <>
                  <progress
                    className="progress progress-primary flex-1"
                    value={appt.completionPercentage}
                    max="100"
                  ></progress>
                  <span className={`text-sm font-medium ${isPast ? 'text-gray-700' : 'text-gray-900'}`}>
                    {appt.completionPercentage}%
                  </span>
                </>
              ) : appt.intakeStatus === "Completed" ? (
                <span className="text-green-600 font-semibold">100% Complete</span>
              ) : appt.intakeStatus === "Canceled" ? (
                <span className="text-gray-500">Appointment Canceled</span>
              ) : (
                <span className="text-gray-500">Not Started</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <div className={styles.cardActions}>
          {appt.intakeStatus === "Canceled" ? (
            <button
              disabled
              className={`${styles.tableButton} bg-gray-300 text-gray-500 cursor-not-allowed w-full`}
            >
              Appointment Canceled
            </button>
          ) : (
            <button
              onClick={() => handleIntakeForm(appt.appointmentId)}
              className={`${styles.tableButton} ${
                appt.intakeStatus === "Completed" || isPast
                  ? styles.tableButtonOutline
                  : styles.tableButtonPrimary
              } w-full`}
            >
              {appt.intakeStatus === "Completed" || isPast
                ? "View Intake Form"
                : appt.intakeStatus === "In Progress"
                ? "Continue Intake Form"
                : "Start Intake Form"}
            </button>
          )}
        </div>
      </div>
    );

    return (
      <div className={styles.mobileCards}>
        {/* Current/Future Intake Forms Section */}
        {currentAppointments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 px-4">
              Current Intake Forms
            </h2>
            {currentAppointments.map((appt) => renderAppointmentCard(appt, false))}
          </div>
        )}

        {/* Past Intake Forms Section */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 px-4">
              Past Intake Forms
            </h2>
            {pastAppointments.map((appt) => renderAppointmentCard(appt, true))}
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
          <span className="ml-2">Loading intake forms...</span>
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-4">
            No Appointments Found
          </h3>
          <p className="text-gray-600 mb-6">
            You need to schedule an appointment before you can complete an
            intake form.
          </p>
          <button
            onClick={handleBookAppointment}
            className={styles.viewAllButton}
          >
            Schedule Your First Appointment
          </button>
        </div>
      );
    }

    // Separate appointments into current and past
    const currentAppointments = appointments.filter(appt => !isAppointmentPast(appt));
    const pastAppointments = appointments.filter(appt => isAppointmentPast(appt));

    const renderAppointmentDesktopCard = (appt: AppointmentWithIntakeStatus, isPast: boolean = false) => (
      <div key={appt.appointmentId} className={`border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ${isPast ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
        {/* Card Header */}
        <div className={`px-6 py-4 border-b rounded-t-xl ${isPast ? 'border-gray-200 bg-gray-100' : 'border-gray-100 bg-gray-50'}`}>
          <div className="flex items-center gap-4">
            <div className={`text-lg font-bold ${isPast ? 'text-gray-700' : 'text-gray-900'}`}>
              {appt.date} at {appt.time}
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {appt.intakeFormNumber}
              </span>
              {getStatusBadge(appt.intakeStatus)}
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Doctor and Facility */}
            <div className="lg:col-span-1">
              <div className={`text-lg font-semibold mb-1 ${isPast ? 'text-gray-700' : 'text-gray-900'}`}>
                {appt.doctor}
              </div>
              <div className={`text-sm mb-3 ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
                {appt.facility}
              </div>
              <div className="text-sm">
                <span className={`font-medium ${isPast ? 'text-gray-600' : 'text-gray-700'}`}>Appointment Type: </span>
                <span className={isPast ? 'text-gray-500' : 'text-gray-600'}>{appt.appointmentType}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="lg:col-span-1">
              <div className={`text-sm font-medium mb-1 ${isPast ? 'text-gray-600' : 'text-gray-700'}`}>Progress</div>
              <div className="flex items-center gap-2">
                {appt.intakeStatus === "In Progress" ? (
                  <>
                    <progress
                      className="progress progress-primary flex-1"
                      value={appt.completionPercentage}
                      max="100"
                    ></progress>
                    <span className={`text-sm font-medium ${isPast ? 'text-gray-700' : 'text-gray-900'}`}>
                      {appt.completionPercentage}%
                    </span>
                  </>
                ) : appt.intakeStatus === "Completed" ? (
                  <span className="text-green-600 font-semibold">100% Complete</span>
                ) : appt.intakeStatus === "Canceled" ? (
                  <span className="text-gray-500">Appointment Canceled</span>
                ) : (
                  <span className="text-gray-500">Not Started</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              {appt.intakeStatus === "Canceled" ? (
                <button
                  disabled
                  className={`${styles.tableButton} bg-gray-300 text-gray-500 cursor-not-allowed w-full justify-center`}
                >
                  Appointment Canceled
                </button>
              ) : (
                <button
                  onClick={() => handleIntakeForm(appt.appointmentId)}
                  className={`${styles.tableButton} ${
                    appt.intakeStatus === "Completed" || isPast
                      ? styles.tableButtonOutline
                      : styles.tableButtonPrimary
                  } w-full justify-center`}
                >
                  {appt.intakeStatus === "Completed" || isPast
                    ? "View Intake Form"
                    : appt.intakeStatus === "In Progress"
                    ? "Continue Intake Form"
                    : "Start Intake Form"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-8">
        {/* Current/Future Intake Forms Section */}
        {currentAppointments.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Current Intake Forms
            </h2>
            <div className="space-y-4">
              {currentAppointments.map((appt) => renderAppointmentDesktopCard(appt, false))}
            </div>
          </div>
        )}

        {/* Past Intake Forms Section */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Past Intake Forms
            </h2>
            <div className="space-y-4">
              {pastAppointments.map((appt) => renderAppointmentDesktopCard(appt, true))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={formsStyles.formsContainer}>
      {/* Responsive header section */}
      <div className={formsStyles.headerSection}>
        <div className={formsStyles.headerContent}>
          <div className={formsStyles.headerText}>
            <h1 className={formsStyles.headerTitle}>Intake Forms</h1>
            <p className={formsStyles.headerDescription}>
              Complete intake forms for your scheduled appointments
            </p>
          </div>
          <button
            onClick={handleBookAppointment}
            className={formsStyles.headerButton}
          >
            Schedule Appointment
          </button>
        </div>
      </div>

      {error && (
        <div className={formsStyles.errorAlert}>
          <span>{error}</span>
        </div>
      )}

      {/* Mobile Card View */}
      <div className={styles.mobileCards}>{renderMobileCards()}</div>

      {/* Desktop Table View */}
      <div className={styles.desktopTable}>{renderDesktopTable()}</div>
    </div>
  );
}

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-2">
        <span className="loading loading-spinner loading-md"></span>
        <span>Loading intake forms...</span>
      </div>
    </div>
  );
}

// Main wrapper component with Suspense
function FormsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FormsPageContent />
    </Suspense>
  );
}

export default FormsPage;
