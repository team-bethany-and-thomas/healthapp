import { 
  createFormDraft, 
  updateForm, 
  submitForm, 
  getMyForms, 
  getFormById,
  savePatientAllergies,
  savePatientMedications,
  getPatientAllergies,
  getPatientMedications,
  parseFormData,
  calculateCompletionPercentage,
  reopenFormForEditing,
  resubmitForm,
  getFormHistory,
  getLatestFormVersion,
  canEditForm,
  canReopenForm,
  FormData,
  PatientForm,
  PatientAllergy,
  PatientMedication 
} from './formService';

const INTAKE_TEMPLATE_ID = 1;

// Create empty intake form structure
export function createEmptyIntakeForm(): FormData {
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

// Create a new intake form draft
export async function createIntakeDraft(
  auth_user_id: string, 
  patient_id: number, 
  appointment_id: number
): Promise<PatientForm> {
  const emptyFormData = createEmptyIntakeForm();

  return createFormDraft({
    form_template_id: INTAKE_TEMPLATE_ID,
    appointment_id,
    form_data: emptyFormData,
    completion_percentage: 0,
    patient_id,
    auth_user_id,
  });
}

// Load existing patient data for pre-filling form
export async function loadExistingPatientData(patient_id: number): Promise<Partial<FormData>> {
  try {
    const [allergies, medications] = await Promise.all([
      getPatientAllergies(patient_id),
      getPatientMedications(patient_id)
    ]);

    return {
      medicalHistory: {
        allergies,
        medications,
        conditions: '',
        emergencyContact: {
          name: '',
          relationship: '',
          phone: ''
        }
      }
    };
  } catch (error) {
    console.error('Error loading existing patient data:', error);
    return {};
  }
}

// Create intake form with existing patient data pre-filled
export async function createIntakeDraftWithExistingData(
  auth_user_id: string,
  patient_id: number,
  appointment_id: number
): Promise<PatientForm> {
  // For new appointments, always start with a fresh form
  // The user can choose to import data from previous forms if needed
  const emptyFormData = createEmptyIntakeForm();

  return createFormDraft({
    form_template_id: INTAKE_TEMPLATE_ID,
    appointment_id,
    form_data: emptyFormData,
    completion_percentage: 0,
    patient_id,
    auth_user_id,
  });
}

// Import data from previous intake forms (optional user action)
export async function importDataFromPreviousIntake(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  importOptions: {
    importAllergies?: boolean;
    importMedications?: boolean;
    importDemographics?: boolean;
    importAddress?: boolean;
    importInsurance?: boolean;
    importEmergencyContact?: boolean;
  } = {}
): Promise<PatientForm> {
  const currentForm = await getFormById(form_id, patient_id);
  const currentFormData = parseFormData(currentForm.form_data);
  
  // Load existing patient data
  const existingData = await loadExistingPatientData(patient_id);
  
  // Get the most recent completed intake form for demographics/address/insurance
  const { documents } = await getMyIntakes(patient_id);
  const completedForms = documents.filter(
    (form: unknown) => {
      const typedForm = form as PatientForm;
      return (typedForm.status === 'submitted' || typedForm.status === 'completed') && 
             typedForm.appointment_id !== currentForm.appointment_id;
    }
  );
  
  let previousFormData: FormData | null = null;
  if (completedForms.length > 0) {
    const mostRecentForm = completedForms[0] as unknown as PatientForm;
    previousFormData = parseFormData(mostRecentForm.form_data);
  }

  // Build the updated form data based on import options
  const updatedFormData: FormData = { ...currentFormData };

  // Import medical data (allergies and medications)
  if (importOptions.importAllergies && existingData.medicalHistory?.allergies) {
    updatedFormData.medicalHistory.allergies = existingData.medicalHistory.allergies;
  }

  if (importOptions.importMedications && existingData.medicalHistory?.medications) {
    updatedFormData.medicalHistory.medications = existingData.medicalHistory.medications;
  }

  // Import other data from previous forms if available
  if (previousFormData) {
    if (importOptions.importDemographics) {
      updatedFormData.demographics = { ...previousFormData.demographics };
    }

    if (importOptions.importAddress) {
      updatedFormData.address = { ...previousFormData.address };
    }

    if (importOptions.importInsurance) {
      updatedFormData.insurance = { ...previousFormData.insurance };
    }

    if (importOptions.importEmergencyContact) {
      updatedFormData.medicalHistory.emergencyContact = { ...previousFormData.medicalHistory.emergencyContact };
    }
  }

  const completionPercentage = calculateCompletionPercentage(updatedFormData);

  return updateForm({
    form_id,
    patient_id,
    auth_user_id,
    form_data: updatedFormData,
    completion_percentage: completionPercentage,
    status: 'in_progress',
  });
}

// Save a section of the intake form
export async function saveIntakeSection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  sectionData: Partial<FormData>,
  currentFormData?: FormData
): Promise<PatientForm> {
  // If we don't have current form data, fetch it
  if (!currentFormData) {
    const existingForm = await getFormById(form_id, patient_id);
    currentFormData = parseFormData(existingForm.form_data);
  }

  // Merge the section data with existing form data
  const mergedFormData: FormData = {
    ...currentFormData,
    ...sectionData,
    demographics: {
      ...currentFormData.demographics,
      ...sectionData.demographics
    },
    address: {
      ...currentFormData.address,
      ...sectionData.address
    },
    insurance: {
      ...currentFormData.insurance,
      ...sectionData.insurance
    },
    medicalHistory: {
      ...currentFormData.medicalHistory,
      ...sectionData.medicalHistory,
      emergencyContact: {
        ...currentFormData.medicalHistory.emergencyContact,
        ...sectionData.medicalHistory?.emergencyContact
      }
    },
    consent: {
      ...currentFormData.consent,
      ...sectionData.consent
    }
  };

  const completionPercentage = calculateCompletionPercentage(mergedFormData);

  return updateForm({
    form_id,
    patient_id,
    auth_user_id,
    form_data: mergedFormData,
    completion_percentage: completionPercentage,
      status: 'not_started',
  });
}

