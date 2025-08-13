import { databases, ID } from '../lib/appwrite';
import { Permission, Role, Query } from 'appwrite';
import { formAttachmentService } from './formAttachmentService';

// Database and collection IDs
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const PATIENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PATIENTS_COLLECTION_ID!;
const PATIENT_FORMS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PATIENT_FORMS_COLLECTION_ID!;
const APPOINTMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!;
const PATIENT_ALLERGIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PATIENT_ALLERGIES_COLLECTION_ID!;
const PATIENT_MEDICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PATIENT_MEDICATIONS_COLLECTION_ID!;
const PATIENT_INSURANCE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PATIENT_INSURANCE_COLLECTION_ID!;
const EMERGENCY_CONTACT_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_EMERGENCY_CONTACT_COLLECTION_ID!;

// Type definitions
export interface Patient {
  $id: string;
  patient_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface Appointment {
  $id: string;
  appointment_id: number;
  patient_id: number;
  provider_id: number;
  appointment_date: string;
  appointment_time: string;
  reason_for_visit: string;
  status: string;
}

export interface PatientFormWithAppointment {
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

export interface Allergy {
  allergen_name: string;
  severity: "mild" | "moderate" | "severe";
  reaction_description: string;
}

export interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  status: "prescribed" | "as_needed" | "completed" | "discontinued";
}

export interface EmergencyContact {
  first_name: string;
  last_name: string;
  relationship: string;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  priority_order: number;
}

export interface InsuranceInfo {
  provider: string;
  policy_number: string;
  group_number: string;
  subscriber_name: string;
  relationship_to_subscriber: string;
  custom_provider?: string; // For when "Other" is selected
}

export interface PatientFormForCompletion {
  $id: string;
  patient_form_id: number;
  patient_id: number;
  appointment_id: number;
  status: string;
  completion_percentage: number;
  created_at: string;
  form_data?: string;
  appointment?: Appointment;
  patient?: Patient;
}

export interface PatientInfo {
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

export interface CompleteIntakeForm {
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

// Load pending patient forms that need completion
export async function loadPendingIntakeForms(): Promise<PatientFormForCompletion[]> {
  try {
    // Load patient forms that need completion (not submitted/completed)
    const patientFormsResponse = await databases.listDocuments(
      DATABASE_ID,
      PATIENT_FORMS_COLLECTION_ID,
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
          DATABASE_ID,
          APPOINTMENTS_COLLECTION_ID,
          [Query.equal("appointment_id", formData.appointment_id)]
        );

        if (appointmentResponse.documents.length > 0) {
          formData.appointment = appointmentResponse.documents[0] as unknown as Appointment;
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

    return formsWithAppointments;
  } catch (error) {
    console.error("Error loading pending intake forms:", error);
    throw new Error("Failed to load pending intake forms");
  }
}

// Validate form data before submission
export function validateCompleteIntakeForm(formData: CompleteIntakeForm): { isValid: boolean; errors: { [key: string]: string } } {
  const errors: { [key: string]: string } = {};

  // Patient info validation
  if (!formData.patient_info.first_name.trim()) errors["patient_info.first_name"] = "First name is required";
  if (!formData.patient_info.last_name.trim()) errors["patient_info.last_name"] = "Last name is required";
  if (!formData.patient_info.phone.trim()) errors["patient_info.phone"] = "Phone number is required";
  if (!formData.patient_info.email.trim()) errors["patient_info.email"] = "Email is required";

  // Insurance validation
  if (!formData.insurance.provider.trim()) errors["insurance.provider"] = "Insurance provider is required";
  
  // If "Other" is selected, validate custom provider
  if (formData.insurance.provider === "Other" && !formData.insurance.custom_provider?.trim()) {
    errors["insurance.custom_provider"] = "Please specify your insurance provider or type 'none'";
  }

  // Emergency contact validation
  if (formData.emergency_contacts.length === 0) {
    errors.emergency_contacts = "At least one emergency contact is required";
  } else {
    formData.emergency_contacts.forEach((contact, index) => {
      if (!contact.first_name.trim()) errors[`emergency_contact_${index}_first_name`] = "First name is required";
      if (!contact.last_name.trim()) errors[`emergency_contact_${index}_last_name`] = "Last name is required";
      if (!contact.relationship.trim()) errors[`emergency_contact_${index}_relationship`] = "Relationship is required";
      if (!contact.phone_primary.trim()) errors[`emergency_contact_${index}_phone_primary`] = "Primary phone is required";
    });
  }

  // Consent validation
  if (!formData.hipaa_consent) errors.hipaa_consent = "HIPAA consent is required";
  if (!formData.treatment_consent) errors.treatment_consent = "Treatment consent is required";
  if (!formData.financial_consent) errors.financial_consent = "Financial consent is required";

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Submit complete intake form
export async function submitCompleteIntakeForm(
  formData: CompleteIntakeForm,
  userId: string
): Promise<{ success: boolean; message: string; patientId?: number; formId?: number }> {
  try {
    const now = new Date().toISOString();

    // 1. Create patient record first
    const patientData = {
      user_id: parseInt(userId) || Math.floor(Math.random() * 1000000),
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
      medical_conditions: formData.medical_conditions || "",
      medical_history: formData.medical_conditions || "", // Using same data for both fields initially
      medical_conditions_updated_at: now,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    console.log("Creating patient with data:", JSON.stringify(patientData, null, 2));

    const patientResult = await databases.createDocument(
      DATABASE_ID,
      PATIENTS_COLLECTION_ID,
      ID.unique(),
      patientData,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    );

    console.log("Patient creation result:", JSON.stringify(patientResult, null, 2));

    // 2. Update the patient_id in formData to use the created patient's ID
    const createdPatientId = patientResult.patient_id;
    console.log("Created patient ID:", createdPatientId, "Type:", typeof createdPatientId);

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
      DATABASE_ID,
      PATIENT_FORMS_COLLECTION_ID,
      ID.unique(),
      patientFormData,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    );

    // 4. Create allergies (only if there are valid allergies)
    if (formData.allergies && formData.allergies.length > 0) {
      for (const allergy of formData.allergies) {
        if (allergy.allergen_name && allergy.allergen_name.trim() && allergy.severity) {
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

          console.log("Creating allergy:", JSON.stringify(allergyData, null, 2));

          try {
            const allergyResult = await databases.createDocument(
              DATABASE_ID,
              PATIENT_ALLERGIES_COLLECTION_ID,
              ID.unique(),
              allergyData,
              [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
              ]
            );
            console.log("Successfully created allergy record:", allergyResult);
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
          frequency: medication.frequency ? String(medication.frequency).trim() : "",
          status: validStatus,
          is_active: true,
          created_at: now,
          updated_at: now,
        };

        console.log("Creating medication:", JSON.stringify(medicationData, null, 2));

        try {
          const medicationResult = await databases.createDocument(
            DATABASE_ID,
            PATIENT_MEDICATIONS_COLLECTION_ID,
            ID.unique(),
            medicationData,
            [
              Permission.read(Role.user(userId)),
              Permission.update(Role.user(userId)),
              Permission.delete(Role.user(userId)),
            ]
          );
          console.log("Successfully created medication record:", medicationResult);
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

      console.log("Creating patient insurance:", JSON.stringify(insuranceData, null, 2));

      try {
        const insuranceResult = await databases.createDocument(
          DATABASE_ID,
          PATIENT_INSURANCE_COLLECTION_ID,
          ID.unique(),
          insuranceData,
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        );
        console.log("Successfully created patient insurance record:", insuranceResult);
      } catch (insuranceError) {
        console.error("Error creating patient insurance record:", insuranceError);
        console.error("Failed insurance data:", insuranceData);
        // Continue with form submission even if insurance creation fails
      }
    }

    // 7. Create emergency contacts
    for (const contact of formData.emergency_contacts) {
      if (contact.first_name && contact.first_name.trim() && contact.last_name && contact.last_name.trim()) {
        const contactData = {
          first_name: String(contact.first_name).trim(),
          last_name: String(contact.last_name).trim(),
          relationship: contact.relationship ? String(contact.relationship).trim() : "",
          phone_primary: contact.phone_primary ? String(contact.phone_primary).trim() : "",
          phone_secondary: contact.phone_secondary ? String(contact.phone_secondary).trim() : "",
          email: contact.email ? String(contact.email).trim() : "",
          priority_order: contact.priority_order || 1,
          is_active: true,
          patient_id: createdPatientId.toString(),
          created_at: now,
          updated_at: now,
        };

        console.log("Creating emergency contact:", JSON.stringify(contactData, null, 2));

        try {
          const contactResult = await databases.createDocument(
            DATABASE_ID,
            EMERGENCY_CONTACT_COLLECTION_ID,
            ID.unique(),
            contactData,
            [
              Permission.read(Role.user(userId)),
              Permission.update(Role.user(userId)),
              Permission.delete(Role.user(userId)),
            ]
          );
          console.log("Successfully created emergency contact record:", contactResult);
        } catch (contactError) {
          console.error("Error creating emergency contact record:", contactError);
          console.error("Failed contact data:", contactData);
          // Continue with other contacts
        }
      }
    }

    // 8. Create form attachments for selected files
    if (formData.attached_files && formData.attached_files.length > 0) {
      console.log("Creating form attachments for files:", formData.attached_files);

      try {
        const attachments = await formAttachmentService.createMultipleFormAttachments(
          patientFormResult.patient_form_id.toString(),
          formData.attached_files,
          createdPatientId,
          userId,
          'medical-document',
          'Intake form attachment'
        );

        console.log("Successfully created form attachments:", attachments.length);
      } catch (attachmentError) {
        console.error("Error creating form attachments:", attachmentError);
        // Don't fail the entire form submission if attachments fail
        console.warn("Form submitted successfully but some file attachments may not have been saved");
      }
    }

    return {
      success: true,
      message: `Complete intake form submitted successfully! Form ID: ${patientFormResult.patient_form_id}${
        formData.attached_files.length > 0 
          ? ` with ${formData.attached_files.length} file attachment${formData.attached_files.length > 1 ? 's' : ''}`
          : ''
      }`,
      patientId: createdPatientId,
      formId: patientFormResult.patient_form_id
    };

  } catch (error) {
    console.error("Error creating complete intake form:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create intake form. Please try again."
    };
  }
}

// Helper functions for form data manipulation
export function createEmptyCompleteIntakeForm(): CompleteIntakeForm {
  return {
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
  };
}

// Helper functions for managing form arrays
export function addAllergy(formData: CompleteIntakeForm): CompleteIntakeForm {
  return {
    ...formData,
    allergies: [
      ...formData.allergies,
      {
        allergen_name: "",
        severity: "mild",
        reaction_description: "",
      },
    ],
  };
}

export function removeAllergy(formData: CompleteIntakeForm, index: number): CompleteIntakeForm {
  return {
    ...formData,
    allergies: formData.allergies.filter((_, i) => i !== index),
  };
}

export function updateAllergy(
  formData: CompleteIntakeForm,
  index: number,
  field: keyof Allergy,
  value: string
): CompleteIntakeForm {
  return {
    ...formData,
    allergies: formData.allergies.map((allergy, i) =>
      i === index ? { ...allergy, [field]: value } : allergy
    ),
  };
}

export function addMedication(formData: CompleteIntakeForm): CompleteIntakeForm {
  return {
    ...formData,
    medications: [
      ...formData.medications,
      {
        medication_name: "",
        dosage: "",
        frequency: "",
        status: "prescribed",
      },
    ],
  };
}

export function removeMedication(formData: CompleteIntakeForm, index: number): CompleteIntakeForm {
  return {
    ...formData,
    medications: formData.medications.filter((_, i) => i !== index),
  };
}

export function updateMedication(
  formData: CompleteIntakeForm,
  index: number,
  field: keyof Medication,
  value: string
): CompleteIntakeForm {
  return {
    ...formData,
    medications: formData.medications.map((medication, i) =>
      i === index ? { ...medication, [field]: value } : medication
    ),
  };
}

export function addEmergencyContact(formData: CompleteIntakeForm): CompleteIntakeForm {
  return {
    ...formData,
    emergency_contacts: [
      ...formData.emergency_contacts,
      {
        first_name: "",
        last_name: "",
        relationship: "",
        phone_primary: "",
        phone_secondary: "",
        email: "",
        priority_order: formData.emergency_contacts.length + 1,
      },
    ],
  };
}

export function removeEmergencyContact(formData: CompleteIntakeForm, index: number): CompleteIntakeForm {
  return {
    ...formData,
    emergency_contacts: formData.emergency_contacts.filter((_, i) => i !== index),
  };
}

export function updateEmergencyContact(
  formData: CompleteIntakeForm,
  index: number,
  field: keyof EmergencyContact,
  value: string | number
): CompleteIntakeForm {
  return {
    ...formData,
    emergency_contacts: formData.emergency_contacts.map((contact, i) =>
      i === index ? { ...contact, [field]: value } : contact
    ),
  };
}

// Update patient info section
export function updatePatientInfo(
  formData: CompleteIntakeForm,
  field: keyof PatientInfo,
  value: string
): CompleteIntakeForm {
  return {
    ...formData,
    patient_info: {
      ...formData.patient_info,
      [field]: value,
    },
  };
}

// Update insurance info section
export function updateInsuranceInfo(
  formData: CompleteIntakeForm,
  field: keyof InsuranceInfo,
  value: string
): CompleteIntakeForm {
  return {
    ...formData,
    insurance: {
      ...formData.insurance,
      [field]: value,
    },
  };
}

// Update consent fields
export function updateConsent(
  formData: CompleteIntakeForm,
  field: 'hipaa_consent' | 'treatment_consent' | 'financial_consent',
  value: boolean
): CompleteIntakeForm {
  return {
    ...formData,
    [field]: value,
  };
}

// Update medical conditions
export function updateMedicalConditions(
  formData: CompleteIntakeForm,
  conditions: string
): CompleteIntakeForm {
  return {
    ...formData,
    medical_conditions: conditions,
  };
}

// Update attached files
export function updateAttachedFiles(
  formData: CompleteIntakeForm,
  files: string[]
): CompleteIntakeForm {
  return {
    ...formData,
    attached_files: files,
  };
}

// Save intake form progress (without submitting)
export async function saveIntakeFormProgress(
  formData: CompleteIntakeForm,
  userId: string,
  appointmentDocId?: string
): Promise<{ success: boolean; message: string; completionPercentage?: number }> {
  try {
    const now = new Date().toISOString();

    // Calculate completion percentage based on filled fields
    const completionPercentage = calculateCompletionPercentage(formData);

    if (appointmentDocId) {
      // Get appointment details
      const appointment = await getAppointmentById(appointmentDocId);
      if (!appointment) {
        return {
          success: false,
          message: "Appointment not found"
        };
      }

      // Get or create form record
      const existingForm = await getExistingIntakeForAppointment(appointment.appointment_id, appointment.patient_id);
      
      if (!existingForm) {
        // Create new form record
        const patientFormData = {
          patient_form_id: Math.floor(Math.random() * 1000000),
          patient_id: appointment.patient_id,
          form_template_id: 1, // Intake form template
          appointment_id: appointment.appointment_id,
          form_data: JSON.stringify({
            patient_info: formData.patient_info,
            insurance: formData.insurance,
            medical_conditions: formData.medical_conditions,
            allergies: formData.allergies,
            medications: formData.medications,
            emergency_contacts: formData.emergency_contacts,
            consent: {
              hipaa: formData.hipaa_consent,
              treatment: formData.treatment_consent,
              financial: formData.financial_consent,
            },
            attached_files: formData.attached_files,
          }),
          status: completionPercentage > 0 ? "in_progress" : "not_started",
          completion_percentage: completionPercentage,
          created_at: now,
          updated_at: now,
        };

        await databases.createDocument(
          DATABASE_ID,
          PATIENT_FORMS_COLLECTION_ID,
          ID.unique(),
          patientFormData,
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        );
      } else {
        // Update existing form record
        const formResponse = await databases.listDocuments(
          DATABASE_ID,
          PATIENT_FORMS_COLLECTION_ID,
          [
            Query.equal("patient_form_id", existingForm.patient_form_id),
            Query.limit(1)
          ]
        );

        if (formResponse.documents.length > 0) {
          const formDoc = formResponse.documents[0];
          const formUpdateData = {
            form_data: JSON.stringify({
              patient_info: formData.patient_info,
              insurance: formData.insurance,
              medical_conditions: formData.medical_conditions,
              allergies: formData.allergies,
              medications: formData.medications,
              emergency_contacts: formData.emergency_contacts,
              consent: {
                hipaa: formData.hipaa_consent,
                treatment: formData.treatment_consent,
                financial: formData.financial_consent,
              },
              attached_files: formData.attached_files,
            }),
            status: completionPercentage > 0 ? "in_progress" : "not_started",
            completion_percentage: completionPercentage,
            updated_at: now,
          };

          await databases.updateDocument(
            DATABASE_ID,
            PATIENT_FORMS_COLLECTION_ID,
            formDoc.$id,
            formUpdateData
          );
        }
      }
    }

    return {
      success: true,
      message: `Progress saved successfully! (${completionPercentage}% complete)`,
      completionPercentage
    };

  } catch (error) {
    console.error("Error saving intake form progress:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save progress. Please try again."
    };
  }
}

// Calculate completion percentage based on filled fields
function calculateCompletionPercentage(formData: CompleteIntakeForm): number {
  let totalFields = 0;
  let filledFields = 0;

  // Patient info (8 fields)
  totalFields += 8;
  if (formData.patient_info.first_name.trim()) filledFields++;
  if (formData.patient_info.last_name.trim()) filledFields++;
  if (formData.patient_info.phone.trim()) filledFields++;
  if (formData.patient_info.email.trim()) filledFields++;
  if (formData.patient_info.gender.trim()) filledFields++;
  if (formData.patient_info.address.trim()) filledFields++;
  if (formData.patient_info.city.trim()) filledFields++;
  if (formData.patient_info.state.trim()) filledFields++;

  // Insurance info (2 required fields)
  totalFields += 2;
  if (formData.insurance.provider.trim()) filledFields++;
  if (formData.insurance.policy_number.trim()) filledFields++;

  // Emergency contacts (at least 1 with 3 required fields)
  totalFields += 3;
  if (formData.emergency_contacts.length > 0) {
    const firstContact = formData.emergency_contacts[0];
    if (firstContact.first_name.trim()) filledFields++;
    if (firstContact.last_name.trim()) filledFields++;
    if (firstContact.phone_primary.trim()) filledFields++;
  }

  // Consent (3 fields)
  totalFields += 3;
  if (formData.hipaa_consent) filledFields++;
  if (formData.treatment_consent) filledFields++;
  if (formData.financial_consent) filledFields++;

  return Math.round((filledFields / totalFields) * 100);
}

// Get appointment details by appointment document ID
export async function getAppointmentById(appointmentDocId: string): Promise<Appointment | null> {
  try {
    const appointmentDoc = await databases.getDocument(
      DATABASE_ID,
      APPOINTMENTS_COLLECTION_ID,
      appointmentDocId
    );
    return appointmentDoc as unknown as Appointment;
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return null;
  }
}

// Check if intake form already exists for appointment
export async function getExistingIntakeForAppointment(
  appointmentId: number,
  patientId: number
): Promise<PatientFormForCompletion | null> {
  try {
    const formsResponse = await databases.listDocuments(
      DATABASE_ID,
      PATIENT_FORMS_COLLECTION_ID,
      [
        Query.equal("appointment_id", appointmentId),
        Query.equal("patient_id", patientId),
        Query.equal("form_template_id", 1), // Intake form template
        Query.limit(1)
      ]
    );

    if (formsResponse.documents.length > 0) {
      const form = formsResponse.documents[0] as unknown as PatientFormForCompletion;
      
      // Get appointment details
      try {
        const appointmentResponse = await databases.listDocuments(
          DATABASE_ID,
          APPOINTMENTS_COLLECTION_ID,
          [Query.equal("appointment_id", appointmentId)]
        );

        if (appointmentResponse.documents.length > 0) {
          form.appointment = appointmentResponse.documents[0] as unknown as Appointment;
        }
      } catch (error) {
        console.error("Error loading appointment for existing form:", error);
      }

      return form;
    }

    return null;
  } catch (error) {
    console.error("Error checking for existing intake form:", error);
    return null;
  }
}

// Create or get intake form for specific appointment
export async function createIntakeFormForAppointment(
  appointmentDocId: string,
  userId: string
): Promise<{ form: PatientFormForCompletion | null; appointment: Appointment | null; isExisting: boolean }> {
  try {
    // First get the appointment details
    const appointment = await getAppointmentById(appointmentDocId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Check if intake form already exists
    const existingForm = await getExistingIntakeForAppointment(appointment.appointment_id, appointment.patient_id);
    if (existingForm) {
      return { form: existingForm, appointment, isExisting: true };
    }

    // Create new intake form record
    const now = new Date().toISOString();
    const patientFormData = {
      patient_form_id: Math.floor(Math.random() * 1000000),
      patient_id: appointment.patient_id,
      form_template_id: 1, // Intake form template
      appointment_id: appointment.appointment_id,
      form_data: JSON.stringify({}), // Empty form data initially
      status: "not_started",
      completion_percentage: 0,
      created_at: now,
      updated_at: now,
    };

    const patientFormResult = await databases.createDocument(
      DATABASE_ID,
      PATIENT_FORMS_COLLECTION_ID,
      ID.unique(),
      patientFormData,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    );

    const newForm: PatientFormForCompletion = {
      $id: patientFormResult.$id,
      patient_form_id: patientFormResult.patient_form_id,
      patient_id: patientFormResult.patient_id,
      appointment_id: patientFormResult.appointment_id,
      status: patientFormResult.status,
      completion_percentage: patientFormResult.completion_percentage,
      created_at: patientFormResult.created_at,
      appointment
    };

    return { form: newForm, appointment, isExisting: false };
  } catch (error) {
    console.error("Error creating intake form for appointment:", error);
    return { form: null, appointment: null, isExisting: false };
  }
}

// Load existing intake form data for editing
export async function loadExistingIntakeFormData(
  appointmentDocId: string,
  userId: string
): Promise<{ success: boolean; data?: CompleteIntakeForm; message: string }> {
  try {
    // Get appointment details first
    const appointment = await getAppointmentById(appointmentDocId);
    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    // Check if intake form exists for this appointment
    const existingForm = await getExistingIntakeForAppointment(appointment.appointment_id, appointment.patient_id);
    if (!existingForm) {
      return {
        success: false,
        message: "No existing intake form found for this appointment"
      };
    }

    // For new intake forms (not_started status), return empty form data
    // Each appointment should have its own fresh intake form
    if (existingForm.status === "not_started" || existingForm.completion_percentage === 0) {
      const emptyFormData: CompleteIntakeForm = {
        patient_form_id: existingForm.$id,
        appointment_id: appointment.appointment_id,
        patient_id: appointment.patient_id,
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
        emergency_contacts: [{
          first_name: "",
          last_name: "",
          relationship: "",
          phone_primary: "",
          phone_secondary: "",
          email: "",
          priority_order: 1,
        }],
        attached_files: [],
        hipaa_consent: false,
        treatment_consent: false,
        financial_consent: false,
      };

      return {
        success: true,
        data: emptyFormData,
        message: "New intake form ready for completion"
      };
    }

    // Only load existing data for forms that are actually in progress or completed
    // This ensures we only pre-fill when the user has already started entering data for THIS specific appointment

    // Parse form data to get what was actually saved for this form
    let formDataFromThisForm: {
      patient_info?: PatientInfo;
      insurance?: InsuranceInfo;
      medical_conditions?: string;
      emergency_contacts?: EmergencyContact[];
      consent?: {
        hipaa?: boolean;
        treatment?: boolean;
        financial?: boolean;
      };
    } = {};
    try {
      if (existingForm.form_data) {
        formDataFromThisForm = JSON.parse(existingForm.form_data);
      }
    } catch (error) {
      console.error("Error parsing form data:", error);
    }

    // Load attached files (form attachments) for this specific form
    let attachedFiles: string[] = [];
    try {
      const attachmentsResponse = await formAttachmentService.getFormAttachments(existingForm.patient_form_id.toString());
      attachedFiles = attachmentsResponse.map(attachment => attachment.file_id);
    } catch (error) {
      console.error("Error loading form attachments:", error);
    }

    // Build form data using only what was saved for this specific form
    const completeFormData: CompleteIntakeForm = {
      patient_form_id: existingForm.$id,
      appointment_id: appointment.appointment_id,
      patient_id: appointment.patient_id,
      patient_info: formDataFromThisForm.patient_info || {
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
      insurance: formDataFromThisForm.insurance || {
        provider: "",
        policy_number: "",
        group_number: "",
        subscriber_name: "",
        relationship_to_subscriber: "self",
      },
      allergies: [], // Start fresh for each appointment
      medications: [], // Start fresh for each appointment
      medical_conditions: formDataFromThisForm.medical_conditions || "",
      emergency_contacts: formDataFromThisForm.emergency_contacts || [{
        first_name: "",
        last_name: "",
        relationship: "",
        phone_primary: "",
        phone_secondary: "",
        email: "",
        priority_order: 1,
      }],
      attached_files: attachedFiles,
      hipaa_consent: formDataFromThisForm.consent?.hipaa || false,
      treatment_consent: formDataFromThisForm.consent?.treatment || false,
      financial_consent: formDataFromThisForm.consent?.financial || false,
    };

    return {
      success: true,
      data: completeFormData,
      message: "Existing intake form data loaded successfully"
    };

  } catch (error) {
    console.error("Error loading existing intake form data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to load existing intake form data"
    };
  }
}

// Submit complete intake form for specific appointment
export async function submitCompleteIntakeFormForAppointment(
  formData: CompleteIntakeForm,
  userId: string,
  appointmentDocId: string
): Promise<{ success: boolean; message: string; patientId?: number; formId?: number }> {
  try {
    // Get appointment details first
    const appointment = await getAppointmentById(appointmentDocId);
    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    // Check if this is an update to an existing form
    const existingForm = await getExistingIntakeForAppointment(appointment.appointment_id, appointment.patient_id);
    
    if (existingForm) {
      // This is an update - use the update function
      return await updateCompleteIntakeForm(formData, userId, appointmentDocId);
    } else {
      // This is a new form - use the create function
      const updatedFormData = {
        ...formData,
        appointment_id: appointment.appointment_id,
        patient_id: appointment.patient_id,
      };
      return await submitCompleteIntakeForm(updatedFormData, userId);
    }
  } catch (error) {
    console.error("Error submitting intake form for appointment:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to submit intake form for appointment"
    };
  }
}

// Update existing complete intake form
export async function updateCompleteIntakeForm(
  formData: CompleteIntakeForm,
  userId: string,
  appointmentDocId: string
): Promise<{ success: boolean; message: string; patientId?: number; formId?: number }> {
  try {
    const now = new Date().toISOString();

    // Get appointment details
    const appointment = await getAppointmentById(appointmentDocId);
    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found"
      };
    }

    // Get existing form
    const existingForm = await getExistingIntakeForAppointment(appointment.appointment_id, appointment.patient_id);
    if (!existingForm) {
      return {
        success: false,
        message: "No existing form found to update"
      };
    }

    // 1. Update patient record
    try {
      const patientResponse = await databases.listDocuments(
        DATABASE_ID,
        PATIENTS_COLLECTION_ID,
        [Query.equal("patient_id", appointment.patient_id)]
      );

      if (patientResponse.documents.length > 0) {
        const patientDoc = patientResponse.documents[0];
        const patientUpdateData = {
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
          medical_conditions: formData.medical_conditions || "",
          medical_history: formData.medical_conditions || "",
          medical_conditions_updated_at: now,
          updated_at: now,
        };

        await databases.updateDocument(
          DATABASE_ID,
          PATIENTS_COLLECTION_ID,
          patientDoc.$id,
          patientUpdateData
        );
        console.log("Updated patient record successfully");
      }
    } catch (error) {
      console.error("Error updating patient record:", error);
    }

    // 2. Update patient form record
    try {
      const formResponse = await databases.listDocuments(
        DATABASE_ID,
        PATIENT_FORMS_COLLECTION_ID,
        [
          Query.equal("patient_form_id", existingForm.patient_form_id),
          Query.limit(1)
        ]
      );

      if (formResponse.documents.length > 0) {
        const formDoc = formResponse.documents[0];
        const formUpdateData = {
          form_data: JSON.stringify({
            patient_info: formData.patient_info,
            insurance: formData.insurance,
            medical_conditions: formData.medical_conditions,
            emergency_contacts: formData.emergency_contacts,
            consent: {
              hipaa: formData.hipaa_consent,
              treatment: formData.treatment_consent,
              financial: formData.financial_consent,
            },
          }),
          status: "submitted",
          completion_percentage: 100,
          submitted_at: now,
          updated_at: now,
        };

        await databases.updateDocument(
          DATABASE_ID,
          PATIENT_FORMS_COLLECTION_ID,
          formDoc.$id,
          formUpdateData
        );
        console.log("Updated patient form record successfully");
      }
    } catch (error) {
      console.error("Error updating patient form record:", error);
    }

    // 3. Update allergies - delete existing and create new ones
    try {
      // Delete existing allergies
      const existingAllergiesResponse = await databases.listDocuments(
        DATABASE_ID,
        PATIENT_ALLERGIES_COLLECTION_ID,
        [Query.equal("patient_id", appointment.patient_id)]
      );

      for (const allergy of existingAllergiesResponse.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          PATIENT_ALLERGIES_COLLECTION_ID,
          allergy.$id
        );
      }

      // Create new allergies
      if (formData.allergies && formData.allergies.length > 0) {
        for (const allergy of formData.allergies) {
          if (allergy.allergen_name && allergy.allergen_name.trim() && allergy.severity) {
            let validSeverity = "mild";
            const severityStr = String(allergy.severity).toLowerCase().trim();
            if (["mild", "moderate", "severe"].includes(severityStr)) {
              validSeverity = severityStr;
            }

            const allergyData = {
              patient_id: appointment.patient_id,
              allergen_name: String(allergy.allergen_name).trim(),
              severity: validSeverity,
              reaction_description: allergy.reaction_description
                ? String(allergy.reaction_description).trim()
                : "",
              is_active: true,
              created_at: now,
              updated_at: now,
            };

            await databases.createDocument(
              DATABASE_ID,
              PATIENT_ALLERGIES_COLLECTION_ID,
              ID.unique(),
              allergyData,
              [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
              ]
            );
          }
        }
      }
      console.log("Updated allergies successfully");
    } catch (error) {
      console.error("Error updating allergies:", error);
    }

    // 4. Update medications - delete existing and create new ones
    try {
      // Delete existing medications
      const existingMedicationsResponse = await databases.listDocuments(
        DATABASE_ID,
        PATIENT_MEDICATIONS_COLLECTION_ID,
        [Query.equal("patient_id", appointment.patient_id)]
      );

      for (const medication of existingMedicationsResponse.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          PATIENT_MEDICATIONS_COLLECTION_ID,
          medication.$id
        );
      }

      // Create new medications
      for (const medication of formData.medications) {
        if (medication.medication_name && medication.medication_name.trim()) {
          let validStatus = "prescribed";
          const statusStr = String(medication.status).toLowerCase().trim();
          if (["discontinued", "completed", "as_needed", "prescribed"].includes(statusStr)) {
            validStatus = statusStr;
          }

          const medicationData = {
            patient_id: appointment.patient_id,
            medication_name: String(medication.medication_name).trim(),
            dosage: medication.dosage ? String(medication.dosage).trim() : "",
            frequency: medication.frequency ? String(medication.frequency).trim() : "",
            status: validStatus,
            is_active: true,
            created_at: now,
            updated_at: now,
          };

          await databases.createDocument(
            DATABASE_ID,
            PATIENT_MEDICATIONS_COLLECTION_ID,
            ID.unique(),
            medicationData,
            [
              Permission.read(Role.user(userId)),
              Permission.update(Role.user(userId)),
              Permission.delete(Role.user(userId)),
            ]
          );
        }
      }
      console.log("Updated medications successfully");
    } catch (error) {
      console.error("Error updating medications:", error);
    }

    // 5. Update insurance - delete existing and create new one
    try {
      // Delete existing insurance
      const existingInsuranceResponse = await databases.listDocuments(
        DATABASE_ID,
        PATIENT_INSURANCE_COLLECTION_ID,
        [Query.equal("patient_id", appointment.patient_id)]
      );

      for (const insurance of existingInsuranceResponse.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          PATIENT_INSURANCE_COLLECTION_ID,
          insurance.$id
        );
      }

      // Create new insurance record
      if (formData.insurance.provider && formData.insurance.provider.trim()) {
        const insuranceData = {
          insurance_id: Math.floor(Math.random() * 1000000),
          patient_id: appointment.patient_id,
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
          is_primary: true,
          is_active: true,
          created_at: now,
          updated_at: now,
        };

        await databases.createDocument(
          DATABASE_ID,
          PATIENT_INSURANCE_COLLECTION_ID,
          ID.unique(),
          insuranceData,
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        );
      }
      console.log("Updated insurance successfully");
    } catch (error) {
      console.error("Error updating insurance:", error);
    }

    // 6. Update emergency contacts - delete existing and create new ones
    try {
      // Delete existing emergency contacts
      const existingContactsResponse = await databases.listDocuments(
        DATABASE_ID,
        EMERGENCY_CONTACT_COLLECTION_ID,
        [Query.equal("patient_id", appointment.patient_id.toString())]
      );

      for (const contact of existingContactsResponse.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          EMERGENCY_CONTACT_COLLECTION_ID,
          contact.$id
        );
      }

      // Create new emergency contacts
      for (const contact of formData.emergency_contacts) {
        if (contact.first_name && contact.first_name.trim() && contact.last_name && contact.last_name.trim()) {
          const contactData = {
            first_name: String(contact.first_name).trim(),
            last_name: String(contact.last_name).trim(),
            relationship: contact.relationship ? String(contact.relationship).trim() : "",
            phone_primary: contact.phone_primary ? String(contact.phone_primary).trim() : "",
            phone_secondary: contact.phone_secondary ? String(contact.phone_secondary).trim() : "",
            email: contact.email ? String(contact.email).trim() : "",
            priority_order: contact.priority_order || 1,
            is_active: true,
            patient_id: appointment.patient_id.toString(),
            created_at: now,
            updated_at: now,
          };

          await databases.createDocument(
            DATABASE_ID,
            EMERGENCY_CONTACT_COLLECTION_ID,
            ID.unique(),
            contactData,
            [
              Permission.read(Role.user(userId)),
              Permission.update(Role.user(userId)),
              Permission.delete(Role.user(userId)),
            ]
          );
        }
      }
      console.log("Updated emergency contacts successfully");
    } catch (error) {
      console.error("Error updating emergency contacts:", error);
    }

    // 7. Update form attachments
    if (formData.attached_files && formData.attached_files.length > 0) {
      try {
        // Delete existing form attachments
        const existingAttachments = await formAttachmentService.getFormAttachments(existingForm.patient_form_id.toString());
        for (const attachment of existingAttachments) {
          await formAttachmentService.removeFormAttachment(attachment.$id);
        }

        // Create new form attachments
        const attachments = await formAttachmentService.createMultipleFormAttachments(
          existingForm.patient_form_id.toString(),
          formData.attached_files,
          appointment.patient_id,
          userId,
          'medical-document',
          'Updated intake form attachment'
        );

        console.log("Successfully updated form attachments:", attachments.length);
      } catch (attachmentError) {
        console.error("Error updating form attachments:", attachmentError);
      }
    }

    return {
      success: true,
      message: `Intake form updated successfully! Form ID: ${existingForm.patient_form_id}${
        formData.attached_files.length > 0 
          ? ` with ${formData.attached_files.length} file attachment${formData.attached_files.length > 1 ? 's' : ''}`
          : ''
      }`,
      patientId: appointment.patient_id,
      formId: existingForm.patient_form_id
    };

  } catch (error) {
    console.error("Error updating complete intake form:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update intake form. Please try again."
    };
  }
}
