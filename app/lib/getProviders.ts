import { databases } from "./appwrite";
import { Models } from "appwrite";


const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const PROVIDERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID!;

export async function getProviders(): Promise<Models.Document[]> {
    try {
        const response = await databases.listDocuments(DB_ID, PROVIDERS_COLLECTION_ID, []);
        return response.documents; 
    } catch (error) {
        console.error("Failed to fetch providers:", error);
        return [];
    }
}