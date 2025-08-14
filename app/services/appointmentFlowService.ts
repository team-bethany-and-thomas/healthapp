import { appointmentBookingService, CreateAppointmentData, AppointmentBooking } from './appointmentBookingService';
import { 
  createIntakeDraftWithExistingData, 
  createIntakeDraft,
  hasCompletedIntakeForAppointment,
  submitIntakeForm,
  reopenIntakeForEditing,
  resubmitIntakeForm,
  getIntakeFormHistory,
  getLatestIntakeVersion,
  getIntakeEditingStatus,
  getFormSubmissionSummary
} from './intakeFormService';
import { PatientForm, FormData } from './formService';

export interface BookAppointmentWithIntakeInput {
  auth_user_id: string;
  patient_id: number;
  provider_id: number;
  appointment_type_id: number;
  appointment_date: string;
  appointment_time: string;
  reason_for_visit: string;
  notes?: string;
  pre_fill_existing_data?: boolean; // Whether to pre-fill with existing patient data
}

export interface AppointmentWithIntakeForm {
  appointment: AppointmentBooking;
  intake_form: PatientForm;
  intake_form_url?: string; // URL to redirect user to complete intake
}

export interface AppointmentFlowStatus {
  appointment: AppointmentBooking;
  has_intake_form: boolean;
  intake_form?: PatientForm;
  intake_completed: boolean;
  next_step: 'complete_intake' | 'appointment_ready' | 'appointment_past' | 'intake_needs_update';
  intake_completion_percentage: number;
  can_edit_intake: boolean;
  can_reopen_intake: boolean;
  intake_status: string;
  is_intake_revision: boolean;
}

class AppointmentFlowService {
  
  // Book appointment and automatically create intake form
  async bookAppointmentWithIntake(
    input: BookAppointmentWithIntakeInput
  ): Promise<AppointmentWithIntakeForm> {
    try {
      // First, create the appointment
      const appointmentData: CreateAppointmentData = {
        patient_id: input.patient_id,
        provider_id: input.provider_id,
        appointment_type_id: input.appointment_type_id,
        appointment_date: input.appointment_date,
        appointment_time: input.appointment_time,
        reason_for_visit: input.reason_for_visit,
        notes: input.notes,
      };

      const appointment = await appointmentBookingService.createAppointment(appointmentData);

      // Then create the intake form draft
      let intake_form: PatientForm;
      
      if (input.pre_fill_existing_data) {
        intake_form = await createIntakeDraftWithExistingData(
          input.auth_user_id,
          input.patient_id,
          appointment.appointment_id
        );
      } else {
        intake_form = await createIntakeDraft(
          input.auth_user_id,
          input.patient_id,
          appointment.appointment_id
        );
      }

      return {
        appointment,
        intake_form,
        intake_form_url: `/appointments/${appointment.$id}/intake-form/${intake_form.$id}`
      };

    } catch (error) {
      console.error('Error booking appointment with intake:', error);
      throw new Error('Failed to book appointment and create intake form. Please try again.');
    }
  }

