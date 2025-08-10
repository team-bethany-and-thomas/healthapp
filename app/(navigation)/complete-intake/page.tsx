"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { databases, ID } from "../../lib/appwrite";
import { Permission, Role, Query } from "appwrite";
import UploadFile from "../../../components/UploadFile";
import UploadTable from "../../../components/UploadTable";
import { formAttachmentService } from "../../services/formAttachmentService";

interface Patient {
  $id: string;
  patient_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface Appointment {
  $id: string;
  appointment_id: number;
  patient_id: number;
  provider_id: number;
  appointment_date: string;
  appointment_time: string;
  reason_for_visit: string;
  status: string;
}

interface PatientFormWithAppointment {
  $id: string;
  patient_form_id: number;
  patient_id: number;
  appointment_id: number;
  form_template_id: number;
  status: string;
  completion_percentage: number;
  created_at: string;
  appointment?: Appointment;
}

interface Allergy {
  allergen_name: string;
  severity: "mild" | "moderate" | "severe";
  reaction_description: string;
}

interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  status: "prescribed" | "as_needed" | "completed" | "discontinued";
}

interface EmergencyContact {
  first_name: string;
  last_name: string;
  relationship: string;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  priority_order: number;
}

interface InsuranceInfo {
  provider: string;
  policy_number: string;
  group_number: string;
  subscriber_name: string;
  relationship_to_subscriber: string;
}

interface PatientFormForCompletion {
  $id: string;
  patient_form_id: number;
  patient_id: number;
  appointment_id: number;
  status: string;
  completion_percentage: number;
  created_at: string;
  appointment?: Appointment;
  patient?: Patient;
}

interface PatientInfo {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  date_of_birth: string;
}

interface CompleteIntakeForm {
  // Form linking
  patient_form_id: string;
  appointment_id: number;
  patient_id: number;

  // Patient demographic information
  patient_info: PatientInfo;

  // Insurance information
  insurance: InsuranceInfo;

  // Medical information
  allergies: Allergy[];
  medications: Medication[];
  medical_conditions: string;

  // Emergency contacts
  emergency_contacts: EmergencyContact[];

  // File attachments
  attached_files: string[];

  // Consent
  hipaa_consent: boolean;
  treatment_consent: boolean;
  financial_consent: boolean;
}