// Save demographics section
export async function saveDemographicsSection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  demographics: FormData['demographics'],
  currentFormData?: FormData
): Promise<PatientForm> {
  return saveIntakeSection(form_id, auth_user_id, patient_id, { demographics }, currentFormData);
}

// Save address section
export async function saveAddressSection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  address: FormData['address'],
  currentFormData?: FormData
): Promise<PatientForm> {
  return saveIntakeSection(form_id, auth_user_id, patient_id, { address }, currentFormData);
}

// Save insurance section
export async function saveInsuranceSection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  insurance: FormData['insurance'],
  currentFormData?: FormData
): Promise<PatientForm> {
  return saveIntakeSection(form_id, auth_user_id, patient_id, { insurance }, currentFormData);
}

// Save medical history section (with database persistence for allergies/medications)
export async function saveMedicalHistorySection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  medicalHistory: FormData['medicalHistory'],
  currentFormData?: FormData
): Promise<PatientForm> {
  // Save allergies and medications to their respective collections
  if (medicalHistory.allergies && medicalHistory.allergies.length > 0) {
    await savePatientAllergies(patient_id, medicalHistory.allergies);
  }

  if (medicalHistory.medications && medicalHistory.medications.length > 0) {
    await savePatientMedications(patient_id, medicalHistory.medications);
  }

  // Save to form
  return saveIntakeSection(form_id, auth_user_id, patient_id, { medicalHistory }, currentFormData);
}

// Save consent section
export async function saveConsentSection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  consent: FormData['consent'],
  currentFormData?: FormData
): Promise<PatientForm> {
  return saveIntakeSection(form_id, auth_user_id, patient_id, { consent }, currentFormData);
}

// Submit the complete intake form
export async function submitIntakeForm(
  form_id: string,
  patient_id: number,
  auth_user_id: string
): Promise<PatientForm> {
  // Get the current form data to ensure we save final medical data
  const currentForm = await getFormById(form_id, patient_id);
  const formData = parseFormData(currentForm.form_data);

  // Ensure all medical data is saved to database before submitting
  if (formData.medicalHistory.allergies.length > 0) {
    await savePatientAllergies(patient_id, formData.medicalHistory.allergies);
  }

  if (formData.medicalHistory.medications.length > 0) {
    await savePatientMedications(patient_id, formData.medicalHistory.medications);
  }

  return submitForm(form_id, patient_id, auth_user_id);
}

