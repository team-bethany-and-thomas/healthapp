"use client";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useAuth } from "@/app/providers/AuthProvider";
import Link from "next/link";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId?: string;
  providerList: Doctor[];
  // providerId
}
interface Appointment {
  appointment_id: string;
  patient_id: string;
  provider_id: string;
  appointment_type_id: string;
  appointment_date: string | Date;
  appointment_time: string | Date;
  status: string;
  reason_for_visit: string;
  notes?: string;
  created_at: string | Date;
  updated_at: string | Date;
}

interface AppointmentType {
  appointment_type_id: number;
  type_name: string;
  description: string;
  duration_minutes: number;
  base_cost: number;
  created_at: string;
  is_active: boolean;
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
}

const appointmentTypes: AppointmentType[] = [
  {
    appointment_type_id: 1,
    type_name: "Initial Consultation",
    description:
      "Comprehensive initial assessment for new patients to discuss health history, concerns, and develop a personalized care plan.",
    duration_minutes: 60,
    base_cost: 150.0,
    created_at: "2025-07-30T21:18:16Z",
    is_active: true,
  },
  {
    appointment_type_id: 2,
    type_name: "Extended Visit",
    description:
      "For existing patients requiring more in-depth discussion, multiple concerns, or complex problem-solving beyond a standard follow-up.",
    duration_minutes: 45,
    base_cost: 110.0,
    created_at: "2025-07-30T21:18:16Z",
    is_active: true,
  },
  {
    appointment_type_id: 3,
    type_name: "Follow-up Visit",
    description:
      "Standard visit for existing patients to review progress, medication adjustments, or address ongoing management of chronic conditions.",
    duration_minutes: 30,
    base_cost: 80.0,
    created_at: "2025-07-30T21:18:16Z",
    is_active: true,
  },
  {
    appointment_type_id: 4,
    type_name: "New Problem / Acute Concern",
    description:
      "For existing patients presenting with a new, acute issue requiring prompt evaluation and management.",
    duration_minutes: 30,
    base_cost: 90.0,
    created_at: "2025-07-30T21:18:16Z",
    is_active: true,
  },
  {
    appointment_type_id: 5,
    type_name: "Brief Check-up",
    description:
      "Quick check-in for existing patients, ideal for medication refills, quick questions, or minor updates.",
    duration_minutes: 15,
    base_cost: 50.0,
    created_at: "2025-07-30T21:18:16Z",
    is_active: true,
  },
];
export const AppointmentBookingModal: React.FC<
  AppointmentBookingModalProps
