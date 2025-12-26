export interface User {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber: string | null;
  roleId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: number;
  roleName: string;
  permissions: Record<string, boolean>;
  createdAt: Date;
}

export interface Project {
  id: number;
  projectName: string;
  status: 'draft' | 'quoted' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  completionPercentage: number;
  createdBy: number;
  lockedBy: number | null;
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ChangeLog {
  id: number;
  projectId: number;
  changedBy: number;
  changeType: 'standard' | 'statusChange' | 'aiExtraction' | 'note';
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  sourceRole: 'sales' | 'scheduler' | 'production' | 'installer' | null;
  createdAt: Date;
}

export interface Communication {
  id: number;
  projectId: number;
  uploadedBy: number;
  sourceType: 'email' | 'sms' | 'document';
  contentText: string | null;
  contentFilePath: string | null;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

export interface Extraction {
  id: number;
  sourceId: number;
  extractedField: string;
  extractedValue: string;
  confidenceScore: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'applied';
  reviewedBy: number | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

export interface Question {
  id: number;
  questionCode: string;
  stage: 'estimate' | 'schedule' | 'production' | 'installation';
  questionText: string;
  inputType: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'number' | 'date';
  validationRules: Record<string, any> | null;
  isRequired: boolean;
  dependsOnCode: string | null;
  dependsOnValue: string | null;
  createdAt: Date;
}

export interface Response {
  id: number;
  projectId: number;
  questionId: number;
  responseValue: string;
  answeredBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: number;
  projectId: number;
  uploadedBy: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  projectId: number | null;
  message: string;
  notificationType: 'projectUpdate' | 'newCommunication' | 'extractionReady' | 'statusChange';
  isRead: boolean;
  createdAt: Date;
}

export interface StatusHistory {
  id: number;
  projectId: number;
  oldStatus: 'draft' | 'quoted' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | null;
  newStatus: 'draft' | 'quoted' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  changedBy: number;
  createdAt: Date;
}