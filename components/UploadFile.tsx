"use client";

import React, { useState, useRef } from 'react';
import { uploadService, type FileUploadData } from '../app/services/uploadService';
import { useAuth } from '../app/hooks/useAuth';

interface UploadFileProps {
  onUploadSuccess?: (fileId: string) => void;
  onUploadError?: (error: string) => void;
  allowMultiple?: boolean;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in MB
  category?: string;
  className?: string;
}

export default function UploadFile({
  onUploadSuccess,
  onUploadError,
  allowMultiple = false,
  acceptedFileTypes = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv",
  maxFileSize = 10,
  category = '',
  className = ''
}: UploadFileProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || !user) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      // Check file type
      if (!uploadService.isFileTypeAllowed(file)) {
        errors.push(`${file.name}: File type not allowed`);
        return;
      }

      // Check file size
      if (!uploadService.isFileSizeAllowed(file)) {
        errors.push(`${file.name}: File size exceeds ${maxFileSize}MB limit`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      onUploadError?.(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      if (allowMultiple) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
      } else {
        setSelectedFiles(validFiles.slice(0, 1));
      }
    }
  };

  const uploadFiles = async () => {
    if (!user || selectedFiles.length === 0) return;

    setIsUploading(true);
    const uploadPromises = selectedFiles.map(async (file) => {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const uploadData: FileUploadData = {
          file,
          category: category || uploadService.getFileCategory(file.type),
          description: descriptions[file.name] || ''
        };

        // Simulate progress (Appwrite doesn't provide real-time progress)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
          }));
        }, 200);

        const uploadedFile = await uploadService.uploadFile(uploadData, user.$id);

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        onUploadSuccess?.(uploadedFile.$id);
        return uploadedFile;
      } catch (error) {
        console.error('Upload error:', error);
        onUploadError?.(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // -1 indicates error
        throw error;
      }
    });

    try {
      await Promise.all(uploadPromises);
      // Clear selected files after successful upload
      setSelectedFiles([]);
      setDescriptions({});
      setUploadProgress({});
    } catch (error) {
      // Some uploads failed, but we don't need to do anything here
      // as individual errors are already handled above
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    const fileName = selectedFiles[index]?.name;
    if (fileName) {
      setDescriptions(prev => {
        const newDescriptions = { ...prev };
        delete newDescriptions[fileName];
        return newDescriptions;
      });
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileName];
        return newProgress;
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please log in to upload files.
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* File Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          title="Select files to upload"
          placeholder="Select files"
          type="file"
          multiple={allowMultiple}
          accept={acceptedFileTypes}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Drop files here' : 'Upload files'}
            </p>
            <p className="text-sm text-gray-500">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports: Images, PDF, Word, Excel, Text files (max {maxFileSize}MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Selected Files</h3>

          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {uploadService.formatFileSize(file.size)} • {uploadService.getFileCategory(file.type)}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  type="button"
                  title="Remove file"
                  className="ml-2 text-red-500 hover:text-red-700"
                  disabled={isUploading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description Input */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={descriptions[file.name] || ''}
                  onChange={(e) => setDescriptions(prev => ({
                    ...prev,
                    [file.name]: e.target.value
                  }))}
                  placeholder="Add a description for this file..."
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUploading}
                />
              </div>

              {/* Upload Progress */}
              {uploadProgress[file.name] !== undefined && (
                <div className="mb-2">
                  {uploadProgress[file.name] === -1 ? (
                    <div className="text-xs text-red-600">Upload failed</div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Uploading...</span>
                        <span>{uploadProgress[file.name]}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[file.name]}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              onClick={uploadFiles}
              disabled={isUploading || selectedFiles.length === 0}
              className={`
                px-6 py-2 rounded-lg font-medium transition-colors
                ${isUploading || selectedFiles.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
