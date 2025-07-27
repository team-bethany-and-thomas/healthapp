"use client";
import { useEffect, useState } from "react";
import { client } from "@/app/lib/appwrite";

export default function AppwriteTest() {
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    const runTests = async () => {
      const testResults: string[] = [];
      
      testResults.push("=== APPWRITE CLIENT TEST ===");
      testResults.push(`Using client endpoint: ${client.config.endpoint}`);
      testResults.push(`Using project ID: ${client.config.project}`);
      testResults.push("");

      // Test basic internet connectivity first
      testResults.push("=== INTERNET CONNECTIVITY TEST ===");
      try {
        await fetch('https://www.google.com', { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        testResults.push("✅ Internet connection working");
      } catch (error) {
        testResults.push(`❌ Internet connection failed: ${error}`);
      }

      // Test Appwrite endpoint specifically
      testResults.push("");
      testResults.push("=== APPWRITE ENDPOINT TEST ===");
      try {
        testResults.push("🔄 Testing Appwrite endpoint reachability...");
        
        const response = await fetch(`${client.config.endpoint}/health`, {
          method: 'GET',
          mode: 'cors'
        });
        testResults.push(`Appwrite health status: ${response.status}`);
        testResults.push("✅ Appwrite endpoint is reachable");
      } catch (error) {
        testResults.push(`❌ Appwrite endpoint test failed: ${error}`);
        testResults.push(`Error type: ${typeof error}`);
        testResults.push(`Error name: ${error instanceof Error ? error.name : 'Unknown'}`);
        testResults.push(`Error message: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Test the client configuration
      testResults.push("");
      testResults.push("=== CLIENT CONFIGURATION TEST ===");
      try {
        testResults.push("🔄 Testing client configuration...");
        
        const response = await fetch(`${client.config.endpoint}/account`, {
          method: 'GET',
          headers: {
            'X-Appwrite-Project': client.config.project || '',
            'Content-Type': 'application/json',
          },
        });
        
        testResults.push(`Response status: ${response.status}`);
        testResults.push(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
        
        if (response.status === 401) {
          testResults.push("✅ 401 is expected for unauthenticated account requests");
        } else if (response.status === 200) {
          testResults.push("✅ Unexpected 200 - you might already be authenticated");
        } else {
          testResults.push(`⚠️ Unexpected status: ${response.status}`);
        }

        const responseText = await response.text();
        testResults.push(`Response body: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
        
      } catch (error) {
        testResults.push(`❌ Client test failed: ${error}`);
        testResults.push(`Error details: ${JSON.stringify(error, null, 2)}`);
      }

      // Test database access specifically
      testResults.push("");
      testResults.push("=== DATABASE ACCESS TEST ===");
      try {
        const dbResponse = await fetch(
          `${client.config.endpoint}/databases/${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}/collections/${process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID}/documents`,
          {
            method: 'GET',
            headers: {
              'X-Appwrite-Project': client.config.project || '',
              'Content-Type': 'application/json',
            },
          }
        );
        
        testResults.push(`Database request status: ${dbResponse.status}`);
        const dbResponseText = await dbResponse.text();
        testResults.push(`Database response: ${dbResponseText.substring(0, 300)}${dbResponseText.length > 300 ? '...' : ''}`);
        
      } catch (error) {
        testResults.push(`❌ Database test failed: ${error}`);
      }

      setResults(testResults);
    };

    runTests();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Appwrite Client Test</h1>
      <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        {results.map((line, index) => (
          <div key={index} className={line.startsWith('❌') ? 'text-red-600' : line.startsWith('✅') ? 'text-green-600' : line.startsWith('⚠️') ? 'text-orange-600' : ''}>
            {line || '\u00A0'}
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        This test bypasses the Appwrite SDK to test raw HTTP requests
      </div>
    </div>
  );
}
