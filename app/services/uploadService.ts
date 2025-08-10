import { storage, databases, ID, Query } from '../lib/appwrite';
import type { Models } from 'appwrite';

// Constants from your Appwrite setup
const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_FILES_BUCKET_ID!;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const FILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID!;

export interface UploadedFile extends Models.Document {
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  userId: string;
  uploadedAt: string;
  category?: string;
  description?: string;
  storageField: string;
}

export interface FileUploadData {
  file: File;
  category?: string;
  description?: string;
}

class UploadService {
  // Upload file to storage and create database record
  async uploadFile(data: FileUploadData, userId: string): Promise<UploadedFile> {
    try {
      console.log('Starting file upload for user:', userId);
      console.log('File details:', { name: data.file.name, size: data.file.size, type: data.file.type });

      // Generate unique filename
      const fileExtension = data.file.name.split('.').pop();
      const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;

      console.log('Uploading to storage bucket:', STORAGE_BUCKET_ID);

      // Upload to Appwrite Storage
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        data.file
      );

      console.log('File uploaded to storage:', uploadedFile.$id);
      console.log('Creating database record in collection:', FILES_COLLECTION_ID);

      // Create database record
      const fileRecord = await databases.createDocument(
        DATABASE_ID,
        FILES_COLLECTION_ID,
        ID.unique(),
        {
          filename: uniqueFilename,
          originalName: data.file.name,
          fileType: data.file.type,
          fileSize: data.file.size,
          userId: userId,
          uploadedAt: new Date().toISOString(),
          category: data.category || '',
          description: data.description || '',
          storageField: uploadedFile.$id
        }
      );

      console.log('Database record created:', fileRecord.$id);
      return fileRecord as unknown as UploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      console.error('Storage bucket ID:', STORAGE_BUCKET_ID);
      console.error('Database ID:', DATABASE_ID);
      console.error('Files collection ID:', FILES_COLLECTION_ID);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all files for a specific user
  async getUserFiles(userId: string): Promise<UploadedFile[]> {
    try {
      console.log('Fetching files for user:', userId);
      console.log('Database ID:', DATABASE_ID);
      console.log('Files collection ID:', FILES_COLLECTION_ID);

      const response = await databases.listDocuments(
        DATABASE_ID,
        FILES_COLLECTION_ID,
        [
          Query.equal('userId', userId)
        ]
      );

      console.log('Found files:', response.documents.length);
      return response.documents as unknown as UploadedFile[];
    } catch (error) {
      console.error('Error fetching user files:', error);
      console.error('Database ID:', DATABASE_ID);
      console.error('Files collection ID:', FILES_COLLECTION_ID);
      throw new Error(`Failed to fetch files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get file download URL
  async getFileUrl(storageFileId: string): Promise<string> {
    try {
      const result = storage.getFileView(STORAGE_BUCKET_ID, storageFileId);
      return result.toString();
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw new Error('Failed to get file URL');
    }
  }

  // Get file download URL for downloading
  async getFileDownloadUrl(storageFileId: string): Promise<string> {
    try {
      const result = storage.getFileDownload(STORAGE_BUCKET_ID, storageFileId);
      return result.toString();
    } catch (error) {
      console.error('Error getting file download URL:', error);
      throw new Error('Failed to get file download URL');
    }
  }

  // Delete file from both storage and database
  async deleteFile(fileId: string, storageFileId: string): Promise<void> {
    try {
      // Delete from storage
      await storage.deleteFile(STORAGE_BUCKET_ID, storageFileId);

      // Delete from database
      await databases.deleteDocument(
        DATABASE_ID,
        FILES_COLLECTION_ID,
        fileId
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Get files by category for a user
  async getUserFilesByCategory(userId: string, category: string): Promise<UploadedFile[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        FILES_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('category', category)
        ]
      );

      return response.documents as unknown as UploadedFile[];
    } catch (error) {
      console.error('Error fetching files by category:', error);
      throw new Error('Failed to fetch files by category');
    }
  }

  // Update file metadata
  async updateFileMetadata(fileId: string, updates: Partial<Pick<UploadedFile, 'category' | 'description'>>): Promise<UploadedFile> {
    try {
      const updatedFile = await databases.updateDocument(
        DATABASE_ID,
        FILES_COLLECTION_ID,
        fileId,
        updates
      );

      return updatedFile as unknown as UploadedFile;
    } catch (error) {
      console.error('Error updating file metadata:', error);
      throw new Error('Failed to update file metadata');
    }
  }

  // Check if file type is allowed
  isFileTypeAllowed(file: File): boolean {
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];

    return allowedTypes.includes(file.type);
  }

  // Check if file size is within limits (10MB max)
  isFileSizeAllowed(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    return file.size <= maxSize;
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file type category (image, document, etc.)
  getFileCategory(fileType: string): string {
    if (fileType.startsWith('image/')) {
      return 'image';
    } else if (fileType === 'application/pdf') {
      return 'pdf';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return 'document';
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return 'spreadsheet';
    } else if (fileType.startsWith('text/')) {
      return 'text';
    }
    return 'other';
  }
}

export const uploadService = new UploadService();