// Get all intake forms for a patient
export async function getMyIntakes(patient_id: number) {
  return getMyForms(patient_id, INTAKE_TEMPLATE_ID);
}

// Get specific intake form by ID
export async function getIntakeById(form_id: string, patient_id: number): Promise<PatientForm> {
  return getFormById(form_id, patient_id);
}

// Get intake form data with parsed JSON and load actual patient data
export async function getIntakeFormData(form_id: string, patient_id: number): Promise<FormData> {
  const form = await getIntakeById(form_id, patient_id);
  const parsedData = parseFormData(form.form_data);
  
  // If this is compact format (empty data), load actual patient data
  if (!parsedData.demographics.firstName && !parsedData.address.street) {
    const existingData = await loadExistingPatientData(patient_id);
    return {
      ...parsedData,
      ...existingData,
      medicalHistory: {
        ...parsedData.medicalHistory,
        ...existingData.medicalHistory
      }
    };
  }
  
  return parsedData;
}

// Check if patient has completed intake for appointment
export async function hasCompletedIntakeForAppointment(
  patient_id: number, 
  appointment_id: number
): Promise<boolean> {
  try {
    const { documents } = await getMyIntakes(patient_id);
    const intakeForAppointment = documents.find(
      (form: unknown) => (form as PatientForm).appointment_id === appointment_id
    );
    const typedForm = intakeForAppointment as unknown as PatientForm;
    return typedForm?.status === 'submitted' || typedForm?.status === 'completed';
  } catch (error) {
    console.error('Error checking intake completion:', error);
    return false;
  }
}

// Get intake form for specific appointment
export async function getIntakeForAppointment(
  patient_id: number,
  appointment_id: number
): Promise<PatientForm | null> {
  try {
    const { documents } = await getMyIntakes(patient_id);
    const intakeForAppointment = documents.find(
      (form: unknown) => (form as PatientForm).appointment_id === appointment_id
    );
    return intakeForAppointment ? intakeForAppointment as unknown as PatientForm : null;
  } catch (error) {
    console.error('Error getting intake for appointment:', error);
    return null;
  }
}

