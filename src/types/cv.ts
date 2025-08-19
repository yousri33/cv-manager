export interface CVRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  universities: string;
  resumeSummary: string;
  detectedGaps: string;
  interviewQuestions: string;
  holderSummary: string;
  cvUrl: string;
  uploadDate: string;
}

export interface AirtableRecord {
  id: string;
  fields: {
    [key: string]: any;
    fldtime?: string;
    fldFirstName?: string;
    fldLastName?: string;
    fldEmail?: string;
    fldUniversities?: string;
    flddoc_resume_summary?: string;
    flddetected_gaps_1?: string;
    fldinterview_questions?: string;
    fldholder_summary?: string;
    fldCV?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
  };
}

export interface CVSearchParams {
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CVApiResponse {
  records: CVRecord[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  recordId?: string;
  status?: string;
  candidate?: string;
}