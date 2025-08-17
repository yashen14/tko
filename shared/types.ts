export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "staff" | "supervisor" | "apollo";
  name: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bio?: string;
  createdAt: string;
  location?: {
    city: "Johannesburg" | "Cape Town";
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  schedule?: {
    workingLateShift?: boolean;
    shiftStartTime?: string; // Default 05:00
    shiftEndTime?: string; // Default based on late shift or not
    weekType?: "normal" | "late"; // Alternating weeks
  };
  salary?: {
    type: "monthly" | "per_job" | "both";
    monthlyAmount?: number;
    perJobRates?: {
      [category: string]: number;
    };
    currency?: string;
    effectiveDate?: string;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface FormField {
  id: string;
  type:
    | "text"
    | "email"
    | "number"
    | "date"
    | "datetime-local"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio";
  label: string;
  required: boolean;
  options?: string[]; // For select fields
  placeholder?: string;
  defaultValue?: string;
  autoFillFrom?: string; // Auto-fill from job data
  readonly?: boolean; // Read-only field
  autoCalculate?: boolean; // Auto-calculate based on other fields
  dependsOn?: string; // Field dependency
  showWhen?: string; // Show when dependent field has this value
  section?: "staff" | "client"; // Which section this field belongs to
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  isTemplate: boolean;
  restrictedToCompanies?: string[]; // Company IDs, empty means available to all
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
  pdfTemplate?: string; // PDF filename for PDF-based forms
  formType?: string; // Type categorization of the form
}

export interface Job {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Staff user ID
  assignedBy: string; // Admin user ID
  companyId?: string;
  formId?: string;
  formIds?: string[]; // Multiple forms can be assigned to a job
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  duration?: number; // Duration in minutes
  carryOver?: boolean;
  notes?: string;
  meoJobNumber?: string; // MEO22 custom job tracking number
  category?:
    | "Geyser Assessment"
    | "Geyser Replacement"
    | "Leak Detection"
    | "Drain Blockage"
    | "Camera Inspection"
    | "Toilet/Shower"
    | "Other";
  categoryOther?: string; // When category is "Other"
  pricing?: {
    type: "call-out" | "repair" | "replacement";
    amount: number;
    staffId?: string; // For staff-specific pricing
  };
  isAssisting?: boolean; // True if staff is assisting another staff member
  client?: { name: string }; // Client information

  // Parsed job data fields (lowercase)
  claimNo?: string;
  policyNo?: string;
  spmNo?: string;
  underwriter?: string;
  branch?: string;
  broker?: string;
  claimSpecialist?: string;
  email?: string;
  riskAddress?: string;
  claimStatus?: string;
  insuredName?: string;
  insCell?: string;
  insHometel?: string;
  insEmail?: string;
  sumInsured?: number;
  incidentDate?: string;
  descriptionOfLoss?: string;
  claimEstimate?: number;
  section?: string;
  peril?: string;
  excess?: string;
  dateReported?: string;

  // Capitalized versions for backward compatibility
  ClaimNo?: string;
  PolicyNo?: string;
  SPMNo?: string;
  Underwriter?: string;
  Branch?: string;
  Broker?: string;
  ClaimSpecialist?: string;
  Email?: string;
  RiskAddress?: string;
  ClaimStatus?: string;
  InsuredName?: string;
  InsCell?: string;
  InsHometel?: string;
  InsEmail?: string;
  SumInsured?: number;
  IncidentDate?: string;
  DescriptionOfLoss?: string;
  ClaimEstimate?: number;
  Section?: string;
  Peril?: string;
  Excess?: string;
  DateReported?: string;

  // Additional job fields
  address?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ExtensionRequest {
  id: string;
  jobId: string;
  staffId: string;
  staffName: string;
  currentDueDate: string;
  requestedDueDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface FormSubmission {
  id: string;
  jobId?: string;
  formId: string;
  formType?: string; // Form type for identification
  submittedBy: string; // Staff user ID
  data: Record<string, any>; // Form field values
  submittedAt: string;
  submissionNumber?: number; // 1, 2, or 3 - tracks which submission this is for the same job/form combination

  // Simplified signature support
  signature?: string; // Client signature (base64 data)
  signature_staff?: string; // Staff signature (base64 data, optional)
}

export interface ParsedJobData {
  claimNo?: string;
  policyNo?: string;
  spmNo?: string;
  underwriter?: string;
  branch?: string;
  broker?: string;
  claimSpecialist?: string;
  email?: string;
  riskAddress?: string;
  claimStatus?: string;
  insuredName?: string;
  insCell?: string;
  insHometel?: string;
  insEmail?: string;
  sumInsured?: number;
  incidentDate?: string;
  descriptionOfLoss?: string;
  claimEstimate?: number;
  section?: string;
  peril?: string;
  excess?: string;
  dateReported?: string;

  // Capitalized versions for backward compatibility
  ClaimNo?: string;
  PolicyNo?: string;
  SPMNo?: string;
  Underwriter?: string;
  Branch?: string;
  Broker?: string;
  ClaimSpecialist?: string;
  Email?: string;
  RiskAddress?: string;
  ClaimStatus?: string;
  InsuredName?: string;
  InsCell?: string;
  InsHometel?: string;
  InsEmail?: string;
  SumInsured?: number;
  IncidentDate?: string;
  DescriptionOfLoss?: string;
  ClaimEstimate?: number;
  Section?: string;
  Peril?: string;
  Excess?: string;
  DateReported?: string;

  [key: string]: any;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  assignedTo: string;
  companyId?: string;
  formId?: string;
  formIds?: string[]; // Multiple forms can be assigned
  priority: "low" | "medium" | "high";
  dueDate?: string;
  rawText?: string; // For parsing
  category?:
    | "Geyser Assessment"
    | "Geyser Replacement"
    | "Leak Detection"
    | "Drain Blockage"
    | "Camera Inspection"
    | "Toilet/Shower"
    | "Other";
  categoryOther?: string; // When category is "Other"
}

export interface CreateFormRequest {
  name: string;
  description?: string;
  fields: Omit<FormField, "id">[];
  isTemplate: boolean;
  restrictedToCompanies?: string[];
  rawSchema?: string; // For parsing
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  assignedTo?: string;
  companyId?: string;
  formId?: string;
  status?: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
  dueDate?: string;
}

export interface DashboardStats {
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  totalStaff: number;
  totalForms: number;
}

export interface TimeLog {
  id: string;
  staffId: string;
  type: "check_in" | "check_out" | "job_start" | "job_end";
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  jobId?: string; // For job start/end logs
  notes?: string;
}

export interface StaffTimeRecord {
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD format
  checkInTime?: string;
  checkOutTime?: string;
  totalWorkHours?: number;
  jobLogs: {
    jobId: string;
    jobTitle: string;
    startTime: string;
    endTime?: string;
    duration?: number; // in minutes
  }[];
}

export interface TimeTrackingExport {
  staffRecords: StaffTimeRecord[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
}