// Validate form data before submission
export function validateIntakeFormData(formData: FormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required demographics fields
  if (!formData.demographics.firstName.trim()) errors.push('First name is required');
  if (!formData.demographics.lastName.trim()) errors.push('Last name is required');
  if (!formData.demographics.dateOfBirth.trim()) errors.push('Date of birth is required');
  if (!formData.demographics.gender.trim()) errors.push('Gender is required');
  if (!formData.demographics.phone.trim()) errors.push('Phone number is required');
  if (!formData.demographics.email.trim()) errors.push('Email is required');

  // Required address fields
  if (!formData.address.street.trim()) errors.push('Street address is required');
  if (!formData.address.city.trim()) errors.push('City is required');
  if (!formData.address.state.trim()) errors.push('State is required');
  if (!formData.address.zip.trim()) errors.push('ZIP code is required');

  // Required consent fields
  if (!formData.consent.hipaa) errors.push('HIPAA consent is required');
  if (!formData.consent.treatment) errors.push('Treatment consent is required');
  if (!formData.consent.financial) errors.push('Financial consent is required');

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.demographics.email && !emailRegex.test(formData.demographics.email)) {
    errors.push('Invalid email format');
  }

  // Phone format validation (basic)
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  if (formData.demographics.phone && !phoneRegex.test(formData.demographics.phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to add allergy to form data
export function addAllergyToFormData(formData: FormData, allergy: PatientAllergy): FormData {
  return {
    ...formData,
    medicalHistory: {
      ...formData.medicalHistory,
      allergies: [...formData.medicalHistory.allergies, allergy]
    }
  };
}

// Helper function to remove allergy from form data
export function removeAllergyFromFormData(formData: FormData, index: number): FormData {
  const allergies = [...formData.medicalHistory.allergies];
  allergies.splice(index, 1);
  
  return {
    ...formData,
    medicalHistory: {
      ...formData.medicalHistory,
      allergies
    }
  };
}

// Helper function to add medication to form data
export function addMedicationToFormData(formData: FormData, medication: PatientMedication): FormData {
  return {
    ...formData,
    medicalHistory: {
      ...formData.medicalHistory,
      medications: [...formData.medicalHistory.medications, medication]
    }
  };
}

// Reopen submitted intake form for editing
export async function reopenIntakeForEditing(
  form_id: string,
  patient_id: number,
  auth_user_id: string,
  revision_reason?: string
): Promise<PatientForm> {
  return reopenFormForEditing(form_id, patient_id, auth_user_id, revision_reason);
}

// Resubmit intake form after editing
export async function resubmitIntakeForm(
  form_id: string,
  patient_id: number,
  auth_user_id: string,
  final_form_data?: FormData
): Promise<PatientForm> {
  return resubmitForm(form_id, patient_id, auth_user_id, final_form_data);
}

// Update intake form section (works for both draft and revision status)
export async function updateIntakeSection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  sectionData: Partial<FormData>,
  currentFormData?: FormData
): Promise<PatientForm> {
  // Get current form to check status
  const currentForm = await getFormById(form_id, patient_id);
  
  // Check if form can be edited
  if (!canEditForm(currentForm)) {
    throw new Error('This form cannot be edited. Please reopen it for editing first.');
  }

  // Use the existing saveIntakeSection logic
  return saveIntakeSection(form_id, auth_user_id, patient_id, sectionData, currentFormData);
}

// Get intake form editing status
export function getIntakeEditingStatus(form: PatientForm): {
  canEdit: boolean;
  canReopen: boolean;
  status: string;
  isRevision: boolean;
  revisionReason?: string;
} {
  return {
    canEdit: canEditForm(form),
    canReopen: canReopenForm(form),
    status: form.status,
    isRevision: form.status === 'revision',
    revisionReason: form.revision_reason
  };
}

// Get complete intake form history for an appointment
export async function getIntakeFormHistory(
  patient_id: number,
  appointment_id: number
): Promise<PatientForm[]> {
  return getFormHistory(patient_id, appointment_id);
}

// Get the latest intake form version for an appointment
export async function getLatestIntakeVersion(
  patient_id: number,
  appointment_id: number
): Promise<PatientForm | null> {
  return getLatestFormVersion(patient_id, appointment_id);
}

// Update demographics section (with edit check)
export async function updateDemographicsSection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  demographics: FormData['demographics'],
  currentFormData?: FormData
): Promise<PatientForm> {
  return updateIntakeSection(form_id, auth_user_id, patient_id, { demographics }, currentFormData);
}

// Update address section (with edit check)
export async function updateAddressSection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  address: FormData['address'],
  currentFormData?: FormData
): Promise<PatientForm> {
  return updateIntakeSection(form_id, auth_user_id, patient_id, { address }, currentFormData);
}

// Update insurance section (with edit check)
export async function updateInsuranceSection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  insurance: FormData['insurance'],
  currentFormData?: FormData
): Promise<PatientForm> {
  return updateIntakeSection(form_id, auth_user_id, patient_id, { insurance }, currentFormData);
}

// Update medical history section (with edit check and database persistence)
export async function updateMedicalHistorySection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  medicalHistory: FormData['medicalHistory'],
  currentFormData?: FormData
): Promise<PatientForm> {
  // Check if form can be edited first
  const currentForm = await getFormById(form_id, patient_id);
  if (!canEditForm(currentForm)) {
    throw new Error('This form cannot be edited. Please reopen it for editing first.');
  }

  // Save allergies and medications to their respective collections
  if (medicalHistory.allergies && medicalHistory.allergies.length > 0) {
    await savePatientAllergies(patient_id, medicalHistory.allergies);
  }

  if (medicalHistory.medications && medicalHistory.medications.length > 0) {
    await savePatientMedications(patient_id, medicalHistory.medications);
  }

  // Save to form
  return updateIntakeSection(form_id, auth_user_id, patient_id, { medicalHistory }, currentFormData);
}

