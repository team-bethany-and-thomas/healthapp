"use client";

import React, { useState, useCallback } from "react";
import { useAuth } from "../app/hooks/useAuth";
import UploadFile from "../components/UploadFile";
import UploadTable from "../components/UploadTable";
import styles from "./ui/DashboardOverview.module.css";

export default function FileManagerPage() {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [refreshTable, setRefreshTable] = useState(0);

  const handleUploadSuccess = (fileId: string) => {
    setUploadSuccess(`File uploaded successfully!`);
    setUploadError(null);
    // Trigger table refresh
    setRefreshTable((prev) => prev + 1);

    // Clear success message after 5 seconds
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess(null);

    // Clear error message after 10 seconds
    setTimeout(() => setUploadError(null), 10000);
  };

  const handleFileSelection = useCallback((fileIds: string[]) => {
    setSelectedFiles(fileIds);
  }, []);

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please log in to access the file manager.
          </p>
          <div className="text-center">
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" -m-6 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={styles.headerSection}>
          <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
          <p className="mt-2 text-gray-600">
            Upload, manage, and organize your documents and images.
          </p>
        </div>

        {/* Success/Error Messages */}
        {uploadSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {uploadSuccess}
                </p>
              </div>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {uploadError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Files
            </h2>
            
          </div>
          <div className="p-6">
            <UploadFile
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              allowMultiple={true}
              category="general"
              className="w-full"
            />
          </div>
        </div>

        {/* File Selection Info */}
        {selectedFiles.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  {selectedFiles.length} file
                  {selectedFiles.length > 1 ? "s" : ""} selected
                </h3>
                <p className="text-xs text-blue-600 mt-1">
                  Selected files can be attached to forms or used in other parts
                  of the application.
                </p>
              </div>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* File Table Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Files</h2>
            <p className="mt-1 text-sm text-gray-600">
              View, download, and manage your uploaded files.
            </p>
          </div>
          <UploadTable
            key={refreshTable}
            onFileSelect={handleFileSelection}
            allowMultipleSelection={true}
            showSelectionColumn={true}
            className="w-full"
          />
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">How to Use</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Upload Files
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Drag and drop files or click to select</li>
                  <li>
                    • Supports images, PDFs, Word docs, Excel files, and text
                    files
                  </li>
                  <li>• Maximum file size: 10MB per file</li>
                  <li>• Add descriptions to organize your files</li>
                  <li>• Upload multiple files at once</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Manage Files
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• View all your uploaded files in the table</li>
                  <li>• Sort by name, size, or upload date</li>
                  <li>• Download files by clicking the download button</li>
                  <li>• Delete files you no longer need</li>
                  <li>• Select files to attach to intake forms</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
