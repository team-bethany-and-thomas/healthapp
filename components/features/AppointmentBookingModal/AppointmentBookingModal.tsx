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
	weekend_available: boolean;
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
  const [preFillExistingData, setPreFillExistingData] = useState(true); // New option for pre-filling
  
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>({
    $id: "",
    name: "",
    gender: "",
    specialty: "",
    location: "",
    phone: "",
    availability: "",
    weekend_available: false,
    bio: "",
    profile_picture_id: "",
  });
  
  const [appointmentBooked, setAppointmentBooked] = useState<boolean>(false);
  const [appointmentIsSaving, setAppointmentIsSaving] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>("");
  const [bookedAppointmentData, setBookedAppointmentData] = useState<AppointmentWithIntakeForm | null>(null);

	const [date, setDate] = useState<Date | undefined>(new Date());
	const [appointmentTime, setAppointmentTime] = useState("");
	const [reasonForVisit, setReasonForVisit] = useState("");
	const [notes, setNotes] = useState(""); // Add separate notes field
	const [selectedDoctor, setSelectedDoctor] = useState<Doctor>({
		$id: "",
		name: "",
		gender: "",
		specialty: "",
		location: "",
		phone: "",
		availability: "",
		weekend_available: false,
		bio: "",
		profile_picture_id: "",
		provider_id: 0,
		first_name: "",
		last_name: "",
		practice_name: "",
	});

  const formattedDate = date?.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
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
      setPreFillExistingData(true);
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
    setPreFillExistingData(true);
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
        const selectedDoctor = fetchSelectedDoctor(providerId);
        if (selectedDoctor.length > 0) {
          setSelectedDoctor(selectedDoctor[0]);
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
              <p className="text-sm text-base-content/70">
                Appointment ID: {bookedAppointmentData.appointment.appointment_id}
              </p>
            </div>

            <div className="bg-info/10 border border-info/20 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-info mb-2">📋 Next Steps</h3>
              <p className="text-sm mb-2">
                We&apos;ve automatically created an intake form for your appointment. 
                Please complete it before your visit to help us prepare for your care.
              </p>
              <p className="text-xs text-base-content/70">
                Intake Form ID: {bookedAppointmentData.intake_form.$id}
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                href={bookedAppointmentData.intake_form_url || `/appointments/${bookedAppointmentData.appointment.$id}/intake`}
                className="btn btn-primary flex-1"
                onClick={handleCloseSuccess}
              >
                Complete Intake Form
              </Link>
              <Link
                href="/dashboard"
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
              disabled={appointmentIsSaving}
            >
              <option value="" disabled>
                Please Select an Appointment Time
              </option>
              <option value="09:00">09:00 AM</option>
              <option value="09:30">09:30 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="10:30">10:30 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="11:30">11:30 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="12:30">12:30 PM</option>
              <option value="13:00">01:00 PM</option>
              <option value="13:30">01:30 PM</option>
              <option value="14:00">02:00 PM</option>
              <option value="14:30">02:30 PM</option>
              <option value="15:00">03:00 PM</option>
              <option value="15:30">03:30 PM</option>
              <option value="16:00">04:00 PM</option>
              <option value="16:30">04:30 PM</option>
              <option value="17:00">05:00 PM</option>
            </select>
          </div>

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