export default function CompleteIntakePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Data loading states
  const [pendingForms, setPendingForms] = useState<PatientFormForCompletion[]>(
    []
  );
  const [selectedForm, setSelectedForm] =
    useState<PatientFormForCompletion | null>(null);

  // File upload states
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [refreshFileTable, setRefreshFileTable] = useState(0);

  const [formData, setFormData] = useState<CompleteIntakeForm>({
    patient_form_id: "",
    appointment_id: 0,
    patient_id: 0,
    patient_info: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      gender: "",
      address: "",
      city: "",
      state: "",
      zipcode: "",
      date_of_birth: "",
    },
    insurance: {
      provider: "",
      policy_number: "",
      group_number: "",
      subscriber_name: "",
      relationship_to_subscriber: "self",
    },
    allergies: [],
    medications: [],
    medical_conditions: "",
    emergency_contacts: [
      {
        first_name: "",
        last_name: "",
        relationship: "",
        phone_primary: "",
        phone_secondary: "",
        email: "",
        priority_order: 1,
      },
    ],
    attached_files: [],
    hipaa_consent: false,
    treatment_consent: false,
    financial_consent: false,
  });

  // Load pending patient forms that need completion
  useEffect(() => {
    if (user) {
      loadPendingIntakeForms();
    }
  }, [user]);

  const loadPendingIntakeForms = async () => {
    try {
      // Load patient forms that need completion (not submitted/completed)
      const patientFormsResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PATIENT_FORMS_COLLECTION_ID!,
        [
          Query.equal("form_template_id", 1), // Intake form template
          Query.notEqual("status", "submitted"),
          Query.notEqual("status", "completed"),
          Query.orderDesc("created_at"),
        ]
      );

      // Get appointment details for each form
      const formsWithAppointments: PatientFormForCompletion[] = [];

      for (const form of patientFormsResponse.documents) {
        const formData = form as unknown as PatientFormForCompletion;

        try {
          // Get appointment details
          const appointmentResponse = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!,
            [Query.equal("appointment_id", formData.appointment_id)]
          );

          if (appointmentResponse.documents.length > 0) {
            formData.appointment = appointmentResponse
              .documents[0] as unknown as Appointment;
            formsWithAppointments.push(formData);
          }
        } catch (error) {
          console.error(
            "Error loading appointment for form:",
            formData.patient_form_id,
            error
          );
        }
      }

      setPendingForms(formsWithAppointments);
    } catch (error) {
      console.error("Error loading pending intake forms:", error);
      setErrors({ general: "Failed to load pending intake forms" });
    }
  };

  const handleFormSelection = (formId: string) => {
    const form = pendingForms.find((f) => f.$id === formId);
    if (form) {
      setSelectedForm(form);
      setFormData((prev) => ({
        ...prev,
        patient_form_id: form.$id,
        appointment_id: form.appointment_id,
        patient_id: form.patient_id,
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name.startsWith("insurance.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        insurance: { ...prev.insurance, [field]: value },
      }));
    } else if (name === "patient_id" || name === "appointment_id") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleEmergencyContactChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      emergency_contacts: prev.emergency_contacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      ),
    }));
  };

  const addEmergencyContact = () => {
    setFormData((prev) => ({
      ...prev,
      emergency_contacts: [
        ...prev.emergency_contacts,
        {
          first_name: "",
          last_name: "",
          relationship: "",
          phone_primary: "",
          phone_secondary: "",
          email: "",
          priority_order: prev.emergency_contacts.length + 1,
        },
      ],
    }));
  };

  const removeEmergencyContact = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      emergency_contacts: prev.emergency_contacts.filter((_, i) => i !== index),
    }));
  };

  const handleAllergyChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.map((allergy, i) =>
        i === index ? { ...allergy, [field]: value } : allergy
      ),
    }));
  };

  const addAllergy = () => {
    setFormData((prev) => ({
      ...prev,
      allergies: [
        ...prev.allergies,
        {
          allergen_name: "",
          severity: "mild",
          reaction_description: "",
        },
      ],
    }));
  };

  const removeAllergy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const handleMedicationChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.map((medication, i) =>
        i === index ? { ...medication, [field]: value } : medication
      ),
    }));
  };

  const addMedication = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          medication_name: "",
          dosage: "",
          frequency: "",
          status: "prescribed",
        },
      ],
    }));
  };

  const removeMedication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  // File upload handlers
  const handleFileUploadSuccess = (fileId: string) => {
    setUploadSuccess(`File uploaded successfully! ID: ${fileId}`);
    setUploadError(null);
    setRefreshFileTable(prev => prev + 1);
    
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
    setFormData(prev => ({
      ...prev,
      attached_files: fileIds
    }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Required fields
    if (!formData.appointment_id)
      newErrors.appointment_id = "Please select an appointment";
    if (!formData.patient_id) newErrors.patient_id = "Please select a patient";

    // Insurance validation
    if (!formData.insurance.provider.trim())
      newErrors["insurance.provider"] = "Insurance provider is required";
    if (!formData.insurance.policy_number.trim())
      newErrors["insurance.policy_number"] = "Policy number is required";

    // Emergency contact validation
    if (formData.emergency_contacts.length === 0) {
      newErrors.emergency_contacts =
        "At least one emergency contact is required";
    } else {
      formData.emergency_contacts.forEach((contact, index) => {
        if (!contact.first_name.trim())
          newErrors[`emergency_contact_${index}_first_name`] =
            "First name is required";
        if (!contact.last_name.trim())
          newErrors[`emergency_contact_${index}_last_name`] =
            "Last name is required";
        if (!contact.relationship.trim())
          newErrors[`emergency_contact_${index}_relationship`] =
            "Relationship is required";
        if (!contact.phone_primary.trim())
          newErrors[`emergency_contact_${index}_phone_primary`] =
            "Primary phone is required";
      });
    }

    // Consent validation
    if (!formData.hipaa_consent)
      newErrors.hipaa_consent = "HIPAA consent is required";
    if (!formData.treatment_consent)
      newErrors.treatment_consent = "Treatment consent is required";
    if (!formData.financial_consent)
      newErrors.financial_consent = "Financial consent is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrors({ general: "You must be logged in to submit the form" });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setErrors({});

    try {
      const now = new Date().toISOString();

      // 1. Create patient record first
      const patientData = {
        user_id: parseInt(user.$id) || Math.floor(Math.random() * 1000000),
        first_name: formData.patient_info.first_name,
        last_name: formData.patient_info.last_name,
        phone: formData.patient_info.phone,
        email: formData.patient_info.email,
        gender: formData.patient_info.gender,
        address: formData.patient_info.address,
        city: formData.patient_info.city,
        state: formData.patient_info.state,
        zipcode: formData.patient_info.zipcode,
        date_of_birth: formData.patient_info.date_of_birth,
        patient_id: formData.patient_id || Math.floor(Math.random() * 1000000),
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      console.log(
        "Creating patient with data:",
        JSON.stringify(patientData, null, 2)
      );

      const patientResult = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PATIENTS_COLLECTION_ID!,
        ID.unique(),
        patientData,
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      console.log(
        "Patient creation result:",
        JSON.stringify(patientResult, null, 2)
      );

      // 2. Update the patient_id in formData to use the created patient's ID
      const createdPatientId = patientResult.patient_id;
      console.log(
        "Created patient ID:",
        createdPatientId,
        "Type:",
        typeof createdPatientId
      );

      if (!createdPatientId) {
        throw new Error("Failed to get patient ID from created patient record");
      }

      // 3. Create patient form record
      const patientFormData = {
        patient_form_id: Math.floor(Math.random() * 1000000),
        patient_id: createdPatientId,
        form_template_id: 1, // Intake form template
        appointment_id: formData.appointment_id,
        form_data: JSON.stringify({
          patient_info: formData.patient_info,
          insurance: formData.insurance,
          medical_conditions: formData.medical_conditions,
          consent: {
            hipaa: formData.hipaa_consent,
            treatment: formData.treatment_consent,
            financial: formData.financial_consent,
          },
        }),
        status: "submitted",
        completion_percentage: 100,
        submitted_at: now,
        created_at: now,
        updated_at: now,
      };

      const patientFormResult = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PATIENT_FORMS_COLLECTION_ID!,
        ID.unique(),
        patientFormData,
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      // 4. Create allergies (only if there are valid allergies)
      if (formData.allergies && formData.allergies.length > 0) {
        for (const allergy of formData.allergies) {
          if (
            allergy.allergen_name &&
            allergy.allergen_name.trim() &&
            allergy.severity
          ) {
            // Ensure severity is valid
            let validSeverity = "mild";
            const severityStr = String(allergy.severity).toLowerCase().trim();
            if (["mild", "moderate", "severe"].includes(severityStr)) {
              validSeverity = severityStr;
            }

            const allergyData = {
              patient_id: createdPatientId,
              allergen_name: String(allergy.allergen_name).trim(),
              severity: validSeverity,
              reaction_description: allergy.reaction_description
                ? String(allergy.reaction_description).trim()
                : "",
              is_active: true,
              created_at: now,
              updated_at: now,
            };

            console.log(
              "Creating allergy:",
              JSON.stringify(allergyData, null, 2)
            );

            try {
              const allergyResult = await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env
                  .NEXT_PUBLIC_APPWRITE_PATIENT_ALLERGIES_COLLECTION_ID!,
                ID.unique(),
                allergyData,
                [
                  Permission.read(Role.user(user.$id)),
                  Permission.update(Role.user(user.$id)),
                  Permission.delete(Role.user(user.$id)),
                ]
              );
              console.log(
                "Successfully created allergy record:",
                allergyResult
              );
            } catch (allergyError) {
              console.error("Error creating allergy record:", allergyError);
              console.error("Failed allergy data:", allergyData);
            }
          }
        }
      }

      // 5. Create medications
      for (const medication of formData.medications) {
        if (medication.medication_name && medication.medication_name.trim()) {
          // Ensure status is valid - must match database enum values
          let validStatus = "prescribed";
          const statusStr = String(medication.status).toLowerCase().trim();
          if (["discontinued", "completed", "as_needed", "prescribed"].includes(statusStr)) {
            validStatus = statusStr;
          }

          const medicationData = {
            patient_id: createdPatientId,
            medication_name: String(medication.medication_name).trim(),
            dosage: medication.dosage ? String(medication.dosage).trim() : "",
            frequency: medication.frequency
              ? String(medication.frequency).trim()
              : "",
            status: validStatus,
            is_active: true,
            created_at: now,
            updated_at: now,
          };

          console.log(
            "Creating medication:",
            JSON.stringify(medicationData, null, 2)
          );

          try {
            const medicationResult = await databases.createDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              process.env
                .NEXT_PUBLIC_APPWRITE_PATIENT_MEDICATIONS_COLLECTION_ID!,
              ID.unique(),
              medicationData,
              [
                Permission.read(Role.user(user.$id)),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
              ]
            );
            console.log(
              "Successfully created medication record:",
              medicationResult
            );
          } catch (medicationError) {
            console.error("Error creating medication record:", medicationError);
            console.error("Failed medication data:", medicationData);
            // Continue with other medications
          }
        }
      }

      // 6. Create patient insurance record
      if (formData.insurance.provider && formData.insurance.provider.trim()) {
        const insuranceData = {
          insurance_id: Math.floor(Math.random() * 1000000), // Generate unique insurance_id
          patient_id: createdPatientId,
          provider_name: String(formData.insurance.provider).trim(),
          policy_number: formData.insurance.policy_number
            ? String(formData.insurance.policy_number).trim()
            : "",
          group_number: formData.insurance.group_number
            ? String(formData.insurance.group_number).trim()
            : "",
          subscriber_name: formData.insurance.subscriber_name
            ? String(formData.insurance.subscriber_name).trim()
            : "",
          is_primary: true, // Default to primary insurance
          is_active: true,
          created_at: now,
          updated_at: now,
        };

        console.log(
          "Creating patient insurance:",
          JSON.stringify(insuranceData, null, 2)
        );

        try {
          const insuranceResult = await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_PATIENT_INSURANCE_COLLECTION_ID!,
            ID.unique(),
            insuranceData,
            [
              Permission.read(Role.user(user.$id)),
              Permission.update(Role.user(user.$id)),
              Permission.delete(Role.user(user.$id)),
            ]
          );
          console.log(
            "Successfully created patient insurance record:",
            insuranceResult
          );
        } catch (insuranceError) {
          console.error("Error creating patient insurance record:", insuranceError);
          console.error("Failed insurance data:", insuranceData);
          // Continue with form submission even if insurance creation fails
        }
      }

      // 7. Create emergency contacts
      for (const contact of formData.emergency_contacts) {
        if (
          contact.first_name &&
          contact.first_name.trim() &&
          contact.last_name &&
          contact.last_name.trim()
        ) {
          const contactData = {
            first_name: String(contact.first_name).trim(),
            last_name: String(contact.last_name).trim(),
            relationship: contact.relationship
              ? String(contact.relationship).trim()
              : "",
            phone_primary: contact.phone_primary
              ? String(contact.phone_primary).trim()
              : "",
            phone_secondary: contact.phone_secondary
              ? String(contact.phone_secondary).trim()
              : "",
            email: contact.email ? String(contact.email).trim() : "",
            priority_order: contact.priority_order || 1,
            is_active: true,
            patient_id: createdPatientId.toString(),
            created_at: now,
            updated_at: now,
          };

          console.log(
            "Creating emergency contact:",
            JSON.stringify(contactData, null, 2)
          );

          try {
            const contactResult = await databases.createDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              process.env.NEXT_PUBLIC_APPWRITE_EMERGENCY_CONTACT_COLLECTION_ID!,
              ID.unique(),
              contactData,
              [
                Permission.read(Role.user(user.$id)),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
              ]
            );
            console.log(
              "Successfully created emergency contact record:",
              contactResult
            );
          } catch (contactError) {
            console.error(
              "Error creating emergency contact record:",
              contactError
            );
            console.error("Failed contact data:", contactData);
            // Continue with other contacts
          }
        }
      }

      // 8. Create form attachments for selected files
      if (formData.attached_files && formData.attached_files.length > 0) {
        console.log(
          "Creating form attachments for files:",
          formData.attached_files
        );

        try {
          const attachments = await formAttachmentService.createMultipleFormAttachments(
            patientFormResult.patient_form_id.toString(),
            formData.attached_files,
            createdPatientId,
            user.$id,
            'medical-document',
            'Intake form attachment'
          );

          console.log(
            "Successfully created form attachments:",
            attachments.length
          );
        } catch (attachmentError) {
          console.error("Error creating form attachments:", attachmentError);
          // Don't fail the entire form submission if attachments fail
          console.warn("Form submitted successfully but some file attachments may not have been saved");
        }
      }

      setSuccessMessage(
        `Complete intake form submitted successfully! Form ID: ${patientFormResult.patient_form_id}${
          formData.attached_files.length > 0 
            ? ` with ${formData.attached_files.length} file attachment${formData.attached_files.length > 1 ? 's' : ''}`
            : ''
        }`
      );

      // Reset form
      setFormData({
        patient_form_id: "",
        appointment_id: 0,
        patient_id: 0,
        patient_info: {
          first_name: "",
          last_name: "",
          phone: "",
          email: "",
          gender: "",
          address: "",
          city: "",
          state: "",
          zipcode: "",
          date_of_birth: "",
        },
        insurance: {
          provider: "",
          policy_number: "",
          group_number: "",
          subscriber_name: "",
          relationship_to_subscriber: "self",
        },
        allergies: [],
        medications: [],
        medical_conditions: "",
        emergency_contacts: [
          {
            first_name: "",
            last_name: "",
            relationship: "",
            phone_primary: "",
            phone_secondary: "",
            email: "",
            priority_order: 1,
          },
        ],
        attached_files: [],
        hipaa_consent: false,
        treatment_consent: false,
        financial_consent: false,
      });
    } catch (error) {
      console.error("Error creating complete intake form:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Failed to create intake form. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600">
            Please log in to access the complete intake form.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              🏥 Complete Patient Intake Form
            </h1>
            <p className="mt-2 text-gray-600">
              Complete intake form with appointment, patient, insurance, medical
              history, and emergency contacts. Logged in as:{" "}
              <span className="font-semibold">{user.email || user.$id}</span>
            </p>
          </div>

          <div className="p-6">
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
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {uploadError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Pending Intake Forms Selection */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Pending Intake Form
                </h2>
                <div className="space-y-4">
                  {pendingForms.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        No pending intake forms found. Please book an
                        appointment first to create an intake form.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {pendingForms.map((form) => (
                        <div
                          key={form.$id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedForm?.$id === form.$id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleFormSelection(form.$id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                Intake Form #{form.patient_form_id}
                              </h3>
                              {form.appointment && (
                                <p className="text-sm text-gray-600">
                                  Appointment:{" "}
                                  {form.appointment.appointment_date} at{" "}
                                  {form.appointment.appointment_time}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">
                                Status: {form.status} (
                                {form.completion_percentage}% complete)
                              </p>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="selected_form"
                                checked={selectedForm?.$id === form.$id}
                                onChange={() => handleFormSelection(form.$id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                aria-label={`Select intake form ${form.patient_form_id}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedForm && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        ✅ Selected: Intake Form #{selectedForm.patient_form_id}
                        {selectedForm.appointment && (
                          <span>
                            {" "}
                            for appointment on{" "}
                            {selectedForm.appointment.appointment_date}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Information */}
              {selectedForm && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Patient Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="patient_info.first_name"
                        value={formData.patient_info.first_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patient_info: {
                              ...prev.patient_info,
                              first_name: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter first name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="patient_info.last_name"
                        value={formData.patient_info.last_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patient_info: {
                              ...prev.patient_info,
                              last_name: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter last name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        title="Date of Birth"
                        name="patient_info.date_of_birth"
                        value={formData.patient_info.date_of_birth}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patient_info: {
                              ...prev.patient_info,
                              date_of_birth: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Gender *
                      </label>
                      <select
                        name="patient_info.gender"
                        value={formData.patient_info.gender}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patient_info: {
                              ...prev.patient_info,
                              gender: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        aria-label="Select gender"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">
                          Prefer not to say
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="patient_info.phone"
                        value={formData.patient_info.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patient_info: {
                              ...prev.patient_info,
                              phone: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="patient_info.email"
                        value={formData.patient_info.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patient_info: {
                              ...prev.patient_info,
                              email: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="patient@example.com"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        name="patient_info.address"
                        value={formData.patient_info.address}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patient_info: {
                              ...prev.patient_info,
                              address: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="123 Main Street, Apt 4B"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        City *
                      </label>
                      <input
                        type="text"
                        name="patient_info.city"
                        value={formData.patient_info.city}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patient_info: {
                              ...prev.patient_info,
                              city: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="New York"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        State *
                      </label>
                      <input
                        type="text"
                        name="patient_info.state"
                        value={formData.patient_info.state}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patient_info: {
                              ...prev.patient_info,
                              state: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="NY"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="patient_info.zipcode"
                        value={formData.patient_info.zipcode}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patient_info: {
                              ...prev.patient_info,
                              zipcode: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="12345"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Insurance Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Insurance Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Insurance Provider *
                    </label>
                    <select
                      name="insurance.provider"
                      value={formData.insurance.provider}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors["insurance.provider"]
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-300 focus:border-blue-500"
                      }`}
                      aria-label="Select insurance provider"
                    >
                      <option value="">Select insurance provider</option>
                      <option value="BCBS">Blue Cross Blue Shield (BCBS)</option>
                      <option value="UnitedHealthCare">UnitedHealthCare</option>
                      <option value="Aetna">Aetna</option>
                      <option value="Cigna">Cigna</option>
                      <option value="Kaiser">Kaiser Permanente</option>
                      <option value="Medicaid">Medicaid</option>
                      <option value="Medicare">Medicare</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors["insurance.provider"] && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors["insurance.provider"]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Policy Number *
                    </label>
                    <input
                      type="text"
                      name="insurance.policy_number"
                      value={formData.insurance.policy_number}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors["insurance.policy_number"]
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-300 focus:border-blue-500"
                      }`}
                      placeholder="Policy number"
                    />
                    {errors["insurance.policy_number"] && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors["insurance.policy_number"]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Group Number
                    </label>
                    <input
                      type="text"
                      name="insurance.group_number"
                      value={formData.insurance.group_number}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Group number (if applicable)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Subscriber Name
                    </label>
                    <input
                      type="text"
                      name="insurance.subscriber_name"
                      value={formData.insurance.subscriber_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Name on insurance policy"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Relationship to Subscriber
                    </label>
                    <select
                      name="insurance.relationship_to_subscriber"
                      value={formData.insurance.relationship_to_subscriber}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      aria-label="Select relationship to subscriber"
                    >
                      <option value="self">Self</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="parent">Parent</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Medical History
                </h2>

                {/* Allergies */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900">
                      Allergies
                    </h3>
                    <button
                      type="button"
                      onClick={addAllergy}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Allergy
                    </button>
                  </div>
                  {formData.allergies.map((allergy, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3 p-3 border border-gray-200 rounded"
                    >
                      <input
                        type="text"
                        placeholder="Allergen name"
                        value={allergy.allergen_name}
                        onChange={(e) =>
                          handleAllergyChange(
                            index,
                            "allergen_name",
                            e.target.value
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Allergen name ${index + 1}`}
                      />
                      <select
                        value={allergy.severity}
                        onChange={(e) =>
                          handleAllergyChange(index, "severity", e.target.value)
                        }
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Allergy severity ${index + 1}`}
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
                          handleAllergyChange(
                            index,
                            "reaction_description",
                            e.target.value
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Reaction description ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeAllergy(index)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {formData.allergies.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No allergies added. Click &quot;Add Allergy&quot; to add one.
                    </p>
                  )}
                </div>

                {/* Medications */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900">
                      Current Medications
                    </h3>
                    <button
                      type="button"
                      onClick={addMedication}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Medication
                    </button>
                  </div>
                  {formData.medications.map((medication, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3 p-3 border border-gray-200 rounded"
                    >
                      <input
                        type="text"
                        placeholder="Medication name"
                        value={medication.medication_name}
                        onChange={(e) =>
                          handleMedicationChange(
                            index,
                            "medication_name",
                            e.target.value
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Medication name ${index + 1}`}
                      />
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={medication.dosage}
                        onChange={(e) =>
                          handleMedicationChange(
                            index,
                            "dosage",
                            e.target.value
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Medication dosage ${index + 1}`}
                      />
                      <input
                        type="text"
                        placeholder="Frequency"
                        value={medication.frequency}
                        onChange={(e) =>
                          handleMedicationChange(
                            index,
                            "frequency",
                            e.target.value
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Medication frequency ${index + 1}`}
                      />
                      <select
                        value={medication.status}
                        onChange={(e) =>
                          handleMedicationChange(
                            index,
                            "status",
                            e.target.value
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Medication status ${index + 1}`}
                      >
                        <option value="prescribed">Prescribed</option>
                        <option value="as_needed">As Needed</option>
                        <option value="completed">Completed</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {formData.medications.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No medications added. Click &quot;Add Medication&quot; to add one.
                    </p>
                  )}
                </div>

                {/* Medical Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Medical Conditions & History
                  </label>
                  <textarea
                    name="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please describe any current medical conditions, past surgeries, or relevant medical history..."
                  />
                </div>
              </div>

              {/* Emergency Contacts */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Emergency Contacts
                </h2>
                <div className="space-y-4">
                  {formData.emergency_contacts.map((contact, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-md font-medium text-gray-900">
                          Emergency Contact {index + 1}
                        </h3>
                        {formData.emergency_contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmergencyContact(index)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            First Name *
                          </label>
                          <input
                            type="text"
                            value={contact.first_name}
                            onChange={(e) =>
                              handleEmergencyContactChange(
                                index,
                                "first_name",
                                e.target.value
                              )
                            }
                            className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`emergency_contact_${index}_first_name`]
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-300 focus:border-blue-500"
                            }`}
                            placeholder="First name"
                          />
                          {errors[`emergency_contact_${index}_first_name`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`emergency_contact_${index}_first_name`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            value={contact.last_name}
                            onChange={(e) =>
                              handleEmergencyContactChange(
                                index,
                                "last_name",
                                e.target.value
                              )
                            }
                            className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`emergency_contact_${index}_last_name`]
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-300 focus:border-blue-500"
                            }`}
                            placeholder="Last name"
                          />
                          {errors[`emergency_contact_${index}_last_name`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`emergency_contact_${index}_last_name`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Relationship *
                          </label>
                          <input
                            type="text"
                            value={contact.relationship}
                            onChange={(e) =>
                              handleEmergencyContactChange(
                                index,
                                "relationship",
                                e.target.value
                              )
                            }
                            className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`emergency_contact_${index}_relationship`]
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-300 focus:border-blue-500"
                            }`}
                            placeholder="e.g., Spouse, Parent, Sibling"
                          />
                          {errors[
                            `emergency_contact_${index}_relationship`
                          ] && (
                            <p className="mt-1 text-sm text-red-600">
                              {
                                errors[
                                  `emergency_contact_${index}_relationship`
                                ]
                              }
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Primary Phone *
                          </label>
                          <input
                            type="tel"
                            value={contact.phone_primary}
                            onChange={(e) =>
                              handleEmergencyContactChange(
                                index,
                                "phone_primary",
                                e.target.value
                              )
                            }
                            className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`emergency_contact_${index}_phone_primary`]
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-300 focus:border-blue-500"
                            }`}
                            placeholder="(555) 123-4567"
                          />
                          {errors[
                            `emergency_contact_${index}_phone_primary`
                          ] && (
                            <p className="mt-1 text-sm text-red-600">
                              {
                                errors[
                                  `emergency_contact_${index}_phone_primary`
                                ]
                              }
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Secondary Phone
                          </label>
                          <input
                            type="tel"
                            value={contact.phone_secondary || ""}
                            onChange={(e) =>
                              handleEmergencyContactChange(
                                index,
                                "phone_secondary",
                                e.target.value
                              )
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="(555) 987-6543 (optional)"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            value={contact.email || ""}
                            onChange={(e) =>
                              handleEmergencyContactChange(
                                index,
                                "email",
                                e.target.value
                              )
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="contact@example.com (optional)"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addEmergencyContact}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Another Emergency Contact
                  </button>
                </div>
              </div>

              {/* File Attachments */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  File Attachments
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Upload and attach relevant documents, images, or medical records to this intake form.
                </p>

                {/* Upload Section */}
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
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">
                    Select Files to Attach
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose from your previously uploaded files to attach to this intake form.
                  </p>
                  
                  {formData.attached_files.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>{formData.attached_files.length}</strong> file{formData.attached_files.length > 1 ? 's' : ''} selected for attachment
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
              </div>

              {/* Consent */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Consent & Authorization
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      title="HIPAA Authorization"
                      name="hipaa_consent"
                      checked={formData.hipaa_consent}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
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
                        <p className="mt-1 text-sm text-red-600">
                          {errors.hipaa_consent}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      title="Treatment Consent"
                      name="treatment_consent"
                      checked={formData.treatment_consent}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
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
                        <p className="mt-1 text-sm text-red-600">
                          {errors.treatment_consent}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      title="Financial Responsibility"
                      name="financial_consent"
                      checked={formData.financial_consent}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
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
                        <p className="mt-1 text-sm text-red-600">
                          {errors.financial_consent}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Submitting Form...
                    </>
                  ) : (
                    "Submit Complete Intake Form"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Form Preview */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Form Data Preview
            </h2>
            <p className="text-sm text-gray-600">
              Current form data (updates as you type)
            </p>
          </div>
          <div className="p-6">
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
