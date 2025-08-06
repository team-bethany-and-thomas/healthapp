import { databases, ID } from "../../lib/appwrite";
import { Models } from "appwrite";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPOINTMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!;

export async function saveAppointment(data: {
    appointment_id: number;
    patient_id: number;
    provider_id: number;
    appointment_type_id: number;
    appointment_date?: string;
    appointment_time?: string;
    status?: string;
    reason_for_visit?: string;
    notes?: string;
    date?: string;
    start_time?: string;
    length_minutes?: string;
}): Promise<Models.Document | null> {
    try {
        const timestamp = new Date().toISOString();

        const response = await databases.createDocument(
            DB_ID,
            APPOINTMENTS_COLLECTION_ID,
            ID.unique(),
            {
                ...data,
                created_at: timestamp,
                updated_at: timestamp,
            }
        );

        console.log("Appoitnment saved:", response);
        return response;
    } catch(error) { 
        console.error("Error saving appointment:", error);}
        return null;
    }