  // Get the status of an appointment and its intake form
  async getAppointmentFlowStatus(
    appointment_id: string,
    patient_id: number
  ): Promise<AppointmentFlowStatus> {
    try {
      // Get the appointment details
      const appointment = await appointmentBookingService.getAppointmentById(appointment_id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check if intake form exists for this appointment
      const intake_form = await getLatestIntakeVersion(patient_id, appointment.appointment_id);
      const has_intake_form = intake_form !== null;
      const intake_completed = await hasCompletedIntakeForAppointment(patient_id, appointment.appointment_id);

      // Get intake editing status if form exists
      let can_edit_intake = false;
      let can_reopen_intake = false;
      let intake_status = 'none';
      let is_intake_revision = false;

      if (intake_form) {
        const editingStatus = getIntakeEditingStatus(intake_form);
        can_edit_intake = editingStatus.canEdit;
        can_reopen_intake = editingStatus.canReopen;
        intake_status = editingStatus.status;
        is_intake_revision = editingStatus.isRevision;
      }

      // Determine next step
      let next_step: 'complete_intake' | 'appointment_ready' | 'appointment_past' | 'intake_needs_update';
      const appointmentDate = new Date(appointment.appointment_date);
      const now = new Date();

      if (appointmentDate < now) {
        next_step = 'appointment_past';
      } else if (!intake_completed) {
        next_step = 'complete_intake';
      } else if (is_intake_revision) {
        next_step = 'intake_needs_update';
      } else {
        next_step = 'appointment_ready';
      }

      return {
        appointment,
        has_intake_form,
        intake_form: intake_form || undefined,
        intake_completed,
        next_step,
        intake_completion_percentage: intake_form?.completion_percentage || 0,
        can_edit_intake,
        can_reopen_intake,
        intake_status,
        is_intake_revision
      };

    } catch (error) {
      console.error('Error getting appointment flow status:', error);
      throw new Error('Failed to get appointment status. Please try again.');
    }
  }

  // Create intake form for existing appointment (if not already created)
  async createIntakeForExistingAppointment(
    auth_user_id: string,
    appointment_id: string,
    patient_id: number,
    pre_fill_existing_data: boolean = true
  ): Promise<PatientForm> {
    try {
      const appointment = await appointmentBookingService.getAppointmentById(appointment_id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check if intake form already exists
      const existingIntake = await getLatestIntakeVersion(patient_id, appointment.appointment_id);
      if (existingIntake) {
        return existingIntake;
      }

      // Create new intake form
      if (pre_fill_existing_data) {
        return await createIntakeDraftWithExistingData(
          auth_user_id,
          patient_id,
          appointment.appointment_id
        );
      } else {
        return await createIntakeDraft(
          auth_user_id,
          patient_id,
          appointment.appointment_id
        );
      }

    } catch (error) {
      console.error('Error creating intake for existing appointment:', error);
      throw new Error('Failed to create intake form. Please try again.');
    }
  }

  // Get all appointments with their intake form status for a patient
  async getPatientAppointmentsWithIntakeStatus(
    patient_id: number
  ): Promise<AppointmentFlowStatus[]> {
    try {
      const appointments = await appointmentBookingService.getPatientAppointments(patient_id);
      
      const appointmentStatuses = await Promise.all(
        appointments.map(async (appointment) => {
          try {
            return await this.getAppointmentFlowStatus(appointment.$id, patient_id);
          } catch (error) {
            console.error(`Error getting status for appointment ${appointment.$id}:`, error);
            // Return basic status if detailed status fails
            return {
              appointment,
              has_intake_form: false,
              intake_completed: false,
              next_step: 'complete_intake' as const,
              intake_completion_percentage: 0,
              can_edit_intake: false,
              can_reopen_intake: false,
              intake_status: 'none',
              is_intake_revision: false
            };
          }
        })
      );

      return appointmentStatuses;

    } catch (error) {
      console.error('Error getting patient appointments with intake status:', error);
      throw new Error('Failed to get appointments status. Please try again.');
    }
  }

  // Get upcoming appointments that need intake completion
  async getUpcomingAppointmentsNeedingIntake(
    patient_id: number
  ): Promise<AppointmentFlowStatus[]> {
    try {
      const upcomingAppointments = await appointmentBookingService.getUpcomingAppointments(patient_id);
      
      const appointmentStatuses = await Promise.all(
        upcomingAppointments.map(async (appointment) => {
          return await this.getAppointmentFlowStatus(appointment.$id, patient_id);
        })
      );

      // Filter to only those needing intake completion or updates
      return appointmentStatuses.filter(status => 
        status.next_step === 'complete_intake' || status.next_step === 'intake_needs_update'
      );

    } catch (error) {
      console.error('Error getting appointments needing intake:', error);
      throw new Error('Failed to get appointments needing intake. Please try again.');
    }
  }

  // Complete the entire appointment flow (submit intake form)
  async completeAppointmentIntake(
    appointment_id: string,
    patient_id: number,
    auth_user_id: string
  ): Promise<{ appointment: AppointmentBooking; intake_form: PatientForm }> {
    try {
      // Get appointment
      const appointment = await appointmentBookingService.getAppointmentById(appointment_id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Get intake form
      const intake_form = await getLatestIntakeVersion(patient_id, appointment.appointment_id);
      if (!intake_form) {
        throw new Error('Intake form not found');
      }

      // Submit the intake form
      const submitted_intake = await submitIntakeForm(
        intake_form.patient_form_id.toString(),
        patient_id,
        auth_user_id
      );

      return {
        appointment,
        intake_form: submitted_intake
      };

    } catch (error) {
      console.error('Error completing appointment intake:', error);
      throw new Error('Failed to complete intake form. Please try again.');
    }
  }

  // Reopen intake form for editing
  async reopenIntakeFormForEditing(
    appointment_id: string,
    patient_id: number,
    auth_user_id: string,
    revision_reason?: string
  ): Promise<{ appointment: AppointmentBooking; intake_form: PatientForm }> {
    try {
      // Get appointment
      const appointment = await appointmentBookingService.getAppointmentById(appointment_id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Get the latest intake form
      const intake_form = await getLatestIntakeVersion(patient_id, appointment.appointment_id);
      if (!intake_form) {
        throw new Error('Intake form not found');
      }

      // Reopen the form for editing
      const reopened_form = await reopenIntakeForEditing(
        intake_form.patient_form_id.toString(),
        patient_id,
        auth_user_id,
        revision_reason
      );

      return {
        appointment,
        intake_form: reopened_form
      };

    } catch (error) {
      console.error('Error reopening intake form for editing:', error);
      throw new Error('Failed to reopen intake form for editing. Please try again.');
    }
  }

  // Resubmit intake form after editing
  async resubmitIntakeForm(
    appointment_id: string,
    patient_id: number,
    auth_user_id: string,
    final_form_data?: FormData
  ): Promise<{ appointment: AppointmentBooking; intake_form: PatientForm }> {
    try {
      // Get appointment
      const appointment = await appointmentBookingService.getAppointmentById(appointment_id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Get the latest intake form
      const intake_form = await getLatestIntakeVersion(patient_id, appointment.appointment_id);
      if (!intake_form) {
        throw new Error('Intake form not found');
      }

      // Resubmit the form
      const resubmitted_form = await resubmitIntakeForm(
        intake_form.patient_form_id.toString(),
        patient_id,
        auth_user_id,
        final_form_data
      );

      return {
        appointment,
        intake_form: resubmitted_form
      };

    } catch (error) {
      console.error('Error resubmitting intake form:', error);
      throw new Error('Failed to resubmit intake form. Please try again.');
    }
  }

  // Get intake form history for an appointment
  async getAppointmentIntakeHistory(
    appointment_id: string,
    patient_id: number
  ): Promise<{
    appointment: AppointmentBooking;
    intake_forms: PatientForm[];
    latest_form?: PatientForm;
    submission_summary?: unknown;
  }> {
    try {
      // Get appointment
      const appointment = await appointmentBookingService.getAppointmentById(appointment_id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Get intake form history
      const intake_forms = await getIntakeFormHistory(patient_id, appointment.appointment_id);
      const latest_form = intake_forms.length > 0 ? intake_forms[0] : undefined;

      let submission_summary;
      if (latest_form) {
        submission_summary = getFormSubmissionSummary(latest_form);
      }

      return {
        appointment,
        intake_forms,
        latest_form,
        submission_summary
      };

    } catch (error) {
      console.error('Error getting appointment intake history:', error);
      throw new Error('Failed to get intake form history. Please try again.');
    }
  }

  // Check if intake form needs attention (incomplete or needs update)
  async getIntakeFormsNeedingAttention(
    patient_id: number
  ): Promise<AppointmentFlowStatus[]> {
    try {
      const upcomingAppointments = await appointmentBookingService.getUpcomingAppointments(patient_id);
      
      const appointmentStatuses = await Promise.all(
        upcomingAppointments.map(async (appointment) => {
          return await this.getAppointmentFlowStatus(appointment.$id, patient_id);
        })
      );

      // Filter to those needing attention
      return appointmentStatuses.filter(status => 
        status.next_step === 'complete_intake' || 
        status.next_step === 'intake_needs_update' ||
        (status.intake_completion_percentage > 0 && status.intake_completion_percentage < 100)
      );

    } catch (error) {
      console.error('Error getting intake forms needing attention:', error);
      throw new Error('Failed to get intake forms needing attention. Please try again.');
    }
  }

  // Get intake editing capabilities for a specific appointment
  async getIntakeEditingCapabilities(
    appointment_id: string,
    patient_id: number
  ): Promise<{
    appointment: AppointmentBooking;
    intake_form?: PatientForm;
    can_edit: boolean;
    can_reopen: boolean;
    can_create_new: boolean;
    editing_status: unknown;
    reasons_cannot_edit?: string[];
  }> {
    try {
      const appointment = await appointmentBookingService.getAppointmentById(appointment_id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const intake_form = await getLatestIntakeVersion(patient_id, appointment.appointment_id);
      const reasons_cannot_edit: string[] = [];

      // Check if appointment is in the past
      const appointmentDate = new Date(appointment.appointment_date);
      const now = new Date();
      const isPastAppointment = appointmentDate < now;

      if (isPastAppointment) {
        reasons_cannot_edit.push('Appointment has already occurred');
      }

      // Check appointment status
      if (appointment.status === 'cancelled') {
        reasons_cannot_edit.push('Appointment has been cancelled');
      }

      let can_edit = false;
      let can_reopen = false;
      let can_create_new = false;
      let editing_status;

      if (intake_form) {
        editing_status = getIntakeEditingStatus(intake_form);
        can_edit = editing_status.canEdit && !isPastAppointment && appointment.status !== 'cancelled';
        can_reopen = editing_status.canReopen && !isPastAppointment && appointment.status !== 'cancelled';
      } else {
        can_create_new = !isPastAppointment && appointment.status !== 'cancelled';
        editing_status = {
          canEdit: false,
          canReopen: false,
          status: 'none',
          isRevision: false
        };
      }

      return {
        appointment,
        intake_form: intake_form || undefined,
        can_edit,
        can_reopen,
        can_create_new,
        editing_status,
        reasons_cannot_edit: reasons_cannot_edit.length > 0 ? reasons_cannot_edit : undefined
      };

    } catch (error) {
      console.error('Error getting intake editing capabilities:', error);
      throw new Error('Failed to get intake editing capabilities. Please try again.');
    }
  }

  // Validate if intake form can be edited based on appointment timing
  validateIntakeEditingTiming(appointment: AppointmentBooking): {
    canEdit: boolean;
    reason?: string;
    hoursUntilAppointment?: number;
  } {
    const appointmentDate = new Date(appointment.appointment_date);
    const now = new Date();
    const timeDifference = appointmentDate.getTime() - now.getTime();
    const hoursUntilAppointment = Math.round(timeDifference / (1000 * 3600));

    // Cannot edit if appointment is in the past
    if (timeDifference <= 0) {
      return {
        canEdit: false,
        reason: 'Appointment has already occurred',
        hoursUntilAppointment: 0
      };
    }

    // Cannot edit if appointment is cancelled
    if (appointment.status === 'cancelled') {
      return {
        canEdit: false,
        reason: 'Appointment has been cancelled',
        hoursUntilAppointment
      };
    }

    // Warning if appointment is very soon (less than 2 hours)
    if (hoursUntilAppointment < 2) {
      return {
        canEdit: true,
        reason: 'Appointment is very soon - changes may not be processed in time',
        hoursUntilAppointment
      };
    }

    return {
      canEdit: true,
      hoursUntilAppointment
    };
  }

  // Get summary of all patient intake forms across appointments
  async getPatientIntakeSummary(patient_id: number): Promise<{
    total_forms: number;
    submitted_forms: number;
    draft_forms: number;
    revision_forms: number;
    forms_needing_attention: number;
    latest_submissions: PatientForm[];
  }> {
    try {
      const appointmentStatuses = await this.getPatientAppointmentsWithIntakeStatus(patient_id);
      
      const allForms = appointmentStatuses
        .filter(status => status.intake_form)
        .map(status => status.intake_form!);

      const summary = {
        total_forms: allForms.length,
        submitted_forms: allForms.filter(form => form.status === 'submitted' || form.status === 'completed').length,
        draft_forms: allForms.filter(form => form.status === 'not_started' || form.status === 'in_progress').length,
        revision_forms: allForms.filter(form => form.status === 'revision').length,
        forms_needing_attention: appointmentStatuses.filter(status => 
          status.next_step === 'complete_intake' || status.next_step === 'intake_needs_update'
        ).length,
        latest_submissions: allForms
          .filter(form => form.submitted_at)
          .sort((a, b) => new Date(b.submitted_at!).getTime() - new Date(a.submitted_at!).getTime())
          .slice(0, 5) // Last 5 submissions
      };

      return summary;

    } catch (error) {
      console.error('Error getting patient intake summary:', error);
      throw new Error('Failed to get patient intake summary. Please try again.');
    }
  }

  // Cancel appointment and its associated intake form
  async cancelAppointmentWithIntake(
    appointment_id: string,
    patient_id: number,
    reason?: string
  ): Promise<AppointmentBooking> {
    try {
      // Cancel the appointment
      const cancelledAppointment = await appointmentBookingService.cancelAppointment(
        appointment_id,
        reason
      );

      // Note: We don't delete the intake form as it might contain valuable patient data
      // The intake form will remain as a draft for potential future use

      return cancelledAppointment;

    } catch (error) {
      console.error('Error cancelling appointment with intake:', error);
      throw new Error('Failed to cancel appointment. Please try again.');
    }
  }

  // Reschedule appointment (keep existing intake form)
  async rescheduleAppointmentWithIntake(
    appointment_id: string,
    patient_id: number,
    newDate: string,
    newTime: string,
    newAppointmentTypeId?: number
  ): Promise<{ appointment: AppointmentBooking; intake_form?: PatientForm }> {
    try {
      // Reschedule the appointment
      const rescheduledAppointment = await appointmentBookingService.rescheduleAppointment(
        appointment_id,
        newDate,
        newTime,
        newAppointmentTypeId
      );

      // Get the existing intake form (it should still be valid for the rescheduled appointment)
      const intake_form = await getLatestIntakeVersion(patient_id, rescheduledAppointment.appointment_id);

      return {
        appointment: rescheduledAppointment,
        intake_form: intake_form || undefined
      };

    } catch (error) {
      console.error('Error rescheduling appointment with intake:', error);
      throw new Error('Failed to reschedule appointment. Please try again.');
    }
  }

  // Check if patient can book appointment (no conflicts, etc.)
  async canBookAppointment(
    patient_id: number,
    provider_id: number,
    appointment_date: string,
    appointment_time: string
  ): Promise<{ canBook: boolean; reason?: string }> {
    try {
      // Check for provider conflicts
      const hasConflict = await appointmentBookingService.checkAppointmentConflict(
        patient_id,
        provider_id,
        appointment_date,
        appointment_time
      );

      if (hasConflict) {
        return {
          canBook: false,
          reason: 'This time slot is not available with the selected provider.'
        };
      }

      // Check if appointment is in the past
      const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);
      const now = new Date();

      if (appointmentDateTime <= now) {
        return {
          canBook: false,
          reason: 'Cannot book appointments in the past.'
        };
      }

      // Check if appointment is too far in the future (optional business rule)
      const maxAdvanceBookingDays = 180; // 6 months
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + maxAdvanceBookingDays);

      if (appointmentDateTime > maxDate) {
        return {
          canBook: false,
          reason: `Cannot book appointments more than ${maxAdvanceBookingDays} days in advance.`
        };
      }

      return { canBook: true };

    } catch (error) {
      console.error('Error checking if can book appointment:', error);
      return {
        canBook: false,
        reason: 'Unable to verify appointment availability. Please try again.'
      };
    }
  }

  // Update appointment summary to include intake editing information
  async getAppointmentSummary(patient_id: number): Promise<{
    total_appointments: number;
    upcoming_appointments: number;
    pending_intake_forms: number;
    completed_appointments: number;
    intake_forms_needing_update: number;
    next_appointment?: AppointmentFlowStatus;
  }> {
    try {
      const appointmentStatuses = await this.getPatientAppointmentsWithIntakeStatus(patient_id);

      const summary = {
        total_appointments: appointmentStatuses.length,
        upcoming_appointments: appointmentStatuses.filter(s => 
          s.next_step === 'complete_intake' || 
          s.next_step === 'appointment_ready' || 
          s.next_step === 'intake_needs_update'
        ).length,
        pending_intake_forms: appointmentStatuses.filter(s => 
          s.next_step === 'complete_intake'
        ).length,
        completed_appointments: appointmentStatuses.filter(s => 
          s.next_step === 'appointment_past'
        ).length,
        intake_forms_needing_update: appointmentStatuses.filter(s => 
          s.next_step === 'intake_needs_update'
        ).length,
        next_appointment: undefined as AppointmentFlowStatus | undefined
      };

      // Find next upcoming appointment
      const upcomingAppointments = appointmentStatuses
        .filter(s => s.next_step === 'complete_intake' || s.next_step === 'appointment_ready' || s.next_step === 'intake_needs_update')
        .sort((a, b) => new Date(a.appointment.appointment_date).getTime() - new Date(b.appointment.appointment_date).getTime());

      if (upcomingAppointments.length > 0) {
        summary.next_appointment = upcomingAppointments[0];
      }

      return summary;

    } catch (error) {
      console.error('Error getting appointment summary:', error);
      throw new Error('Failed to get appointment summary. Please try again.');
    }
  }
}

// Create singleton instance
export const appointmentFlowService = new AppointmentFlowService();

// Enhanced React hooks for the appointment flow with editing capabilities
import { useState, useEffect } from 'react';

export const useAppointmentFlowStatus = (appointment_id: string | null, patient_id: number | null) => {
  const [status, setStatus] = useState<AppointmentFlowStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!appointment_id || !patient_id) {
        setStatus(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await appointmentFlowService.getAppointmentFlowStatus(appointment_id, patient_id);
        setStatus(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [appointment_id, patient_id]);

  const refreshStatus = async () => {
    if (!appointment_id || !patient_id) return;
    
    try {
      setError(null);
      const result = await appointmentFlowService.getAppointmentFlowStatus(appointment_id, patient_id);
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return { status, loading, error, refreshStatus };
};

export const useAppointmentSummary = (patient_id: number | null) => {
  const [summary, setSummary] = useState<{
    total_appointments: number;
    upcoming_appointments: number;
    pending_intake_forms: number;
    completed_appointments: number;
    intake_forms_needing_update: number;
    next_appointment?: AppointmentFlowStatus;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!patient_id) {
        setSummary(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await appointmentFlowService.getAppointmentSummary(patient_id);
        setSummary(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [patient_id]);

  return { summary, loading, error };
};

export const useIntakeFormsNeedingAttention = (patient_id: number | null) => {
  const [forms, setForms] = useState<AppointmentFlowStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      if (!patient_id) {
        setForms([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await appointmentFlowService.getIntakeFormsNeedingAttention(patient_id);
        setForms(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [patient_id]);

  const refreshForms = async () => {
    if (!patient_id) return;
    
    try {
      setError(null);
      const result = await appointmentFlowService.getIntakeFormsNeedingAttention(patient_id);
      setForms(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return { forms, loading, error, refreshForms };
};

export const useIntakeEditingCapabilities = (appointment_id: string | null, patient_id: number | null) => {
  const [capabilities, setCapabilities] = useState<{
    appointment: AppointmentBooking;
    intake_form?: PatientForm;
    can_edit: boolean;
    can_reopen: boolean;
    can_create_new: boolean;
    editing_status: unknown;
    reasons_cannot_edit?: string[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCapabilities = async () => {
      if (!appointment_id || !patient_id) {
        setCapabilities(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await appointmentFlowService.getIntakeEditingCapabilities(appointment_id, patient_id);
        setCapabilities(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCapabilities();
  }, [appointment_id, patient_id]);

  return { capabilities, loading, error };
};

export const useAppointmentIntakeHistory = (appointment_id: string | null, patient_id: number | null) => {
  const [history, setHistory] = useState<{
    appointment: AppointmentBooking;
    intake_forms: PatientForm[];
    latest_form?: PatientForm;
    submission_summary?: unknown;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!appointment_id || !patient_id) {
        setHistory(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await appointmentFlowService.getAppointmentIntakeHistory(appointment_id, patient_id);
        setHistory(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [appointment_id, patient_id]);

  const refreshHistory = async () => {
    if (!appointment_id || !patient_id) return;
    
    try {
      setError(null);
      const result = await appointmentFlowService.getAppointmentIntakeHistory(appointment_id, patient_id);
      setHistory(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return { history, loading, error, refreshHistory };
};

export const usePatientIntakeSummary = (patient_id: number | null) => {
  const [summary, setSummary] = useState<{
    total_forms: number;
    submitted_forms: number;
    draft_forms: number;
    revision_forms: number;
    forms_needing_attention: number;
    latest_submissions: PatientForm[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!patient_id) {
        setSummary(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await appointmentFlowService.getPatientIntakeSummary(patient_id);
        setSummary(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [patient_id]);

  return { summary, loading, error };
};

// Hook for booking appointments with intake
export const useBookAppointmentWithIntake = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const bookAppointment = async (input: BookAppointmentWithIntakeInput) => {
    try {
      setLoading(true);
      setError(null);
      const result = await appointmentFlowService.bookAppointmentWithIntake(input);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { bookAppointment, loading, error };
};

// Hook for intake form editing operations
export const useIntakeFormEditing = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reopenForEditing = async (
    appointment_id: string,
    patient_id: number,
    auth_user_id: string,
    revision_reason?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await appointmentFlowService.reopenIntakeFormForEditing(
        appointment_id,
        patient_id,
        auth_user_id,
        revision_reason
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resubmitForm = async (
    appointment_id: string,
    patient_id: number,
    auth_user_id: string,
    final_form_data?: FormData
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await appointmentFlowService.resubmitIntakeForm(
        appointment_id,
        patient_id,
        auth_user_id,
        final_form_data
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeIntake = async (
    appointment_id: string,
    patient_id: number,
    auth_user_id: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await appointmentFlowService.completeAppointmentIntake(
        appointment_id,
        patient_id,
        auth_user_id
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    reopenForEditing, 
    resubmitForm, 
    completeIntake, 
    loading, 
    error 
  };
};

// Hook for appointment management operations
export const useAppointmentManagement = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cancelAppointment = async (
    appointment_id: string,
    patient_id: number,
    reason?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await appointmentFlowService.cancelAppointmentWithIntake(
        appointment_id,
        patient_id,
        reason
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rescheduleAppointment = async (
    appointment_id: string,
    patient_id: number,
    newDate: string,
    newTime: string,
    newAppointmentTypeId?: number
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await appointmentFlowService.rescheduleAppointmentWithIntake(
        appointment_id,
        patient_id,
        newDate,
        newTime,
        newAppointmentTypeId
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createIntakeForExisting = async (
    auth_user_id: string,
    appointment_id: string,
    patient_id: number,
    pre_fill_existing_data: boolean = true
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await appointmentFlowService.createIntakeForExistingAppointment(
        auth_user_id,
        appointment_id,
        patient_id,
        pre_fill_existing_data
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    cancelAppointment, 
    rescheduleAppointment, 
    createIntakeForExisting, 
    loading, 
    error 
  };
};
