"use client";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useAuth } from "@/app/providers/AuthProvider";
import { appointmentFlowService, BookAppointmentWithIntakeInput, AppointmentWithIntakeForm } from "@/app/services/appointmentFlowService";
import { useAppointmentTypes } from "@/app/services/appointmentService";
import Link from "next/link";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId?: string;
  providerList: Doctor[];
  onAppointmentBooked?: () => void;
}

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
	availability_day?: number[]; // Array of available days (1=Monday, 2=Tuesday, ..., 7=Sunday)
	bio: string;
	profile_picture_id: string;
	provider_id: number; // Make this required to match the actual provider data
	first_name: string;
	last_name: string;
	practice_name: string;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({ 
  isOpen, 
  onClose, 
  providerId = "", 
  providerList = [],
  onAppointmentBooked 
}) => {
  const [appointmentType, setAppointmentType] = useState("");
  const { user, isLoading } = useAuth();
  
  const { appointmentTypes, loading: appointmentTypesLoading } = useAppointmentTypes({ isActive: true });

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [notes, setNotes] = useState("");
  const [preFillExistingData, setPreFillExistingData] = useState(false);
  
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>({
    $id: "",
    name: "",
    gender: "",
    specialty: "",
    location: "",
    phone: "",
    availability: "",
    weekend_available: false,
    availability_day: [],
    bio: "",
    profile_picture_id: "",
    provider_id: 0,
    first_name: "",
    last_name: "",
    practice_name: "",
  });
  
  const [appointmentBooked, setAppointmentBooked] = useState<boolean>(false);
  const [appointmentIsSaving, setAppointmentIsSaving] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>("");
  const [bookedAppointmentData, setBookedAppointmentData] = useState<AppointmentWithIntakeForm | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState<boolean>(false);

  const modalRef = useRef<HTMLDialogElement>(null);

  const formattedDate = date?.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatTime = (time: string) => {
    // Handle format like "8am", "5pm", "12pm", "12am"
    const amPmMatch = time.match(/(\d{1,2})(am|pm)/i);
    if (amPmMatch) {
      const hours = parseInt(amPmMatch[1]);
      const period = amPmMatch[2].toUpperCase();
      return `${hours}:00 ${period}`;
    }
    
    // Handle format like "09:00", "17:30"
    if (time.includes(':')) {
      const [hours, minutes] = time.split(":");
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
      return `${hour12}:${minutes} ${ampm}`;
    }
    
    return time; // Return as-is if format is unrecognized
  };

  // Check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if date is in the past
    if (date < today) {
      return true;
    }
    
    // Check if the day of week is available for this provider
    // JavaScript getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
    // Database availability_day: 1=Monday, 2=Tuesday, ..., 7=Sunday
    const jsDay = date.getDay(); // 0-6
    const dbDay = jsDay === 0 ? 7 : jsDay; // Convert Sunday from 0 to 7, others stay same
    
    // Check if this day is in the provider's availability_day array
    if (selectedDoctor?.availability_day && selectedDoctor.availability_day.length > 0) {
      return !selectedDoctor.availability_day.includes(dbDay);
    }
    
    // If no availability_day data, fall back to weekend_available logic
    const isWeekend = jsDay === 0 || jsDay === 6; // Sunday or Saturday
    if (isWeekend && !selectedDoctor?.weekend_available) {
      return true;
    }
    
    return false;
  };

  const handleAppointmentType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAppointmentType(e.target.value);
  };

  const handleTimeSelection = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setAppointmentTime(e.target.value);
    
  const handleVisitReason = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setReasonForVisit(e.target.value);

  const handleNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setNotes(e.target.value);

  // Generate available time slots based on provider availability
  const generateAvailableTimeSlots = async (selectedDate: Date, doctor: Doctor, appointmentDuration: number = 30) => {
    console.log('=== generateAvailableTimeSlots ===');
    console.log('selectedDate:', selectedDate);
    console.log('doctor:', doctor);
    console.log('appointmentDuration:', appointmentDuration);

    if (!selectedDate || !doctor.$id) {
      console.log('Missing selectedDate or doctor.$id');
      return [];
    }

    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = selectedDate.toISOString().split('T')[0];

    console.log('dayOfWeek:', dayOfWeek, 'isWeekend:', isWeekend, 'dateStr:', dateStr);

    // Check if this day is available using availability_day field
    // JavaScript getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
    // Database availability_day: 1=Monday, 2=Tuesday, ..., 7=Sunday
    const jsDay = dayOfWeek; // 0-6
    const dbDay = jsDay === 0 ? 7 : jsDay; // Convert Sunday from 0 to 7, others stay same
    
    // Check if this day is in the provider's availability_day array
    if (doctor.availability_day && doctor.availability_day.length > 0) {
      if (!doctor.availability_day.includes(dbDay)) {
        console.log(`Day ${dbDay} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][jsDay]}) not in availability_day:`, doctor.availability_day);
        return []; // Provider not available on this day
      }
    }

    // Determine provider availability hours
    let startTime: string | undefined;
    let endTime: string | undefined;

    if (isWeekend && doctor.weekend_available) {
      startTime = doctor.weekend_start;
      endTime = doctor.weekend_end;
      console.log('Using weekend hours:', startTime, '-', endTime);
    } else if (!isWeekend) {
      startTime = doctor.availability_start;
      endTime = doctor.availability_end;
      console.log('Using weekday hours:', startTime, '-', endTime);
    }

    if (!startTime || !endTime) {
      console.log('No availability for this day - startTime:', startTime, 'endTime:', endTime);
      return []; // Provider not available on this day
    }

    // Parse time strings to minutes since midnight
    const parseTimeToMinutes = (timeStr: string): number => {
      // Handle format like "8am", "5pm", "12pm", "12am"
      const amPmMatch = timeStr.match(/(\d{1,2})(am|pm)/i);
      if (amPmMatch) {
        let hours = parseInt(amPmMatch[1]);
        const period = amPmMatch[2].toLowerCase();
        
        // Convert to 24-hour format
        if (period === 'pm' && hours !== 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }
        
        return hours * 60; // No minutes for am/pm format
      }
      
      // Handle format like "09:00", "17:30"
      if (timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      }
      
      return 0; // Default fallback
    };

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    console.log('startMinutes:', startMinutes, 'endMinutes:', endMinutes);

    // Generate all possible time slots
    const timeSlots: string[] = [];
    for (let minutes = startMinutes; minutes < endMinutes; minutes += appointmentDuration) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }

    console.log('Generated time slots:', timeSlots);

    // If it's today, filter out past time slots
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let availableSlots = timeSlots;
    if (selectedDate.getTime() === today.getTime()) {
      console.log('Filtering past times for today');
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      availableSlots = timeSlots.filter(slot => {
        const slotMinutes = parseTimeToMinutes(slot);
        return slotMinutes > currentMinutes + 60; // Must be at least 1 hour in the future
      });
      console.log('Available slots after filtering past times:', availableSlots);
    }

    // For now, skip conflict checking to debug the basic slot generation
    console.log('Final available slots:', availableSlots);
    return availableSlots;

    // TODO: Re-enable conflict checking once basic slot generation works
    // Check for existing appointments and filter out conflicting slots
    // try {
    // 	const numericProviderId = getNumericProviderId(doctor);
    // 	const conflictingSlots: string[] = [];

    // 	// Check each slot for conflicts
    // 	for (const slot of availableSlots) {
    // 		const hasConflict = await appointmentBookingService.checkAppointmentConflict(
    // 			0, // We don't need patient ID for this check
    // 			numericProviderId,
    // 			dateStr,
    // 			slot,
    // 			appointmentDuration
    // 		);
    // 		if (hasConflict) {
    // 			conflictingSlots.push(slot);
    // 		}
    // 	}

    // 	// Remove conflicting slots
    // 	return availableSlots.filter(slot => !conflictingSlots.includes(slot));
    // } catch (error) {
    // 	console.error('Error checking appointment conflicts:', error);
    // 	return availableSlots; // Return all slots if conflict check fails
    // }
  };

  // Load available time slots when date or doctor changes
  useEffect(() => {
    const loadTimeSlots = async () => {
      console.log('loadTimeSlots useEffect triggered');
      console.log('date:', date);
      console.log('selectedDoctor.$id:', selectedDoctor.$id);
      console.log('appointmentType:', appointmentType);

      if (!date || !selectedDoctor.$id) {
        console.log('Missing date or selectedDoctor.$id, clearing slots');
        setAvailableTimeSlots([]);
        return;
      }

      setLoadingTimeSlots(true);
      setAppointmentTime(''); // Reset selected time

      try {
        // Get appointment duration from selected appointment type, or use default
        let duration = 30; // Default duration
        if (appointmentType) {
          const selectedAppointmentType = appointmentTypes.find(
            type => type.appointment_type_id.toString() === appointmentType
          );
          duration = selectedAppointmentType?.duration_minutes || 30;
        }

        console.log('Using duration:', duration);
        const slots = await generateAvailableTimeSlots(date, selectedDoctor, duration);
        console.log('Setting available time slots:', slots);
        setAvailableTimeSlots(slots);
      } catch (error) {
        console.error('Error loading time slots:', error);
        setAvailableTimeSlots([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };

    loadTimeSlots();
  }, [date, selectedDoctor, appointmentType, appointmentTypes]);

  // Helper function to get numeric IDs
  const getNumericUserId = (user: { userId?: string | number; id?: string | number; $id: string }): number => {
    // If your user has a numeric ID field, use that
    if (user.userId) return Number(user.userId);
    if (user.id) return Number(user.id);
    
    // Otherwise, convert the string ID to a number (hash or simple conversion)
    // You might need to adjust this based on your user ID structure
    return parseInt(user.$id.replace(/[^0-9]/g, '')) || Date.now();
  };

  const getNumericProviderId = (doctor: Doctor): number => {
    // Use the provider_id if available, otherwise convert $id
    if (doctor.provider_id) return doctor.provider_id;
    
    // Convert string ID to number - adjust this logic as needed
    return parseInt(doctor.$id.replace(/[^0-9]/g, '')) || 1;
  };

  const handleSubmit = async () => {
    try {
      if (!user) {
        setBookingError("You must be logged in to book an appointment.");
        return;
      }

      if (!appointmentType || !date || !appointmentTime || !reasonForVisit.trim()) {
        setBookingError("Please fill in all required fields.");
        return;
      }

      setAppointmentIsSaving(true);
      setBookingError("");

      const appointmentDateStr = date.toISOString().split('T')[0];
      const numericUserId = getNumericUserId(user);
      const numericProviderId = getNumericProviderId(selectedDoctor);

      // Check if booking is allowed
      const canBook = await appointmentFlowService.canBookAppointment(
        numericUserId,
        numericProviderId,
        appointmentDateStr,
        appointmentTime
      );

      if (!canBook.canBook) {
        setBookingError(canBook.reason || "This time slot is not available.");
        setAppointmentIsSaving(false);
        return;
      }

      const bookingData: BookAppointmentWithIntakeInput = {
        auth_user_id: user.$id,
        patient_id: numericUserId,
        provider_id: numericProviderId,
        appointment_type_id: parseInt(appointmentType),
        appointment_date: appointmentDateStr,
        appointment_time: appointmentTime,
        reason_for_visit: reasonForVisit.trim(),
        notes: notes.trim(),
        pre_fill_existing_data: preFillExistingData,
      };

      const result = await appointmentFlowService.bookAppointmentWithIntake(bookingData);
      
      setBookedAppointmentData(result);
      setAppointmentBooked(true);
      
      if (onAppointmentBooked) {
        onAppointmentBooked();
      }

    } catch (error) {
      console.error("Error booking appointment:", error);
      setBookingError(error instanceof Error ? error.message : "Failed to book appointment. Please try again.");
    } finally {
      setAppointmentIsSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    onClose();
    setTimeout(() => {
      setAppointmentBooked(false);
      setAppointmentType("");
      setDate(new Date());
      setAppointmentTime("");
      setReasonForVisit("");
      setNotes("");
      setBookingError("");
      setBookedAppointmentData(null);
      setPreFillExistingData(false);
    }, 300);
  };

  const resetForm = () => {
    setAppointmentType("");
    setDate(new Date());
    setAppointmentTime("");
    setReasonForVisit("");
    setNotes("");
    setBookingError("");
    setAppointmentBooked(false);
    setBookedAppointmentData(null);
    setPreFillExistingData(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetForm, 300);
  };

  useEffect(() => {
    const fetchSelectedDoctor = (id: string) => {
      return providerList.filter((provider) => provider.$id === id);
    };

    const modal = modalRef.current;
    if (!modal) return;

    if (isOpen) {
      if (!modal.open) {
        const selectedDoctorArray = fetchSelectedDoctor(providerId);
        
        if (selectedDoctorArray.length > 0) {
          setSelectedDoctor(selectedDoctorArray[0]);
        } else {
          console.log('No doctor found with ID:', providerId);
        }

        modal.showModal();
      }
    } else {
      if (modal.open) {
        modal.close();
      }
    }
  }, [isOpen, providerId, providerList]);

  if (isLoading || appointmentTypesLoading) {
    return (
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={handleClose}
      >
        <div className="modal-box bg-base-100">
          <div className="text-center py-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4">Loading...</p>
          </div>
        </div>
      </dialog>
    );
  }

  if (appointmentBooked && bookedAppointmentData) {
    return (
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={handleClose}
      >
        <div className="modal-box bg-base-100">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="font-bold text-lg mb-2 text-success">Success!</h1>
            <h2 className="font-bold text-lg mb-4">
              Your appointment is confirmed!
            </h2>

            <div className="bg-base-200 p-4 rounded-lg mb-6">
              <p className="mb-2">
                <span className="font-semibold text-primary">
                  {selectedDoctor.name}
                </span>
              </p>
              <p className="mb-2">
                <span className="font-semibold">{formattedDate}</span>
              </p>
              <p className="mb-2">
                <span className="font-semibold">
                  {formatTime(appointmentTime)}
                </span>
              </p>
            </div>

            <div className="bg-info/10 border border-info/20 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-info mb-2">📋 Next Steps</h3>
              <p className="text-sm mb-2">
                We&apos;ve automatically created an intake form for your appointment. 
                Please complete it before your visit to help us prepare for your care.
              </p>
              <p className="text-xs text-base-content/70">
                Intake Form #: IF-{bookedAppointmentData.appointment.appointment_id.toString().slice(-6)}
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard/forms"
                className="btn btn-primary flex-1"
                onClick={handleCloseSuccess}
              >
                Complete Intake Form
              </Link>
              <Link
                href="/dashboard/appointments"
                className="btn btn-outline flex-1"
                onClick={handleCloseSuccess}
              >
                View Appointments
              </Link>
            </div>

            <div className="modal-action justify-center">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleCloseSuccess}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </dialog>
    );
  }

  if (user) {
    return (
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={handleClose}
      >
        <div className="modal-box bg-primary">
          <h3 className="font-bold text-lg text-base-content text-center">
            Book Appointment With: {selectedDoctor.name}
          </h3>

          {bookingError && (
            <div className="alert alert-error mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">{bookingError}</span>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <select
              value={appointmentType}
              className="select select-bordered w-3/4 mt-2 bg-base-200 text-base-content"
              onChange={handleAppointmentType}
              disabled={appointmentIsSaving}
            >
              <option value="">Select Appointment Type</option>
              {appointmentTypes
                .sort((a, b) => a.appointment_type_id - b.appointment_type_id)
                .map((aT) => (
                  <option
                    key={aT.appointment_type_id}
                    value={aT.appointment_type_id}
                  >
                    {aT.type_name} ({aT.duration_minutes} min) - ${aT.base_cost}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-center mt-6 mb-6">
            <DayPicker
              className="react-day-picker bg-base-200 border border-base-300 rounded-lg p-4"
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={isDateDisabled}
              footer={
                date
                  ? `Selected: ${date.toLocaleDateString()}`
                  : "Pick a day."
              }
            />
          </div>

          <div className="flex justify-center mt-2">
            <select
              value={appointmentTime}
              className="select bg-base-200 text-base-content select-bordered w-3/4"
              onChange={handleTimeSelection}
              disabled={appointmentIsSaving || loadingTimeSlots}
            >
              <option value="" disabled>
                {loadingTimeSlots 
                  ? "Loading available times..." 
                  : availableTimeSlots.length === 0 
                    ? "No available times for this date"
                    : "Please Select an Appointment Time"
                }
              </option>
              {availableTimeSlots.map((timeSlot) => (
                <option key={timeSlot} value={timeSlot}>
                  {formatTime(timeSlot)}
                </option>
              ))}
            </select>
          </div>

          {/* Show availability info */}
          {date && selectedDoctor.$id && (
            <div className="flex justify-center mt-2">
              <div className="text-sm text-base-content/70 text-center">
                {(() => {
                  const dayOfWeek = date.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                  
                  if (isWeekend && selectedDoctor.weekend_available && selectedDoctor.weekend_start && selectedDoctor.weekend_end) {
                    return `${dayName}: ${formatTime(selectedDoctor.weekend_start)} - ${formatTime(selectedDoctor.weekend_end)}`;
                  } else if (!isWeekend && selectedDoctor.availability_start && selectedDoctor.availability_end) {
                    return `${dayName}: ${formatTime(selectedDoctor.availability_start)} - ${formatTime(selectedDoctor.availability_end)}`;
                  } else {
                    return `${selectedDoctor.name} is not available on ${dayName}s`;
                  }
                })()}
              </div>
            </div>
          )}

          <form className="py-4 flex justify-center">
            <div className="flex flex-col w-3/4">
              <label className="mb-3">Reason for Visit: *</label>
              <textarea
                value={reasonForVisit}
                onChange={handleVisitReason}
                id={"visitReason"}
                className="textarea textarea-bordered bg-base-200 text-base-content w-full mb-4"
                rows={3}
                disabled={appointmentIsSaving}
                placeholder="Please describe the reason for your visit..."
              ></textarea>
              
              <label className="mb-3">Additional Notes: (Optional)</label>
              <textarea
                value={notes}
                onChange={handleNotes}
                id={"notes"}
                className="textarea textarea-bordered bg-base-200 text-base-content w-full mb-4"
                rows={3}
                disabled={appointmentIsSaving}
                placeholder="Any additional information you'd like to share..."
              ></textarea>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text text-sm">
                    Pre-fill intake form with existing medical information
                  </span>
                  <input
                    type="checkbox"
                    checked={preFillExistingData}
                    onChange={(e) => setPreFillExistingData(e.target.checked)}
                    className="checkbox checkbox-primary"
                    disabled={appointmentIsSaving}
                  />
                </label>
                <div className="label">
                  <span className="label-text-alt text-xs text-base-content/70">
                    If checked, we&apos;ll pre-fill your intake form with previously entered allergies and medications
                  </span>
                </div>
              </div>
            </div>
          </form>

          <div className="bg-info/10 border border-info/20 p-3 rounded-lg mb-4 mx-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-info">ℹ️</span>
              <span className="font-semibold text-sm">What happens next?</span>
            </div>
            <p className="text-xs text-base-content/80">
              After booking, we&apos;ll automatically create an intake form for you to complete. 
              This helps us prepare for your visit and ensures we have your current medical information.
            </p>
          </div>

          <div className="modal-action flex gap-4 justify-center">
            <button
              className="btn btn-primary btn-sm"
              disabled={appointmentIsSaving || !appointmentType || !date || !appointmentTime || !reasonForVisit.trim()}
              onClick={handleSubmit}
            >
              {appointmentIsSaving && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              {appointmentIsSaving
                ? "Booking Appointment..."
                : "Book Appointment & Create Forms"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClose}
              disabled={appointmentIsSaving}
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    );
  } else {
    return (
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={handleClose}
      >
        <div className="modal-box bg-base-100">
          <div className="text-center">
            <h2 className="font-bold text-lg mb-4">Ready to Book?</h2>
            <p className="mb-6">
              Please sign in to continue, or sign up to create your account and
              manage appointments.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/login" className="btn btn-primary flex-1">
                Sign In
              </Link>
              <Link href="/register" className="btn btn-outline flex-1">
                Sign Up
              </Link>
            </div>

            <div className="modal-action justify-center">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </dialog>
    );
  }
};
