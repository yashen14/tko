import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PDFSignatureManager } from "@/components/PDFSignatureManager";
import {
  FileText,
  Edit,
  Trash2,
  Plus,
  Settings,
  Eye,
  Upload,
  Download,
  Variable,
  Link,
  Save,
  MousePointer,
  X,
  Copy,
  Database,
  FolderOpen,
  AlertTriangle,
  Package,
  Shield,
  AlertCircle,
  RefreshCw,
  Book,
} from "lucide-react";
import { Form, FormField } from "@shared/types";
import { VariableMappingEditor } from "./VariableMappingEditor";

interface PDFFile {
  name: string;
  size: number;
  lastModified: string;
  mappedForms: string[];
}

interface VariableMapping {
  id: string;
  formFieldId: string;
  formFieldLabel: string;
  pdfVariable: string;
  databaseColumn: string;
  required: boolean;
  fieldType: string;
  autoFillFrom?: string;
}

interface AdminFormManagerProps {
  currentUser: any;
}

export function AdminFormManager({ currentUser }: AdminFormManagerProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<string>("");
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [showVariableMapper, setShowVariableMapper] = useState(false);
  const [showPdfManager, setShowPdfManager] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showPdfLinker, setShowPdfLinker] = useState(false);
  const [showVariableView, setShowVariableView] = useState(false);
  const [selectedPdfForView, setSelectedPdfForView] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showSignatureManager, setShowSignatureManager] = useState(false);
  const [selectedPdfForSignature, setSelectedPdfForSignature] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'client' | 'staff'>('client');
  const [signaturePositions, setSignaturePositions] = useState<{ [pdfName: string]: any }>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Form submission management state
  const [formSubmissions, setFormSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [showSubmissionEditor, setShowSubmissionEditor] = useState(false);
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Only allow access for admins
  if (currentUser?.role !== "admin") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">
            Only administrators can access the form management system.
          </p>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      console.log('Starting fetchData...');

      // Define core forms with their variable mappings
      const coreForms = [
        {
          id: "noncompliance-form",
          name: "Non Compliance Form",
          description: "Assessment form for non-compliance issues and geyser replacement",
          fields: [
            { id: "date", label: "Date", type: "date", required: false, autoFillFrom: "currentDate" },
            { id: "insuranceName", label: "Insurance Name", type: "text", required: false, autoFillFrom: "underwriter" },
            { id: "claimNumber", label: "Claim Number", type: "text", required: false, autoFillFrom: "claimNo" },
            { id: "clientName", label: "Client Name", type: "text", required: false, autoFillFrom: "insuredName" },
            { id: "clientSurname", label: "Client Surname", type: "text", required: false },
            { id: "installersName", label: "Installers Name", type: "text", required: false, autoFillFrom: "assignedStaffName" },
            { id: "quotationSupplied", label: "Quotation Supplied?", type: "select", options: ["Yes", "No"], required: false },
            { id: "plumberIndemnity", label: "Plumber Indemnity", type: "select", options: ["Electric geyser", "Solar geyser", "Heat pump", "Pipe Repairs", "Assessment"], required: false },
            { id: "geyserMake", label: "Geyser Make", type: "text", required: false },
            { id: "geyserSerial", label: "Geyser Serial", type: "text", required: false },
            { id: "geyserCode", label: "Geyser Code", type: "text", required: false },
            { id: "selectedIssues", label: "Selected Compliance Issues", type: "checkbox", required: false }
          ],
          isTemplate: false,
          pdfTemplate: "Noncompliance.pdf",
          formType: "assessment",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "material-list-form",
          name: "Material List Form",
          description: "Comprehensive material list for geyser installation projects",
          fields: [
            { id: "date", label: "Date", type: "date", required: false, autoFillFrom: "currentDate" },
            { id: "plumber", label: "Plumber Name", type: "text", required: false, autoFillFrom: "assignedStaffName" },
            { id: "claimNumber", label: "Claim Number", type: "text", required: false, autoFillFrom: "claimNo" },
            { id: "insurance", label: "Insurance Company", type: "text", required: false, autoFillFrom: "underwriter" },
            { id: "geyserSize", label: "Geyser Size", type: "select", options: ["50L", "100L", "150L", "200L", "250L", "300L"], required: false },
            { id: "geyserBrand", label: "Geyser Brand", type: "select", options: ["Kwikot", "Heat Tech", "Techron", "Other"], required: false },
            { id: "dripTraySize", label: "Drip Tray Size", type: "text", required: false },
            { id: "vacuumBreaker1", label: "Vacuum Breaker 1", type: "text", required: false },
            { id: "vacuumBreaker2", label: "Vacuum Breaker 2", type: "text", required: false },
            { id: "pressureControlValve", label: "Pressure Control Valve", type: "text", required: false },
            { id: "nonReturnValve", label: "Non Return Valve", type: "text", required: false },
            { id: "fogiPack", label: "Fogi Pack", type: "text", required: false },
            { id: "additionalMaterials", label: "Additional Materials", type: "textarea", required: false }
          ],
          isTemplate: false,
          pdfTemplate: "ML.pdf",
          formType: "materials",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "liability-form",
          name: "Liability Form",
          description: "Enhanced liability waiver form with comprehensive assessment",
          fields: [
            { id: "date", label: "Date", type: "date", required: false, autoFillFrom: "currentDate" },
            { id: "insurance", label: "Insurance", type: "text", required: false, autoFillFrom: "underwriter" },
            { id: "claimNumber", label: "Claim Number", type: "text", required: false, autoFillFrom: "claimNo" },
            { id: "client", label: "Client", type: "text", required: false, autoFillFrom: "insuredName" },
            { id: "plumber", label: "Plumber", type: "text", required: false, autoFillFrom: "assignedStaffName" },
            { id: "wasExcessPaid", label: "Was Excess Paid?", type: "select", options: ["yes", "no"], required: false },
            { id: "selectedAssessmentItems", label: "Assessment Items", type: "checkbox", required: false },
            { id: "waterHammerBefore", label: "Water Hammer Before", type: "text", required: false },
            { id: "waterHammerAfter", label: "Water Hammer After", type: "text", required: false },
            { id: "pressureTestBefore", label: "Pressure Test Before", type: "text", required: false },
            { id: "pressureTestAfter", label: "Pressure Test After", type: "text", required: false },
            { id: "thermostatSettingBefore", label: "Thermostat Setting Before", type: "text", required: false },
            { id: "thermostatSettingAfter", label: "Thermostat Setting After", type: "text", required: false },
            { id: "pipeInstallation", label: "Pipe Installation Quality", type: "select", options: ["excellent", "good", "acceptable", "poor", "not-applicable"], required: false },
            { id: "pipeInsulation", label: "Pipe Insulation", type: "select", options: ["adequate", "inadequate", "missing", "not-required"], required: false },
            { id: "pressureRegulation", label: "Pressure Regulation", type: "select", options: ["within-limits", "too-high", "too-low", "not-tested"], required: false },
            { id: "temperatureControl", label: "Temperature Control", type: "select", options: ["functioning", "erratic", "not-functioning", "needs-adjustment"], required: false },
            { id: "safetyCompliance", label: "Safety Compliance", type: "select", options: ["compliant", "minor-issues", "major-issues", "non-compliant"], required: false },
            { id: "workmanshipQuality", label: "Workmanship Quality", type: "select", options: ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"], required: false },
            { id: "materialStandards", label: "Material Standards", type: "select", options: ["sabs-approved", "iso-certified", "non-standard", "unknown"], required: false },
            { id: "installationCertificate", label: "Installation Certificate", type: "select", options: ["issued", "pending", "not-required", "rejected"], required: false },
            { id: "additionalComments", label: "Additional Comments", type: "textarea", required: false }
          ],
          isTemplate: false,
          pdfTemplate: "liabWave.pdf",
          formType: "liability",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "clearance-certificate-form",
          name: "Clearance Certificate Form",
          description: "BBP clearance certificate for geyser installations",
          fields: [
            { id: "cname", label: "Client Name", type: "text", required: false, autoFillFrom: "insuredName" },
            { id: "cref", label: "Claim Reference", type: "text", required: false, autoFillFrom: "claimNo" },
            { id: "caddress", label: "Client Address", type: "text", required: false, autoFillFrom: "riskAddress" },
            { id: "cdamage", label: "Cause of Damage", type: "text", required: false },
            { id: "gcomments", label: "General Comments", type: "textarea", required: false },
            { id: "scopework", label: "Scope of Work", type: "textarea", required: false },
            { id: "oldgeyser", label: "Old Geyser", type: "select", options: ["150L", "200L", "250L", "300L", "Other"], required: false },
            { id: "newgeyser", label: "New Geyser", type: "select", options: ["150L", "200L", "250L", "300L", "Other"], required: false },
            { id: "staff", label: "Staff Member", type: "text", required: false, autoFillFrom: "assignedStaffName" },
            { id: "cquality1", label: "Quality Check 1", type: "select", options: ["Yes", "No"], required: false },
            { id: "cquality2", label: "Quality Check 2", type: "select", options: ["Yes", "No"], required: false },
            { id: "cquality3", label: "Quality Check 3", type: "select", options: ["Yes", "No"], required: false },
            { id: "cquality4", label: "Quality Check 4", type: "select", options: ["Yes", "No"], required: false },
            { id: "cquality5", label: "Quality Check 5", type: "select", options: ["Yes", "No"], required: false },
            { id: "cquality6", label: "Workmanship Rating", type: "select", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], required: false },
            { id: "excess", label: "Excess Paid", type: "select", options: ["Yes", "No"], required: false },
            { id: "amount", label: "Excess Amount", type: "text", required: false }
          ],
          isTemplate: false,
          pdfTemplate: "BBPClearanceCertificate.pdf",
          formType: "certificate",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Helper function for fetch with timeout
      const fetchWithTimeout = async (url: string, options: any, timeout = 10000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      // Fetch forms with error handling
      try {
        const formsResponse = await fetchWithTimeout("/api/forms", { headers });
        if (formsResponse.ok) {
          const formsData = await formsResponse.json();
          // Merge core forms with fetched forms, giving priority to fetched forms
          const existingFormIds = formsData.map((f: any) => f.id);
          const newCoreForms = coreForms.filter(cf => !existingFormIds.includes(cf.id));
          setForms([...formsData, ...newCoreForms]);
        } else {
          console.warn("Forms API not responding properly, using core forms only");
          setForms(coreForms);
        }
      } catch (error) {
        console.warn("Failed to fetch forms, using core forms only:", error);
        setForms(coreForms);
      }

      // Fetch PDF files (handle gracefully if endpoint doesn't exist)
      try {
        const pdfResponse = await fetchWithTimeout("/api/admin/pdf-files", { headers });
        if (pdfResponse.ok) {
          const pdfData = await pdfResponse.json();
          setPdfFiles(pdfData || []);
        } else {
          console.log("PDF files endpoint returned error, using empty list");
          setPdfFiles([]);
        }
      } catch (error) {
        console.log("PDF files endpoint not available, using empty list");
        setPdfFiles([]);
      }

      // Fetch form submissions
      try {
        const submissionsResponse = await fetch("/api/form-submissions", { headers });
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          setFormSubmissions(submissionsData || []);
        } else {
          setFormSubmissions([]);
        }
      } catch (error) {
        console.warn("Failed to fetch form submissions:", error);
        setFormSubmissions([]);
      }

      // Fetch jobs
      try {
        const jobsResponse = await fetch("/api/jobs", { headers });
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setJobs(jobsData || []);
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.warn("Failed to fetch jobs:", error);
        setJobs([]);
      }

      // Fetch users
      try {
        const usersResponse = await fetch("/api/auth/users", { headers });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData || []);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.warn("Failed to fetch users:", error);
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch data - global error:", error);

      // More detailed error logging
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error("Network error occurred. Check if server is running and accessible.");
      }

      // Set empty fallback data to prevent component crashes
      setForms([]);
      setPdfFiles([]);
      setFormSubmissions([]);
      setJobs([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormCreate = async () => {
    const newForm: Partial<Form> = {
      name: "New Form",
      description: "Enter description",
      fields: [],
      isTemplate: false,
      restrictedToCompanies: [],
    };

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newForm),
      });

      if (response.ok) {
        const createdForm = await response.json();
        setForms([...forms, createdForm]);
        setSelectedForm(createdForm);
        setShowFormEditor(true);
      }
    } catch (error) {
      console.error("Failed to create form:", error);
    }
  };

  const handleFormUpdate = async (formId: string, updates: Partial<Form>) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedForm = await response.json();
        setForms(forms.map(f => f.id === formId ? updatedForm : f));
        setSelectedForm(updatedForm);
      }
    } catch (error) {
      console.error("Failed to update form:", error);
    }
  };

  const handleFormDelete = async (formId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/forms/${formId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setForms(forms.filter(f => f.id !== formId));
        if (selectedForm?.id === formId) {
          setSelectedForm(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete form:", error);
    }
  };

  const handleEditSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setShowSubmissionEditor(true);
  };

  const handleUpdateSubmission = async (submissionId: string, updates: any) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/form-submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedSubmission = await response.json();
        setFormSubmissions(formSubmissions.map(sub =>
          sub.id === submissionId ? updatedSubmission : sub
        ));
        setShowSubmissionEditor(false);
        alert("Form submission updated successfully");
      } else {
        throw new Error("Failed to update submission");
      }
    } catch (error) {
      console.error("Failed to update form submission:", error);
      alert("Failed to update form submission");
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm("Are you sure you want to delete this form submission? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/form-submissions/${submissionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setFormSubmissions(formSubmissions.filter(sub => sub.id !== submissionId));
        alert("Form submission deleted successfully");
      } else {
        throw new Error("Failed to delete submission");
      }
    } catch (error) {
      console.error("Failed to delete form submission:", error);
      alert("Failed to delete form submission");
    }
  };

  const handleDownloadSubmissionPDF = async (submission: any) => {
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

        // Get proper form name for download
        let fileName;
        const form = forms.find(f => f.id === submission.formId);
        if (form?.name) {
          fileName = `${form.name.replace(/[^a-zA-Z0-9]/g, '_')}-${submission.id}.pdf`;
        } else {
          // Handle custom forms
          switch (submission.formId) {
            case "noncompliance-form":
              fileName = "Non_Compliance_Form.pdf";
              break;
            case "material-list-form":
              fileName = "Material_List_Form.pdf";
              break;
            case "liability-form":
              fileName = "Liability_Form.pdf";
              break;
            case "clearance-certificate-form":
              fileName = "Clearance_Certificate_Form.pdf";
              break;
            case "sahl-certificate-form":
              fileName = "SAHL_Certificate_Form.pdf";
              break;
            case "absa-form":
              fileName = "ABSA_Form.pdf";
              break;
            case "discovery-form":
              fileName = "Discovery_Form.pdf";
              break;
            default:
              fileName = `${submission.formId}-${submission.id}.pdf`;
          }
        }

        a.download = fileName;
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

  const handleClearFormSubmissions = async () => {
    if (!confirm("Are you sure you want to clear ALL form submissions? This action cannot be undone and will reset all job progress calculations.")) {
      return;
    }

    if (!confirm("This will permanently delete all form submission data from the database. Type 'CONFIRM' to proceed.") ||
        !prompt("Type 'CONFIRM' to proceed:") === 'CONFIRM') {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/form-submissions/clear-all", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully cleared ${result.clearedCount} form submissions from the database.`);
      } else {
        throw new Error("Failed to clear form submissions");
      }
    } catch (error) {
      console.error("Failed to clear form submissions:", error);
      alert("Failed to clear form submissions. Please try again.");
    }
  };

  const handleFieldAdd = () => {
    if (!selectedForm) return;

    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
      placeholder: "Enter value",
    };

    const updatedForm = {
      ...selectedForm,
      fields: [...selectedForm.fields, newField],
    };

    setSelectedForm(updatedForm);
    setEditingField(newField);
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    if (!selectedForm) return;

    const updatedFields = selectedForm.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );

    const updatedForm = { ...selectedForm, fields: updatedFields };
    setSelectedForm(updatedForm);
  };

  const handleFieldDelete = (fieldId: string) => {
    if (!selectedForm) return;

    const updatedFields = selectedForm.fields.filter(field => field.id !== fieldId);
    const updatedForm = { ...selectedForm, fields: updatedFields };
    setSelectedForm(updatedForm);
  };

  const handleSaveForm = async () => {
    if (!selectedForm) return;

    await handleFormUpdate(selectedForm.id, selectedForm);
    setShowFormEditor(false);
    setEditingField(null);
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith('.pdf')) {
      alert('Please select a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/upload-pdf", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        fetchData(); // Refresh PDF list
        alert('PDF uploaded successfully!');
      } else {
        alert('Upload endpoint not available yet');
      }
    } catch (error) {
      console.error("Failed to upload PDF:", error);
      alert('Upload feature not available yet');
    }
  };

  const handlePdfRename = async (oldName: string, newName: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/rename-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldName, newName }),
      });

      if (response.ok) {
        fetchData(); // Refresh PDF list
        alert('PDF renamed successfully!');
      } else {
        alert('Rename feature not available yet');
      }
    } catch (error) {
      console.error("Failed to rename PDF:", error);
      alert('Rename feature not available yet');
    }
  };

  const handleLinkPdfToForm = async (formId: string, pdfFileName: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/link-pdf-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ formId, pdfFileName }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
        setShowPdfLinker(false);
        alert("PDF linked to form successfully!");
      } else {
        setShowPdfLinker(false);
        alert("Link feature not available yet");
      }
    } catch (error) {
      console.error("Failed to link PDF to form:", error);
      setShowPdfLinker(false);
      alert("Link feature not available yet");
    }
  };

  const handleSaveSignaturePosition = async (pdfName: string, position: any) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/pdf-signature-position", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pdfName,
          position: {
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            page: position.page || 1
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Signature position saved for ${pdfName}:`, result);

        // Show detailed success message with form type info
        const formType = result.formType || "unknown";
        alert(`✅ Signature position saved successfully!\n\nForm: ${pdfName}\nType: ${formType}\nPosition: X:${position.x}, Y:${position.y}\nSize: ${position.width}×${position.height}\n\n📝 Source code has been updated automatically.`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.warn("❌ Signature position save failed:", response.status, errorData);
        alert(`❌ Failed to save signature position for ${pdfName}\n\nError: ${errorData.error || 'Unknown error'}\nStatus: ${response.status}\n\nPlease try again or check the console for details.`);
        // Store locally as fallback
        localStorage.setItem(`pdf-signature-${pdfName}`, JSON.stringify(position));
        alert("⚠️ Server save failed. Position saved locally as backup.");
      }
    } catch (error) {
      console.error("❌ Network error saving signature position:", error);
      // Store locally as fallback
      localStorage.setItem(`pdf-signature-${pdfName}`, JSON.stringify(position));
      alert("⚠️ Network error. Position saved locally as backup.");
    }
  };

  const handleSaveIndividualSignaturePosition = async (pdfName: string, position: any, type: 'client' | 'staff') => {
    try {
      const token = localStorage.getItem("auth_token");

      // Check if this is a dual signature form
      const isDualForm = ["BBPClearanceCertificate.pdf", "desco.pdf", "liabWave.pdf"].includes(pdfName);

      if (isDualForm) {
        // For dual signature forms, we need to update only the specific signature type
        // Get current positions first
        const currentPositions = signaturePositions[pdfName] || {};

        // Create updated dual positions with the new single signature
        const updatedDualPositions = {
          client: type === 'client' ? {
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            opacity: 0.7
          } : currentPositions.client || {
            x: 100, y: 100, width: 180, height: 50, opacity: 0.7
          },
          staff: type === 'staff' ? {
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            opacity: 0.7
          } : currentPositions.staff || {
            x: 100, y: 160, width: 180, height: 50, opacity: 0.7
          }
        };

        // Save as dual signature
        const response = await fetch("/api/admin/pdf-dual-signature-position", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pdfName,
            dualPositions: updatedDualPositions
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ ${type} signature position saved for ${pdfName}:`, result);

          // Update local state
          setSignaturePositions(prev => ({
            ...prev,
            [pdfName]: updatedDualPositions
          }));

          alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} signature position saved successfully!\n\nForm: ${pdfName}\nPosition: X:${position.x}, Y:${position.y}\nSize: ${position.width}×${position.height}\n\n📝 Source code has been updated automatically.`);
        } else {
          throw new Error(`Failed to save ${type} signature position`);
        }
      } else {
        // For single signature forms, use the regular endpoint
        await handleSaveSignaturePosition(pdfName, position);
      }
    } catch (error) {
      console.error(`❌ Error saving ${type} signature position:`, error);
      alert(`❌ Failed to save ${type} signature position. Please try again.`);
    }
  };

  const handleSaveDualSignaturePositions = async (pdfName: string, dualPositions: any) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/pdf-dual-signature-position", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pdfName,
          dualPositions: {
            client: {
              x: dualPositions.client.x,
              y: dualPositions.client.y,
              width: dualPositions.client.width,
              height: dualPositions.client.height,
              opacity: 0.7
            },
            staff: {
              x: dualPositions.staff.x,
              y: dualPositions.staff.y,
              width: dualPositions.staff.width,
              height: dualPositions.staff.height,
              opacity: 0.7
            }
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Dual signature positions saved for ${pdfName}:`, result);

        // Show detailed success message
        const formType = result.formType || "unknown";
        alert(`✅ Dual signature positions saved successfully!\n\nForm: ${pdfName}\nType: ${formType}\n\nClient: X:${dualPositions.client.x}, Y:${dualPositions.client.y}, Size: ${dualPositions.client.width}×${dualPositions.client.height}\nStaff: X:${dualPositions.staff.x}, Y:${dualPositions.staff.y}, Size: ${dualPositions.staff.width}×${dualPositions.staff.height}\n\n📝 Source code has been updated automatically.`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.warn("❌ Dual signature positions save failed:", response.status, errorData);
        alert(`❌ Failed to save dual signature positions for ${pdfName}\n\nError: ${errorData.error || 'Unknown error'}\nStatus: ${response.status}\n\nPlease try again or check the console for details.`);
      }
    } catch (error) {
      console.error("❌ Network error saving dual signature positions:", error);
      alert("⚠️ Network error. Please try again or check the console for details.");
    }
  };

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading form management system...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-red-500 to-amber-500 p-1 rounded mr-2">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-red-600 to-amber-600 bg-clip-text text-transparent font-bold">
                Admin Form Management System
              </span>
            </div>
            <Badge className="bg-gradient-to-r from-red-500 to-amber-500 text-white">Admin Only</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="forms" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="forms">Forms Management</TabsTrigger>
              <TabsTrigger value="submissions">Form Submissions</TabsTrigger>
              <TabsTrigger value="variables">Variable Mapping</TabsTrigger>
              <TabsTrigger value="pdfs">PDF Management</TabsTrigger>
              <TabsTrigger value="database">Database Schema</TabsTrigger>
            </TabsList>

            {/* Forms Management Tab */}
            <TabsContent value="forms">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search forms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Button onClick={handleFormCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Form
                    </Button>
                  </div>
                  <Badge variant="outline">
                    {filteredForms.length} forms
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {filteredForms.map((form) => (
                    <Card key={form.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              {form.id === "material-list-form" && (
                                <Package className="h-5 w-5 text-blue-600" />
                              )}
                              {form.id === "noncompliance-form" && (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              )}
                              <h3 className="font-semibold">{form.name}</h3>
                              <Badge variant={form.isTemplate ? "default" : "secondary"}>
                                {form.isTemplate ? "Template" : "Standard"}
                              </Badge>
                              {form.pdfTemplate && (
                                <Badge variant="outline">
                                  <FileText className="h-3 w-3 mr-1" />
                                  PDF: {form.pdfTemplate}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{form.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{form.fields.length} fields</span>
                              <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
                              <span>Updated: {new Date(form.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedForm(form);
                                setShowFormEditor(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedForm(form);
                                setShowVariableMapper(true);
                              }}
                            >
                              <Variable className="h-4 w-4" />
                            </Button>
                            {!['material-list-form', 'noncompliance-form'].includes(form.id) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Form</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{form.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleFormDelete(form.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Form Submissions Management Tab */}
            <TabsContent value="submissions">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search submissions..."
                      value={submissionSearchTerm}
                      onChange={(e) => setSubmissionSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Button onClick={fetchData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  <Badge variant="outline">
                    {formSubmissions.length} submissions
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {formSubmissions
                    .filter(submission =>
                      !submissionSearchTerm ||
                      submission.id.toLowerCase().includes(submissionSearchTerm.toLowerCase()) ||
                      jobs.find(j => j.id === submission.jobId)?.title?.toLowerCase().includes(submissionSearchTerm.toLowerCase()) ||
                      forms.find(f => f.id === submission.formId)?.name?.toLowerCase().includes(submissionSearchTerm.toLowerCase())
                    )
                    .map((submission) => {
                      const job = jobs.find(j => j.id === submission.jobId);
                      const form = forms.find(f => f.id === submission.formId);
                      const submitter = users.find(u => u.id === submission.submittedBy);

                      return (
                        <Card key={submission.id} className="border overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-2 flex-1 min-w-0 max-w-full">
                                <div className="flex items-center space-x-2 min-w-0">
                                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                  <span className="font-medium truncate flex-1 min-w-0" title={form?.name || 'Unknown Form'}>
                                    {form?.name || 'Unknown Form'}
                                  </span>
                                  <Badge variant="outline" className="text-xs flex-shrink-0 max-w-20 truncate" title={submission.id}>
                                    {submission.id.length > 8 ? `${submission.id.substring(0, 8)}...` : submission.id}
                                  </Badge>
                                </div>

                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="truncate" title={job?.title || 'Unknown Job'}><strong>Job:</strong> {job?.title || 'Unknown Job'}</div>
                                  <div className="truncate" title={submitter?.name || 'Unknown User'}><strong>Submitted by:</strong> {submitter?.name || 'Unknown User'}</div>
                                  <div className="break-all"><strong>Date:</strong> {new Date(submission.submittedAt).toLocaleString()}</div>
                                  {submission.updatedAt && (
                                    <div className="break-all"><strong>Updated:</strong> {new Date(submission.updatedAt).toLocaleString()}</div>
                                  )}
                                </div>

                                <div className="text-xs text-gray-500">
                                  <strong>Form Data:</strong>
                                  <div className="mt-1 bg-gray-50 p-2 rounded text-xs max-h-20 overflow-hidden relative">
                                    <pre className="whitespace-pre-wrap break-all text-xs leading-tight overflow-hidden">
                                      {(() => {
                                        const jsonString = JSON.stringify(submission.data, null, 2);
                                        return jsonString.length > 200 ? `${jsonString.substring(0, 200)}...` : jsonString;
                                      })()}
                                    </pre>
                                    {JSON.stringify(submission.data, null, 2).length > 200 && (
                                      <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col space-y-2 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadSubmissionPDF(submission)}
                                  className="h-8 w-8 p-0"
                                  title="Download PDF"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditSubmission(submission)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteSubmission(submission.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>

                {formSubmissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No form submissions found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Variable Mapping Tab */}
            <TabsContent value="variables">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Form-to-Database Variable Mapping</h3>
                  <Select value={selectedForm?.id || ""} onValueChange={(formId) => {
                    const form = forms.find(f => f.id === formId);
                    setSelectedForm(form || null);
                  }}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a form" />
                    </SelectTrigger>
                    <SelectContent>
                      {forms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Field Mappings for "{selectedForm.name}"</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Form Field</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Database Column</TableHead>
                            <TableHead>Auto Fill Source</TableHead>
                            <TableHead>Required</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedForm.fields.map((field) => (
                            <TableRow key={field.id}>
                              <TableCell className="font-medium">{field.label}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{field.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="database_column"
                                  defaultValue={field.id.replace(/[^a-zA-Z0-9]/g, '_')}
                                  className="w-32"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="autoFillSource"
                                  defaultValue={field.autoFillFrom}
                                  className="w-32"
                                />
                              </TableCell>
                              <TableCell>
                                <Switch checked={field.required} />
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm">
                                  <Save className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* PDF Management Tab */}
            <TabsContent value="pdfs">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">PDF Template Management</h3>
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <Label htmlFor="pdf-upload">
                      <Button asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload PDF
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>

                <div className="grid gap-4">
                  {pdfFiles.map((pdf) => (
                    <Card key={pdf.name} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-red-600" />
                              <h3 className="font-semibold">{pdf.name}</h3>
                              <Badge variant="outline">
                                {(pdf.size / 1024).toFixed(1)} KB
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Last modified: {new Date(pdf.lastModified).toLocaleDateString()}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Mapped to:</span>
                              {pdf.mappedForms.length > 0 ? (
                                pdf.mappedForms.map((formName) => (
                                  <Badge key={formName} variant="secondary" className="text-xs">
                                    {formName}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  No forms mapped
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPdfForView(pdf.name);
                                setShowPdfViewer(true);
                              }}
                              title="View PDF"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPdfForSignature(pdf.name);
                                setSignatureType('client');
                                setShowSignatureManager(true);
                              }}
                              title="Edit Client Signature Position"
                            >
                              <MousePointer className="h-4 w-4" />
                            </Button>
                            {/* Staff signature button - only show for dual signature forms */}
                            {["BBPClearanceCertificate.pdf", "desco.pdf", "liabWave.pdf"].includes(pdf.name) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPdfForSignature(pdf.name);
                                  setSignatureType('staff');
                                  setShowSignatureManager(true);
                                }}
                                title="Edit Staff Signature Position"
                              >
                                <Book className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPdf(pdf.name);
                                setShowVariableView(true);
                              }}
                              title="Edit Variable Mapping"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPdf(pdf.name);
                                setShowPdfLinker(true);
                              }}
                              title="Link to Form"
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Database Schema Tab */}
            <TabsContent value="database">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Database Schema & Routes Configuration</h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      Form Data Storage Schema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Configure how form fields map to database columns and API routes.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm">
{`{
  "formSubmissions": {
    "id": "string",
    "jobId": "string",
    "formId": "string",
    "submittedBy": "string",
    "data": {
      // Dynamic fields based on form configuration
    },
    "submittedAt": "datetime",
    "signature": "object"
  }
}`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Standard Forms Schema */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900">
                      <FileText className="h-5 w-5 mr-2" />
                      Standard Forms Data Schema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Material List Schema */}
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          Material List Form
                        </h4>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <pre className="text-sm">
{`{
  "materialListSubmission": {
    "formId": "material-list-form",
    "data": {
      "item_description": "string",
      "manufacturer": "string",
      "size_specification": "string",
      "quantity_requested": "number",
      "quantity_used": "number",
      "notes": "text"
    }
  }
}`}
                          </pre>
                        </div>
                      </div>

                      {/* Non Compliance Schema */}
                      <div>
                        <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Non Compliance Form
                        </h4>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <pre className="text-sm">
{`{
  "nonComplianceSubmission": {
    "formId": "noncompliance-form",
    "data": {
      "cold_vacuum_breaker": "select",
      "pipe_material": "select",
      "water_pressure": "number",
      "compliance_notes": "text"
    }
  }
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Database Management */}
                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-900">
                      <Database className="h-5 w-5 mr-2" />
                      Database Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">Reset Form Submissions</h4>
                        <p className="text-sm text-orange-700 mb-4">
                          Clear all form submissions from the database. This will remove all historical form data
                          and reset the job progress calculations. This action cannot be undone.
                        </p>
                        <Button
                          variant="destructive"
                          onClick={handleClearFormSubmissions}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Clear All Form Submissions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Form Editor Dialog */}
      <Dialog open={showFormEditor} onOpenChange={setShowFormEditor}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form: {selectedForm?.name}</DialogTitle>
            <DialogDescription>
              Configure form fields, validation, and database mapping.
            </DialogDescription>
          </DialogHeader>
          
          {selectedForm && (
            <div className="space-y-6">
              {/* Form Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="form-name">Form Name</Label>
                  <Input
                    id="form-name"
                    value={selectedForm.name}
                    onChange={(e) => setSelectedForm({
                      ...selectedForm,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="form-type">Form Type</Label>
                  <Input
                    id="form-type"
                    value={selectedForm.formType || ""}
                    onChange={(e) => setSelectedForm({
                      ...selectedForm,
                      formType: e.target.value
                    })}
                    placeholder="e.g., clearance, liability, assessment"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="form-description">Description</Label>
                <Textarea
                  id="form-description"
                  value={selectedForm.description || ""}
                  onChange={(e) => setSelectedForm({
                    ...selectedForm,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedForm.isTemplate}
                  onCheckedChange={(checked) => setSelectedForm({
                    ...selectedForm,
                    isTemplate: checked
                  })}
                />
                <Label>Template Form</Label>
              </div>

              {/* Fields Management */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Form Fields</h4>
                  <Button onClick={handleFieldAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                <div className="space-y-2">
                  {selectedForm.fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Label</Label>
                              <Input
                                value={field.label}
                                onChange={(e) => handleFieldUpdate(field.id, { label: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) => handleFieldUpdate(field.id, { type: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="textarea">Textarea</SelectItem>
                                  <SelectItem value="select">Select</SelectItem>
                                  <SelectItem value="checkbox">Checkbox</SelectItem>
                                  <SelectItem value="radio">Radio</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Auto Fill From</Label>
                              <Input
                                value={field.autoFillFrom || ""}
                                onChange={(e) => handleFieldUpdate(field.id, { autoFillFrom: e.target.value })}
                                placeholder="e.g., claimNo, insuredName"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Placeholder</Label>
                              <div className="space-y-2">
                                <Input
                                  value={field.placeholder || ""}
                                  onChange={(e) => handleFieldUpdate(field.id, { placeholder: e.target.value })}
                                  placeholder="Enter custom placeholder or select from suggestions below"
                                />
                                <Select
                                  value=""
                                  onValueChange={(value) => {
                                    if (value !== "custom") {
                                      handleFieldUpdate(field.id, { placeholder: value });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Use predefined placeholder" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="custom">Custom placeholder</SelectItem>
                                    <SelectItem value="Enter your full name">Enter your full name</SelectItem>
                                    <SelectItem value="example@email.com">example@email.com</SelectItem>
                                    <SelectItem value="Enter phone number">Enter phone number</SelectItem>
                                    <SelectItem value="Enter address">Enter address</SelectItem>
                                    <SelectItem value="Select date">Select date</SelectItem>
                                    <SelectItem value="Select time">Select time</SelectItem>
                                    <SelectItem value="Enter amount">Enter amount</SelectItem>
                                    <SelectItem value="Enter description">Enter description</SelectItem>
                                    <SelectItem value="Choose option">Choose option</SelectItem>
                                    <SelectItem value="Upload file">Upload file</SelectItem>
                                    <SelectItem value="Enter claim number">Enter claim number</SelectItem>
                                    <SelectItem value="Enter policy number">Enter policy number</SelectItem>
                                    <SelectItem value="Enter job reference">Enter job reference</SelectItem>
                                    <SelectItem value="Describe the issue">Describe the issue</SelectItem>
                                    <SelectItem value="Additional notes">Additional notes</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) => handleFieldUpdate(field.id, { required: checked })}
                                />
                                <Label>Required</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.readonly}
                                  onCheckedChange={(checked) => handleFieldUpdate(field.id, { readonly: checked })}
                                />
                                <Label>Read Only</Label>
                              </div>
                            </div>
                          </div>

                          {field.type === "select" && (
                            <div>
                              <Label>Options (one per line)</Label>
                              <Textarea
                                value={field.options?.join('\n') || ""}
                                onChange={(e) => handleFieldUpdate(field.id, {
                                  options: e.target.value.split('\n').filter(opt => opt.trim())
                                })}
                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingField(field)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFieldDelete(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowFormEditor(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveForm}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Form
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Variable Mapping Editor Dialog */}
      {showVariableMapper && selectedForm && (
        <VariableMappingEditor
          form={selectedForm}
          onSave={(mappings) => {
            console.log("Variable mappings saved:", mappings);
            setShowVariableMapper(false);
          }}
          onClose={() => setShowVariableMapper(false)}
        />
      )}

      {/* PDF Viewer Dialog */}
      <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>PDF Viewer: {selectedPdfForView}</DialogTitle>
          </DialogHeader>
          <div className="h-[600px] w-full">
            {selectedPdfForView && (
              <iframe
                src={`/forms/${selectedPdfForView}`}
                className="w-full h-full border rounded"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF to Form Linker Dialog */}
      <Dialog open={showPdfLinker} onOpenChange={setShowPdfLinker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link PDF to Form</DialogTitle>
            <DialogDescription>
              Associate "{selectedPdf}" with a form template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Form</Label>
              <Select onValueChange={(formId) => {
                if (formId && selectedPdf) {
                  handleLinkPdfToForm(formId, selectedPdf);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a form" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variable Mapping View Dialog */}
      <Dialog open={showVariableView} onOpenChange={setShowVariableView}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Variable className="h-5 w-5 mr-2 text-amber-600" />
              PDF Variable Mapping: {selectedPdf}
            </DialogTitle>
            <DialogDescription>
              View and edit how form fields map to PDF variables for this template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Forms using this PDF */}
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">Forms Using This PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {forms
                    .filter(form => form.pdfTemplate === selectedPdf)
                    .map(form => (
                      <Card key={form.id} className="bg-white border-amber-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-amber-800">{form.name}</h4>
                              <p className="text-sm text-gray-600">{form.description}</p>
                              <Badge variant="outline" className="mt-2">
                                {form.fields.length} fields
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedForm(form);
                                setShowVariableMapper(true);
                                setShowVariableView(false);
                              }}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit Mapping
                            </Button>
                          </div>

                          <div className="mt-4">
                            <h5 className="font-medium text-sm mb-2">Field Mappings:</h5>
                            <div className="space-y-2">
                              {form.fields.slice(0, 5).map(field => (
                                <div key={field.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                  <span className="font-medium">{field.label}</span>
                                  <span className="text-gray-600">{field.type}</span>
                                  <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                                    {field.id.replace(/[^a-zA-Z0-9]/g, "_")}
                                  </span>
                                </div>
                              ))}
                              {form.fields.length > 5 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{form.fields.length - 5} more fields
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {forms.filter(form => form.pdfTemplate === selectedPdf).length === 0 && (
                    <div className="text-center py-8 text-amber-600">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No forms are currently using this PDF template</p>
                      <Button
                        className="mt-2 bg-amber-600 hover:bg-amber-700"
                        onClick={() => {
                          setShowPdfLinker(true);
                          setShowVariableView(false);
                        }}
                      >
                        Link to Form
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Submission Editor Dialog */}
      <Dialog open={showSubmissionEditor} onOpenChange={setShowSubmissionEditor}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form Submission</DialogTitle>
            <DialogDescription>
              Edit the form submission data. Changes will be saved to the database.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Submission Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Submission ID:</strong> {selectedSubmission.id}</div>
                  <div><strong>Job:</strong> {jobs.find(j => j.id === selectedSubmission.jobId)?.title || 'Unknown'}</div>
                  <div><strong>Form:</strong> {forms.find(f => f.id === selectedSubmission.formId)?.name || 'Unknown'}</div>
                  <div><strong>Submitted by:</strong> {users.find(u => u.id === selectedSubmission.submittedBy)?.name || 'Unknown'}</div>
                </div>
              </div>

              {/* Edit Form Data */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Form Data</Label>
                <Textarea
                  value={JSON.stringify(selectedSubmission.data, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsedData = JSON.parse(e.target.value);
                      setSelectedSubmission({
                        ...selectedSubmission,
                        data: parsedData
                      });
                    } catch (error) {
                      // Invalid JSON, but still update for user to see changes
                      setSelectedSubmission({
                        ...selectedSubmission,
                        data: e.target.value
                      });
                    }
                  }}
                  className="font-mono text-sm min-h-[200px]"
                  placeholder="Enter form data as JSON..."
                />
                <p className="text-xs text-gray-500">
                  Edit the form data as JSON. Make sure the format is valid before saving.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmissionEditor(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateSubmission(selectedSubmission.id, {
                    data: selectedSubmission.data
                  })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Signature Manager */}
      <PDFSignatureManager
        open={showSignatureManager}
        onOpenChange={setShowSignatureManager}
        pdfUrl={selectedPdfForSignature ? `/forms/${selectedPdfForSignature}` : ""}
        formType={selectedPdfForSignature || ""}
        currentSignaturePosition={selectedPdfForSignature ? signaturePositions[selectedPdfForSignature] : undefined}
        currentDualPositions={selectedPdfForSignature ? signaturePositions[selectedPdfForSignature] : undefined}
        isDualSignature={selectedPdfForSignature ? ["clearance-certificate-form", "discovery-form", "liability-form"].includes(selectedPdfForSignature.replace(".pdf", "")) : false}
        signatureType={signatureType}
        onSavePosition={(position) => {
          if (selectedPdfForSignature) {
            // Use individual signature handler for both single and dual signature forms
            handleSaveIndividualSignaturePosition(selectedPdfForSignature, position, signatureType);
          }
        }}
        onSaveDualPositions={(dualPositions) => {
          if (selectedPdfForSignature) {
            setSignaturePositions(prev => ({
              ...prev,
              [selectedPdfForSignature]: dualPositions
            }));

            // Save dual positions to backend
            handleSaveDualSignaturePositions(selectedPdfForSignature, dualPositions);
          }
        }}
      />
    </div>
  );
}
