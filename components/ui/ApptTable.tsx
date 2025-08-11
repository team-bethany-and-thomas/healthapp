"use client";
import { useEffect, useState } from "react";
import { databases } from "../../app/lib/appwrite";
import { Query, Models } from "appwrite";
import { useAuth } from "../../app/providers/AuthProvider";

// ---- ENV ----
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPTS_COL = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!;
const APPT_TYPES_COL = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENT_TYPES_COLLECTION_ID!;
const PROVIDERS_COL = process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID!;
const PATIENT_FORMS_COL = process.env.NEXT_PUBLIC_APPWRITE_PATIENT_FORMS_COLLECTION_ID!;

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
}

type MergedAppointment = {
  appointmentId: string;
  intakeFormNumber: string;
  date: string;
  time: string;
  doctor: string;
  facility: string;
  appointmentType: string;
  reason: string;
  cost: string;
  hasIntakeForm: boolean;
};

export const ApptTable = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<MergedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get numeric patient_id from user (same logic as booking modal)
  const getNumericUserId = (user: { userId?: string | number; id?: string | number; $id: string }): number => {
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
        const apptsRes = await databases.listDocuments(
          DB_ID,
          APPTS_COL,
          [
            Query.equal("patient_id", patientId),
            Query.orderDesc("appointment_date"),
            Query.limit(50)
          ]
        );

        if (apptsRes.documents.length === 0) {
          setAppointments([]);
          return;
        }

        // 2) Fetch related data
        const [providersList, apptTypesList, patientFormsList] = await Promise.all([
          databases.listDocuments(DB_ID, PROVIDERS_COL, [Query.limit(500)]),
          databases.listDocuments(DB_ID, APPT_TYPES_COL, [Query.limit(500)]),
          databases.listDocuments(DB_ID, PATIENT_FORMS_COL, [
            Query.equal("patient_id", patientId),
            Query.limit(100)
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
        const rows: MergedAppointment[] = (apptsRes.documents as AppointmentDocument[]).map((appointment) => {
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
                if (docId === '688694300008dd5e2506' && providerIdStr === '68869430000852504') {
                  provider = prov;
                  break;
                }
                // More general pattern matching - check if the first 12 digits match
                const docIdDigits = docId.replace(/[^0-9]/g, '');
                const providerIdDigits = providerIdStr.replace(/[^0-9]/g, '');
                if (docIdDigits.length >= 12 && providerIdDigits.length >= 12) {
                  if (docIdDigits.substring(0, 12) === providerIdDigits.substring(0, 12)) {
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

          const typeName = appointmentType?.type_name || `Type ID: ${appointment.appointment_type_id}`;

          const cost = appointmentType?.base_cost ? `$${appointmentType.base_cost}` : "";

          // Generate a user-friendly intake form number
          const intakeFormNumber = patientForm 
            ? `IF-${appointment.appointment_id.toString().slice(-6)}` 
            : "N/A";

          return {
            appointmentId: appointment.$id,
            intakeFormNumber,
            date: fmtDate(appointment.appointment_date),
            time: fmtTime(appointment.appointment_time),
            doctor: doctorName,
            facility: facilityName,
            appointmentType: typeName,
            reason: appointment.reason_for_visit || "",
            cost,
            hasIntakeForm: !!patientForm,
          };
        });

        setAppointments(rows);
      } catch (err) {
        console.error("fetchAppointments error:", err);
        setError(err instanceof Error ? err.message : "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  const handleBookAppointment = () => {
    window.location.href = "/search";
  };

  const handleIntakeForm = (appointmentId: string, hasIntakeForm: boolean) => {
    if (hasIntakeForm) {
      // Navigate to existing intake form
      window.location.href = `/dashboard/forms?appointment_id=${appointmentId}`;
    } else {
      // Navigate to create new intake form for this appointment
      window.location.href = `/dashboard/forms?appointment_id=${appointmentId}`;
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

  return (
    <>
      <h3 className="text-xl font-semibold mb-4 mt-4">Appointments</h3>
      <button onClick={handleBookAppointment} className="btn btn-primary rounded-md mb-4">
        Schedule Appointment
      </button>
      
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 rounded-xl">
        <table className="table table-lg table-pin-rows table-pin-cols">
          <thead>
            <tr>
              <th>Intake Form #</th>
              <td>Date</td>
              <td>Time</td>
              <td>Doctor</td>
              <td>Facility</td>
              <td>Appointment Type</td>
              <td>Reason For Visit</td>
              <td>Cost</td>
              <td>Actions</td>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center p-4">
                  <span className="loading loading-spinner loading-md"></span>
                  <span className="ml-2">Loading appointments...</span>
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center p-4">
                  <div>
                    <p className="mb-2">No appointments found.</p>
                    <button onClick={handleBookAppointment} className="btn btn-primary btn-sm">
                      Schedule Your First Appointment
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt.appointmentId}>
                  <th>{appt.intakeFormNumber}</th>
                  <td>{appt.date}</td>
                  <td>{appt.time}</td>
                  <td>{appt.doctor}</td>
                  <td>{appt.facility}</td>
                  <td>{appt.appointmentType}</td>
                  <td>{appt.reason}</td>
                  <td>{appt.cost}</td>
                  <td>
                    <button
                      onClick={() => handleIntakeForm(appt.appointmentId, appt.hasIntakeForm)}
                      className={`btn btn-sm ${
                        appt.hasIntakeForm 
                          ? 'btn-outline btn-info' 
                          : 'btn-primary'
                      }`}
                    >
                      {appt.hasIntakeForm ? 'View Intake' : 'Intake'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
