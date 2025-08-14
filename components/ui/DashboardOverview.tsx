'use client';

import React, { useState, useEffect } from 'react';
import OverviewCards from './OverviewCards';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../app/providers/AuthProvider';
import { databases } from '../../app/lib/appwrite';
import { Query, Models } from 'appwrite';
import { uploadService, UploadedFile } from '../../app/services/uploadService';
import { providerService } from '../../app/services/providerService';
import { AppointmentBookingModal } from '../features/AppointmentBookingModal/AppointmentBookingModal';

// Environment variables
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPTS_COL = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!;
const APPT_TYPES_COL = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENT_TYPES_COLLECTION_ID!;
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
  profile_picture_id?: string;
  bio?: string;
}

interface AppointmentTypeDocument extends Models.Document {
  appointment_type_id: number;
  type_name: string;
  base_cost: number;
  duration_minutes: number;
}

interface DashboardAppointment {
  id: string;
  date: string;
  time: string;
  providerName: string;
  type: string;
  reason: string;
  status: string;
}

// Doctor interface for the booking modal
interface Doctor {
  $id: string;
  name: string;
  gender: string;
  specialty: string;
  location: string;
  phone: string;
  availability: string;
  availability_start?: string;
  availability_end?: string;
  weekend_available: boolean;
  weekend_start?: string;
  weekend_end?: string;
  bio: string;
  profile_picture_id: string;
  provider_id: number;
  first_name: string;
  last_name: string;
  practice_name: string;
}

