"use client";
import { useState, useEffect, useRef } from "react";
import React from "react";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName?: string;
  appointmentDate?: string;
}

export const AppointmentBookingModal: React.FC<
  AppointmentBookingModalProps
> = ({ isOpen, onClose, providerName }) => {
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
        <div className="modal-box">
          <h3 className="font-bold text-lg">Hello!</h3>
          <h4>{providerName} </h4>
          <p className="py-4">
            Press ESC key or click the button below to close
          </p>
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
