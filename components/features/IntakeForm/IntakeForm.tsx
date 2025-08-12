"use client";

import React, { useState, useEffect } from "react";
import { PatientInformation } from "./PatientInformation";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  ContactRound,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Pill,
} from "lucide-react";
import { EmergencyContact } from "./EmergencyContact";
interface PatientFormData {
  patient_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  date_of_birth: string | undefined;
  gender: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

interface EmergencyContactFormData {
  contact_id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  priority_order: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}
export const IntakeForm: React.FC = () => {
  // TODO: Implement Emergency Contacts step
  // TODO: Implmement Insurance Information
  // TODO: Implement Allergies
  // TODO implement medications section
  // TODO: Add navigation between steps using the progress bar
  // TODO: Integrate API for form submission
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState({
    patientInformation: {
      patient_id: user?.$id || "",
      user_id: user?.$id || "",
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      date_of_birth: "",
      gender: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
    },
    emergencyContact: {
      contact_id: "43",
      patient_id: user?.$id || "",
      first_name: "",
      last_name: "",
      relationship: "",
      phone_primary: "",
      phone_secondary: "",
      email: "",
      priority_order: "1",
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
    },
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        patientInformation: {
          ...prev.patientInformation,
          patient_id: user.$id,
          user_id: user.$id,
        },
        emergencyContact: {
          ...prev.emergencyContact,
          patient_id: user.$id,
        },
      }));
    }
  }, [user]);

  const steps = [
    { step: 0, stepTitle: "patientInformation" },
    { step: 1, stepTitle: "emergencyContact" },
    { step: 2, stepTitle: "insuranceInformation" },
    { step: 3, stepTitle: "allergies" },
    { step: 4, stepTitle: "medications" },
  ];
  type FormData = PatientFormData | EmergencyContactFormData;
  const handleStepSubmit = (data: FormData, field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...data,
        ...(field == "patientInformation"
          ? {
              patient_id: user?.$id || "",
              user_id: user?.$id || "",
              date_of_birth: data.date_of_birth || "",
            }
          : {}),
        ...(field == "emergencyContact"
          ? {
              patient_id: user?.$id || "",
            }
          : {}),
      },
    }));

    if (currentStep === 4) {
      const completeData = {
        ...formData,
        [field]: {
          ...data,
          ...(field == "patientInformation"
            ? {
                patient_id: user?.$id || "",
                user_id: user?.$id || "",
                date_of_birth: data.date_of_birth || "",
              }
            : {}),
        },
      };
      console.log("complete form:", completeData);
    }
    setCurrentStep(currentStep + 1);
    console.log(data);
  };

  return (
    // functionality
    // one card showing at a time based on current step
    //when clicked should add a 'step-secondary' class for section's step
    // similar to step 1 & <PatientInformation/>
    // state for step
    // button for increasing and decreasing steps
    <>
      <div className="flex justify-center z-10 border-b border-base-300  border-t py-4">
        <ul className="steps w-full max-w-4xl">
          <li
            className={`step ${
              currentStep >= 0 ? "step-secondary" : ""
            } flex-1`}
          >
            <span className="step-icon">
              <ContactRound />
            </span>
            Patient <br />
            Information
          </li>
          <li
            className={`step ${
              currentStep >= 1 ? "step-secondary" : ""
            }  flex-1`}
          >
            <span className="step-icon">
              <ShieldAlert />
            </span>
            Emergency
            <br />
            Contact
          </li>
          <li
            className={`step ${
              currentStep >= 2 ? "step-secondary" : ""
            }  flex-1`}
          >
            <span className="step-icon">
              <ShieldCheck />
            </span>
            Insurance
            <br />
            Information
          </li>
          <li
            className={`step ${
              currentStep >= 3 ? "step-secondary" : ""
            }  flex-1`}
          >
            <span className="step-icon">
              <TriangleAlert />
            </span>
            Allergies
          </li>
          <li
            className={`step ${
              currentStep >= 4 ? "step-secondary" : ""
            }  flex-1`}
          >
            <span className="step-icon">
              <Pill />
            </span>
            Medications
          </li>
        </ul>
      </div>
      <main className=" flex justify-center items-start min-h-screen px-4">
        <div className="w-full max-w-3xl">
          {currentStep == steps[0].step && (
            <PatientInformation
              onSubmit={(data) => handleStepSubmit(data, "patientInformation")}
              defaultValues={formData.patientInformation}
            />
          )}
          {currentStep == steps[1].step && (
            <EmergencyContact
              onSubmit={(data) => handleStepSubmit(data, "emergencyContact")}
              defaultValues={formData.emergencyContact}
            />
          )}
        </div>
      </main>
    </>
  );
};
