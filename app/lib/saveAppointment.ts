import { databases, ID } from "./appwrite";
import { Models } from "appwrite";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPOINTMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!;

export async function saveAppointment(data: {
    patient_id: number;
    provider_id: number;
    appointment_id: number;
    appointment_type_id: number;
    appointment_date: string;
    appointment_time: string;
    status?: string;
    reason_for_visit?: string;
    notes?: string;
    start_time?: string;
    length_minutes?: string;
}): Promise<Models.Document | null> {
    try {
        const uniqueId = ID.unique();

        const response =  await databases.createDocument(
            DB_ID,
            APPOINTMENTS_COLLECTION_ID,
            uniqueId,
            {
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        );

        return response;
    } catch (err) {
        console.error('Error saving appointment:', err);
        throw err;
    }
  }