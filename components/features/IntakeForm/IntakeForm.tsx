"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PatientInformation } from "./PatientInformation";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  ContactRound,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Pill,
} from "lucide-react";
import {
  CompleteIntakeForm,
  PatientFormForCompletion,
  Appointment,
  createEmptyCompleteIntakeForm,
  loadPendingIntakeForms,
  submitCompleteIntakeForm,
  submitCompleteIntakeFormForAppointment,
  validateCompleteIntakeForm,
  createIntakeFormForAppointment,
  loadExistingIntakeFormData,
  saveIntakeFormProgress,
  updatePatientInfo,
  updateInsuranceInfo,
  updateConsent,
  updateMedicalConditions,
  updateAttachedFiles,
  addAllergy,
  removeAllergy,
  updateAllergy,
  addMedication,
  removeMedication,
  updateMedication,
  addEmergencyContact,
  removeEmergencyContact,
  updateEmergencyContact,
} from "@/app/services/completeIntakeService";
import UploadFile from "../../UploadFile";
import UploadTable from "../../UploadTable";
import { formAttachmentService } from "@/app/services/formAttachmentService";

interface PatientFormData {
  patient_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  date_of_birth?: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

interface IntakeFormProps {
  appointmentId?: string | null;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({ appointmentId }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Data loading states
  const [pendingForms, setPendingForms] = useState<PatientFormForCompletion[]>(
    []
  );
  const [selectedForm, setSelectedForm] =
    useState<PatientFormForCompletion | null>(null);
  const [currentAppointment, setCurrentAppointment] =
    useState<Appointment | null>(null);
  const [isAppointmentSpecific, setIsAppointmentSpecific] = useState(false);

  // File upload states
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [refreshFileTable, setRefreshFileTable] = useState(0);

  // Complete intake form data
  const [completeFormData, setCompleteFormData] = useState<CompleteIntakeForm>(
    createEmptyCompleteIntakeForm()
  );

  // Legacy patient information data for step 0
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
  });

