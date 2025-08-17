import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ResponsiveNavigation } from "@/components/ResponsiveNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Users,
  FileText,
  Briefcase,
  Building2,
  Plus,
  Settings,
  BarChart3,
  Calendar,
  List,
  Search,
  User,
  Package,
  AlertCircle,
  Shield,
  Wrench,
  Zap,
  Edit,
  Menu,
  X,
  RotateCcw,
  Send,
  Target,
  Trash2,
  Clock,
  Download,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Job,
  Form,
  User as UserType,
  Company,
  FormSubmission,
  StaffTimeRecord,
} from "@shared/types";
import { CreateJobModal } from "@/components/CreateJobModal";
import { CreateFormModal } from "@/components/CreateFormModal";
import { JobCalendarView } from "@/components/JobCalendarView";
import { AdvancedCalendarView } from "@/components/AdvancedCalendarView";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { CreateCompanyModal } from "@/components/CreateCompanyModal";
import { StaffProfileModal } from "@/components/StaffProfileModal";
import { JobEditModal } from "@/components/JobEditModal";
import { JobCreationCalendarModal } from "@/components/JobCreationCalendarModal";
import { StaffCalendarView } from "@/components/StaffCalendarView";
import { JobProgressModal } from "@/components/JobProgressModal";
import { StaffSalaryTracker } from "@/components/StaffSalaryTracker";
import { StaffScheduleManager } from "@/components/StaffScheduleManager";
import { MaterialListManager } from "@/components/MaterialListManager";
import { NoncomplianceForm } from "@/components/NoncomplianceForm";
import { EnhancedLiabilityForm } from "@/components/EnhancedLiabilityForm";
import { EnhancedShiftManagement } from "@/components/EnhancedShiftManagement";
import { ClientManagement } from "@/components/ClientManagement";
import { CompanyManagementModal } from "@/components/CompanyManagementModal";
import { FormEditModal } from "@/components/FormEditModal";
import { PDFFormGenerator } from "@/components/PDFFormGenerator";
import { DeletionConfirmModal } from "@/components/DeletionConfirmModal";
import { JobTimeEditor } from "@/components/JobTimeEditor";
import { MongoSyncStatus } from "@/components/MongoSyncStatus";
import { StaffViewPortal } from "@/components/StaffViewPortal";
import { JobDuplicationModal } from "@/components/JobDuplicationModal";
import { AdminPDFManagement } from "@/components/AdminPDFManagement";
import { FormVariableViewer } from "@/components/FormVariableViewer";
import { AdminFormManager } from "@/components/AdminFormManager";
import { PDFSignatureManager } from "@/components/PDFSignatureManager";
import { AdminPopulatedPDFViewer } from "@/components/AdminPopulatedPDFViewer";
import { MaterialFormTemplateEditor } from "@/components/MaterialFormTemplateEditor";
import { StaffDetailModal } from "@/components/StaffDetailModal";
import { SendAgainModal } from "@/components/SendAgainModal";
import { SmartJobAssignmentModal } from "@/components/SmartJobAssignmentModal";
import { ExtensionRequestsModal } from "@/components/ExtensionRequestsModal";
import { JobListView } from "@/components/JobListView";
import { CompiledPDFPreviewModal } from "@/components/CompiledPDFPreviewModal";
import { Background3D, Background3DProvider } from "@/components/Background3D";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [staff, setStaff] = useState<UserType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showJobEdit, setShowJobEdit] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCalendarJobCreation, setShowCalendarJobCreation] = useState(false);
  const [selectedStaffForCalendar, setSelectedStaffForCalendar] =
    useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [showCompanyManagement, setShowCompanyManagement] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFormEdit, setShowFormEdit] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [showPDFFormGenerator, setShowPDFFormGenerator] = useState(false);
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [deletionItem, setDeletionItem] = useState<{
    type: "staff" | "company";
    id: string;
    name: string;
  } | null>(null);
  const [showJobTimeEditor, setShowJobTimeEditor] = useState(false);
  const [showJobProgress, setShowJobProgress] = useState(false);
  const [selectedJobForProgress, setSelectedJobForProgress] =
    useState<Job | null>(null);
  const [selectedJobForTimeEdit, setSelectedJobForTimeEdit] =
    useState<Job | null>(null);
  const [showEnhancedShiftManagement, setShowEnhancedShiftManagement] =
    useState(false);
  const [jobView, setJobView] = useState<"calendar" | "list">("calendar");
  const [selectedJobTime, setSelectedJobTime] = useState<{
    time: string;
    date: Date;
  } | null>(null);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("all");
  const [showStaffViewPortal, setShowStaffViewPortal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    job: Job | null;
  }>({ visible: false, x: 0, y: 0, job: null });
  const [showJobDuplication, setShowJobDuplication] = useState(false);
  const [jobToDuplicate, setJobToDuplicate] = useState<Job | null>(null);
  const [showAdminPDFManagement, setShowAdminPDFManagement] = useState(false);
  const [showFormVariableViewer, setShowFormVariableViewer] = useState(false);
  const [showPDFSignatureManager, setShowPDFSignatureManager] = useState(false);
  const [showAdminPopulatedPDFViewer, setShowAdminPopulatedPDFViewer] = useState(false);
  const [selectedFormSubmission, setSelectedFormSubmission] = useState<any>(null);

  // Helper functions for PDF management
  const getFormPDFName = (formId: string) => {
    switch (formId) {
      case "form-absa-certificate":
      case "absa-form":
        return "ABSACertificate.pdf";
      case "form-clearance-certificate":
      case "clearance-certificate-form":
        return "BBPClearanceCertificate.pdf";
      case "form-sahl-certificate":
      case "sahl-certificate-form":
        return "sahlld.pdf";
      case "form-discovery-geyser":
      case "discovery-form":
        return "desco.pdf";
      case "form-liability-certificate":
      case "liability-form":
        return "liabWave.pdf";
      case "noncompliance-form":
        return "Noncompliance.pdf";
      case "material-list-form":
        return "ML.pdf";
      default:
        return "placeholder.pdf";
    }
  };

  const getFormDisplayName = (formId: string) => {
    switch (formId) {
      case "form-absa-certificate":
      case "absa-form":
        return "ABSA Certificate";
      case "form-clearance-certificate":
      case "clearance-certificate-form":
        return "Clearance Certificate";
      case "form-sahl-certificate":
      case "sahl-certificate-form":
        return "SAHL Certificate";
      case "form-discovery-geyser":
      case "discovery-form":
        return "Discovery Form";
      case "form-liability-certificate":
      case "liability-form":
        return "Liability Certificate";
      case "noncompliance-form":
        return "Non-Compliance Form";
      case "material-list-form":
        return "Material List";
      default:
        return "Unknown Form";
    }
  };

  const getFormTypeFromId = (formId: string) => {
    switch (formId) {
      case "form-absa-certificate":
      case "absa-form":
        return "absa-form";
      case "form-clearance-certificate":
      case "clearance-certificate-form":
        return "clearance-certificate-form";
      case "form-sahl-certificate":
      case "sahl-certificate-form":
        return "sahl-certificate-form";
      case "form-discovery-geyser":
      case "discovery-form":
        return "discovery-form";
      case "form-liability-certificate":
      case "liability-form":
        return "liability-form";
      case "noncompliance-form":
        return "noncompliance-form";
      case "material-list-form":
        return "material-list-form";
      default:
        return "default";
    }
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("jobs");

  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplateType, setEditingTemplateType] = useState<"material-list" | "noncompliance" | "liability">("material-list");
  const [showStaffDetail, setShowStaffDetail] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState<UserType | null>(null);
  const [discardedJobs, setDiscardedJobs] = useState<any[]>([]);
  const [showSendAgain, setShowSendAgain] = useState(false);
  const [selectedJobForSendAgain, setSelectedJobForSendAgain] = useState<Job | null>(null);
  const [showSmartAssignment, setShowSmartAssignment] = useState(false);
  const [selectedJobForAssignment, setSelectedJobForAssignment] = useState<Job | null>(null);
  const [showExtensionRequests, setShowExtensionRequests] = useState(false);
  const [extensionRequestsCount, setExtensionRequestsCount] = useState(0);
  const [timeRecords, setTimeRecords] = useState<StaffTimeRecord[]>([]);
  const [timeTrackingDateRange, setTimeTrackingDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Stat card modal states
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showFormsModal, setShowFormsModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [selectedJobForPDF, setSelectedJobForPDF] = useState<Job | null>(null);

  // View as other roles
  const [viewAsRole, setViewAsRole] = useState<'admin' | 'apollo' | 'staff'>('admin');
  const [isEditMode, setIsEditMode] = useState(false);

  // Simulate user role for View As functionality
  const effectiveUser = viewAsRole === 'admin' ? user : {
    ...user,
    role: viewAsRole
  };

  // Navigation items - filtered based on effective user role
  const navItems = React.useMemo(() => {
    const allNavItems = [
      { key: "jobs", label: "Jobs", icon: <Briefcase className="h-4 w-4" /> },
      { key: "admin-forms", label: "Admin Forms", icon: <Settings className="h-4 w-4" />, adminOnly: true },
      { key: "schedule", label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
      { key: "forms", label: "Forms", icon: <FileText className="h-4 w-4" />, apolloExcluded: true },
      { key: "staff", label: "Staff", icon: <User className="h-4 w-4" /> },
      { key: "companies", label: "Companies", icon: <Building2 className="h-4 w-4" />, apolloExcluded: true },
      { key: "discarded-jobs", label: "Discarded Jobs", icon: <Trash2 className="h-4 w-4" />, adminOnly: true },
      { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
      { key: "time-tracking", label: "Time Tracking", icon: <Clock className="h-4 w-4" />, adminOnly: true },
      { key: "salary", label: "Salary", icon: <DollarSign className="h-4 w-4" /> },
      { key: "clients", label: "Clients", icon: <Users className="h-4 w-4" /> },
      { key: "materials", label: "Materials", icon: <Package className="h-4 w-4" />, apolloExcluded: true },
    ];

    // Filter based on effective user role
    if (effectiveUser?.role === 'staff') {
      return [
        { key: "jobs", label: "Jobs", icon: <Briefcase className="h-4 w-4" /> },
        { key: "schedule", label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
        { key: "salary", label: "Salary", icon: <DollarSign className="h-4 w-4" /> },
      ];
    } else if (effectiveUser?.role === 'apollo') {
      return allNavItems.filter(item => !item.apolloExcluded && !item.adminOnly);
    } else {
      // Admin gets all items
      return allNavItems;
    }
  }, [effectiveUser?.role]);

  // Update active tab when switching roles
  React.useEffect(() => {
    if (effectiveUser?.role === 'staff' && !['jobs', 'schedule', 'salary'].includes(activeTab)) {
      setActiveTab('jobs');
    }
  }, [effectiveUser?.role, activeTab]);

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "supervisor")) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "admin" && activeTab === "time-tracking") {
      fetchTimeRecords();
    }
  }, [user, activeTab, timeTrackingDateRange]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch data with individual error handling
      const responses = await Promise.allSettled([
        fetch("/api/jobs", { headers }),
        fetch("/api/forms", { headers }),
        fetch("/api/auth/users", { headers }),
        fetch("/api/companies", { headers }),
        fetch("/api/form-submissions", { headers }),
        fetch("/api/jobs/discarded", { headers }),
        fetch("/api/extension-requests", { headers }),
      ]);

      // Handle jobs
      try {
        if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
          const jobsData = await responses[0].value.json();
          setJobs(Array.isArray(jobsData) ? jobsData : []);
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.warn("Failed to fetch jobs:", error);
        setJobs([]);
      }

      // Handle forms
      try {
        if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
          const formsData = await responses[1].value.json();
          setForms(Array.isArray(formsData) ? formsData : []);
        } else {
          setForms([]);
        }
      } catch (error) {
        console.warn("Failed to fetch forms:", error);
        setForms([]);
      }

      // Handle users
      try {
        if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
          const usersData = await responses[2].value.json();
          // For admins, show all users (staff, apollos, supervisors). For others, filter by role
          const filteredUsers = Array.isArray(usersData)
            ? (user?.role === "admin"
                ? usersData.filter((u: UserType) => u.role !== "admin") // Show all except other admins
                : usersData.filter((u: UserType) => u.role === "staff"))
            : [];
          setStaff(filteredUsers);
        } else {
          setStaff([]);
        }
      } catch (error) {
        console.warn("Failed to fetch users:", error);
        setStaff([]);
      }

      // Handle companies
      try {
        if (responses[3].status === 'fulfilled' && responses[3].value.ok) {
          const companiesData = await responses[3].value.json();
          setCompanies(Array.isArray(companiesData) ? companiesData : []);
        } else {
          setCompanies([]);
        }
      } catch (error) {
        console.warn("Failed to fetch companies:", error);
        setCompanies([]);
      }

      // Handle submissions
      try {
        if (responses[4].status === 'fulfilled' && responses[4].value.ok) {
          const submissionsData = await responses[4].value.json();
          setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
        } else {
          setSubmissions([]);
        }
      } catch (error) {
        console.warn("Failed to fetch submissions:", error);
        setSubmissions([]);
      }

      // Handle discarded jobs
      try {
        if (responses[5].status === 'fulfilled' && responses[5].value.ok) {
          const discardedData = await responses[5].value.json();
          setDiscardedJobs(Array.isArray(discardedData) ? discardedData : []);
        } else {
          setDiscardedJobs([]);
        }
      } catch (error) {
        console.warn("Failed to fetch discarded jobs:", error);
        setDiscardedJobs([]);
      }

      // Handle extension requests
      try {
        if (responses[6].status === 'fulfilled' && responses[6].value.ok) {
          const extensionRequestsData = await responses[6].value.json();
          setExtensionRequestsCount(Array.isArray(extensionRequestsData) ? extensionRequestsData.filter(req => req.status === 'pending').length : 0);
        } else {
          setExtensionRequestsCount(0);
        }
      } catch (error) {
        console.warn("Failed to fetch extension requests:", error);
        setExtensionRequestsCount(0);
      }

    } catch (error) {
      console.error("Failed to fetch data:", error);
      // Set fallback empty data
      setJobs([]);
      setForms([]);
      setStaff([]);
      setCompanies([]);
      setSubmissions([]);
      setDiscardedJobs([]);
      setExtensionRequestsCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeRecords = async () => {
    if (!user || user.role !== "admin") return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = new URLSearchParams();
      if (timeTrackingDateRange.startDate) {
        params.append('startDate', timeTrackingDateRange.startDate);
      }
      if (timeTrackingDateRange.endDate) {
        params.append('endDate', timeTrackingDateRange.endDate);
      }

      const response = await fetch(`/api/admin/time-records?${params.toString()}`, { headers });

      if (response.ok) {
        const timeRecordsData = await response.json();
        setTimeRecords(timeRecordsData);
      } else {
        console.error("Failed to fetch time records");
      }
    } catch (error) {
      console.error("Error fetching time records:", error);
    }
  };

  const handleExportTimeRecords = async () => {
    if (!user || user.role !== "admin") return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = new URLSearchParams();
      if (timeTrackingDateRange.startDate) {
        params.append('startDate', timeTrackingDateRange.startDate);
      }
      if (timeTrackingDateRange.endDate) {
        params.append('endDate', timeTrackingDateRange.endDate);
      }

      const response = await fetch(`/api/admin/time-records/export?${params.toString()}`, { headers });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time-records-${timeTrackingDateRange.startDate}-to-${timeTrackingDateRange.endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to export time records");
      }
    } catch (error) {
      console.error("Error exporting time records:", error);
      alert("Error exporting time records");
    }
  };

  // Filter jobs based on search term, staff selection, and effective user role
  const filteredJobs = React.useMemo(() => {
    let filtered = jobs;

    // For staff view, only show jobs assigned to them
    if (effectiveUser?.role === 'staff') {
      filtered = filtered.filter((job) => job.assignedTo === effectiveUser.id);
    } else {
      // Filter by staff selection for admin/apollo
      if (selectedStaffFilter && selectedStaffFilter !== "all") {
        filtered = filtered.filter(
          (job) => job.assignedTo === selectedStaffFilter,
        );
      }
    }

    // Then filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term) ||
          (job.insuredName && job.insuredName.toLowerCase().includes(term)) ||
          (job.claimNo && job.claimNo.toLowerCase().includes(term)) ||
          (job.policyNo && job.policyNo.toLowerCase().includes(term)) ||
          (job.riskAddress && job.riskAddress.toLowerCase().includes(term)) ||
          staff
            .find((s) => s.id === job.assignedTo)
            ?.name.toLowerCase()
            .includes(term),
      );
    }

    return filtered;
  }, [jobs, searchTerm, selectedStaffFilter, staff, effectiveUser]);

  const stats = React.useMemo(() => {
    // For staff view, show only their own job statistics
    if (effectiveUser?.role === 'staff') {
      const staffJobs = jobs.filter((j) => j.assignedTo === effectiveUser.id);
      return {
        totalJobs: staffJobs.length,
        jobsInProgress: staffJobs.filter((j) => j.status === "pending" || j.status === "in_progress").length,
        completedJobs: staffJobs.filter((j) => j.status === "completed").length,
        totalStaff: 1, // Just themselves
        totalForms: forms.length, // They can see all forms
        totalCompanies: companies.length,
      };
    } else {
      // For admin/apollo, show all statistics
      return {
        totalJobs: jobs.length,
        jobsInProgress: jobs.filter((j) => j.status === "pending" || j.status === "in_progress").length,
        completedJobs: jobs.filter((j) => j.status === "completed").length,
        totalStaff: staff.length,
        totalForms: forms.length,
        totalCompanies: companies.length,
      };
    }
  }, [jobs, staff, forms, companies, effectiveUser]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCreateJobFromCalendar = (timeSlot: string, date: Date) => {
    setSelectedJobTime({ time: timeSlot, date });
    setShowCreateJob(true);
  };

  const handleMoveJob = async (
    jobId: string,
    newTime: string,
    newDate: Date,
  ) => {
    try {
      const newDueDate = new Date(newDate);
      const [hours, minutes] = newTime.split(":").map(Number);
      newDueDate.setHours(hours, minutes);

      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ dueDate: newDueDate.toISOString() }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to move job:", error);
    }
  };

  const handleExtendJob = async (jobId: string, duration: number) => {
    // Implementation for extending job duration
    console.log("Extending job", jobId, "by", duration, "minutes");
  };

  const handleUserClick = (user: UserType) => {
    setSelectedUser(user);
    setShowUserManagement(true);
  };

  const handleJobEdit = (job: Job) => {
    setSelectedJob(job);
    setShowJobEdit(true);
  };

  const handleCreateJobWithTime = (
    staffId: string,
    timeSlot: string,
    date: Date,
  ) => {
    // Set the selected time and date for job creation
    const [hours, minutes] = timeSlot.split(":").map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes);

    setSelectedJobTime({
      time: timeSlot,
      date: scheduledDate,
      staffId, // Add staff ID to the selected job time
    });

    // Pre-select the staff member
    setSelectedJob(null); // Clear any existing job
    setShowCreateJob(true);
  };

  const handleCompanyManage = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyManagement(true);
  };

  const handleFormEdit = (form: Form) => {
    setSelectedForm(form);
    setShowFormEdit(true);
  };

  // Email functionality for SP requests
  const handleSendToSP = async (job: Job) => {
    const subject = `${job.underwriter || job.Underwriter || 'Insurance Company'}: ${job.claimNo || job.ClaimNo || 'Claim'}`;
    const body = `Good day.

Please assist with ${job.category || 'service request'} ${job.description ? `- ${job.description}` : ''}

Client: ${job.insuredName || job.InsuredName || 'N/A'} (${job.insCell || job.InsCell || 'Phone not available'})
Address: ${job.riskAddress || job.RiskAddress || 'Address not available'}

Job Reference: ${job.id}
Claim Number: ${job.claimNo || job.ClaimNo || 'N/A'}
Policy Number: ${job.policyNumber || job.PolicyNo || 'N/A'}

Please review and advise.

Best regards,
BBPlumbing Team
🌺 Lilo & Stitch 🌺`;

    try {
      const mailtoLink = `mailto:Yashe@bbplumbing.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      alert('Email prepared and opened in your default email client! 🌺');
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to prepare email. Please try again.');
    }
  };

  const handleFormDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setForms(forms.filter(f => f.id !== formId));
        alert('Form deleted successfully! ����');
      }
    } catch (error) {
      console.error('Failed to delete form:', error);
      alert('Failed to delete form');
    }
  };

  const handleJobDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This will also delete all associated form submissions.')) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setJobs(jobs.filter(j => j.id !== jobId));
        alert('Job deleted successfully! 🌺');
      } else {
        const errorData = await response.text();
        alert(`Failed to delete job: ${errorData}`);
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job');
    }
  };

  const handleJobTimeChange = async (
    jobId: string,
    newStartTime: Date,
    newEndTime: Date,
  ) => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          dueDate: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        console.error("Failed to update job time");
      }
    } catch (error) {
      console.error("Error updating job time:", error);
    }
  };

  const handleJobUpdate = async (jobId: string, updates: Partial<Job>) => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        console.error("Failed to update job");
      }
    } catch (error) {
      console.error("Error updating job:", error);
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJobForProgress(job);
    setShowJobProgress(true);
  };

  const handleJobContextMenu = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    if (user?.role === "admin" || user?.role === "supervisor") {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        job,
      });
    }
  };

  const handleJobDuplicate = (job: Job, newDate: Date) => {
    const duplicatedJob = {
      ...job,
      id: `job-${Date.now()}`,
      dueDate: newDate.toISOString(),
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setJobs((prev) => [...prev, duplicatedJob]);
    setContextMenu({ visible: false, x: 0, y: 0, job: null });
  };

  const handleJobDragToDate = (job: Job, newDate: Date) => {
    const staffJobsOnDate = jobs.filter(
      (j) =>
        j.assignedTo === job.assignedTo &&
        j.dueDate &&
        new Date(j.dueDate).toDateString() === newDate.toDateString(),
    );

    let finalDateTime = new Date(newDate);

    if (staffJobsOnDate.length > 0) {
      const lastJobTime = Math.max(
        ...staffJobsOnDate.map((j) => new Date(j.dueDate!).getTime()),
      );
      finalDateTime = new Date(lastJobTime + 60 * 60 * 1000);
    } else {
      finalDateTime.setHours(9, 0, 0, 0);
    }

    handleJobUpdate(job.id, { dueDate: finalDateTime.toISOString() });
  };

  const handleJobPDFDownload = async (job: Job) => {
    // Get all form submissions for this job
    const jobSubmissions = submissions.filter((sub) => sub.jobId === job.id);

    if (jobSubmissions.length === 0) {
      alert("No forms found for this job to generate PDF");
      return;
    }

    // Show preview modal first
    setSelectedJobForPDF(job);
    setShowPDFPreview(true);
  };

  const handleConfirmPDFDownload = async () => {
    if (!selectedJobForPDF) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Get all form submissions for this job
      const jobSubmissions = submissions.filter((sub) => sub.jobId === selectedJobForPDF.id);

      console.log(`Generating compiled PDF for job ${selectedJobForPDF.id} with ${jobSubmissions.length} submissions`);

      // Call the compiled PDF endpoint that merges all PDFs for this job
      const response = await fetch(`/api/jobs/${selectedJobForPDF.id}/compiled-pdf`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionIds: jobSubmissions.map(sub => sub.id),
          jobTitle: selectedJobForPDF.title,
          claimNumber: selectedJobForPDF.claimNo || selectedJobForPDF.ClaimNo,
          clientName: selectedJobForPDF.insuredName || selectedJobForPDF.InsuredName
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `job-${selectedJobForPDF.id}-compiled-report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log(`Successfully downloaded compiled PDF for job ${selectedJobForPDF.id}`);
      } else {
        // Handle error response safely to avoid "body stream already read" error
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.text();
          errorMessage = errorData || errorMessage;
        } catch (readError) {
          console.warn("Could not read error response body:", readError);
        }
        console.error(
          `Failed to generate compiled PDF (${response.status}):`,
          errorMessage,
        );
        alert(`Failed to generate compiled PDF: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error downloading compiled PDF:", error);
      alert(
        `Error downloading compiled PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleDownloadFormPDF = async (submission: FormSubmission) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/forms/${submission.formId}/submissions/${submission.id}/pdf`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Determine correct PDF name based on form type
        let pdfName;
        const formType = submission.formType || submission.formId;
        if (formType.includes('noncompliance')) {
          pdfName = 'Noncompliance.pdf';
        } else if (formType.includes('material')) {
          pdfName = 'ML.pdf';
        } else {
          pdfName = `${formType}-${submission.jobId}.pdf`;
        }
        a.download = pdfName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.text();
          errorMessage = errorData || errorMessage;
        } catch (readError) {
          console.warn("Could not read error response body:", readError);
        }
        console.error(
          `Failed to download PDF (${response.status}):`,
          errorMessage,
        );
        alert(`Failed to download PDF: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(
        `Error downloading PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleStaffUpdate = (updatedStaff: UserType) => {
    setStaff(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
  };

  const handleStaffDelete = (staffId: string) => {
    setStaff(prev => prev.filter(s => s.id !== staffId));
  };

  const handleJobRemoveFromStaff = async (jobId: string, staffId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Move job to discarded jobs (we'll implement this endpoint later)
      const response = await fetch(`/api/jobs/${jobId}/discard`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: "Removed by admin", previousAssignee: staffId }),
      });

      if (response.ok) {
        // Update local state - remove assignment
        setJobs(prev => prev.map(job =>
          job.id === jobId
            ? { ...job, assignedTo: "", status: "pending" }
            : job
        ));
        alert("Job removed from staff and moved to discarded jobs");
      } else {
        // For now, just update locally if endpoint doesn't exist
        setJobs(prev => prev.map(job =>
          job.id === jobId
            ? { ...job, assignedTo: "", status: "pending" }
            : job
        ));
        alert("Job removed from staff assignment");
      }
    } catch (error) {
      console.error("Error removing job from staff:", error);
      // Fallback to local update
      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? { ...job, assignedTo: "", status: "pending" }
          : job
      ));
      alert("Job removed from staff assignment");
    }
  };

  const handleSendAgain = async (jobId: string, reason: string, additionalNotes?: string, assignTo?: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Create a duplicate job with the send again reason
      const originalJob = jobs.find(j => j.id === jobId);
      if (!originalJob) return;

      // Get reason label for title update
      const reasonLabels = {
        "comeback": "Comeback",
        "reassist": "Re-assist",
        "new-install": "New Install",
        "issue-found": "Issue Found"
      };
      const reasonLabel = reasonLabels[reason as keyof typeof reasonLabels] || reason;

      // Update title and description with selected reason
      const updatedTitle = `${reasonLabel}: ${originalJob.title}`;
      const updatedDescription = `${reasonLabel} - ${originalJob.description}`;

      // Create notes with assignor information
      const assignorNote = `Assigned by: ${user?.name || 'Admin'}`;
      const combinedNotes = [
        assignorNote,
        `Send again reason: ${reasonLabel}`,
        additionalNotes ? `Additional notes: ${additionalNotes}` : '',
        originalJob.notes ? `Original notes: ${originalJob.notes}` : ''
      ].filter(Boolean).join('\n');

      // Transfer all job details and create new job
      const sendAgainData = {
        ...originalJob, // Transfer all original job details
        title: updatedTitle,
        description: updatedDescription,
        assignedTo: assignTo || originalJob.assignedTo,
        status: "pending",
        notes: combinedNotes,
        sendAgainReason: reason,
        sendAgainNotes: additionalNotes,
        originalJobId: jobId,
        sentAgainAt: new Date().toISOString(),
        // Keep all client information for re-adding to client list
        insuredName: originalJob.insuredName || originalJob.InsuredName,
        claimNo: originalJob.claimNo || originalJob.ClaimNo,
        policyNo: originalJob.policyNo || originalJob.PolicyNo,
        riskAddress: originalJob.riskAddress || originalJob.RiskAddress,
        insEmail: originalJob.insEmail || originalJob.Email,
        insCell: originalJob.insCell || originalJob.InsCell,
        // Transfer all other details
        underwriter: originalJob.underwriter || originalJob.Underwriter,
        broker: originalJob.broker || originalJob.Broker,
        excess: originalJob.excess || originalJob.Excess,
        incidentDate: originalJob.incidentDate,
        descriptionOfLoss: originalJob.descriptionOfLoss,
        category: originalJob.category,
        priority: originalJob.priority,
        duration: originalJob.duration,
        // Remove the original ID to create a new job
        id: undefined
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers,
        body: JSON.stringify(sendAgainData),
      });

      if (response.ok) {
        fetchData(); // Refresh data to show new job in the list
        alert(`Job sent again successfully as "${reasonLabel}" with all details transferred`);
      } else {
        alert("Failed to send job again");
      }
    } catch (error) {
      console.error("Error sending job again:", error);
      alert("Error sending job again");
    }
  };

  const handleSmartAssign = async (jobId: string, staffId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          assignedTo: staffId,
          status: "pending",
          assignedAt: new Date().toISOString(),
          assignmentMethod: "smart"
        }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
        const assignedStaff = staff.find(s => s.id === staffId);
        alert(`Job successfully assigned to ${assignedStaff?.name || staffId}`);
      } else {
        alert("Failed to assign job");
      }
    } catch (error) {
      console.error("Error assigning job:", error);
      alert("Error assigning job");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>

        {/* Context Menu for Job Operations */}
        {contextMenu.visible && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() =>
                setContextMenu({ visible: false, x: 0, y: 0, job: null })
              }
            />
            <div
              className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b">
                {contextMenu.job?.title}
              </div>
              <button
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  if (contextMenu.job) {
                    setJobToDuplicate(contextMenu.job);
                    setShowJobDuplication(true);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0, job: null });
                }}
              >
                Duplicate Job for Later Date
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  if (contextMenu.job) {
                    setSelectedJobForProgress(contextMenu.job);
                    setShowJobProgress(true);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0, job: null });
                }}
              >
                View Job Details
              </button>
              {contextMenu.job?.status === "completed" && (
                <button
                  className="w-full px-3 py-2 text-left text-sm text-green-700 hover:bg-green-50"
                  onClick={() => {
                    if (contextMenu.job) {
                      handleJobPDFDownload(contextMenu.job);
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, job: null });
                  }}
                >
                  Download PDF Report
                </button>
              )}
            </div>
          </>
        )}

        {/* Click outside handler */}
        {contextMenu.visible && (
          <div
            className="fixed inset-0 z-30"
            onClick={() =>
              setContextMenu({ visible: false, x: 0, y: 0, job: null })
            }
          />
        )}
      </div>
    );
  }

  return (
    <Background3DProvider>
      {/* 3D Background for admin and apollo only */}
      {(user?.role === "admin" || user?.role === "apollo") && (
        <Background3D enabled={true} className="fixed inset-0" />
      )}

      <div className="min-h-screen relative z-10" style={{ background: (user?.role === "admin" || user?.role === "apollo") ? 'transparent' : undefined }}>

      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">🎨 Edit Mode Active</h2>
            <p className="mb-4">Visual site editing is coming soon! 🌺</p>
            <p className="text-sm text-gray-600 mb-4">
              Features in development:
              <br />��� Drag & drop layout editing
              <br />�� Color customization
              <br />• Size adjustments
              <br />• Emoji & image insertion
              <br />• Tab resizing
            </p>
            <div className="text-4xl mb-4">🌺 Lilo & Stitch 🌺</div>
            <Button onClick={() => setIsEditMode(false)}>
              Exit Edit Mode
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`${(user?.role === "admin" || user?.role === "apollo") ? 'bg-3d-header' : 'bg-white'} shadow-sm border-b sticky top-0 z-40 ${isEditMode ? 'border-4 border-yellow-400' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  JobFlow Admin 🌺
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  Welcome back, {user?.name} {viewAsRole !== 'admin' && `(Viewing as ${viewAsRole === 'staff' ? 'Staff Member' : viewAsRole})`} 🌺
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Search Bar */}
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jobs, staff, forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Desktop buttons */}
              <div className="hidden lg:flex items-center space-x-2">
                {/* View As Controls - Only show for admins */}
                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">View as:</label>
                    <Select value={viewAsRole} onValueChange={(value: 'admin' | 'apollo' | 'staff') => setViewAsRole(value)}>
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="apollo">Apollo</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Edit Mode Toggle - Only show for admins */}
                {user?.role === 'admin' && (
                  <Button
                    variant={isEditMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>{isEditMode ? 'Exit Edit' : 'Edit Site'}</span>
                    <span>🎨</span>
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={logout}>
                  <span>Logout</span>
                </Button>
                <div className="relative ml-4">
                  <div className="bg-gradient-to-r from-red-500 to-amber-500 p-2 rounded-full shadow-lg">
                    <div className="relative">
                      <Wrench className="h-6 w-6 text-white" />
                      <Zap className="h-3 w-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile menu */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-4">
                    {/* Mobile Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search jobs, staff, forms..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* View As Controls - Mobile */}
                    {user?.role === 'admin' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">View as:</label>
                        <Select value={viewAsRole} onValueChange={(value: 'admin' | 'apollo' | 'staff') => setViewAsRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="apollo">Apollo</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Edit Mode Toggle - Mobile */}
                    {user?.role === 'admin' && (
                      <Button
                        variant={isEditMode ? "default" : "outline"}
                        onClick={() => {
                          setIsEditMode(!isEditMode);
                          setIsMenuOpen(false);
                        }}
                        className="justify-start"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        <span>{isEditMode ? 'Exit Edit' : 'Edit Site'}</span>
                        <span className="ml-1">🎨</span>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="justify-start text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <span>Logout</span>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Overview - Clickable */}
        <div className={`grid gap-3 sm:gap-6 mb-6 sm:mb-8 ${
          effectiveUser?.role === "staff"
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3"
            : effectiveUser?.role === "apollo"
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
        }`}>
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowCompletedModal(true)}
          >
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Completed Jobs
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.completedJobs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowJobsModal(true)}
          >
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Jobs
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.totalJobs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowPendingModal(true)}
          >
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 sm:h-12 sm:w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Jobs in Progress
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.jobsInProgress}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowStaffModal(true)}
          >
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    {effectiveUser?.role === 'staff' ? 'My Profile' : 'Staff Members'}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.totalStaff}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {effectiveUser?.role !== "apollo" && effectiveUser?.role !== "staff" && (
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setShowFormsModal(true)}
            >
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      Active Forms
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {stats.totalForms}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extension Requests Card - Admin Only */}
          {effectiveUser?.role === "admin" && (
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow relative"
              onClick={() => setShowExtensionRequests(true)}
            >
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 sm:h-12 sm:w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      Extension Requests
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {extensionRequestsCount}
                    </p>
                  </div>
                  {extensionRequestsCount > 0 && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-red-500 text-white px-2 py-1 text-xs">
                        {extensionRequestsCount}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Responsive Navigation */}
          <ResponsiveNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            navItems={navItems}
            userRole={effectiveUser?.role || ""}
          />



          {/* Jobs Tab */}
          <TabsContent key="jobs-content" value="jobs">
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                  <CardTitle className="text-lg sm:text-xl">
                    {effectiveUser?.role === 'staff' ? 'My Jobs' : 'Job Management'}
                  </CardTitle>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                    {effectiveUser?.role !== 'staff' && (
                      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                        {(user?.role === "admin" ||
                          user?.role === "supervisor") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowStaffViewPortal(true)}
                            className="w-full sm:w-auto"
                          >
                            <User className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">View as Staff</span>
                            <span className="sm:hidden">Staff View</span>
                          </Button>
                        )}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => setShowCreateJob(true)}
                            className="flex-1 sm:flex-none"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Quick Create</span>
                            <span className="sm:hidden">Create</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCalendarJobCreation(true)}
                            className="flex-1 sm:flex-none"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Schedule Job</span>
                            <span className="sm:hidden">Schedule</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* View Toggle and Staff Filter */}
                <div className="mb-4 flex flex-col space-y-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:space-y-0">
                  <div className="flex space-x-2">
                    <Button
                      variant={jobView === "calendar" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setJobView("calendar")}
                      className="flex-1 sm:flex-none"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Calendar View</span>
                      <span className="sm:hidden">Calendar</span>
                    </Button>
                    <Button
                      variant={jobView === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setJobView("list")}
                      className="flex-1 sm:flex-none"
                    >
                      <List className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">List View</span>
                      <span className="sm:hidden">List</span>
                    </Button>
                  </div>

                  {effectiveUser?.role !== 'staff' && (
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                      <label className="text-sm font-medium">
                        Staff Member:
                      </label>
                      <Select
                        value={selectedStaffFilter}
                        onValueChange={(value) => {
                          setSelectedStaffFilter(value);
                          setSelectedStaff(value === "all" ? "" : value);
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="All Staff" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="all-staff" value="all">
                            All Staff Members
                          </SelectItem>
                          {staff.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Calendar View */}
                {jobView === "calendar" && (
                  <div className="mb-6">
                    <StaffCalendarView
                      jobs={jobs}
                      staff={staff}
                      currentUser={user}
                      showAllStaff={true}
                      selectedStaff={selectedStaff}
                      onStaffSelect={setSelectedStaff}
                      onJobUpdate={handleJobUpdate}
                      onJobTimeChange={(jobId, newStartTime, newEndTime) => {
                        handleJobUpdate(jobId, {
                          dueDate: newStartTime.toISOString(),
                        });
                      }}
                      onCreateJob={(staffId, timeSlot, date) => {
                        const [hours, minutes] = timeSlot
                          .split(":")
                          .map(Number);
                        const jobDateTime = new Date(date);
                        jobDateTime.setHours(hours, minutes, 0, 0);
                        setSelectedJobTime({
                          date: jobDateTime,
                          time: timeSlot,
                        });
                        setShowCreateJob(true);
                      }}
                      onJobClick={handleJobClick}
                      onJobEdit={handleJobEdit}
                    />
                  </div>
                )}

                {/* List View */}
                {jobView === "list" && (
                  <JobListView
                    jobs={filteredJobs}
                    staff={staff}
                    user={user}
                    effectiveUser={effectiveUser}
                    searchTerm={searchTerm}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    handleJobEdit={handleJobEdit}
                    handleJobPDFDownload={handleJobPDFDownload}
                    handleJobContextMenu={handleJobContextMenu}
                    setSelectedJobForTimeEdit={setSelectedJobForTimeEdit}
                    setShowJobTimeEditor={setShowJobTimeEditor}
                    setSelectedJobForAssignment={setSelectedJobForAssignment}
                    setShowSmartAssignment={setShowSmartAssignment}
                    setSelectedJobForSendAgain={setSelectedJobForSendAgain}
                    setShowSendAgain={setShowSendAgain}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forms Tab */}
          {user?.role !== "apollo" && (
            <TabsContent key="forms-content" value="forms">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Form Management</CardTitle>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => setShowCreateForm(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Form
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPDFFormGenerator(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate from PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowFormVariableViewer(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        View Variables
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Material Forms Templates Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-blue-600" />
                        Material Forms Templates
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Material List Template */}
                        <div className="border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors border-blue-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <Package className="h-6 w-6 text-blue-600 mr-3" />
                              <div>
                                <h4 className="font-medium text-blue-900">
                                  Material List
                                </h4>
                                <p className="text-sm text-blue-600">
                                  Complete material tracking
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800"
                            >
                              Template
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            Track standard items, sizes, manufacturers,
                            quantities requested vs used
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => {
                                if (jobs.length > 0) {
                                  // Open material list for first available job as template
                                  setSelectedJobForProgress(jobs[0]);
                                  setShowJobProgress(true);
                                }
                              }}
                            >
                              <Package className="h-3 w-3 mr-1" />
                              Use Template
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setEditingTemplateType("material-list");
                                setShowTemplateEditor(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Non Compliance Template */}
                        <div className="border rounded-lg p-4 hover:bg-red-50 cursor-pointer transition-colors border-red-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                              <div>
                                <h4 className="font-medium text-red-900">
                                  Non Compliance
                                </h4>
                                <p className="text-sm text-red-600">
                                  33-question compliance form
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-red-100 text-red-800"
                            >
                              Template
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            Comprehensive compliance assessment from cold vacuum
                            breaker to pipe types
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-red-600 hover:bg-red-700"
                              onClick={() => {
                                if (jobs.length > 0) {
                                  // Open non-compliance form for first available job as template
                                  setSelectedJobForProgress(jobs[0]);
                                  setShowJobProgress(true);
                                }
                              }}
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Use Template
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setEditingTemplateType("noncompliance");
                                setShowTemplateEditor(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Enhanced Liability Template */}
                        <div className="border rounded-lg p-4 hover:bg-green-50 cursor-pointer transition-colors border-green-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <Shield className="h-6 w-6 text-green-600 mr-3" />
                              <div>
                                <h4 className="font-medium text-green-900">
                                  Enhanced Liability
                                </h4>
                                <p className="text-sm text-green-600">
                                  Before/after assessment
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              Template
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            8 primary assessment items, 7 before/after
                            comparison sections
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                if (jobs.length > 0) {
                                  // Open liability form for first available job as template
                                  setSelectedJobForProgress(jobs[0]);
                                  setShowJobProgress(true);
                                }
                              }}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Use Template
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setEditingTemplateType("liability");
                                setShowTemplateEditor(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Standard Forms Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-600" />
                        Standard Forms
                      </h3>
                      <div className="space-y-4">
                        {forms.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No forms found. Create your first form to get
                            started.
                          </div>
                        ) : (
                          forms.map((form) => (
                            <div
                              key={form.id}
                              className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleFormEdit(form)}
                              title="Click to view and edit form details"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-2">
                                  {form.id === "material-list-form" && (
                                    <Package className="h-5 w-5 text-blue-600" />
                                  )}
                                  {form.id === "noncompliance-form" && (
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                  )}
                                  {form.id === "enhanced-liability-form" && (
                                    <Shield className="h-5 w-5 text-green-600" />
                                  )}
                                  <div>
                                    <h3 className="font-medium">{form.name}</h3>
                                    <p className="text-sm text-gray-600">
                                      {form.description}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {form.fields.length} fields
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  {form.isTemplate && (
                                    <Badge variant="secondary">Template</Badge>
                                  )}
                                  <Badge variant="outline">
                                    {form.restrictedToCompanies?.length === 0
                                      ? "All Companies"
                                      : `${form.restrictedToCompanies?.length || 0} Companies`}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Job-Sectioned Forms Display */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Forms by Job</h3>
                    <div className="space-y-4">
                      {jobs.map((job) => {
                        const jobSubmissions = submissions.filter(
                          (sub) => sub.jobId === job.id,
                        );
                        if (jobSubmissions.length === 0) return null;

                        return (
                          <Card
                            key={job.id}
                            className="border-l-4 border-l-blue-500"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    {job.title}
                                  </CardTitle>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="outline">
                                      {job.claimNo || job.ClaimNo}
                                    </Badge>
                                    <Badge
                                      variant={
                                        job.status === "completed"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {job.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right text-sm text-gray-600">
                                  <div>{job.insuredName || job.InsuredName}</div>
                                  <div>
                                    {new Date(
                                      job.scheduledDate,
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm">
                                  Form Submissions ({jobSubmissions.length})
                                </h4>
                                <div className="grid gap-2">
                                  {jobSubmissions.map((submission) => (
                                    <div
                                      key={submission.id}
                                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex items-center gap-3">
                                        {submission.formId === "material-list-form" ? (
                                          <Package className="h-4 w-4 text-blue-600" />
                                        ) : submission.formId === "noncompliance-form" ? (
                                          <AlertCircle className="h-4 w-4 text-red-600" />
                                        ) : (
                                          <FileText className="h-4 w-4 text-gray-600" />
                                        )}
                                        <div>
                                          <div className="font-medium text-sm">
                                            {submission.formId ===
                                            "noncompliance-form"
                                              ? "Noncompliance Form"
                                              : submission.formId ===
                                                  "material-list-form"
                                                ? "Material List"
                                                : forms.find(
                                                    (f) =>
                                                      f.id ===
                                                      submission.formId,
                                                  )?.name || "Unknown Form"}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            Submitted:{" "}
                                            {new Date(
                                              submission.submissionDate,
                                            ).toLocaleDateString()}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleDownloadFormPDF(submission)
                                          }
                                          className="text-xs"
                                        >
                                          Download PDF
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-xs"
                                          onClick={() => {
                                            setSelectedFormSubmission(submission);
                                            setShowAdminPopulatedPDFViewer(true);
                                          }}
                                        >
                                          View Details
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {jobs.filter((job) =>
                        submissions.some((sub) => sub.jobId === job.id),
                      ).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No form submissions found for any jobs yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Staff Tab - Only for staff and supervisors */}
          <TabsContent key="staff-content" value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <p className="text-sm text-gray-600">
                  {user?.role === "supervisor"
                    ? "View and manage staff (limited permissions)"
                    : "View and manage staff members"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div
                      key={member.id}
                      className="border rounded-lg p-4 flex justify-between items-center hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedStaffMember(member);
                        setShowStaffDetail(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          member.role === "apollo" ? "bg-purple-100" :
                          member.role === "supervisor" ? "bg-orange-100" :
                          "bg-blue-100"
                        }`}>
                          <User className={`h-6 w-6 ${
                            member.role === "apollo" ? "text-purple-600" :
                            member.role === "supervisor" ? "text-orange-600" :
                            "text-blue-600"
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium">{member.name}</h3>
                          <p className="text-sm text-gray-600">
                            {member.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{member.username}
                          </p>
                          {member.location && (
                            <p className="text-xs text-gray-500">
                              �� {member.location.city}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge
                          variant="outline"
                          className={
                            member.role === "apollo" ? "border-purple-300 text-purple-700" :
                            member.role === "supervisor" ? "border-orange-300 text-orange-700" :
                            "border-blue-300 text-blue-700"
                          }
                        >
                          {member.role}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          {`${jobs.filter((j) => j.assignedTo === member.id).length} active jobs`}
                        </p>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              member.role === "apollo" ? "bg-purple-600" :
                              member.role === "supervisor" ? "bg-orange-600" :
                              "bg-blue-600"
                            }`}
                            style={{
                              width: `${Math.min(100, (jobs.filter((j) => j.assignedTo === member.id && j.status === "completed").length / Math.max(1, jobs.filter((j) => j.assignedTo === member.id).length)) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-green-600">
                          {`${jobs.filter((j) => j.assignedTo === member.id && j.status === "completed").length} completed`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab - Restricted for supervisors */}
          {user?.role !== "apollo" && (
            <TabsContent key="companies-content" value="companies">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Company Management</CardTitle>
                    {user?.role === "admin" ? (
                      <Button
                        size="sm"
                        onClick={() => setShowCreateCompany(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Company
                      </Button>
                    ) : (
                      <Badge variant="secondary">View Only</Badge>
                    )}
                  </div>
                  {user?.role === "supervisor" && (
                    <p className="text-sm text-amber-600">
                      You have read-only access to company information
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {companies.map((company) => (
                      <div
                        key={company.id}
                        className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleCompanyManage(company)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{company.name}</h3>
                            <p className="text-sm text-gray-600">
                              {`${jobs.filter((j) => j.companyId === company.id).length} active jobs`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompanyManage(company);
                          }}
                        >
                          Manage
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Discarded Jobs Tab */}
          {user?.role === "admin" && (
            <TabsContent key="discarded-jobs-content" value="discarded-jobs">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Discarded Jobs Management</CardTitle>
                    <Badge variant="outline">
                      {discardedJobs.length} discarded jobs
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Manage jobs that have been removed from staff assignments
                  </p>
                </CardHeader>
                <CardContent>
                  {discardedJobs.length === 0 ? (
                    <div className="text-center py-12">
                      <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Discarded Jobs
                      </h3>
                      <p className="text-gray-600">
                        Jobs removed from staff assignments will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {discardedJobs.map((discardedJob) => (
                        <div key={discardedJob.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-lg">{discardedJob.originalJob.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {discardedJob.originalJob.insuredName || discardedJob.originalJob.InsuredName}
                              </p>
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline">{discardedJob.originalJob.claimNo || discardedJob.originalJob.ClaimNo}</Badge>
                                <span className="text-xs text-gray-500">
                                  Discarded: {new Date(discardedJob.discardedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                <strong>Reason:</strong> {discardedJob.reason}
                              </p>
                              {discardedJob.previousAssignee && (
                                <p className="text-sm text-gray-700">
                                  <strong>Previously assigned to:</strong> {
                                    staff.find(s => s.id === discardedJob.previousAssignee)?.name || discardedJob.previousAssignee
                                  }
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // TODO: Open job assignment modal
                                  console.log("Reassign job:", discardedJob.id);
                                  alert("Job reassignment modal will be implemented");
                                }}
                              >
                                <Users className="h-4 w-4 mr-1" />
                                Reassign
                              </Button>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem("auth_token");
                                    const response = await fetch(`/api/jobs/discarded/${discardedJob.id}/reinvoke`, {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                      },
                                      body: JSON.stringify({
                                        reason: "Reinvoked by admin"
                                      }),
                                    });

                                    if (response.ok) {
                                      fetchData(); // Refresh all data
                                      alert("Job reinvoked successfully");
                                    } else {
                                      alert("Failed to reinvoke job");
                                    }
                                  } catch (error) {
                                    console.error("Error reinvoking job:", error);
                                    alert("Error reinvoking job");
                                  }
                                }}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reinvoke
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                  if (confirm("Are you sure you want to permanently delete this discarded job?")) {
                                    try {
                                      const token = localStorage.getItem("auth_token");
                                      const response = await fetch(`/api/jobs/discarded/${discardedJob.id}`, {
                                        method: "DELETE",
                                        headers: {
                                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                        },
                                      });

                                      if (response.ok) {
                                        fetchData(); // Refresh all data
                                        alert("Discarded job deleted permanently");
                                      } else {
                                        alert("Failed to delete discarded job");
                                      }
                                    } catch (error) {
                                      console.error("Error deleting discarded job:", error);
                                      alert("Error deleting discarded job");
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Schedule Tab */}
          <TabsContent key="schedule-content" value="schedule">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Staff Schedule Management
                </h2>
                {user?.role === "admin" && (
                  <Button
                    onClick={() => setShowEnhancedShiftManagement(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Enhanced Shift Management
                  </Button>
                )}
              </div>
              <StaffScheduleManager
                jobs={jobs}
                staff={staff}
                currentUser={user!}
              />
            </div>
          </TabsContent>

          {/* Salary Tab */}
          <TabsContent key="salary-content" value="salary">
            <StaffSalaryTracker jobs={jobs} staff={staff} currentUser={user!} />
          </TabsContent>

          {/* Materials Tab */}
          {user?.role !== "apollo" && (
            <TabsContent key="materials-content" value="materials">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Materials & Advanced Forms Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="material-lists" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger
                          key="material-lists"
                          value="material-lists"
                        >
                          Material Lists
                        </TabsTrigger>
                        <TabsTrigger key="noncompliance" value="noncompliance">
                          Noncompliance Forms
                        </TabsTrigger>
                        <TabsTrigger key="liability" value="liability">
                          Enhanced Liability
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent
                        key="material-lists-content"
                        value="material-lists"
                        className="mt-6"
                      >
                        {jobs.length > 0 ? (
                          <MaterialListManager
                            job={jobs[0]}
                            onMaterialListSave={(materialList) => {
                              console.log("Material list saved:", materialList);
                              // In real implementation: save to backend
                            }}
                          />
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Select a job to manage materials
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent
                        key="noncompliance-content"
                        value="noncompliance"
                        className="mt-6"
                      >
                        {jobs.length > 0 ? (
                          <NoncomplianceForm
                            job={jobs[0]}
                            assignedStaff={
                              staff.find((s) => s.id === jobs[0].assignedTo) ||
                              null
                            }
                            onSubmit={(formData) => {
                              console.log(
                                "Noncompliance form submitted:",
                                formData,
                              );
                              // In real implementation: save to backend
                            }}
                          />
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Select a job to create noncompliance form
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent
                        key="liability-content"
                        value="liability"
                        className="mt-6"
                      >
                        {jobs.length > 0 ? (
                          <EnhancedLiabilityForm
                            job={jobs[0]}
                            assignedStaff={
                              staff.find((s) => s.id === jobs[0].assignedTo) ||
                              null
                            }
                            onSubmit={(formData) => {
                              console.log(
                                "Enhanced liability form submitted:",
                                formData,
                              );
                              // In real implementation: save to backend
                            }}
                          />
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Select a job to create enhanced liability form
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Clients Tab */}
          <TabsContent key="clients-content" value="clients">
            <ClientManagement jobs={jobs} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent key="analytics-content" value="analytics">
            <div className="space-y-6">
              <AnalyticsDashboard jobs={jobs} staff={staff} />
              <MongoSyncStatus />
            </div>
          </TabsContent>

          {/* Admin Forms Tab - Only for admins, not apollos */}
          {user?.role === "admin" && (
            <TabsContent key="time-tracking-content" value="time-tracking">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Time Tracking Records
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={handleExportTimeRecords}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button
                        onClick={fetchTimeRecords}
                        variant="outline"
                        size="sm"
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">Start Date:</label>
                      <Input
                        type="date"
                        value={timeTrackingDateRange.startDate}
                        onChange={(e) =>
                          setTimeTrackingDateRange(prev => ({
                            ...prev,
                            startDate: e.target.value
                          }))
                        }
                        className="w-auto"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">End Date:</label>
                      <Input
                        type="date"
                        value={timeTrackingDateRange.endDate}
                        onChange={(e) =>
                          setTimeTrackingDateRange(prev => ({
                            ...prev,
                            endDate: e.target.value
                          }))
                        }
                        className="w-auto"
                      />
                    </div>
                    <Button
                      onClick={fetchTimeRecords}
                      size="sm"
                    >
                      Apply Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {timeRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No time records found for the selected date range.</p>
                      <p className="text-sm">Try adjusting the date range or check if staff have logged time.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">
                                {timeRecords.length}
                              </p>
                              <p className="text-sm text-gray-600">Total Records</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">
                                {new Set(timeRecords.map(r => r.staffId)).size}
                              </p>
                              <p className="text-sm text-gray-600">Active Staff</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-600">
                                {timeRecords.reduce((total, record) =>
                                  total + record.jobLogs.length, 0
                                )}
                              </p>
                              <p className="text-sm text-gray-600">Jobs Completed</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-orange-600">
                                {Math.round(
                                  timeRecords.reduce((total, record) =>
                                    total + (record.totalWorkHours || 0), 0
                                  ) * 10
                                ) / 10}h
                              </p>
                              <p className="text-sm text-gray-600">Total Hours</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Time Records Table */}
                      <div className="space-y-4">
                        {timeRecords.map((record, index) => (
                          <Card key={`${record.staffId}-${record.date}`} className="overflow-hidden">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-semibold">{record.staffName}</h3>
                                  <p className="text-sm text-gray-600">
                                    {new Date(record.date).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  {record.totalWorkHours && (
                                    <Badge variant="outline" className="text-lg px-3 py-1">
                                      {record.totalWorkHours}h
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Check In/Out Times */}
                                <div>
                                  <h4 className="font-medium mb-3">Check In/Out</h4>
                                  <div className="space-y-2">
                                    {record.checkInTime && (
                                      <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg">
                                        <span className="text-sm font-medium text-green-800">Check In</span>
                                        <span className="text-sm text-green-600">
                                          {new Date(record.checkInTime).toLocaleTimeString()}
                                        </span>
                                      </div>
                                    )}
                                    {record.checkOutTime && (
                                      <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg">
                                        <span className="text-sm font-medium text-red-800">Check Out</span>
                                        <span className="text-sm text-red-600">
                                          {new Date(record.checkOutTime).toLocaleTimeString()}
                                        </span>
                                      </div>
                                    )}
                                    {!record.checkInTime && !record.checkOutTime && (
                                      <p className="text-sm text-gray-500 italic">No check-in/out records</p>
                                    )}
                                  </div>
                                </div>

                                {/* Job Activities */}
                                <div>
                                  <h4 className="font-medium mb-3">Job Activities ({record.jobLogs.length})</h4>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {record.jobLogs.length === 0 ? (
                                      <p className="text-sm text-gray-500 italic">No job activities</p>
                                    ) : (
                                      record.jobLogs.map((jobLog, jobIndex) => (
                                        <div key={jobIndex} className="py-2 px-3 bg-blue-50 rounded-lg">
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-blue-800">
                                              {jobLog.jobTitle}
                                            </span>
                                            {jobLog.duration && (
                                              <Badge variant="secondary" className="text-xs">
                                                {jobLog.duration}min
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex justify-between items-center mt-1 text-xs text-blue-600">
                                            <span>
                                              Start: {new Date(jobLog.startTime).toLocaleTimeString()}
                                            </span>
                                            {jobLog.endTime && (
                                              <span>
                                                End: {new Date(jobLog.endTime).toLocaleTimeString()}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {user?.role === "admin" && user?.role !== "apollo" && (
            <TabsContent key="admin-forms-content" value="admin-forms">
              <AdminFormManager currentUser={user} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Modals */}
      <CreateJobModal
        open={showCreateJob}
        onOpenChange={(open) => {
          setShowCreateJob(open);
          if (!open) setSelectedJobTime(null);
        }}
        onJobCreated={fetchData}
        selectedJobTime={selectedJobTime}
      />

      <CreateFormModal
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onFormCreated={fetchData}
      />

      <CreateCompanyModal
        open={showCreateCompany}
        onOpenChange={setShowCreateCompany}
        onCompanyCreated={fetchData}
      />

      <StaffProfileModal
        open={showUserManagement}
        onOpenChange={setShowUserManagement}
        staffMember={selectedUser}
        jobs={jobs}
        onProfileUpdated={fetchData}
      />

      <JobEditModal
        open={showJobEdit}
        onOpenChange={(open) => {
          setShowJobEdit(open);
          if (!open) setSelectedJob(null);
        }}
        job={selectedJob}
        onJobUpdated={fetchData}
      />

      <JobCreationCalendarModal
        open={showCalendarJobCreation}
        onOpenChange={setShowCalendarJobCreation}
        staff={staff}
        jobs={jobs}
        onCreateJobWithTime={handleCreateJobWithTime}
      />

      <CompanyManagementModal
        open={showCompanyManagement}
        onOpenChange={(open) => {
          setShowCompanyManagement(open);
          if (!open) setSelectedCompany(null);
        }}
        company={selectedCompany}
        onCompanyUpdated={fetchData}
      />

      <FormEditModal
        open={showFormEdit}
        onOpenChange={(open) => {
          setShowFormEdit(open);
          if (!open) setSelectedForm(null);
        }}
        form={selectedForm}
        onFormUpdated={fetchData}
        isAdmin={user?.role === "admin"}
      />

      <PDFFormGenerator
        open={showPDFFormGenerator}
        onOpenChange={setShowPDFFormGenerator}
        onFormCreated={fetchData}
      />

      <DeletionConfirmModal
        open={showDeletionConfirm}
        onOpenChange={setShowDeletionConfirm}
        title={`Delete ${deletionItem?.type === "staff" ? "Staff Member" : "Company"}`}
        description={`You are about to permanently delete this ${deletionItem?.type}. This action cannot be undone and may affect existing jobs and data.`}
        itemName={deletionItem?.name || ""}
        onConfirm={async () => {
          if (!deletionItem) return;

          const token = localStorage.getItem("auth_token");
          const headers: Record<string, string> = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const endpoint =
            deletionItem.type === "staff"
              ? `/api/auth/users/${deletionItem.id}`
              : `/api/companies/${deletionItem.id}`;

          const response = await fetch(endpoint, {
            method: "DELETE",
            headers,
          });

          if (response.ok) {
            fetchData();
          } else {
            throw new Error("Failed to delete");
          }
        }}
      />

      <JobTimeEditor
        open={showJobTimeEditor}
        onOpenChange={(open) => {
          setShowJobTimeEditor(open);
          if (!open) setSelectedJobForTimeEdit(null);
        }}
        job={selectedJobForTimeEdit}
        onJobUpdated={fetchData}
      />

      <JobProgressModal
        job={selectedJobForProgress}
        isOpen={showJobProgress}
        onClose={() => {
          setShowJobProgress(false);
          setSelectedJobForProgress(null);
        }}
        staff={staff}
      />

      <EnhancedShiftManagement
        open={showEnhancedShiftManagement}
        onOpenChange={setShowEnhancedShiftManagement}
        staff={staff}
        currentUser={user!}
        onShiftUpdate={(assignments) => {
          console.log("Shift assignments updated:", assignments);
          // In real implementation: save to backend
          fetchData(); // Refresh data
        }}
      />

      <StaffViewPortal
        open={showStaffViewPortal}
        onOpenChange={setShowStaffViewPortal}
        jobs={jobs}
        staff={staff}
        currentUser={user}
      />

      <JobDuplicationModal
        open={showJobDuplication}
        onOpenChange={setShowJobDuplication}
        job={jobToDuplicate}
        staff={staff}
        onDuplicate={(originalJob, newDate, newStaffId) => {
          const duplicatedJob = {
            ...originalJob,
            id: `job-${Date.now()}`,
            dueDate: newDate.toISOString(),
            assignedTo: newStaffId || originalJob.assignedTo,
            status: "pending" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setJobs((prev) => [...prev, duplicatedJob]);
          setJobToDuplicate(null);
        }}
      />

      <AdminPDFManagement
        open={showAdminPDFManagement}
        onOpenChange={setShowAdminPDFManagement}
      />

      {/* Form Variable Viewer Modal */}
      {showFormVariableViewer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto">
            <FormVariableViewer
              onClose={() => setShowFormVariableViewer(false)}
            />
          </div>
        </div>
      )}

      <MaterialFormTemplateEditor
        open={showTemplateEditor}
        onOpenChange={setShowTemplateEditor}
        templateType={editingTemplateType}
        onSave={(template) => {
          console.log("Template saved:", template);
          // TODO: Save template to backend
        }}
      />

      <StaffDetailModal
        open={showStaffDetail}
        onOpenChange={(open) => {
          setShowStaffDetail(open);
          if (!open) setSelectedStaffMember(null);
        }}
        staff={selectedStaffMember}
        jobs={jobs}
        onStaffUpdate={handleStaffUpdate}
        onStaffDelete={handleStaffDelete}
        onJobRemove={handleJobRemoveFromStaff}
      />

      <SendAgainModal
        open={showSendAgain}
        onOpenChange={(open) => {
          setShowSendAgain(open);
          if (!open) setSelectedJobForSendAgain(null);
        }}
        job={selectedJobForSendAgain}
        onSendAgain={handleSendAgain}
        availableStaff={staff}
      />

      <SmartJobAssignmentModal
        open={showSmartAssignment}
        onOpenChange={(open) => {
          setShowSmartAssignment(open);
          if (!open) setSelectedJobForAssignment(null);
        }}
        job={selectedJobForAssignment}
        availableStaff={staff}
        allJobs={jobs}
        onAssignJob={handleSmartAssign}
      />

      <ExtensionRequestsModal
        open={showExtensionRequests}
        onOpenChange={setShowExtensionRequests}
        onRequestsUpdated={fetchData}
      />

      {/* Total Jobs Modal */}
      <Dialog open={showJobsModal} onOpenChange={setShowJobsModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Jobs ({jobs.length})</DialogTitle>
            <DialogDescription>
              Manage and view all jobs in the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card key={job.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">{job.title}</span>
                          <Badge variant={job.status === 'completed' ? 'default' : job.status === 'in_progress' ? 'secondary' : 'outline'}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant={job.priority === 'high' ? 'destructive' : job.priority === 'medium' ? 'secondary' : 'outline'}>
                            {job.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Assigned to:</strong> {staff.find(s => s.id === job.assignedTo)?.name || 'Unknown'}</div>
                          <div><strong>Due:</strong> {job.dueDate ? new Date(job.dueDate).toLocaleString() : 'Not set'}</div>
                          <div><strong>Client:</strong> {job.insuredName || job.InsuredName || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button size="sm" variant="secondary" onClick={() => handleSendToSP(job)} title="Send to Service Provider">
                          <Send className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">SP</span>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedJob(job);
                          setShowJobEdit(true);
                          setShowJobsModal(false);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleJobDelete(job.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Jobs in Progress Modal */}
      <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Jobs in Progress ({jobs.filter(j => j.status === 'pending' || j.status === 'in_progress').length})</DialogTitle>
            <DialogDescription>
              View and manage jobs that are currently in progress or pending
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              {jobs.filter(job => job.status === 'pending' || job.status === 'in_progress').map((job) => (
                <Card key={job.id} className="border border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium">{job.title}</span>
                          <Badge variant="outline" className={job.status === 'pending' ? "border-yellow-600 text-yellow-600" : "border-blue-600 text-blue-600"}>
                            {job.status === 'pending' ? 'Pending' : 'In Progress'}
                          </Badge>
                          <Badge variant={job.priority === 'high' ? 'destructive' : job.priority === 'medium' ? 'secondary' : 'outline'}>
                            {job.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Assigned to:</strong> {staff.find(s => s.id === job.assignedTo)?.name || 'Unknown'}</div>
                          <div><strong>Due:</strong> {job.dueDate ? new Date(job.dueDate).toLocaleString() : 'Not set'}</div>
                          <div><strong>Client:</strong> {job.insuredName || job.InsuredName || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button size="sm" variant="secondary" onClick={() => handleSendToSP(job)} title="Send to Service Provider">
                          <Send className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">SP</span>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedJob(job);
                          setShowJobEdit(true);
                          setShowPendingModal(false);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleJobDelete(job.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Members Modal */}
      <Dialog open={showStaffModal} onOpenChange={setShowStaffModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Staff Members ({staff.length})</DialogTitle>
            <DialogDescription>
              Manage and view all staff members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              {staff.map((member) => (
                <Card key={member.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-green-600" />
                          <span className="font-medium">{member.name}</span>
                          <Badge variant={member.role === 'admin' ? 'destructive' : member.role === 'supervisor' ? 'secondary' : 'outline'}>
                            {member.role}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Email:</strong> {member.email}</div>
                          <div><strong>Phone:</strong> {member.phone || 'Not set'}</div>
                          <div><strong>Location:</strong> {member.location?.city || 'Not set'}</div>
                          <div><strong>Jobs Assigned:</strong> {jobs.filter(j => j.assignedTo === member.id).length}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedUser(member);
                          setShowUserManagement(true);
                          setShowStaffModal(false);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                          setDeletionItem({ type: 'staff', id: member.id, name: member.name });
                          setShowDeletionConfirm(true);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completed Jobs Modal */}
      <Dialog open={showCompletedModal} onOpenChange={setShowCompletedModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Completed Jobs ({jobs.filter(j => j.status === 'completed').length})</DialogTitle>
            <DialogDescription>
              View and manage jobs that have been completed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              {jobs.filter(job => job.status === 'completed').map((job) => (
                <Card key={job.id} className="border border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-5 w-5 text-green-600" />
                          <span className="font-medium">{job.title}</span>
                          <Badge variant="default" className="bg-green-600 text-white">
                            Completed
                          </Badge>
                          <Badge variant={job.priority === 'high' ? 'destructive' : job.priority === 'medium' ? 'secondary' : 'outline'}>
                            {job.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Assigned to:</strong> {staff.find(s => s.id === job.assignedTo)?.name || 'Unknown'}</div>
                          <div><strong>Completed:</strong> {job.dueDate ? new Date(job.dueDate).toLocaleString() : 'Unknown'}</div>
                          <div><strong>Client:</strong> {job.insuredName || job.InsuredName || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => handleJobPDFDownload(job)} className="text-green-600 border-green-600 hover:bg-green-100">
                          <FileText className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Download PDF</span>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedJob(job);
                          setShowJobEdit(true);
                          setShowCompletedModal(false);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Forms Modal */}
      <Dialog open={showFormsModal} onOpenChange={setShowFormsModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submitted Forms ({submissions.length}) 🌺 Lilo & Stitch</DialogTitle>
            <DialogDescription>
              View and manage forms that have been submitted by staff
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              {forms.map((form) => (
                <Card key={form.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">{form.name}</span>
                          <Badge variant={form.isTemplate ? 'secondary' : 'outline'}>
                            {form.isTemplate ? 'Template' : 'Form'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Fields:</strong> {form.fields.length}</div>
                          <div><strong>Type:</strong> {form.formType || 'Standard'}</div>
                          <div><strong>Description:</strong> {form.description || 'No description'}</div>
                          <div><strong>Submissions:</strong> {submissions.filter(s => s.formId === form.id).length}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedForm(form);
                          setShowFormEdit(true);
                          setShowFormsModal(false);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleFormDelete(form.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Signature Manager for form submission details */}
      {selectedFormSubmission && (
        <PDFSignatureManager
          open={showPDFSignatureManager}
          onOpenChange={(open) => {
            setShowPDFSignatureManager(open);
            if (!open) {
              setSelectedFormSubmission(null);
            }
          }}
          pdfUrl={`/forms/${getFormPDFName(selectedFormSubmission.formId)}`}
          formType={getFormDisplayName(selectedFormSubmission.formId)}
          formData={selectedFormSubmission.data}
          onSavePosition={(position) => {
            // Save signature position to source code
            const formType = getFormTypeFromId(selectedFormSubmission.formId);
            const pdfName = getFormPDFName(selectedFormSubmission.formId);

            fetch('/api/admin/pdf-signature-position', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              },
              body: JSON.stringify({
                pdfName,
                formType,
                position
              })
            }).then(async response => {
              if (response.ok) {
                const result = await response.json();
                console.log('✅ Signature position saved to source code successfully:', result);
                // Optional: Show success notification to user
              } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('❌ Failed to save signature position:', response.status, errorData);
                // Optional: Show error notification to user
              }
            }).catch(error => {
              console.error('❌ Network error saving signature position:', error);
              // Optional: Show error notification to user
            });
          }}
        />
      )}

      {selectedFormSubmission && (
        <AdminPopulatedPDFViewer
          open={showAdminPopulatedPDFViewer}
          onOpenChange={(open) => {
            setShowAdminPopulatedPDFViewer(open);
            if (!open) {
              setSelectedFormSubmission(null);
            }
          }}
          formSubmission={selectedFormSubmission}
          jobDetails={jobs.find(job => job.id === selectedFormSubmission.jobId)}
        />
      )}

      {/* Compiled PDF Preview Modal */}
      {selectedJobForPDF && (
        <CompiledPDFPreviewModal
          open={showPDFPreview}
          onOpenChange={(open) => {
            setShowPDFPreview(open);
            if (!open) {
              setSelectedJobForPDF(null);
            }
          }}
          job={selectedJobForPDF}
          submissions={submissions.filter(sub => sub.jobId === selectedJobForPDF.id)}
          onConfirmDownload={handleConfirmPDFDownload}
        />
      )}
      </div>
    </Background3DProvider>
  );
}