// Update consent section (with edit check)
export async function updateConsentSection(
  form_id: string,
  auth_user_id: string,
  patient_id: number,
  consent: FormData['consent'],
  currentFormData?: FormData
): Promise<PatientForm> {
  return updateIntakeSection(form_id, auth_user_id, patient_id, { consent }, currentFormData);
}

// Compare two form versions to show changes
export function compareFormVersions(
  oldForm: PatientForm,
  newForm: PatientForm
): {
  hasChanges: boolean;
  changes: {
    section: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
} {
  const changes: { section: string; field: string; oldValue: unknown; newValue: unknown; }[] = [];
  
  try {
    const oldData = parseFormData(oldForm.form_data);
    const newData = parseFormData(newForm.form_data);

    // Compare demographics
    Object.keys(oldData.demographics).forEach(key => {
      if (oldData.demographics[key as keyof typeof oldData.demographics] !== 
          newData.demographics[key as keyof typeof newData.demographics]) {
        changes.push({
          section: 'demographics',
          field: key,
          oldValue: oldData.demographics[key as keyof typeof oldData.demographics],
          newValue: newData.demographics[key as keyof typeof newData.demographics]
        });
      }
    });

    // Compare address
    Object.keys(oldData.address).forEach(key => {
      if (oldData.address[key as keyof typeof oldData.address] !== 
          newData.address[key as keyof typeof newData.address]) {
        changes.push({
          section: 'address',
          field: key,
          oldValue: oldData.address[key as keyof typeof oldData.address],
          newValue: newData.address[key as keyof typeof newData.address]
        });
      }
    });

    // Compare insurance
    Object.keys(oldData.insurance).forEach(key => {
      if (oldData.insurance[key as keyof typeof oldData.insurance] !== 
          newData.insurance[key as keyof typeof newData.insurance]) {
        changes.push({
          section: 'insurance',
          field: key,
          oldValue: oldData.insurance[key as keyof typeof oldData.insurance],
          newValue: newData.insurance[key as keyof typeof newData.insurance]
        });
      }
    });

    // Compare medical history (simplified - could be more detailed)
    if (JSON.stringify(oldData.medicalHistory.allergies) !== JSON.stringify(newData.medicalHistory.allergies)) {
      changes.push({
        section: 'medicalHistory',
        field: 'allergies',
        oldValue: oldData.medicalHistory.allergies,
        newValue: newData.medicalHistory.allergies
      });
    }

    if (JSON.stringify(oldData.medicalHistory.medications) !== JSON.stringify(newData.medicalHistory.medications)) {
      changes.push({
        section: 'medicalHistory',
        field: 'medications',
        oldValue: oldData.medicalHistory.medications,
        newValue: newData.medicalHistory.medications
      });
    }

    if (oldData.medicalHistory.conditions !== newData.medicalHistory.conditions) {
      changes.push({
        section: 'medicalHistory',
        field: 'conditions',
        oldValue: oldData.medicalHistory.conditions,
        newValue: newData.medicalHistory.conditions
      });
    }

    // Compare consent
    Object.keys(oldData.consent).forEach(key => {
      if (oldData.consent[key as keyof typeof oldData.consent] !== 
          newData.consent[key as keyof typeof newData.consent]) {
        changes.push({
          section: 'consent',
          field: key,
          oldValue: oldData.consent[key as keyof typeof oldData.consent],
          newValue: newData.consent[key as keyof typeof newData.consent]
        });
      }
    });

  } catch (error) {
    console.error('Error comparing form versions:', error);
  }

  return {
    hasChanges: changes.length > 0,
    changes
  };
}

// Get form submission summary
export function getFormSubmissionSummary(form: PatientForm): {
  isSubmitted: boolean;
  submissionDate?: string;
  isRevision: boolean;
  revisionReason?: string;
  completionPercentage: number;
  canEdit: boolean;
  canReopen: boolean;
} {
  const editingStatus = getIntakeEditingStatus(form);
  
  return {
    isSubmitted: form.status === 'submitted' || form.status === 'completed',
    submissionDate: form.submitted_at || undefined,
    isRevision: editingStatus.isRevision,
    revisionReason: editingStatus.revisionReason,
    completionPercentage: form.completion_percentage,
    canEdit: editingStatus.canEdit,
    canReopen: editingStatus.canReopen
  };
}
