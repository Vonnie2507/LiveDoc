export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: {
      id: number;
      roleName: string;
    };
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: {
    id: number;
    roleName: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  id: number;
  projectName: string;
  status: 'draft' | 'quoted' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  completionPercentage: number;
  createdBy: {
    id: number;
    fullName: string;
  };
  lockedBy: {
    id: number;
    fullName: string;
  } | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  projects: ProjectResponse[];
  total: number;
}

export interface ChangeLogResponse {
  id: number;
  projectId: number;
  changedBy: {
    id: number;
    fullName: string;
    role: string;
  };
  changeType: 'standard' | 'statusChange' | 'aiExtraction' | 'note';
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  sourceRole: 'sales' | 'scheduler' | 'production' | 'installer' | null;
  createdAt: string;
}

export interface CommunicationResponse {
  id: number;
  projectId: number;
  uploadedBy: {
    id: number;
    fullName: string;
  };
  sourceType: 'email' | 'sms' | 'document';
  contentText: string | null;
  contentFilePath: string | null;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface ExtractionResponse {
  id: number;
  sourceId: number;
  extractedField: string;
  extractedValue: string;
  confidenceScore: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'applied';
  reviewedBy: {
    id: number;
    fullName: string;
  } | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface QuestionResponse {
  id: number;
  questionCode: string;
  stage: 'estimate' | 'schedule' | 'production' | 'installation';
  questionText: string;
  inputType: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'number' | 'date';
  validationRules: Record<string, any> | null;
  isRequired: boolean;
  dependsOnCode: string | null;
  dependsOnValue: string | null;
}

export interface ResponseResponse {
  id: number;
  projectId: number;
  question: {
    id: number;
    questionCode: string;
    questionText: string;
  };
  responseValue: string;
  answeredBy: {
    id: number;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentResponse {
  id: number;
  projectId: number;
  uploadedBy: {
    id: number;
    fullName: string;
  };
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  field?: string;
}