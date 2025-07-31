"use client";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { ChevronDown } from "lucide-react";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName?: string;
  // providerId
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
> = ({ isOpen, onClose, providerName }) => {
  const [appointmentType, setAppointmentType] = useState(
    "Select Appointment Type"
  );

  const handleAppointmentType = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setAppointmentType(e.target.value);
  const modalRef = useRef<HTMLDialogElement>(null);
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

  return (
    <>
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={onClose}
      >
        <div className="modal-box bg-primary">
          <h3 className="font-bold text-lg  text-primary-content text-center">
            Book Appointment With: {providerName}
          </h3>
          <select
            value={appointmentType}
            className=" select select-bordered w-full mt-2"
            onChange={handleAppointmentType}
          >
            <option value="default">Select Appointment Type</option>
            {appointmentTypes.map((aT) => (
              <option key={aT.appointment_type_id} value={aT.duration_minutes}>
                {aT.type_name}
                {` (${aT.duration_minutes}) minutes`}
              </option>
            ))}
          </select>

          <form className="py-4">
            <input type="" name="" id="" />
          </form>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};