> = ({ isOpen, onClose, providerId = "", providerList = [] }) => {
  const [appointmentType, setAppointmentType] = useState("");

  const { user, isLoading } = useAuth();
  // const allProviders = providerList;

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reasonForVisit, setReasonForVisit] = useState("");
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

  const [appointmentIsSaving, setAppointmentIsSaving] =
    useState<boolean>(false);

  const formatAppointment = () => {
    if (!date || !appointmentTime) return;

    // Create new date with selected date and time
    const [hours, minutes] = appointmentTime.split(":");
    const appointmentDate = new Date(date);
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // console.log(appointmentDate);
  };
  const formattedDate = date?.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Convert 24-hour time to 12-hour format for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };
  const handleAppointmentType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAppointmentType(e.target.value);
  };
  const modalRef = useRef<HTMLDialogElement>(null);

  const handleTimeSelection = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setAppointmentTime(e.target.value);
  const handleVisitReason = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setReasonForVisit(e.target.value);

  const handleSubmit = () => {
    const mockPostRequest = (dataSubmitted: Appointment) => {
      setAppointmentIsSaving(true);
      setTimeout(() => {
        console.log("appointment booked", dataSubmitted);
        setAppointmentIsSaving(false);
        setAppointmentBooked(true);
      }, 2500);
    };

    const dataSubmitted: Appointment = {
      appointment_id: String(Math.floor(Math.random() * 10000 + 1)),
      patient_id: user?.$id || "",
      provider_id: selectedDoctor.$id,
      appointment_type_id: appointmentType,
      appointment_date: date || "",
      appointment_time: appointmentTime,
      status: "booked",
      reason_for_visit: reasonForVisit || "",
      notes: "",
      created_at: new Date(),
      updated_at: new Date(),
    };
    // console.log(dataSubmitted);
    formatAppointment();
    mockPostRequest(dataSubmitted);
  };

  const handleCloseSuccess = () => {
    // Close modal immediately
    onClose();

    // Delay state reset until modal animation completes
    setTimeout(() => {
      setAppointmentBooked(false);
      setAppointmentType("");
      setDate(new Date());
      setAppointmentTime("");
      setReasonForVisit("");
    }, 300);
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
        setSelectedDoctor(selectedDoctor[0]);
        modal.showModal();
      }
    } else {
      if (modal.open) {
        modal.close();
      }
    }
  }, [isOpen, providerId]);
  // returns Loading... if checking for user. this ensures unauthorized does not show automatically.
  if (isLoading) {
    return (
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={onClose}
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
  // return a success modal with booking info
  if (appointmentBooked) {
    return (
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={onClose}
      >
        <div className="modal-box bg-base-100">
          <div className="text-center">
            <h1 className="font-bold text-lg mb-2">Success!</h1>
            <h2 className="font-bold text-lg mb-4">
              Your appointment is confirmed!
            </h2>

            <p className="mb-6">
              We&apos;ve reserved your spot with{" "}
              <span className="font-semibold text-primary">
                {selectedDoctor.name}
              </span>
              {" on "}
              <span className="font-semibold">{formattedDate}</span> {" at "}
              <span className="font-semibold">
                {formatTime(appointmentTime)}
              </span>
              . To help us prepare for your visit, please fill out a few forms.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/#"
                className="btn btn-primary flex-1"
                onClick={handleCloseSuccess}
              >
                Complete Intake Forms
              </Link>
              <Link
                href="/dashboard"
                className="btn btn-outline flex-1"
                onClick={handleCloseSuccess}
              >
                I&apos;ll Do it Later
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
  // return a booking modal if there is a user signed in
  if (user) {
    return (
      <>
        <dialog
          ref={modalRef}
          className="modal modal-bottom sm:modal-middle"
          onClose={onClose}
        >
          <div className="modal-box  bg-primary">
            <h3 className="font-bold text-lg  text-base-content text-center">
              Book Appointment With: {selectedDoctor.name}
            </h3>
            <div className="flex justify-center mt-2">
              <select
                defaultValue={appointmentType}
                className=" select select-bordered w-3/4 mt-2 bg-base-200 text-base-content "
                onChange={handleAppointmentType}
              >
                <option value="default">Select Appointment Type</option>
                {appointmentTypes.map((aT) => (
                  <option
                    key={aT.appointment_type_id}
                    value={aT.appointment_type_id}
                  >
                    {aT.type_name}
                    {` (${aT.duration_minutes}) minutes`}
                  </option>
                ))}
              </select>
            </div>

            <div className=" flex justify-center mt-6 mb-6">
              <DayPicker
                className="react-day-picker bg-base-200 border border-base-300 rounded-lg p-4 "
                mode="single"
                selected={date}
                onSelect={setDate}
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
                className=" select  bg-base-200 text-base-content select-bordered w-3/4"
                onChange={handleTimeSelection}
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
            <form className="py-4 flex  justify-center">
              <div className="flex flex-col  w-3/4">
                <label className="mb-3">Reason for Visit:</label>
                <textarea
                  value={reasonForVisit}
                  onChange={handleVisitReason}
                  id={"visitReason"}
                  className="textarea textarea-bordered bg-base-200 text-base-content w-full"
                  rows={5}
                ></textarea>
              </div>
            </form>
            <div className="modal-action flex gap-4 justify-center">
              <button
                className="btn btn-primary btn-sm"
                disabled={appointmentIsSaving}
                onClick={handleSubmit}
              >
                {appointmentIsSaving && (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
                {appointmentIsSaving
                  ? "Saving Appointment"
                  : "Book Appointment"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      </>
    );
  } else {
    // returns an unauthorized modal if the there is not an authorized user
    return (
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={onClose}
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
                onClick={onClose}
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
