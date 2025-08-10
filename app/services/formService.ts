import { databases, ID } from '@/app/lib/appwrite';
import { Query, Permission, Role } from 'appwrite';

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const FORMS_COL = process.env.NEXT_PUBLIC_APPWRITE_PATIENT_FORMS_COLLECTION_ID || 'patient_forms';
const ALLERGIES_COL = process.env.NEXT_PUBLIC_APPWRITE_PATIENT_ALLERGIES_COLLECTION_ID || 'patient_allergies';
const MEDICATIONS_COL = process.env.NEXT_PUBLIC_APPWRITE_PATIENT_MEDICATIONS_COLLECTION_ID || 'patient_medications';

export type FormStatus = 'not_started' | 'in_progress' | 'submitted' | 'completed' | 'revision';

export type PatientAllergy = {
  allergy_id?: number;
  patient_id: number;
  allergen_name: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction_description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PatientMedication = {
  medication_id?: number;
  patient_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  status: 'active' | 'inactive' | 'discontinued';
  reaction_description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type FormData = {
  demographics: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  medicalHistory: {
    allergies: PatientAllergy[];
    medications: PatientMedication[];
    conditions: string;
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  consent: {
    hipaa: boolean;
    treatment: boolean;
    financial: boolean;
  };
};

export type CreateFormInput = {
  auth_user_id: string;
  patient_id: number;
  form_template_id: number;
  appointment_id: number;
  form_data: string | FormData;
  completion_percentage?: number;
};

export type UpdateFormInput = {
  form_id: string;
  auth_user_id: string;
  patient_id: number;
  form_data?: FormData | string;
  completion_percentage?: number;
  status?: FormStatus;
};

export type PatientForm = {
  $id: string;
  patient_form_id: number;
  patient_id: number;
  form_template_id: number;
  appointment_id: number;
  form_data: string;
  status: FormStatus;
  completion_percentage: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  version?: number;
  previous_version_id?: string;
  revision_reason?: string;
};

// Helper function to create a compact form data string that fits within 500 chars
function createCompactFormData(formData: FormData | string): string {
  if (typeof formData === 'string') {
    // If it's already a string, check if it fits
    if (formData.length <= 500) return formData;
    // If too long, create a summary
    return `{"status":"draft","sections":${Object.keys(JSON.parse(formData) || {}).length},"created":"${new Date().toISOString()}"}`;
  }
  
  // Create a compact representation
  const compact = {
    d: formData.demographics.firstName ? 1 : 0, // demographics filled
    a: formData.address.street ? 1 : 0, // address filled  
    i: formData.insurance.provider ? 1 : 0, // insurance filled
    m: formData.medicalHistory.allergies.length + formData.medicalHistory.medications.length, // medical items count
    c: (formData.consent.hipaa ? 1 : 0) + (formData.consent.treatment ? 1 : 0) + (formData.consent.financial ? 1 : 0), // consent count
    t: Date.now() // timestamp
  };
  
  const compactString = JSON.stringify(compact);
  
  // If still too long, create minimal version
  if (compactString.length > 500) {
    return `{"status":"active","updated":${Date.now()}}`;
  }
  
  return compactString;
}

// Create a new form draft
export async function createFormDraft(input: CreateFormInput): Promise<PatientForm> {
  const now = new Date().toISOString();
  // Generate a unique integer ID for patient_form_id
  const patientFormId = Math.floor(Math.random() * 1000000) + Date.now() % 1000000;
  
  // Create compact form data that fits within 500 character limit
  const formDataString = createCompactFormData(input.form_data);

  const document = await databases.createDocument(
    DB_ID,
    FORMS_COL,
    ID.unique(),
    {
      patient_form_id: patientFormId, // Add the missing required field as integer
      patient_id: input.patient_id,
      form_template_id: input.form_template_id,
      appointment_id: input.appointment_id,
      form_data: formDataString,
      status: 'not_started',
      completion_percentage: input.completion_percentage || 0,
      submitted_at: null,
      created_at: now,
      updated_at: now,
    },
    [
      Permission.read(Role.user(input.auth_user_id)),
      Permission.update(Role.user(input.auth_user_id)),
      Permission.delete(Role.user(input.auth_user_id)),
    ]
  );

  return document as unknown as PatientForm;
}

// Update an existing form
export async function updateForm(input: UpdateFormInput): Promise<PatientForm> {
  // Find the form by form_id and patient_id
  const { documents } = await databases.listDocuments(DB_ID, FORMS_COL, [
    Query.equal('patient_form_id', input.form_id),
    Query.equal('patient_id', input.patient_id),
  ]);
  
  if (!documents.length) throw new Error('Form not found');

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  if (typeof input.form_data !== 'undefined') {
    // Use compact form data to stay within 500 character limit
    patch.form_data = createCompactFormData(input.form_data);
  }
  
  if (typeof input.completion_percentage === 'number') {
    patch.completion_percentage = input.completion_percentage;
  }
  
  if (input.status) {
    patch.status = input.status;
    if (input.status === 'submitted') {
      patch.submitted_at = now;
      if (typeof input.completion_percentage === 'undefined') {
        patch.completion_percentage = 100;
      }
    }
  }

  const updated = await databases.updateDocument(DB_ID, FORMS_COL, documents[0].$id, patch);
  return updated as unknown as PatientForm;
}

// Submit a form (convenience method)
export async function submitForm(form_id: string, patient_id: number, auth_user_id: string): Promise<PatientForm> {
  return updateForm({ 
    form_id, 
    patient_id, 
    auth_user_id, 
    status: 'submitted', 
    completion_percentage: 100 
  });
}

// Get all forms for a patient
export async function getMyForms(patient_id: number, template_id?: number) {
  const qs = [Query.equal('patient_id', patient_id), Query.orderDesc('updated_at')];
  if (typeof template_id === 'number') qs.push(Query.equal('form_template_id', template_id));
  return databases.listDocuments(DB_ID, FORMS_COL, qs);
}

// Get a specific form by ID
export async function getFormById(form_id: string, patient_id: number): Promise<PatientForm> {
  const { documents } = await databases.listDocuments(DB_ID, FORMS_COL, [
    Query.equal('patient_form_id', form_id),
    Query.equal('patient_id', patient_id),
  ]);
  if (!documents.length) throw new Error('Form not found');
  return documents[0] as unknown as PatientForm;
}

// Save patient allergies to the database
export async function savePatientAllergies(patient_id: number, allergies: PatientAllergy[]): Promise<void> {
  const now = new Date().toISOString();
  
  // First, mark all existing allergies as inactive
  const existingAllergies = await databases.listDocuments(DB_ID, ALLERGIES_COL, [
    Query.equal('patient_id', patient_id),
  ]);

  // Mark existing allergies as inactive
  for (const allergy of existingAllergies.documents) {
    await databases.updateDocument(DB_ID, ALLERGIES_COL, allergy.$id, {
      is_active: false,
      updated_at: now,
    });
  }

  // Create new allergy records
  for (const allergy of allergies) {
    if (allergy.allergen_name.trim()) {
      await databases.createDocument(
        DB_ID,
        ALLERGIES_COL,
        ID.unique(),
        {
          patient_id,
          allergen_name: allergy.allergen_name,
          severity: allergy.severity || 'mild',
          reaction_description: allergy.reaction_description || '',
          is_active: true,
          created_at: now,
          updated_at: now,
        }
      );
    }
  }
}

// Save patient medications to the database
export async function savePatientMedications(patient_id: number, medications: PatientMedication[]): Promise<void> {
  const now = new Date().toISOString();
  
  // First, mark all existing medications as inactive
  const existingMedications = await databases.listDocuments(DB_ID, MEDICATIONS_COL, [
    Query.equal('patient_id', patient_id),
  ]);

  // Mark existing medications as inactive
  for (const medication of existingMedications.documents) {
    await databases.updateDocument(DB_ID, MEDICATIONS_COL, medication.$id, {
      is_active: false,
      updated_at: now,
    });
  }

  // Create new medication records
  for (const medication of medications) {
    if (medication.medication_name.trim()) {
      await databases.createDocument(
        DB_ID,
        MEDICATIONS_COL,
        ID.unique(),
        {
          patient_id,
          medication_name: medication.medication_name,
          dosage: medication.dosage || '',
          frequency: medication.frequency || '',
          status: medication.status || 'active',
          reaction_description: medication.reaction_description || '',
          is_active: true,
          created_at: now,
          updated_at: now,
        }
      );
    }
  }
}

// Get patient allergies
export async function getPatientAllergies(patient_id: number): Promise<PatientAllergy[]> {
  const response = await databases.listDocuments(DB_ID, ALLERGIES_COL, [
    Query.equal('patient_id', patient_id),
    Query.equal('is_active', true),
    Query.orderDesc('created_at'),
  ]);

  return response.documents as unknown as PatientAllergy[];
}

// Get patient medications
export async function getPatientMedications(patient_id: number): Promise<PatientMedication[]> {
  const response = await databases.listDocuments(DB_ID, MEDICATIONS_COL, [
    Query.equal('patient_id', patient_id),
    Query.equal('is_active', true),
    Query.orderDesc('created_at'),
  ]);

  return response.documents as unknown as PatientMedication[];
}

// Parse form data from string - handle both full and compact formats
export function parseFormData(formDataString: string): FormData {
  try {
    const parsed = JSON.parse(formDataString);
    
    // Check if this is compact format (has 'd', 'a', 'i', 'm', 'c' properties)
    if (typeof parsed === 'object' && 'd' in parsed && 'a' in parsed) {
      // This is compact format, return empty form structure
      // The actual data should be retrieved from separate collections
      return {
        demographics: {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: '',
          phone: '',
          email: ''
        },
        address: {
          street: '',
          city: '',
          state: '',
          zip: ''
        },
        insurance: {
          provider: '',
          policyNumber: '',
          groupNumber: ''
        },
        medicalHistory: {
          allergies: [],
          medications: [],
          conditions: '',
          emergencyContact: {
            name: '',
            relationship: '',
            phone: ''
          }
        },
        consent: {
          hipaa: false,
          treatment: false,
          financial: false
        }
      };
    }
    
    // If it's full format, return as is
    return parsed as FormData;
  } catch (error) {
    console.error('Error parsing form data:', error);
    // Return empty form structure if parsing fails
    return {
      demographics: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: ''
      },
      address: {
        street: '',
        city: '',
        state: '',
        zip: ''
      },
      insurance: {
        provider: '',
        policyNumber: '',
        groupNumber: ''
      },
      medicalHistory: {
        allergies: [],
        medications: [],
        conditions: '',
        emergencyContact: {
          name: '',
          relationship: '',
          phone: ''
        }
      },
      consent: {
        hipaa: false,
        treatment: false,
        financial: false
      }
    };
  }
}

// Reopen a submitted form for editing (creates revision)
export async function reopenFormForEditing(
  form_id: string, 
  patient_id: number, 
  auth_user_id: string,
  revision_reason?: string
): Promise<PatientForm> {
  // Find the current form
  const { documents } = await databases.listDocuments(DB_ID, FORMS_COL, [
    Query.equal('patient_form_id', form_id),
    Query.equal('patient_id', patient_id),
  ]);
  
  if (!documents.length) throw new Error('Form not found');
  
  const currentForm = documents[0];
  
  // Only allow reopening if form is submitted or completed
  if (currentForm.status !== 'submitted' && currentForm.status !== 'completed') {
    throw new Error('Only submitted or completed forms can be reopened for editing');
  }

  const now = new Date().toISOString();
  
  // Update the form status to revision
  const updated = await databases.updateDocument(DB_ID, FORMS_COL, currentForm.$id, {
    status: 'revision',
    updated_at: now,
    revision_reason: revision_reason || 'Form reopened for editing',
  });

  return updated as unknown as PatientForm;
}

// Resubmit a form after editing
export async function resubmitForm(
  form_id: string, 
  patient_id: number, 
  auth_user_id: string,
  final_form_data?: FormData
): Promise<PatientForm> {
  // Find the form
  const { documents } = await databases.listDocuments(DB_ID, FORMS_COL, [
    Query.equal('patient_form_id', form_id),
    Query.equal('patient_id', patient_id),
  ]);
  
  if (!documents.length) throw new Error('Form not found');
  
  const currentForm = documents[0];
  
  // Only allow resubmission if form is in revision status or not_started/in_progress
  if (currentForm.status !== 'revision' && currentForm.status !== 'not_started' && currentForm.status !== 'in_progress') {
    throw new Error('Only forms in revision, not_started, or in_progress status can be resubmitted');
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    status: 'submitted',
    submitted_at: now,
    updated_at: now,
    completion_percentage: 100,
  };

  // Update form data if provided - use compact format
  if (final_form_data) {
    updateData.form_data = createCompactFormData(final_form_data);
    
    // Save medical data to separate collections
    if (final_form_data.medicalHistory.allergies.length > 0) {
      await savePatientAllergies(patient_id, final_form_data.medicalHistory.allergies);
    }
    
    if (final_form_data.medicalHistory.medications.length > 0) {
      await savePatientMedications(patient_id, final_form_data.medicalHistory.medications);
    }
  }

  const updated = await databases.updateDocument(DB_ID, FORMS_COL, currentForm.$id, updateData);
  return updated as unknown as PatientForm;
}

// Get form history/versions for an appointment
export async function getFormHistory(
  patient_id: number, 
  appointment_id: number
): Promise<PatientForm[]> {
  const response = await databases.listDocuments(DB_ID, FORMS_COL, [
    Query.equal('patient_id', patient_id),
    Query.equal('appointment_id', appointment_id),
    Query.orderDesc('updated_at'),
  ]);

  return response.documents as unknown as PatientForm[];
}

// Check if form can be edited
export function canEditForm(form: PatientForm): boolean {
  return form.status === 'not_started' || form.status === 'in_progress' || form.status === 'revision';
}

// Check if form can be reopened for editing
export function canReopenForm(form: PatientForm): boolean {
  return form.status === 'submitted' || form.status === 'completed';
}

// Get the latest version of a form for an appointment
export async function getLatestFormVersion(
  patient_id: number, 
  appointment_id: number
): Promise<PatientForm | null> {
  try {
    const forms = await getFormHistory(patient_id, appointment_id);
    return forms.length > 0 ? forms[0] : null;
  } catch (error) {
    console.error('Error getting latest form version:', error);
    return null;
  }
}

// Calculate completion percentage based on form data
export function calculateCompletionPercentage(formData: FormData): number {
  const sections = {
    demographics: 6, // firstName, lastName, dateOfBirth, gender, phone, email
    address: 4, // street, city, state, zip
    insurance: 3, // provider, policyNumber, groupNumber
    medicalHistory: 3, // allergies, medications, conditions
    consent: 3, // hipaa, treatment, financial
  };

  let totalFields = 0;
  let filledFields = 0;

  // Demographics
  totalFields += sections.demographics;
  if (formData.demographics.firstName.trim()) filledFields++;
  if (formData.demographics.lastName.trim()) filledFields++;
  if (formData.demographics.dateOfBirth.trim()) filledFields++;
  if (formData.demographics.gender.trim()) filledFields++;
  if (formData.demographics.phone.trim()) filledFields++;
  if (formData.demographics.email.trim()) filledFields++;

  // Address
  totalFields += sections.address;
  if (formData.address.street.trim()) filledFields++;
  if (formData.address.city.trim()) filledFields++;
  if (formData.address.state.trim()) filledFields++;
  if (formData.address.zip.trim()) filledFields++;

  // Insurance
  totalFields += sections.insurance;
  if (formData.insurance.provider.trim()) filledFields++;
  if (formData.insurance.policyNumber.trim()) filledFields++;
  if (formData.insurance.groupNumber.trim()) filledFields++;

  // Medical History
  totalFields += sections.medicalHistory;
  if (formData.medicalHistory.allergies.length > 0) filledFields++;
  if (formData.medicalHistory.medications.length > 0) filledFields++;
  if (formData.medicalHistory.conditions.trim()) filledFields++;

  // Consent
  totalFields += sections.consent;
  if (formData.consent.hipaa) filledFields++;
  if (formData.consent.treatment) filledFields++;
  if (formData.consent.financial) filledFields++;

  return Math.round((filledFields / totalFields) * 100);
}
