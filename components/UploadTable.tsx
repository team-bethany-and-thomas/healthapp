"use client";

import React, { useState, useEffect } from 'react';
import { uploadService, type UploadedFile } from '../app/services/uploadService';
import { useAuth } from '../app/hooks/useAuth';
import styles from './UploadTable.module.css';

interface UploadTableProps {
  onFileSelect?: (fileIds: string[]) => void;
  allowMultipleSelection?: boolean;
  showSelectionColumn?: boolean;
  category?: string;
  className?: string;
  hideCategoryInTitle?: boolean;
  readOnly?: boolean;
}

export default function UploadTable({
  onFileSelect,
  allowMultipleSelection = false,
  showSelectionColumn = false,
  category,
  className = '',
  hideCategoryInTitle = false,
  readOnly = false
}: UploadTableProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'uploadedAt' | 'filename' | 'fileSize'>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user, category]);

  useEffect(() => {
    if (onFileSelect) {
      onFileSelect(Array.from(selectedFiles));
    }
  }, [selectedFiles]); // Remove onFileSelect from dependencies to prevent infinite loop

  const loadFiles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const userFiles = category 
        ? await uploadService.getUserFilesByCategory(user.$id, category)
        : await uploadService.getUserFiles(user.$id);
      
      setFiles(userFiles);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: UploadedFile) => {
    if (!confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      return;
    }

    try {
      setDeletingFiles(prev => new Set(prev).add(file.$id));
      await uploadService.deleteFile(file.$id, file.storageField);
      
      // Remove from local state
      setFiles(prev => prev.filter(f => f.$id !== file.$id));
      
      // Remove from selection if selected
      setSelectedFiles(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(file.$id);
        return newSelection;
      });
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Failed to delete file');
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.$id);
        return newSet;
      });
    }
  };

  const handleFileSelection = (fileId: string) => {
    if (!showSelectionColumn) return;

    setSelectedFiles(prev => {
      const newSelection = new Set(prev);
      
      if (allowMultipleSelection) {
        if (newSelection.has(fileId)) {
          newSelection.delete(fileId);
        } else {
          newSelection.add(fileId);
        }
      } else {
        // Single selection mode
        if (newSelection.has(fileId)) {
          newSelection.clear();
        } else {
          newSelection.clear();
          newSelection.add(fileId);
        }
      }
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (!showSelectionColumn || !allowMultipleSelection) return;

    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.$id)));
    }
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedFiles = [...files].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'filename':
        aValue = a.originalName.toLowerCase();
        bValue = b.originalName.toLowerCase();
        break;
      case 'fileSize':
        aValue = a.fileSize;
        bValue = b.fileSize;
        break;
      case 'uploadedAt':
      default:
        aValue = new Date(a.uploadedAt).getTime();
        bValue = new Date(b.uploadedAt).getTime();
        break;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getFileIcon = (fileType: string) => {
    const category = uploadService.getFileCategory(fileType);
    
    switch (category) {
      case 'image':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'pdf':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'spreadsheet':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      const downloadUrl = await uploadService.getFileDownloadUrl(file.storageField);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file');
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please log in to view your files.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 mb-2">{error}</div>
        <button
          onClick={loadFiles}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg className="mx-auto w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium">No files uploaded yet</p>
        <p className="text-sm">Upload some files to see them here.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.uploadTableContainer} ${className} ${isMobile ? styles.mobileCardView : ''}`}>
      {/* Header */}
      <div className={styles.headerSection}>
        <h2 className={styles.headerTitle}>
          Your Files {category && !hideCategoryInTitle && `(${category})`}
        </h2>
        <div className={styles.headerActions}>
          {showSelectionColumn && selectedFiles.size > 0 && (
            <span className={styles.selectedCount}>
              {selectedFiles.size} selected
            </span>
          )}
          <button
            onClick={loadFiles}
            disabled={readOnly}
            className={`${styles.refreshButton} ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? "Cannot refresh in read-only mode" : "Refresh files"}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      {isMobile ? (
        <div>
          {sortedFiles.map((file) => (
            <div key={file.$id} className={styles.fileCard}>
              <div className={styles.fileCardHeader}>
                {showSelectionColumn && (
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.$id)}
                    onChange={() => handleFileSelection(file.$id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    title={`Select ${file.originalName}`}
                  />
                )}
                {getFileIcon(file.fileType)}
                <div className={styles.fileCardTitle}>
                  {file.originalName}
                </div>
              </div>
              <div className={styles.fileCardMeta}>
                <div>
                  <strong>Type:</strong> {uploadService.getFileCategory(file.fileType)}
                </div>
                <div>
                  <strong>Size:</strong> {uploadService.formatFileSize(file.fileSize)}
                </div>
                <div>
                  <strong>Uploaded:</strong> {new Date(file.uploadedAt).toLocaleDateString()}
                </div>
                {file.description && (
                  <div>
                    <strong>Description:</strong> {file.description}
                  </div>
                )}
              </div>
              <div className={styles.fileCardActions}>
                <button
                  onClick={() => handleDownload(file)}
                  disabled={readOnly}
                  className={`${styles.actionButton} ${styles.downloadButton} ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={readOnly ? "Cannot download in read-only mode" : `Download ${file.originalName}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(file)}
                  disabled={deletingFiles.has(file.$id) || readOnly}
                  className={`${styles.actionButton} ${styles.deleteButton} ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={readOnly ? "Cannot delete in read-only mode" : `Delete ${file.originalName}`}
                >
                  {deletingFiles.has(file.$id) ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                {showSelectionColumn && (
                  <th className={styles.tableHeaderCell}>
                    {allowMultipleSelection && (
                      <input
                        type="checkbox"
                        checked={files.length > 0 && selectedFiles.size === files.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        title="Select all files"
                      />
                    )}
                  </th>
                )}
                <th className={styles.tableHeaderCell}>
                  Type
                </th>
                <th 
                  className={`${styles.tableHeaderCell} ${styles.sortableHeader}`}
                  onClick={() => handleSort('filename')}
                >
                  <div className="flex items-center">
                    Name
                    {sortBy === 'filename' && (
                      <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className={`${styles.tableHeaderCell} ${styles.sortableHeader} ${styles.hiddenOnMobile}`}
                  onClick={() => handleSort('fileSize')}
                >
                  <div className="flex items-center">
                    Size
                    {sortBy === 'fileSize' && (
                      <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className={`${styles.tableHeaderCell} ${styles.sortableHeader} ${styles.hiddenOnMobile}`}
                  onClick={() => handleSort('uploadedAt')}
                >
                  <div className="flex items-center">
                    Uploaded
                    {sortBy === 'uploadedAt' && (
                      <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className={`${styles.tableHeaderCell} ${styles.hiddenOnTablet}`}>
                  Description
                </th>
                <th className={styles.tableHeaderCell}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedFiles.map((file) => (
                <tr key={file.$id} className={styles.tableRow}>
                  {showSelectionColumn && (
                    <td className={styles.tableCell}>
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.$id)}
                        onChange={() => handleFileSelection(file.$id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        title={`Select ${file.originalName}`}
                      />
                    </td>
                  )}
                  <td className={styles.tableCell}>
                    <div className={styles.typeIcon}>
                      {getFileIcon(file.fileType)}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={`${styles.fileName} ${styles.tableCellTruncate}`}>
                      {file.originalName}
                    </div>
                    <div className={styles.fileCategory}>
                      {uploadService.getFileCategory(file.fileType)}
                    </div>
                  </td>
                  <td className={`${styles.tableCell} ${styles.hiddenOnMobile}`}>
                    {uploadService.formatFileSize(file.fileSize)}
                  </td>
                  <td className={`${styles.tableCell} ${styles.hiddenOnMobile}`}>
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className={`${styles.tableCell} ${styles.tableCellTruncate} ${styles.hiddenOnTablet}`}>
                    {file.description || '-'}
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={readOnly}
                        className={`${styles.actionButton} ${styles.downloadButton} ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={readOnly ? "Cannot download in read-only mode" : `Download ${file.originalName}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={deletingFiles.has(file.$id) || readOnly}
                        className={`${styles.actionButton} ${styles.deleteButton} ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={readOnly ? "Cannot delete in read-only mode" : `Delete ${file.originalName}`}
                      >
                        {deletingFiles.has(file.$id) ? (
                          <div className="w-5 h-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
