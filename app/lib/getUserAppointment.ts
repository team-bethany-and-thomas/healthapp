import { databases } from "./appwrite";
import { Query, Models } from "appwrite"

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPOINTMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!;

export async function getUserAppointment(patient_id: string): Promise<Models.Document[]> {
    try {
        console.log('Querying with patient_id:', patient_id);

        const response = await databases.listDocuments(
            DB_ID,
            APPOINTMENTS_COLLECTION_ID,
            [Query.equal('patient_id', patient_id)]
        );
        
        console.log('Fetched appointment:', response.documents);
        return response.documents;
    }catch (error) {
        console.error('Error fetching appointments:', error);
        throw error;
        return [];
    }
}