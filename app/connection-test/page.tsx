"use client";
import { useEffect, useState } from "react";

export default function ConnectionTest() {
  const [status, setStatus] = useState("🔄 Testing connection...");

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic client connection
        console.log("🔧 Environment Variables:");
        console.log("- Endpoint:", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
        console.log("- Project ID:", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
        console.log("- Database ID:", process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID);
        console.log("- Collection ID:", process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID);

        // Test if we can reach the Appwrite endpoint
        const response = await fetch(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT + '/health', {
          method: 'GET',
        });
        
        if (response.ok) {
          setStatus("✅ Appwrite endpoint is reachable");
          console.log("✅ Appwrite health check passed");
        } else {
          setStatus("❌ Appwrite endpoint returned error: " + response.status);
          console.log("❌ Appwrite health check failed:", response.status);
        }
      } catch (error) {
        setStatus("❌ Network error: " + (error as Error).message);
        console.error("❌ Connection test failed:", error);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Appwrite Connection Test</h1>
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-sm">{status}</p>
      </div>
      <div className="mt-4 text-xs text-gray-600">
        Check the browser console for detailed logs
      </div>
    </div>
  );
}
