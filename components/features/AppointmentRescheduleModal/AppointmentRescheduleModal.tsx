"use client";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useAuth } from "@/app/providers/AuthProvider";
import { appointmentFlowService } from "@/app/services/appointmentFlowService";
import { useAppointmentTypes } from "@/app/services/appointmentService";

interface AppointmentRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    appointmentId: string;
    date: string;
    time: string;
    doctor: string;
    facility: string;
    appointmentType: string;
    reason: string;
    providerId?: string;
    appointmentTypeId?: number;
  } | null;
  onAppointmentRescheduled?: () => void;
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
  bio: string;
  profile_picture_id: string;
  provider_id: number;
  first_name: string;
  last_name: string;
  practice_name: string;
}

export const AppointmentRescheduleModal: React.FC<AppointmentRescheduleModalProps> = ({ 
  isOpen, 
  onClose, 
  appointment,
  onAppointmentRescheduled 
}) => {
  const [appointmentType, setAppointmentType] = useState("");
  const { user, isLoading } = useAuth();
  
  const { appointmentTypes, loading: appointmentTypesLoading } = useAppointmentTypes({ isActive: true });

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointmentTime, setAppointmentTime] = useState("");
  
  const [appointmentRescheduled, setAppointmentRescheduled] = useState<boolean>(false);
  const [appointmentIsSaving, setAppointmentIsSaving] = useState<boolean>(false);
  const [rescheduleError, setRescheduleError] = useState<string>("");
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

  const handleAppointmentType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAppointmentType(e.target.value);
  };

  const handleTimeSelection = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setAppointmentTime(e.target.value);

  // Helper function to get numeric IDs
  const getNumericUserId = (user: { userId?: string | number; id?: string | number; $id: string }): number => {
    if (user.userId) return Number(user.userId);
    if (user.id) return Number(user.id);
    return parseInt(user.$id.replace(/[^0-9]/g, '')) || Date.now();
  };

  // Generate basic time slots (simplified version)
  const generateBasicTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Load available time slots when date changes
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!date) {
        setAvailableTimeSlots([]);
        return;
      }

      setLoadingTimeSlots(true);
      setAppointmentTime(''); // Reset selected time

      try {
        // For now, use basic time slots
        // In a full implementation, you'd check provider availability and conflicts
        const slots = generateBasicTimeSlots();
        
        // If it's today, filter out past time slots
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        let availableSlots = slots;
        if (date.getTime() === today.getTime()) {
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          availableSlots = slots.filter(slot => {
            const [hours, minutes] = slot.split(':').map(Number);
            const slotMinutes = hours * 60 + minutes;
            return slotMinutes > currentMinutes + 60; // Must be at least 1 hour in the future
          });
        }

        setAvailableTimeSlots(availableSlots);
      } catch (error) {
        console.error('Error loading time slots:', error);
        setAvailableTimeSlots([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };

    loadTimeSlots();
  }, [date]);

  const handleSubmit = async () => {
    try {
      if (!user || !appointment) {
        setRescheduleError("Unable to reschedule appointment.");
        return;
      }

      if (!date || !appointmentTime) {
        setRescheduleError("Please select a new date and time.");
        return;
      }

      setAppointmentIsSaving(true);
      setRescheduleError("");

      const appointmentDateStr = date.toISOString().split('T')[0];
      const numericUserId = getNumericUserId(user);
      const newAppointmentTypeId = appointmentType ? parseInt(appointmentType) : appointment.appointmentTypeId;

      // Reschedule the appointment
      const result = await appointmentFlowService.rescheduleAppointmentWithIntake(
        appointment.appointmentId,
        numericUserId,
        appointmentDateStr,
        appointmentTime,
        newAppointmentTypeId
      );
      
      setAppointmentRescheduled(true);
      
      if (onAppointmentRescheduled) {
        onAppointmentRescheduled();
      }

    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      setRescheduleError(error instanceof Error ? error.message : "Failed to reschedule appointment. Please try again.");
    } finally {
      setAppointmentIsSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    onClose();
    setTimeout(() => {
      setAppointmentRescheduled(false);
      setAppointmentType("");
      setDate(new Date());
      setAppointmentTime("");
      setRescheduleError("");
    }, 300);
  };

  const resetForm = () => {
    setAppointmentType("");
    setDate(new Date());
    setAppointmentTime("");
    setRescheduleError("");
    setAppointmentRescheduled(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetForm, 300);
  };

  // Initialize form when appointment changes
  useEffect(() => {
    if (appointment && appointmentTypes.length > 0) {
      // Try to find the current appointment type
      const currentType = appointmentTypes.find(type => 
        type.type_name === appointment.appointmentType.split(' (')[0]
      );
      if (currentType) {
        setAppointmentType(currentType.appointment_type_id.toString());
      }
    }
  }, [appointment, appointmentTypes]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    if (isOpen) {
      if (!modal.open) {
        modal.showModal();
      }
    } else {
      if (modal.open) {
        modal.close();
      }
    }
  }, [isOpen]);

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

  if (appointmentRescheduled) {
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
              Your appointment has been rescheduled!
            </h2>

            <div className="bg-base-200 p-4 rounded-lg mb-6">
              <p className="mb-2">
                <span className="font-semibold text-primary">
                  {appointment?.doctor}
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
              <h3 className="font-semibold text-info mb-2">📋 Your Intake Form</h3>
              <p className="text-sm mb-2">
                Your existing intake form will remain connected to this rescheduled appointment. 
                No need to fill it out again!
              </p>
            </div>

            <div className="modal-action justify-center">
              <button
                type="button"
                className="btn btn-primary"
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

  if (!appointment) {
    return null;
  }

  return (
    <dialog
      ref={modalRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={handleClose}
    >
      <div className="modal-box bg-primary">
        <h3 className="font-bold text-lg text-base-content text-center">
          Reschedule Appointment
        </h3>

        <div className="bg-base-200 p-4 rounded-lg mt-4 mb-4">
          <h4 className="font-semibold mb-2">Current Appointment:</h4>
          <p className="text-sm"><strong>Doctor:</strong> {appointment.doctor}</p>
          <p className="text-sm"><strong>Date:</strong> {appointment.date}</p>
          <p className="text-sm"><strong>Time:</strong> {appointment.time}</p>
          <p className="text-sm"><strong>Type:</strong> {appointment.appointmentType}</p>
        </div>

        {rescheduleError && (
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
            <span className="text-sm">{rescheduleError}</span>
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
            disabled={{
              before: new Date(), // Disable past dates
            }}
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
                  : "Please Select a New Appointment Time"
              }
            </option>
            {availableTimeSlots.map((timeSlot) => (
              <option key={timeSlot} value={timeSlot}>
                {formatTime(timeSlot)}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-info/10 border border-info/20 p-3 rounded-lg mb-4 mx-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-info">ℹ️</span>
            <span className="font-semibold text-sm">About Rescheduling</span>
          </div>
          <p className="text-xs text-base-content/80">
            Your existing intake form will remain connected to this appointment after rescheduling. 
            You won&apos;t need to fill it out again.
          </p>
        </div>

        <div className="modal-action flex gap-4 justify-center">
          <button
            className="btn btn-primary btn-sm"
            disabled={appointmentIsSaving || !date || !appointmentTime}
            onClick={handleSubmit}
          >
            {appointmentIsSaving && (
              <span className="loading loading-spinner loading-xs"></span>
            )}
            {appointmentIsSaving
              ? "Rescheduling..."
              : "Reschedule Appointment"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleClose}
            disabled={appointmentIsSaving}
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
};