  // Handle appointment-specific intake form
  useEffect(() => {
    if (user && appointmentId) {
      handleAppointmentSpecificForm();
    } else if (user) {
      loadPendingIntakeFormsData();
    }
  }, [user, appointmentId]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        patientInformation: {
          ...prev.patientInformation,
          patient_id: user.$id,
          user_id: user.$id,
        },
      }));
      setCompleteFormData((prev) => ({
        ...prev,
        patient_id: parseInt(user.$id) || 0,
      }));
    }
  }, [user]);

  const handleAppointmentSpecificForm = async () => {
    if (!appointmentId || !user) return;

    try {
      setIsLoading(true);
      const result = await createIntakeFormForAppointment(
        appointmentId,
        user.$id
      );

      if (result.appointment && result.form) {
        setCurrentAppointment(result.appointment);
        setSelectedForm(result.form);
        setIsAppointmentSpecific(true);

        if (result.isExisting) {
          // Load existing intake form data
          try {
            console.log(
              "🔍 Loading existing intake form data for appointment:",
              appointmentId
            );
            const existingDataResult = await loadExistingIntakeFormData(
              appointmentId,
              user.$id
            );
            console.log("📊 Existing data result:", existingDataResult);

            if (existingDataResult.success && existingDataResult.data) {
              console.log(
                "✅ Successfully loaded patient info:",
                existingDataResult.data.patient_info
              );
              console.log(
                "📋 Complete form data being set:",
                existingDataResult.data
              );

              setCompleteFormData(existingDataResult.data);

              // Also update the legacy form data for step 0
              const updatedPatientInfo = {
                patient_id: user.$id,
                user_id: user.$id,
                first_name: existingDataResult.data.patient_info.first_name,
                last_name: existingDataResult.data.patient_info.last_name,
                phone: existingDataResult.data.patient_info.phone,
                email: existingDataResult.data.patient_info.email,
                date_of_birth:
                  existingDataResult.data.patient_info.date_of_birth,
                gender: existingDataResult.data.patient_info.gender,
                address: existingDataResult.data.patient_info.address,
                city: existingDataResult.data.patient_info.city,
                state: existingDataResult.data.patient_info.state,
                zip_code: existingDataResult.data.patient_info.zipcode,
                created_at: new Date(),
                updated_at: new Date(),
                is_active: true,
              };

              console.log(
                "🔄 Updated patient info for form:",
                updatedPatientInfo
              );

              setFormData((prev) => ({
                ...prev,
                patientInformation: updatedPatientInfo,
              }));

              console.log("✅ Form data updated successfully");
              
              // Check if this is actually a new form (empty data) or existing data
              const hasExistingData = existingDataResult.data.patient_info.first_name || 
                                    existingDataResult.data.patient_info.last_name ||
                                    existingDataResult.data.allergies.length > 0 ||
                                    existingDataResult.data.medications.length > 0 ||
                                    existingDataResult.data.insurance.provider;

              if (hasExistingData) {
                setSuccessMessage(
                  "Loaded existing intake form data. You can review and update your information."
                );
              } else {
                setSuccessMessage(
                  "New intake form created for your appointment. Please complete all sections below."
                );
              }
            } else {
              console.log(
                "⚠️ No existing data found or failed to load, using fallback"
              );
              // Fallback to basic form setup if data loading fails
              setCompleteFormData((prev) => ({
                ...prev,
                patient_form_id: result.form!.$id,
                appointment_id: result.appointment!.appointment_id,
                patient_id: result.appointment!.patient_id,
              }));
              setSuccessMessage(
                "New intake form created for your appointment. Please complete all sections below."
              );
            }
          } catch (loadError) {
            console.error(
              "❌ Error loading existing intake form data:",
              loadError
            );
            // Fallback to basic form setup
            setCompleteFormData((prev) => ({
              ...prev,
              patient_form_id: result.form!.$id,
              appointment_id: result.appointment!.appointment_id,
              patient_id: result.appointment!.patient_id,
            }));
            setSuccessMessage(
              "Found existing intake form for this appointment. You can continue editing or view the current progress."
            );
          }
        } else {
          // New form - just set basic information
          setCompleteFormData((prev) => ({
            ...prev,
            patient_form_id: result.form!.$id,
            appointment_id: result.appointment!.appointment_id,
            patient_id: result.appointment!.patient_id,
          }));
          setSuccessMessage(
            "Created new intake form for your appointment. Please complete all sections."
          );
        }
      } else {
        setErrors({
          general: "Failed to load appointment information. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error handling appointment-specific form:", error);
      setErrors({
        general: "Failed to load appointment information. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingIntakeFormsData = async () => {
    try {
      const forms = await loadPendingIntakeForms();
      setPendingForms(forms);
    } catch (error) {
      console.error("Error loading pending intake forms:", error);
      setErrors({ general: "Failed to load pending intake forms" });
    }
  };

  const steps = [
    {
      step: 0,
      stepTitle: "patientInformation",
      color: "bg-blue-50 border-blue-200",
      cardColor: "bg-blue-100",
      buttonColor: "btn-primary",
    },
    {
      step: 1,
      stepTitle: "emergencyContacts",
      color: "bg-green-50 border-green-200",
      cardColor: "bg-green-100",
      buttonColor: "btn-success",
    },
    {
      step: 2,
      stepTitle: "insuranceInformation",
      color: "bg-orange-50 border-orange-200",
      cardColor: "bg-orange-100",
      buttonColor: "btn-warning",
    },
    {
      step: 3,
      stepTitle: "allergies",
      color: "bg-red-50 border-red-200",
      cardColor: "bg-red-100",
      buttonColor: "btn-error",
    },
    {
      step: 4,
      stepTitle: "medications",
      color: "bg-purple-50 border-purple-200",
      cardColor: "bg-purple-100",
      buttonColor: "btn-secondary",
    },
    {
      step: 5,
      stepTitle: "consent",
      color: "bg-indigo-50 border-indigo-200",
      cardColor: "bg-indigo-100",
      buttonColor: "btn-accent",
    },
  ];

  const getCurrentStepColors = () => steps[currentStep] || steps[0];

  const handleStepSubmit = (data: PatientFormData) => {
    // Update legacy form data
    setFormData((prev) => ({
      ...prev,
      patientInformation: {
        ...data,
        patient_id: user?.$id || "",
        user_id: user?.$id || "",
        date_of_birth: data.date_of_birth || "",
      },
    }));

    // Update complete form data
    setCompleteFormData((prev) =>
      updatePatientInfo(prev, "first_name", data.first_name)
    );
    setCompleteFormData((prev) =>
      updatePatientInfo(prev, "last_name", data.last_name)
    );
    setCompleteFormData((prev) => updatePatientInfo(prev, "phone", data.phone));
    setCompleteFormData((prev) => updatePatientInfo(prev, "email", data.email));
    setCompleteFormData((prev) =>
      updatePatientInfo(prev, "gender", data.gender)
    );
    setCompleteFormData((prev) =>
      updatePatientInfo(prev, "address", data.address)
    );
    setCompleteFormData((prev) => updatePatientInfo(prev, "city", data.city));
    setCompleteFormData((prev) => updatePatientInfo(prev, "state", data.state));
    setCompleteFormData((prev) =>
      updatePatientInfo(prev, "zipcode", data.zip_code)
    );
    setCompleteFormData((prev) =>
      updatePatientInfo(prev, "date_of_birth", data.date_of_birth || "")
    );

    console.log("Patient information updated:", data);

    // Move to next step
    setCurrentStep(1);
  };

  const handleFormSelection = (formId: string) => {
    const form = pendingForms.find((f) => f.$id === formId);
    if (form) {
      setSelectedForm(form);
      setCompleteFormData((prev) => ({
        ...prev,
        patient_form_id: form.$id,
        appointment_id: form.appointment_id,
        patient_id: form.patient_id,
      }));
    }
  };

  // File upload handlers
  const handleFileUploadSuccess = (fileId: string) => {
    setUploadSuccess(`File uploaded successfully! ID: ${fileId}`);
    setUploadError(null);
    setRefreshFileTable((prev) => prev + 1);

    // Clear success message after 5 seconds
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  const handleFileUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess(null);

    // Clear error message after 10 seconds
    setTimeout(() => setUploadError(null), 10000);
  };

  const handleFileSelection = useCallback((fileIds: string[]) => {
    setCompleteFormData((prev) => updateAttachedFiles(prev, fileIds));
  }, []);

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Save progress function
  const handleSaveProgress = async () => {
    if (!user) {
      setErrors({ general: "You must be logged in to save progress" });
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setErrors({});

    try {
      const result = await saveIntakeFormProgress(
        completeFormData,
        user.$id,
        appointmentId || undefined
      );

      if (result.success) {
        setSuccessMessage(result.message);
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      console.error("Error saving intake form progress:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Failed to save progress. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear fields function
  const handleClearFields = () => {
    if (window.confirm("Are you sure you want to clear all fields? This action cannot be undone.")) {
      const emptyForm = createEmptyCompleteIntakeForm();
      
      // Preserve the form linking information
      setCompleteFormData({
        ...emptyForm,
        patient_form_id: completeFormData.patient_form_id,
        appointment_id: completeFormData.appointment_id,
        patient_id: completeFormData.patient_id,
      });

      // Also clear the legacy form data for step 0
      setFormData({
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
      });

      setSuccessMessage("All fields have been cleared.");
      setErrors({});
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Submit complete form
  const handleCompleteFormSubmit = async () => {
    if (!user) {
      setErrors({ general: "You must be logged in to submit the form" });
      return;
    }

    const validation = validateCompleteIntakeForm(completeFormData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setErrors({});

    try {
      let result;

      // Use appointment-specific submission if we have an appointmentId
      if (isAppointmentSpecific && appointmentId) {
        result = await submitCompleteIntakeFormForAppointment(
          completeFormData,
          user.$id,
          appointmentId
        );
      } else {
        result = await submitCompleteIntakeForm(completeFormData, user.$id);
      }

      if (result.success) {
        setSuccessMessage(result.message);
        // Reset form
        setCompleteFormData(createEmptyCompleteIntakeForm());
        setCurrentStep(0);

        // If this was for a specific appointment, redirect back to appointments
        if (isAppointmentSpecific) {
          setTimeout(() => {
            window.location.href = "/dashboard/appointments";
          }, 3000);
        }
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      console.error("Error submitting complete intake form:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Failed to submit intake form. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600">
            Please log in to access the intake form.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-400">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {errors.general}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Success/Error Messages */}
      {uploadSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {uploadSuccess}
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{uploadError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex justify-center items-center z-10 bg-white rounded-2xl shadow-xl mx-auto mb-4 py-3 w-3/4">
        <ul className="steps w-full max-w-4xl">
          <li
            className={`step ${currentStep >= 0 ? "step-primary" : ""} flex-1`}
          >
            <span className="step-icon">
              <ContactRound />
            </span>
            Patient <br />
            Information
          </li>
          <li
            className={`step ${currentStep >= 1 ? "step-success" : ""} flex-1`}
          >
            <span className="step-icon">
              <ShieldAlert />
            </span>
            Emergency
            <br />
            Contact
          </li>
          <li
            className={`step ${currentStep >= 2 ? "step-warning" : ""} flex-1`}
          >
            <span className="step-icon">
              <ShieldCheck />
            </span>
            Insurance
            <br />
            Information
          </li>
          <li className={`step ${currentStep >= 3 ? "step-error" : ""} flex-1`}>
            <span className="step-icon">
              <TriangleAlert />
            </span>
            Allergies
          </li>
          <li
            className={`step ${
              currentStep >= 4 ? "step-secondary" : ""
            } flex-1`}
          >
            <span className="step-icon">
              <Pill />
            </span>
            Medications
          </li>
          <li
            className={`step ${currentStep >= 5 ? "step-accent" : ""} flex-1`}
          >
            <span className="step-icon">
              <ShieldCheck />
            </span>
            Consent
          </li>
        </ul>
      </div>

      <main className="flex justify-center items-start px-4">
        <div className="w-full max-w-5xl">
          {/* Step 0: Patient Information */}
          {currentStep === 0 && (
            <div className="mt-2">
              <PatientInformation
                onSubmit={handleStepSubmit}
                defaultValues={formData.patientInformation}
                onClearFields={handleClearFields}
                onSaveProgress={handleSaveProgress}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Step 1: Emergency Contacts */}
          {currentStep === 1 && (
            <div className="card bg-base-100 shadow-xl rounded-2xl mt-2">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Emergency Contacts</h2>

                <div className="space-y-4">
                  {completeFormData.emergency_contacts.map((contact, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-md font-medium text-gray-900">
                          Emergency Contact {index + 1}
                        </h3>
                        {completeFormData.emergency_contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setCompleteFormData((prev) =>
                                removeEmergencyContact(prev, index)
                              )
                            }
                            className="btn btn-error btn-sm rounded-lg"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">First Name *</span>
                          </label>
                          <input
                            type="text"
                            value={contact.first_name}
                            onChange={(e) =>
                              setCompleteFormData((prev) =>
                                updateEmergencyContact(
                                  prev,
                                  index,
                                  "first_name",
                                  e.target.value
                                )
                              )
                            }
                            className="input input-bordered w-full bg-base-200 text-base-content rounded-lg"
                            placeholder="First name"
                          />
                          {errors[`emergency_contact_${index}_first_name`] && (
                            <span className="text-error text-sm">
                              {errors[`emergency_contact_${index}_first_name`]}
                            </span>
                          )}
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Last Name *</span>
                          </label>
                          <input
                            type="text"
                            value={contact.last_name}
                            onChange={(e) =>
                              setCompleteFormData((prev) =>
                                updateEmergencyContact(
                                  prev,
                                  index,
                                  "last_name",
                                  e.target.value
                                )
                              )
                            }
                            className="input input-bordered w-full bg-base-200 text-base-content rounded-lg"
                            placeholder="Last name"
                          />
                          {errors[`emergency_contact_${index}_last_name`] && (
                            <span className="text-error text-sm">
                              {errors[`emergency_contact_${index}_last_name`]}
                            </span>
                          )}
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Relationship *</span>
                          </label>
                          <input
                            type="text"
                            value={contact.relationship}
                            onChange={(e) =>
                              setCompleteFormData((prev) =>
                                updateEmergencyContact(
                                  prev,
                                  index,
                                  "relationship",
                                  e.target.value
                                )
                              )
                            }
                            className="input input-bordered w-full bg-base-200 text-base-content rounded-lg"
                            placeholder="e.g., Spouse, Parent, Sibling"
                          />
                          {errors[
                            `emergency_contact_${index}_relationship`
                          ] && (
                            <span className="text-error text-sm">
                              {
                                errors[
                                  `emergency_contact_${index}_relationship`
                                ]
                              }
                            </span>
                          )}
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Primary Phone *</span>
                          </label>
                          <input
                            type="tel"
                            value={contact.phone_primary}
                            onChange={(e) =>
                              setCompleteFormData((prev) =>
                                updateEmergencyContact(
                                  prev,
                                  index,
                                  "phone_primary",
                                  e.target.value
                                )
                              )
                            }
                            className="input input-bordered w-full bg-base-200 text-base-content rounded-lg"
                            placeholder="(555) 123-4567"
                          />
                          {errors[
                            `emergency_contact_${index}_phone_primary`
                          ] && (
                            <span className="text-error text-sm">
                              {
                                errors[
                                  `emergency_contact_${index}_phone_primary`
                                ]
                              }
                            </span>
                          )}
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Secondary Phone</span>
                          </label>
                          <input
                            type="tel"
                            value={contact.phone_secondary || ""}
                            onChange={(e) =>
                              setCompleteFormData((prev) =>
                                updateEmergencyContact(
                                  prev,
                                  index,
                                  "phone_secondary",
                                  e.target.value
                                )
                              )
                            }
                            className="input input-bordered w-full bg-base-200 text-base-content rounded-lg"
                            placeholder="(555) 987-6543 (optional)"
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Email</span>
                          </label>
                          <input
                            type="email"
                            value={contact.email || ""}
                            onChange={(e) =>
                              setCompleteFormData((prev) =>
                                updateEmergencyContact(
                                  prev,
                                  index,
                                  "email",
                                  e.target.value
                                )
                              )
                            }
                            className="input input-bordered w-full bg-base-200 text-base-content rounded-lg"
                            placeholder="contact@example.com (optional)"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setCompleteFormData((prev) => addEmergencyContact(prev))
                    }
                    className="btn btn-outline w-full rounded-lg"
                  >
                    Add Another Emergency Contact
                  </button>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-col gap-4 mt-6">
                  {/* Clear Fields and Save Progress Buttons */}
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleClearFields}
                      disabled={isLoading}
                      className="bg-red-500 hover:bg-red-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Clear Fields
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProgress}
                      disabled={isLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Saving...
                        </>
                      ) : (
                        "Save Progress"
                      )}
                    </button>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="bg-[rgba(102,232,219,0.9)] hover:bg-[rgba(72,212,199,0.9)] text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Insurance Information */}
          {currentStep === 2 && (
            <div className="card bg-base-100 shadow-xl rounded-2xl mt-2">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">
                  Insurance Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Insurance Provider *</span>
                    </label>
                    <select
                      value={completeFormData.insurance.provider}
                      onChange={(e) =>
                        setCompleteFormData((prev) =>
                          updateInsuranceInfo(prev, "provider", e.target.value)
                        )
                      }
                      className="select select-bordered w-full bg-base-200 text-base-content rounded-lg"
                      title="Insurance Provider"
                    >
                      <option value="">Select insurance provider</option>
                      <option value="BCBS">
                        Blue Cross Blue Shield (BCBS)
                      </option>
                      <option value="UnitedHealthCare">UnitedHealthCare</option>
                      <option value="Aetna">Aetna</option>
                      <option value="Cigna">Cigna</option>
                      <option value="Kaiser">Kaiser Permanente</option>
                      <option value="Medicaid">Medicaid</option>
                      <option value="Medicare">Medicare</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors["insurance.provider"] && (
                      <span className="text-error text-sm">
                        {errors["insurance.provider"]}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Policy Number *</span>
                    </label>
                    <input
                      type="text"
                      value={completeFormData.insurance.policy_number}
                      onChange={(e) =>
                        setCompleteFormData((prev) =>
                          updateInsuranceInfo(
                            prev,
                            "policy_number",
                            e.target.value
                          )
                        )
                      }
                      className="input input-bordered w-full bg-base-200 text-base-content rounded-lg"
                      placeholder="Policy number"
                    />
                    {errors["insurance.policy_number"] && (
                      <span className="text-error text-sm">
                        {errors["insurance.policy_number"]}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Group Number</span>
                    </label>
                    <input
                      type="text"
                      value={completeFormData.insurance.group_number}
                      onChange={(e) =>
                        setCompleteFormData((prev) =>
                          updateInsuranceInfo(
                            prev,
                            "group_number",
                            e.target.value
                          )
                        )
                      }
                      className="input input-bordered w-full bg-base-200 text-base-content rounded-lg"
                      placeholder="Group number (if applicable)"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Subscriber Name</span>
                    </label>
                    <input
                      type="text"
                      value={completeFormData.insurance.subscriber_name}
                      onChange={(e) =>
                        setCompleteFormData((prev) =>
                          updateInsuranceInfo(
                            prev,
                            "subscriber_name",
                            e.target.value
                          )
                        )
                      }
                      className="input input-bordered w-full bg-base-200 text-base-content rounded-lg"
                      placeholder="Name on insurance policy"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">
                        Relationship to Subscriber
                      </span>
                    </label>
                      <select
                        value={
                          completeFormData.insurance.relationship_to_subscriber
                        }
                        onChange={(e) =>
                          setCompleteFormData((prev) =>
                            updateInsuranceInfo(
                              prev,
                              "relationship_to_subscriber",
                              e.target.value
                            )
                          )
                        }
                        className="select select-bordered w-full bg-base-200 text-base-content rounded-lg"
                        title="Relationship to Subscriber"
                      >
                      <option value="self">Self</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="parent">Parent</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-col gap-4 mt-6">
                  {/* Clear Fields and Save Progress Buttons */}
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleClearFields}
                      disabled={isLoading}
                      className="bg-red-500 hover:bg-red-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Clear Fields
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProgress}
                      disabled={isLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Saving...
                        </>
                      ) : (
                        "Save Progress"
                      )}
                    </button>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="bg-[rgba(102,232,219,0.9)] hover:bg-[rgba(72,212,199,0.9)] text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Allergies */}
          {currentStep === 3 && (
            <div className="card bg-base-100 shadow-xl rounded-2xl mt-2">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Allergies</h2>

                <div className="space-y-4">
                  {completeFormData.allergies.map((allergy, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 border border-gray-200 rounded-xl items-center"
                    >
                      <input
                        type="text"
                        placeholder="Allergen name"
                        value={allergy.allergen_name}
                        onChange={(e) =>
                          setCompleteFormData((prev) =>
                            updateAllergy(
                              prev,
                              index,
                              "allergen_name",
                              e.target.value
                            )
                          )
                        }
                        className="input input-bordered bg-base-200 text-base-content rounded-lg lg:col-span-3"
                        aria-label="Allergen name"
                      />
                      <select
                        value={allergy.severity}
                        onChange={(e) =>
                          setCompleteFormData((prev) =>
                            updateAllergy(
                              prev,
                              index,
                              "severity",
                              e.target.value
                            )
                          )
                        }
                        className="select select-bordered bg-base-200 text-base-content rounded-lg lg:col-span-3"
                        title="Allergy Severity"
                      >
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Reaction description"
                        value={allergy.reaction_description}
                        onChange={(e) =>
                          setCompleteFormData((prev) =>
                            updateAllergy(
                              prev,
                              index,
                              "reaction_description",
                              e.target.value
                            )
                          )
                        }
                        className="input input-bordered bg-base-200 text-base-content rounded-lg lg:col-span-4"
                        aria-label="Reaction description"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCompleteFormData((prev) =>
                            removeAllergy(prev, index)
                          )
                        }
                        className="btn btn-error rounded-lg h-12 lg:col-span-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {completeFormData.allergies.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No allergies added. Click &quot;Add Allergy&quot; to add one.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setCompleteFormData((prev) => addAllergy(prev))
                    }
                    className="btn btn-outline w-full rounded-lg"
                  >
                    Add Allergy
                  </button>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-col gap-4 mt-6">
                  {/* Clear Fields and Save Progress Buttons */}
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleClearFields}
                      disabled={isLoading}
                      className="bg-red-500 hover:bg-red-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Clear Fields
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProgress}
                      disabled={isLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Saving...
                        </>
                      ) : (
                        "Save Progress"
                      )}
                    </button>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="bg-[rgba(102,232,219,0.9)] hover:bg-[rgba(72,212,199,0.9)] text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Medications */}
          {currentStep === 4 && (
            <div className="card bg-base-100 shadow-xl rounded-2xl mt-2">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Current Medications</h2>

                <div className="space-y-4">
                  {completeFormData.medications.map((medication, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-5 gap-4 p-3 border border-gray-200 rounded-xl items-center"
                    >
                      <input
                        type="text"
                        placeholder="Medication name"
                        value={medication.medication_name}
                        onChange={(e) =>
                          setCompleteFormData((prev) =>
                            updateMedication(
                              prev,
                              index,
                              "medication_name",
                              e.target.value
                            )
                          )
                        }
                        className="input input-bordered bg-base-200 text-base-content rounded-lg"
                        aria-label="Medication name"
                      />
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={medication.dosage}
                        onChange={(e) =>
                          setCompleteFormData((prev) =>
                            updateMedication(
                              prev,
                              index,
                              "dosage",
                              e.target.value
                            )
                          )
                        }
                        className="input input-bordered bg-base-200 text-base-content rounded-lg"
                        aria-label="Dosage"
                      />
                      <input
                        type="text"
                        placeholder="Frequency"
                        value={medication.frequency}
                        onChange={(e) =>
                          setCompleteFormData((prev) =>
                            updateMedication(
                              prev,
                              index,
                              "frequency",
                              e.target.value
                            )
                          )
                        }
                        className="input input-bordered bg-base-200 text-base-content rounded-lg"
                        aria-label="Frequency"
                      />
                      <select
                        value={medication.status}
                        onChange={(e) =>
                          setCompleteFormData((prev) =>
                            updateMedication(
                              prev,
                              index,
                              "status",
                              e.target.value
                            )
                          )
                        }
                        className="select select-bordered bg-base-200 text-base-content rounded-lg"
                        title="Medication Status"
                      >
                        <option value="prescribed">Prescribed</option>
                        <option value="as_needed">As Needed</option>
                        <option value="completed">Completed</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setCompleteFormData((prev) =>
                            removeMedication(prev, index)
                          )
                        }
                        className="btn btn-error rounded-lg h-12"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {completeFormData.medications.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No medications added. Click &quot;Add Medication&quot; to add one.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setCompleteFormData((prev) => addMedication(prev))
                    }
                    className="btn btn-outline w-full rounded-lg"
                  >
                    Add Medication
                  </button>
                </div>

                {/* Medical Conditions */}
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">
                    Medical Conditions & History
                  </h3>
                  <textarea
                    value={completeFormData.medical_conditions}
                    onChange={(e) =>
                      setCompleteFormData((prev) =>
                        updateMedicalConditions(prev, e.target.value)
                      )
                    }
                    rows={4}
                    className="textarea textarea-bordered bg-base-200 text-base-content rounded-lg w-full"
                    placeholder="Please describe any current medical conditions, past surgeries, or relevant medical history..."
                  />
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-col gap-4 mt-6">
                  {/* Clear Fields and Save Progress Buttons */}
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleClearFields}
                      disabled={isLoading}
                      className="bg-red-500 hover:bg-red-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Clear Fields
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProgress}
                      disabled={isLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Saving...
                        </>
                      ) : (
                        "Save Progress"
                      )}
                    </button>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="bg-[rgba(102,232,219,0.9)] hover:bg-[rgba(72,212,199,0.9)] text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Consent & File Attachments */}
          {currentStep === 5 && (
            <div className="card bg-base-100 shadow-xl rounded-2xl mt-2">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">
                  File Attachments & Consent
                </h2>

                {/* File Attachments */}
                <div className="mb-8">
                  <h3 className="text-md font-medium text-gray-900 mb-4">
                    Upload New Files
                  </h3>
                  <UploadFile
                    onUploadSuccess={handleFileUploadSuccess}
                    onUploadError={handleFileUploadError}
                    allowMultiple={true}
                    category="medical-documents"
                    className="w-full"
                  />
                </div>

                {/* File Selection Section */}
                <div className="mb-8">
                  <h3 className="text-md font-medium text-gray-900 mb-4">
                    Select Files to Attach
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose from your previously uploaded files to attach to this
                    intake form.
                  </p>

                  {completeFormData.attached_files.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>
                          {completeFormData.attached_files.length}
                        </strong>{" "}
                        file
                        {completeFormData.attached_files.length > 1 ? "s" : ""}{" "}
                        selected for attachment
                      </p>
                    </div>
                  )}

                  <UploadTable
                    key={refreshFileTable}
                    onFileSelect={handleFileSelection}
                    allowMultipleSelection={true}
                    showSelectionColumn={true}
                    category="medical-documents"
                    className="w-full"
                  />
                </div>

                {/* Consent */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-900">
                    Consent & Authorization
                  </h3>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      aria-label="HIPAA consent"
                      checked={completeFormData.hipaa_consent}
                      onChange={(e) =>
                        setCompleteFormData((prev) =>
                          updateConsent(prev, "hipaa_consent", e.target.checked)
                        )
                      }
                      className="checkbox checkbox-primary mt-1"
                    />
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-900">
                        HIPAA Authorization *
                      </label>
                      <p className="text-sm text-gray-600">
                        I authorize the use and disclosure of my health
                        information for treatment, payment, and healthcare
                        operations as described in the Notice of Privacy
                        Practices.
                      </p>
                      {errors.hipaa_consent && (
                        <span className="text-error text-sm">
                          {errors.hipaa_consent}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      aria-label="Treatment consent"
                      checked={completeFormData.treatment_consent}
                      onChange={(e) =>
                        setCompleteFormData((prev) =>
                          updateConsent(
                            prev,
                            "treatment_consent",
                            e.target.checked
                          )
                        )
                      }
                      className="checkbox checkbox-primary mt-1"
                    />
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-900">
                        Treatment Consent *
                      </label>
                      <p className="text-sm text-gray-600">
                        I consent to the medical treatment and procedures that
                        may be performed during my care at this facility.
                      </p>
                      {errors.treatment_consent && (
                        <span className="text-error text-sm">
                          {errors.treatment_consent}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      aria-label="Financial responsibility"
                      checked={completeFormData.financial_consent}
                      onChange={(e) =>
                        setCompleteFormData((prev) =>
                          updateConsent(
                            prev,
                            "financial_consent",
                            e.target.checked
                          )
                        )
                      }
                      className="checkbox checkbox-primary mt-1"
                    />
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-900">
                        Financial Responsibility *
                      </label>
                      <p className="text-sm text-gray-600">
                        I understand and accept financial responsibility for all
                        services provided and agree to pay all charges not
                        covered by insurance.
                      </p>
                      {errors.financial_consent && (
                        <span className="text-error text-sm">
                          {errors.financial_consent}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-col gap-4 mt-6">
                  {/* Clear Fields and Save Progress Buttons */}
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleClearFields}
                      disabled={isLoading}
                      className="bg-red-500 hover:bg-red-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Clear Fields
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProgress}
                      disabled={isLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Saving...
                        </>
                      ) : (
                        "Save Progress"
                      )}
                    </button>
                  </div>
                  
                  {/* Navigation and Submit Buttons */}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteFormSubmit}
                      disabled={isLoading}
                      className={`${
                        isLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[rgba(102,232,219,0.9)] hover:bg-[rgba(72,212,199,0.9)] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                      } text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 transition-all duration-200 font-semibold min-w-[180px]`}
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Submitting...
                        </>
                      ) : (
                        "Submit Complete Intake Form"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};
