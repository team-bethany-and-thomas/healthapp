"use client";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";

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
  const [appointmentType, setAppointmentType] = useState("");

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reasonForVisit, setReasonForVisit] = useState("");

  const handleAppointmentType = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setAppointmentType(e.target.value);
  const modalRef = useRef<HTMLDialogElement>(null);

  const handleTimeSelection = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setAppointmentTime(e.target.value);
  const handleVisitReason = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setReasonForVisit(e.target.value);

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
        <div className="modal-box  bg-primary">
          <h3 className="font-bold text-lg  text-base-content text-center">
            Book Appointment With: {providerName}
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
                  value={aT.duration_minutes}
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
                date ? `Selected: ${date.toLocaleDateString()}` : "Pick a day."
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
              {/* can .split(":")[0] and check if number is lower than 12 for a.m. above 12 to conditionally render p.m. */}
              <option value="01:00">01:00</option>
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
          <div className="modal-action flex justify-center">
            <button className="btn btn-primary">Book Appointment</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};