const DashboardOverview: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [nextAppointment, setNextAppointment] = useState<DashboardAppointment | null>(null);
  const [recentUpload, setRecentUpload] = useState<UploadedFile | null>(null);
  const [totalAppointments, setTotalAppointments] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [recommendedDoctor, setRecommendedDoctor] = useState<ProviderDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [providerList, setProviderList] = useState<Doctor[]>([]);
  
  // Health education state
  const [healthTip, setHealthTip] = useState<{title: string, content: string, category: string} | null>(null);

  // Helper function to get numeric patient_id from user (same logic as ApptTable)
  const getNumericUserId = (user: { userId?: string | number; id?: string | number; $id: string }): number => {
    if (user.userId) return Number(user.userId);
    if (user.id) return Number(user.id);
    return parseInt(user.$id.replace(/[^0-9]/g, "")) || Date.now();
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setNextAppointment(null);
          setRecentUpload(null);
          setTotalAppointments(0);
          setTotalFiles(0);
          setError("Please log in to view your dashboard.");
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
        setTotalAppointments(appointments.length);

        // Fetch all providers and appointment types for efficiency
        const [providersRes, appointmentTypesRes] = await Promise.all([
          databases.listDocuments(DB_ID, PROVIDERS_COL, [Query.limit(500)]),
          databases.listDocuments(DB_ID, APPT_TYPES_COL, [Query.limit(500)])
        ]);

        const providers = providersRes.documents as ProviderDocument[];
        const appointmentTypes = appointmentTypesRes.documents as AppointmentTypeDocument[];

        // Create appointment types lookup map
        const typesMap = new Map<number, AppointmentTypeDocument>();
        for (const type of appointmentTypes) {
          typesMap.set(type.appointment_type_id, type);
        }

        // Find next upcoming appointment
        const now = new Date();
        const upcomingAppointments = appointments.filter(apt => {
          const appointmentDate = new Date(apt.appointment_date);
          return appointmentDate >= now;
        }).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

        if (upcomingAppointments.length > 0) {
          const nextApt = upcomingAppointments[0];
          
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
          
          const providerName = provider 
            ? `${provider.first_name} ${provider.last_name}`.trim()
            : `Provider ID: ${nextApt.provider_id}`;

          // Get appointment type from the types map
          const appointmentType = typesMap.get(nextApt.appointment_type_id);
          const typeName = appointmentType?.type_name || `Type ID: ${nextApt.appointment_type_id}`;

          setNextAppointment({
            id: nextApt.$id,
            date: nextApt.appointment_date,
            time: nextApt.appointment_time,
            providerName,
            type: typeName,
            reason: nextApt.reason_for_visit || '',
            status: nextApt.status || 'scheduled'
          });
        } else {
          setNextAppointment(null);
        }

        // Find recommended doctor based on user's appointment history
        if (appointments.length > 0) {
          // Get specialties from user's past appointments
          const userProviderIds = [...new Set(appointments.map(apt => apt.provider_id))];
          const userProviders = providers.filter(p => 
            userProviderIds.some(id => {
              if (p.provider_id === id) return true;
              // Also check document ID pattern matching
              const providerIdStr = String(id);
              const docIdDigits = p.$id.replace(/[^0-9]/g, '');
              const providerIdDigits = providerIdStr.replace(/[^0-9]/g, '');
              return docIdDigits.length >= 12 && providerIdDigits.length >= 12 &&
                     docIdDigits.substring(0, 12) === providerIdDigits.substring(0, 12);
            })
          );

          const userSpecialties = [...new Set(userProviders.map(p => p.specialty).filter(Boolean))];
          
          if (userSpecialties.length > 0) {
            // Find providers in the same specialties that the user hasn't seen
            const recommendedProviders = providers.filter(p => 
              userSpecialties.includes(p.specialty) && 
              !userProviderIds.includes(p.provider_id) &&
              !userProviderIds.some(id => {
                const providerIdStr = String(id);
                const docIdDigits = p.$id.replace(/[^0-9]/g, '');
                const providerIdDigits = providerIdStr.replace(/[^0-9]/g, '');
                return docIdDigits.length >= 12 && providerIdDigits.length >= 12 &&
                       docIdDigits.substring(0, 12) === providerIdDigits.substring(0, 12);
              })
            );

            if (recommendedProviders.length > 0) {
              // Pick a random recommended provider
              const randomIndex = Math.floor(Math.random() * recommendedProviders.length);
              setRecommendedDoctor(recommendedProviders[randomIndex]);
            } else {
              // If no providers in same specialty, recommend a highly-rated general provider
              const generalProviders = providers.filter(p => 
                p.specialty && 
                (p.specialty.toLowerCase().includes('primary') || 
                 p.specialty.toLowerCase().includes('family') ||
                 p.specialty.toLowerCase().includes('internal')) &&
                !userProviderIds.includes(p.provider_id)
              );
              
              if (generalProviders.length > 0) {
                const randomIndex = Math.floor(Math.random() * generalProviders.length);
                setRecommendedDoctor(generalProviders[randomIndex]);
              }
            }
          } else {
            // If no specialty info, recommend a general provider
            const generalProviders = providers.filter(p => 
              p.specialty && 
              (p.specialty.toLowerCase().includes('primary') || 
               p.specialty.toLowerCase().includes('family') ||
               p.specialty.toLowerCase().includes('internal'))
            );
            
            if (generalProviders.length > 0) {
              const randomIndex = Math.floor(Math.random() * generalProviders.length);
              setRecommendedDoctor(generalProviders[randomIndex]);
            }
          }
        } else {
          // For new users, recommend a primary care provider
          const primaryCareProviders = providers.filter(p => 
            p.specialty && 
            (p.specialty.toLowerCase().includes('primary') || 
             p.specialty.toLowerCase().includes('family') ||
             p.specialty.toLowerCase().includes('internal'))
          );
          
          if (primaryCareProviders.length > 0) {
            const randomIndex = Math.floor(Math.random() * primaryCareProviders.length);
            setRecommendedDoctor(primaryCareProviders[randomIndex]);
          }
        }

        // Fetch user's files
        try {
          const userFiles = await uploadService.getUserFiles(user.$id);
          setTotalFiles(userFiles.length);

          // Find most recent upload
          if (userFiles.length > 0) {
            const sortedFiles = userFiles.sort((a, b) => 
              new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );
            setRecentUpload(sortedFiles[0]);
          } else {
            setRecentUpload(null);
          }
        } catch (fileError) {
          console.error('Error fetching files:', fileError);
          setTotalFiles(0);
          setRecentUpload(null);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    // Handle both time-only format (HH:MM) and full datetime format
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    
    const date = new Date(timeString);
    return isNaN(date.getTime()) 
      ? timeString 
      : date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
  };

  const formatUploadDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Set both dates to start of day for accurate comparison
    const uploadDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = today.getTime() - uploadDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper function to get doctor image URL using the same method as ProviderSearch
  const getDoctorImageUrl = (provider: ProviderDocument): string => {
    if (provider.profile_picture_id) {
      // Use the same method as providerService to get the image URL
      return providerService.getProfileImageUrl(provider.profile_picture_id);
    }
    // Return default avatar if no profile picture
    return '/default-avatar.svg';
  };

  // Convert ProviderDocument to Doctor interface for booking modal
  const convertProviderToDoctor = (provider: ProviderDocument): Doctor => {
    return {
      $id: provider.$id,
      name: `${provider.first_name} ${provider.last_name}`.trim(),
      gender: '', // Not available in ProviderDocument
      specialty: provider.specialty || '',
      location: provider.practice_name || '',
      phone: '', // Not available in ProviderDocument
      availability: '', // Not available in ProviderDocument
      availability_start: '9am', // Default availability
      availability_end: '5pm', // Default availability
      weekend_available: false, // Default
      weekend_start: undefined,
      weekend_end: undefined,
      bio: provider.bio || '',
      profile_picture_id: provider.profile_picture_id || '',
      provider_id: provider.provider_id,
      first_name: provider.first_name,
      last_name: provider.last_name,
      practice_name: provider.practice_name || ''
    };
  };

  // Handle booking appointment for recommended doctor
  const handleBookRecommendedDoctor = () => {
    if (recommendedDoctor) {
      const doctorForModal = convertProviderToDoctor(recommendedDoctor);
      setProviderList([doctorForModal]);
      setSelectedProviderId(recommendedDoctor.$id);
      setIsBookingModalOpen(true);
    }
  };

  // Handle appointment booked callback
  const handleAppointmentBooked = () => {
    setIsBookingModalOpen(false);
    // Refresh dashboard data to show new appointment
    window.location.reload();
  };

  // Health education tips database
  const healthTips = [
    {
      title: "Stay Hydrated",
      content: "Drink at least 8 glasses of water daily to maintain proper hydration and support your body's vital functions.",
      category: "Nutrition"
    },
    {
      title: "Get Quality Sleep",
      content: "Aim for 7-9 hours of sleep each night. Good sleep improves immune function, mental clarity, and overall health.",
      category: "Wellness"
    },
    {
      title: "Exercise Regularly",
      content: "Just 30 minutes of moderate exercise 5 times a week can reduce your risk of heart disease, diabetes, and depression.",
      category: "Fitness"
    },
    {
      title: "Eat More Fruits & Vegetables",
      content: "Try to fill half your plate with colorful fruits and vegetables. They're packed with vitamins, minerals, and antioxidants.",
      category: "Nutrition"
    },
    {
      title: "Practice Deep Breathing",
      content: "Take 5 minutes daily for deep breathing exercises. It can reduce stress, lower blood pressure, and improve focus.",
      category: "Mental Health"
    },
    {
      title: "Wash Your Hands",
      content: "Proper handwashing for 20 seconds with soap and water is one of the best ways to prevent illness and infection.",
      category: "Prevention"
    },
    {
      title: "Limit Screen Time",
      content: "Take regular breaks from screens using the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.",
      category: "Wellness"
    },
    {
      title: "Stay Connected",
      content: "Maintain social connections with family and friends. Strong relationships are linked to better mental and physical health.",
      category: "Mental Health"
    },
    {
      title: "Schedule Regular Checkups",
      content: "Don't skip your annual physical and recommended screenings. Early detection is key to preventing serious health issues.",
      category: "Prevention"
    },
    {
      title: "Manage Stress",
      content: "Find healthy ways to cope with stress like meditation, yoga, or talking to a counselor. Chronic stress affects your entire body.",
      category: "Mental Health"
    },
    {
      title: "Protect Your Skin",
      content: "Use sunscreen with at least SPF 30 daily, even on cloudy days. Skin cancer is highly preventable with proper protection.",
      category: "Prevention"
    },
    {
      title: "Take Medication as Prescribed",
      content: "Follow your doctor's instructions exactly when taking medications. Set reminders if needed and never skip doses.",
      category: "Treatment"
    }
  ];

  // Function to get a random health tip
  const getRandomHealthTip = () => {
    const randomIndex = Math.floor(Math.random() * healthTips.length);
    return healthTips[randomIndex];
  };

  // Set random health tip on component mount
  useEffect(() => {
    setHealthTip(getRandomHealthTip());
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        {/* Main cards grid loading */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg h-48 animate-pulse"></div>
            ))}
          </div>
        </div>
      {/* Recommended doctor card loading */}
      <div className="lg:w-96">
        <div className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
      </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-1">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Please Log In</h3>
            <p className="text-yellow-700 mb-4">You need to be logged in to view your dashboard overview.</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col mt-24 lg:flex-row gap-6 mb-8">
          {/* Main cards grid */}
          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Next Appointment Card */}
              <OverviewCards
                title="Next Appointment"
                value={nextAppointment ? formatDate(nextAppointment.date) : 'None scheduled'}
                description={nextAppointment ? `${formatTime(nextAppointment.time)} - ${nextAppointment.type}\n${nextAppointment.providerName}` : 'Schedule your next appointment'}
                actionText={nextAppointment ? 'View Details' : 'Book Now'}
                onAction={() => nextAppointment ? router.push('/dashboard/appointments') : router.push('/search')}
                status={nextAppointment ? 'primary' : 'warning'}
                icon={
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />

              {/* Recent File Upload Card */}
              <OverviewCards
                title="Recent Upload"
                value={recentUpload ? recentUpload.fileName : 'No files'}
                description={recentUpload ? `${formatUploadDate(recentUpload.uploadedAt)} • ${uploadService.formatFileSize(recentUpload.fileSize)}` : 'Upload your first file'}
                actionText={recentUpload ? 'View Files' : 'Upload Now'}
                onAction={() => router.push('/dashboard/fileManager')}
                status="default"
                icon={
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />

              {/* Total Appointments Card */}
              <OverviewCards
                title="Total Appointments"
                value={totalAppointments}
                description="All time appointments"
                actionText="View All"
                onAction={() => router.push('/dashboard/appointments')}
                status="default"
                icon={
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />

              {/* Total Files Card */}
              <OverviewCards
                title="Files Stored"
                value={totalFiles}
                description="Documents & records"
                actionText="Manage Files"
                onAction={() => router.push('/dashboard/fileManager')}
                status="default"
                icon={
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Recommended Doctor Card - Separate on the right */}
          <div className="lg:w-1/3">
            <OverviewCards
              title="Recommended Doctor"
              value={recommendedDoctor ? `${recommendedDoctor.first_name} ${recommendedDoctor.last_name}` : 'No recommendations'}
              description={
                recommendedDoctor 
                  ? `${recommendedDoctor.specialty}\n${recommendedDoctor.practice_name}${
                      recommendedDoctor.bio ? `\n\n${recommendedDoctor.bio}` : ''
                    }`
                  : 'Complete an appointment to get recommendations'
              }
              actionText={recommendedDoctor ? 'Book Appointment' : 'Find Doctors'}
              onAction={recommendedDoctor ? handleBookRecommendedDoctor : () => router.push('/search')}
              status="default"
              image={recommendedDoctor ? getDoctorImageUrl(recommendedDoctor) : undefined}
              isRecommendedDoctor={true}
              icon={
                !recommendedDoctor ? (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ) : undefined
              }
            />
          </div>
        </div>

      {/* Appointment Booking Modal */}
      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        providerId={selectedProviderId}
        providerList={providerList}
        onAppointmentBooked={handleAppointmentBooked}
      />

      {/* Health Education Card - Full Width at Bottom */}
      {healthTip && (
        <div className="mb-8">
          <OverviewCards
            title="Health Tip of the Day"
            value={healthTip.title}
            description={`${healthTip.content}\n\nCategory: ${healthTip.category}`}
            actionText="Get New Tip"
            onAction={() => setHealthTip(getRandomHealthTip())}
            status="default"
            icon={
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />
      </div>
    )}
  </>
  );
};

export default DashboardOverview;
