import { databases, ID } from '../lib/appwrite';
import { Query, Permission, Role } from 'appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const FORM_ATTACHMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_FORM_ATTACHMENTS_COLLECTION_ID || 'form_attachments';

export interface FormAttachment {
  $id: string;
  attachment_id: number;
  form_id: string;
  file_id: string;
  patient_id: number;
  attachment_type: 'medical-document' | 'insurance-card' | 'id-document' | 'other';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFormAttachmentInput {
  form_id: string;
  file_id: string;
  patient_id: number;
  attachment_type?: string;
  description?: string;
  auth_user_id: string;
}

class FormAttachmentService {
  // Create a form attachment record
  async createFormAttachment(input: CreateFormAttachmentInput): Promise<FormAttachment> {
    const now = new Date().toISOString();
    const attachmentId = Math.floor(Math.random() * 1000000) + Date.now() % 1000000;

    const document = await databases.createDocument(
      DATABASE_ID,
      FORM_ATTACHMENTS_COLLECTION_ID,
      ID.unique(),
      {
        attachment_id: attachmentId,
        form_id: input.form_id,
        file_id: input.file_id,
        patient_id: input.patient_id,
        attachment_type: input.attachment_type || 'medical-document',
        description: input.description || '',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      [
        Permission.read(Role.user(input.auth_user_id)),
        Permission.update(Role.user(input.auth_user_id)),
        Permission.delete(Role.user(input.auth_user_id)),
      ]
    );

    return document as unknown as FormAttachment;
  }

  // Create multiple form attachments
  async createMultipleFormAttachments(
    form_id: string,
    file_ids: string[],
    patient_id: number,
    auth_user_id: string,
    attachment_type?: string,
    description?: string
  ): Promise<FormAttachment[]> {
    const attachments: FormAttachment[] = [];

    for (const file_id of file_ids) {
      try {
        const attachment = await this.createFormAttachment({
          form_id,
          file_id,
          patient_id,
          attachment_type,
          description,
          auth_user_id,
        });
        attachments.push(attachment);
      } catch (error) {
        console.error(`Error creating attachment for file ${file_id}:`, error);
        // Continue with other files even if one fails
      }
    }

    return attachments;
  }

  // Get all attachments for a form
  async getFormAttachments(form_id: string): Promise<FormAttachment[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        FORM_ATTACHMENTS_COLLECTION_ID,
        [
          Query.equal('form_id', form_id),
          Query.equal('is_active', true),
          Query.orderDesc('created_at'),
        ]
      );

      return response.documents as unknown as FormAttachment[];
    } catch (error) {
      console.error('Error fetching form attachments:', error);
      return [];
    }
  }

  // Get all attachments for a patient
  async getPatientFormAttachments(patient_id: number): Promise<FormAttachment[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        FORM_ATTACHMENTS_COLLECTION_ID,
        [
          Query.equal('patient_id', patient_id),
          Query.equal('is_active', true),
          Query.orderDesc('created_at'),
        ]
      );

      return response.documents as unknown as FormAttachment[];
    } catch (error) {
      console.error('Error fetching patient form attachments:', error);
      return [];
    }
  }

  // Remove a form attachment
  async removeFormAttachment(attachment_id: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      await databases.updateDocument(
        DATABASE_ID,
        FORM_ATTACHMENTS_COLLECTION_ID,
        attachment_id,
        {
          is_active: false,
          updated_at: now,
        }
      );
    } catch (error) {
      console.error('Error removing form attachment:', error);
      throw new Error('Failed to remove form attachment');
    }
  }

  // Remove multiple form attachments
  async removeMultipleFormAttachments(attachment_ids: string[]): Promise<void> {
    for (const attachment_id of attachment_ids) {
      try {
        await this.removeFormAttachment(attachment_id);
      } catch (error) {
        console.error(`Error removing attachment ${attachment_id}:`, error);
        // Continue with other attachments even if one fails
      }
    }
  }

  // Update form attachment description
  async updateFormAttachmentDescription(
    attachment_id: string,
    description: string
  ): Promise<FormAttachment> {
    try {
      const now = new Date().toISOString();
      const updated = await databases.updateDocument(
        DATABASE_ID,
        FORM_ATTACHMENTS_COLLECTION_ID,
        attachment_id,
        {
          description,
          updated_at: now,
        }
      );

      return updated as unknown as FormAttachment;
    } catch (error) {
      console.error('Error updating form attachment description:', error);
      throw new Error('Failed to update form attachment description');
    }
  }

  // Get attachment by ID
  async getFormAttachmentById(attachment_id: string): Promise<FormAttachment | null> {
    try {
      const document = await databases.getDocument(
        DATABASE_ID,
        FORM_ATTACHMENTS_COLLECTION_ID,
        attachment_id
      );

      return document as unknown as FormAttachment;
    } catch (error) {
      console.error('Error fetching form attachment by ID:', error);
      return null;
    }
  }

  // Check if file is already attached to form
  async isFileAttachedToForm(form_id: string, file_id: string): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        FORM_ATTACHMENTS_COLLECTION_ID,
        [
          Query.equal('form_id', form_id),
          Query.equal('file_id', file_id),
          Query.equal('is_active', true),
        ]
      );

      return response.documents.length > 0;
    } catch (error) {
      console.error('Error checking if file is attached to form:', error);
      return false;
    }
  }

  // Get attachments by type
  async getFormAttachmentsByType(
    form_id: string,
    attachment_type: string
  ): Promise<FormAttachment[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        FORM_ATTACHMENTS_COLLECTION_ID,
        [
          Query.equal('form_id', form_id),
          Query.equal('attachment_type', attachment_type),
          Query.equal('is_active', true),
          Query.orderDesc('created_at'),
        ]
      );

      return response.documents as unknown as FormAttachment[];
    } catch (error) {
      console.error('Error fetching form attachments by type:', error);
      return [];
    }
  }

  // Get attachment count for a form
  async getFormAttachmentCount(form_id: string): Promise<number> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        FORM_ATTACHMENTS_COLLECTION_ID,
        [
          Query.equal('form_id', form_id),
          Query.equal('is_active', true),
        ]
      );

      return response.documents.length;
    } catch (error) {
      console.error('Error getting form attachment count:', error);
      return 0;
    }
  }

  // Replace form attachments (remove old ones and add new ones)
  async replaceFormAttachments(
    form_id: string,
    new_file_ids: string[],
    patient_id: number,
    auth_user_id: string,
    attachment_type?: string,
    description?: string
  ): Promise<FormAttachment[]> {
    try {
      // Get existing attachments
      const existingAttachments = await this.getFormAttachments(form_id);

      // Remove existing attachments
      for (const attachment of existingAttachments) {
        await this.removeFormAttachment(attachment.$id);
      }

      // Create new attachments
      return await this.createMultipleFormAttachments(
        form_id,
        new_file_ids,
        patient_id,
        auth_user_id,
        attachment_type,
        description
      );
    } catch (error) {
      console.error('Error replacing form attachments:', error);
      throw new Error('Failed to replace form attachments');
    }
  }
}

export const formAttachmentService = new FormAttachmentService();
