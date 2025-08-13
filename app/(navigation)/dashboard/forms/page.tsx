"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { IntakeForm } from "@/components/features/IntakeForm/IntakeForm";
import { useAuth } from "@/app/providers/AuthProvider";
import { databases } from "@/app/lib/appwrite";
import { Query, Models } from "appwrite";
import styles from "@/components/ui/ApptTable.module.css";
import formsStyles from "./FormsPage.module.css";

// Environment variables
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPTS_COL = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!;
const PROVIDERS_COL = process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID!;
const PATIENT_FORMS_COL =
  process.env.NEXT_PUBLIC_APPWRITE_PATIENT_FORMS_COLLECTION_ID!;
const APPT_TYPES_COL =
  process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENT_TYPES_COLLECTION_ID!;

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
};

function FormsPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");
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
        };
      });

      setAppointments(rows);
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
    // Refresh the list to show updated status
    fetchAppointmentsWithIntakeStatus();
  };

  const handleBookAppointment = () => {
    window.location.href = "/search";
  };

  // If showing intake form, render it
  if (showIntakeForm && selectedAppointmentId) {
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
        <IntakeForm appointmentId={selectedAppointmentId} />
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
        </div>
      );
    }

    return (
      <div className={styles.mobileCards}>
        {appointments.map((appt) => (
          <div key={appt.appointmentId} className={styles.appointmentCard}>
            <div className={styles.cardHeader}>
              <div className={styles.intakeFormBadge}>
                {appt.intakeFormNumber}
              </div>
              <div className="text-sm font-semibold text-gray-600">
                {appt.date} at {appt.time}
              </div>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Doctor:</span>
                <span className={styles.cardValue}>{appt.doctor}</span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Facility:</span>
                <span className={styles.cardValue}>{appt.facility}</span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Type:</span>
                <span className={styles.cardValue}>{appt.appointmentType}</span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Intake Status:</span>
                <span
                  className={`${styles.cardValue} ${
                    appt.intakeStatus === "Completed"
                      ? "text-green-600 font-semibold"
                      : appt.intakeStatus === "In Progress"
                      ? "text-yellow-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }`}
                >
                  {appt.intakeStatus}
                  {appt.intakeStatus === "In Progress" && (
                    <span className="text-sm text-gray-500 ml-1">
                      ({appt.completionPercentage}%)
                    </span>
                  )}
                </span>
              </div>

              {appt.reason && (
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Reason:</span>
                  <span className={styles.cardValue}>{appt.reason}</span>
                </div>
              )}
            </div>

            <div className={styles.cardActions}>
              <button
                onClick={() => handleIntakeForm(appt.appointmentId)}
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
          </div>
        ))}
      </div>
    );
  };

  const renderDesktopTable = () => (
    <div
      className={`${styles.tableContainer} rounded-box border border-base-content/5 bg-base-100 rounded-xl`}
    >
      <table className="table table-lg w-full">
        <thead>
          <tr>
            <th>Intake Form #</th>
            <td>Date</td>
            <td>Time</td>
            <td>Doctor</td>
            <td>Facility</td>
            <td>Appointment Type</td>
            <td>Status</td>
            <td>Progress</td>
            <td>Actions</td>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9} className="text-center p-4">
                <span className="loading loading-spinner loading-md"></span>
                <span className="ml-2">Loading intake forms...</span>
              </td>
            </tr>
          ) : appointments.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center p-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    No Appointments Found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You need to schedule an appointment before you can complete
                    an intake form.
                  </p>
                  <button
                    onClick={handleBookAppointment}
                    className={styles.viewAllButton}
                  >
                    Schedule Your First Appointment
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            appointments.map((appt) => (
              <tr key={appt.appointmentId} className="hover:bg-base-50">
                <th>{appt.intakeFormNumber}</th>
                <td>{appt.date}</td>
                <td>{appt.time}</td>
                <td title={appt.doctor}>{appt.doctor}</td>
                <td title={appt.facility}>{appt.facility}</td>
                <td title={appt.appointmentType}>{appt.appointmentType}</td>
                <td>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      appt.intakeStatus === "Completed"
                        ? "bg-green-100 text-green-800"
                        : appt.intakeStatus === "In Progress"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {appt.intakeStatus}
                  </span>
                </td>
                <td>
                  {appt.intakeStatus === "In Progress" ? (
                    <div className="flex items-center gap-2">
                      <progress
                        className="progress progress-primary w-16"
                        value={appt.completionPercentage}
                        max="100"
                      ></progress>
                      <span className="text-sm">
                        {appt.completionPercentage}%
                      </span>
                    </div>
                  ) : appt.intakeStatus === "Completed" ? (
                    <span className="text-green-600 font-semibold">100%</span>
                  ) : (
                    <span className="text-gray-400">0%</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => handleIntakeForm(appt.appointmentId)}
                    className={`${styles.tableButton} ${
                      appt.intakeStatus === "Completed"
                        ? styles.tableButtonOutline
                        : styles.tableButtonPrimary
                    }`}
                    style={{
                      width: "90px",
                      minWidth: "90px",
                      maxWidth: "90px",
                    }}
                    title={
                      appt.intakeStatus === "Completed"
                        ? "View Intake Form"
                        : appt.intakeStatus === "In Progress"
                        ? "Continue Intake Form"
                        : "Start Intake Form"
                    }
                  >
                    {appt.intakeStatus === "Completed"
                      ? "View Form"
                      : appt.intakeStatus === "In Progress"
                      ? "Continue"
                      : "Start"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

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

export default FormsPage;
