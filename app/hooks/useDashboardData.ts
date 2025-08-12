'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { databases } from '../lib/appwrite';
import { Query, Models } from 'appwrite';
import { uploadService, UploadedFile } from '../services/uploadService';

// Environment variables
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPTS_COL = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!;
const PROVIDERS_COL = process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID!;

// Real data interfaces based on your database structure
interface AppointmentDocument extends Models.Document {
  appointment_id: number;
  patient_id: number;
  provider_id: number;
  appointment_type_id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason_for_visit: string;
  notes?: string;
}

interface ProviderDocument extends Models.Document {
  provider_id: number;
  first_name: string;
  last_name: string;
  practice_name: string;
  specialty: string;
}

export interface DashboardAppointment {
  id: string;
  date: string;
  time: string;
  providerName: string;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'scheduled';
}

export interface DashboardFileUpload {
  id: string;
  fileName: string;
  uploadDate: string;
  fileType: string;
  size: string;
}

export interface DashboardStats {
  totalAppointments: number;
  totalFiles: number;
  upcomingAppointments: number;
  completedAppointments: number;
}

export interface DashboardData {
  nextAppointment: DashboardAppointment | null;
  recentUpload: DashboardFileUpload | null;
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
}

export const useDashboardData = (): DashboardData => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    nextAppointment: null,
    recentUpload: null,
    stats: {
      totalAppointments: 0,
      totalFiles: 0,
      upcomingAppointments: 0,
      completedAppointments: 0,
    },
    loading: true,
    error: null,
  });

  // Helper function to get numeric patient_id from user (same logic as ApptTable)
  const getNumericUserId = (user: { userId?: string | number; id?: string | number; $id: string }): number => {
    if (user.userId) return Number(user.userId);
    if (user.id) return Number(user.id);
    return parseInt(user.$id.replace(/[^0-9]/g, "")) || Date.now();
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        if (!user) {
          setData(prev => ({
            ...prev,
            nextAppointment: null,
            recentUpload: null,
            stats: {
              totalAppointments: 0,
              totalFiles: 0,
              upcomingAppointments: 0,
              completedAppointments: 0,
            },
            loading: false,
            error: "Please log in to view your dashboard."
          }));
          return;
        }

        // Get the patient_id for the current user
        const patientId = getNumericUserId(user);

        // Fetch user's appointments
        const apptsRes = await databases.listDocuments(
          DB_ID,
          APPTS_COL,
          [
            Query.equal("patient_id", patientId),
            Query.orderDesc("appointment_date"),
            Query.limit(50)
          ]
        );

        const appointments = apptsRes.documents as AppointmentDocument[];
        const now = new Date();
        
        // Calculate stats
        const upcomingAppointments = appointments.filter(apt => {
          const appointmentDate = new Date(apt.appointment_date);
          return appointmentDate >= now;
        });
        
        const completedAppointments = appointments.filter(apt => {
          const appointmentDate = new Date(apt.appointment_date);
          return appointmentDate < now || apt.status === 'completed';
        });

        // Find next upcoming appointment
        let nextAppointment: DashboardAppointment | null = null;
        if (upcomingAppointments.length > 0) {
          const sortedUpcoming = upcomingAppointments.sort((a, b) => 
            new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
          );
          const nextApt = sortedUpcoming[0];
          
          // Fetch provider information
          let providerName = `Provider ID: ${nextApt.provider_id}`;
          try {
            const providersRes = await databases.listDocuments(DB_ID, PROVIDERS_COL, [Query.limit(500)]);
            const providers = providersRes.documents as ProviderDocument[];
            
            // Find provider by ID (using same logic as ApptTable)
            let provider = providers.find(p => p.provider_id === nextApt.provider_id);
            
            if (!provider) {
              // Try to find provider by document ID pattern matching
              const providerIdStr = String(nextApt.provider_id);
              provider = providers.find(p => {
                const docIdDigits = p.$id.replace(/[^0-9]/g, '');
                const providerIdDigits = providerIdStr.replace(/[^0-9]/g, '');
                return docIdDigits.length >= 12 && providerIdDigits.length >= 12 &&
                       docIdDigits.substring(0, 12) === providerIdDigits.substring(0, 12);
              });
            }
            
            if (provider) {
              providerName = `${provider.first_name} ${provider.last_name}`.trim();
            }
          } catch (providerError) {
            console.error('Error fetching provider:', providerError);
          }

          nextAppointment = {
            id: nextApt.$id,
            date: nextApt.appointment_date,
            time: nextApt.appointment_time,
            providerName,
            type: nextApt.reason_for_visit || 'Appointment',
            status: (nextApt.status as DashboardAppointment['status']) || 'scheduled'
          };
        }

        // Fetch user's files
        let recentUpload: DashboardFileUpload | null = null;
        let totalFiles = 0;
        
        try {
          const userFiles = await uploadService.getUserFiles(user.$id);
          totalFiles = userFiles.length;

          // Find most recent upload
          if (userFiles.length > 0) {
            const sortedFiles = userFiles.sort((a, b) => 
              new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );
            const recentFile = sortedFiles[0];
            
            recentUpload = {
              id: recentFile.$id,
              fileName: recentFile.fileName,
              uploadDate: recentFile.uploadedAt,
              fileType: recentFile.fileType,
              size: uploadService.formatFileSize(recentFile.fileSize)
            };
          }
        } catch (fileError) {
          console.error('Error fetching files:', fileError);
        }

        setData(prev => ({
          ...prev,
          nextAppointment,
          recentUpload,
          stats: {
            totalAppointments: appointments.length,
            totalFiles,
            upcomingAppointments: upcomingAppointments.length,
            completedAppointments: completedAppointments.length,
          },
          loading: false,
          error: null
        }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load dashboard data'
        }));
      }
    };

    fetchDashboardData();
  }, [user]);

  return data;
};
