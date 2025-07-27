"use client";
import { useEffect, useState } from "react";

export default function NetworkTest() {
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    const runTests = async () => {
      const testResults: string[] = [];
      
      // Test 1: Environment variables
      testResults.push("=== ENVIRONMENT VARIABLES ===");
      testResults.push(`Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'MISSING'}`);
      testResults.push(`Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'MISSING'}`);
      testResults.push(`Database ID: ${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'MISSING'}`);
      testResults.push(`Collection ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID || 'MISSING'}`);
      testResults.push("");

      // Test 2: Basic network connectivity
      testResults.push("=== NETWORK CONNECTIVITY ===");
      try {
        const response = await fetch('https://cloud.appwrite.io/v1/health');
        testResults.push(`✅ Appwrite health check: ${response.status} ${response.statusText}`);
      } catch (error) {
        testResults.push(`❌ Appwrite health check failed: ${error}`);
      }

      // Test 3: Custom endpoint if different
      if (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && 
          process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT !== 'https://cloud.appwrite.io/v1') {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/health`);
          testResults.push(`✅ Custom endpoint health: ${response.status} ${response.statusText}`);
        } catch (error) {
          testResults.push(`❌ Custom endpoint failed: ${error}`);
        }
      }

      // Test 4: DNS resolution
      testResults.push("");
      testResults.push("=== DNS & BROWSER INFO ===");
      testResults.push(`User Agent: ${navigator.userAgent}`);
      testResults.push(`Online: ${navigator.onLine}`);
      
      setResults(testResults);
    };

    runTests();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Network Diagnostics</h1>
      <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
        {results.map((line, index) => (
          <div key={index} className={line.startsWith('❌') ? 'text-red-600' : line.startsWith('✅') ? 'text-green-600' : ''}>
            {line || '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  );
}
