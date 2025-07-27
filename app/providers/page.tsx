"use client";

import { useEffect, useState } from "react";
import { databases } from "@/app/lib/appwrite"; // Fixed import path

type Provider = {
  // Name fields
  first_name?: string;
  last_name?: string;
  full_name?: string;
  
  // Basic info
  specialty?: string;
  
  // Location fields
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  
  // Personal info
  gender?: string;
  pronouns?: string;
  
  // Professional info
  education?: string;
  practice_name?: string;
  languages_spoken?: string | string[];
  rating?: number;
  
  // Appwrite metadata
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        // Debug environment variables
        console.log("🔧 Environment Variables Check:");
        console.log("- Database ID:", process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID);
        console.log("- Collection ID:", process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID);
        console.log("- Project ID:", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
        console.log("- Endpoint:", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);

        if (!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID) {
          throw new Error("NEXT_PUBLIC_APPWRITE_DATABASE_ID is not set");
        }
        
        if (!process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID) {
          throw new Error("NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID is not set");
        }

        console.log("🚀 Attempting to fetch documents from Appwrite...");
        console.log("Using Database ID:", process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID);
        console.log("Using Collection ID:", process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID);

        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID!
        );
        console.log(" Successfully fetched from Appwrite!");
        console.log(" Response:", response);
        console.log("Documents count:", response.documents.length);
        setProviders(response.documents as unknown as Provider[]);
      } catch (error) {
        console.error("❌ Detailed Error Info:");
        console.error("Error type:", typeof error);
        console.error("Error message:", error instanceof Error ? error.message : error);
        console.error("Full error object:", error);
        
        // Check if it's an Appwrite-specific error
        if (error && typeof error === 'object' && 'code' in error) {
          const appwriteError = error as { code?: string; type?: string; message?: string };
          console.error(" Appwrite Error Code:", appwriteError.code);
          console.error(" Appwrite Error Type:", appwriteError.type);
          console.error(" Appwrite Error Message:", appwriteError.message);
        }
      }
    };

    fetchProviders();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Our Providers</h1>
      
      {providers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            📋 No providers found in the database
          </div>
          <div className="text-sm text-gray-400">
            Add some provider documents to your Appwrite collection to see them here.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => {
            // Helper to get name
            const getName = () => {
              if (provider.first_name && provider.last_name) {
                return `${provider.first_name} ${provider.last_name}`;
              }
              if (provider.full_name) {
                return provider.full_name;
              }
              return "Provider Name Not Available";
            };

            // Helper to get location
            const getLocation = () => {
              if (provider.location) {
                return provider.location;
              }
              const parts = [provider.city, provider.state, provider.zip].filter(Boolean);
              return parts.length > 0 ? parts.join(', ') : "Location Not Available";
            };

            return (
              <div key={provider.$id} className="border rounded-lg p-4 shadow-md bg-white">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {getName()}
                </h2>
                
                {provider.specialty && (
                  <p className="text-blue-600 font-medium mb-3">{provider.specialty}</p>
                )}
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium"> Location:</span> {getLocation()}</p>
                  
                  {provider.practice_name && (
                    <p><span className="font-medium">Practice:</span> {provider.practice_name}</p>
                  )}
                  
                  {provider.education && (
                    <p><span className="font-medium">Education:</span> {provider.education}</p>
                  )}
                  
                  {provider.languages_spoken && (
                    <p><span className="font-medium">Languages:</span> {
                      Array.isArray(provider.languages_spoken) 
                        ? provider.languages_spoken.join(', ')
                        : provider.languages_spoken
                    }</p>
                  )}
                  
                  {provider.gender && (
                    <p><span className="font-medium"> Gender:</span> {provider.gender}</p>
                  )}
                  
                  {provider.pronouns && (
                    <p><span className="font-medium"> Pronouns:</span> {provider.pronouns}</p>
                  )}
                  
                  {provider.rating && (
                    <p><span className="font-medium">⭐ Rating:</span> {provider.rating}/5</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}