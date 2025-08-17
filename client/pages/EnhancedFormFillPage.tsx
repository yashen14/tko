import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  User,
  Building,
  Smartphone,
  Check,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { Job, Form, User as UserType, FormField } from "@shared/types";
import { FullScreenSignaturePad } from "@/components/FullScreenSignaturePad";
import { useAuth } from "@/contexts/AuthContext";
import { NoncomplianceForm } from "@/components/NoncomplianceForm";
import { MaterialListForm } from "@/components/MaterialListForm";
import { EnhancedLiabilityForm } from "@/components/EnhancedLiabilityForm";
import { ClearanceCertificateForm } from "@/components/ClearanceCertificateForm";
import { SAHLCertificateForm } from "@/components/SAHLCertificateForm";
import { ABSAForm } from "@/components/ABSAForm";
import { DiscoveryForm } from "@/components/DiscoveryForm";

export default function EnhancedFormFillPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(location.search);
  const stateParams = (location.state as any) || {};

  const jobId = stateParams.jobId || urlParams.get("jobId");
  const formId = stateParams.formId || urlParams.get("formId");
  const editMode = stateParams.editMode || false;
  const existingSubmissionId = stateParams.existingSubmissionId;
  const existingData = stateParams.existingData;

  const [job, setJob] = useState<Job | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [staff, setStaff] = useState<UserType[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [signature, setSignature] = useState<string>(""); // Client signature
  const [signature_staff, setSignature_staff] = useState<string>(""); // Staff signature
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSection, setCurrentSection] = useState<
    "staff" | "client" | "signature" | "staff-signature"
  >("staff");
  const [autoSaveKey, setAutoSaveKey] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasBeenSubmitted, setHasBeenSubmitted] = useState(false);

  const handleSuccessfulSubmission = () => {
    setSuccess(true);
    setHasBeenSubmitted(true);
    setTimeout(() => {
      setSuccess(false);
      // Navigate back to staff dashboard with a message to open Fill Forms
      navigate('/', {
        state: {
          openFillForms: true,
          jobId: jobId,
          message: 'Form submitted successfully!'
        }
      });
    }, 2000);
  };

  // Auto-save functionality
  const saveFormData = useCallback(
    (data: Record<string, any>) => {
      if (autoSaveKey) {
        localStorage.setItem(autoSaveKey, JSON.stringify(data));
      }
    },
    [autoSaveKey],
  );

  const loadSavedData = useCallback(() => {
    if (autoSaveKey) {
      const saved = localStorage.getItem(autoSaveKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved form data:", e);
        }
      }
    }
    return {};
  }, [autoSaveKey]);

  useEffect(() => {
    if (jobId && formId) {
      setAutoSaveKey(`form_${jobId}_${formId}`);
    }
  }, [jobId, formId]);

  // Define getFieldsBySection function
  const getFieldsBySection = useCallback((section: "staff" | "client") => {
    if (!form) return [];
    
    // Use section property if available, otherwise fallback to form-specific logic
    if (form.fields.some(f => f.section)) {
      return form.fields.filter(f => f.section === section || (!f.section && section === "staff"));
    }
    
    // Fallback logic for forms without section markers
    if (form.name === "ABSA Form") {
      return section === "staff" ? form.fields.filter((_, i) => i < 5 || i >= 13) : form.fields.filter((_, i) => i >= 5 && i < 13);
    }
    if (form.name === "SAHL Certificate Form") {
      return section === "staff" ? form.fields.filter((_, i) => i < 5 || i >= 11) : form.fields.filter((_, i) => i >= 5 && i < 11);
    }
    if (form.name === "Clearance Certificate") {
      return section === "staff" ? form.fields.filter((_, i) => i < 4 || i >= 10) : form.fields.filter((_, i) => i >= 4 && i < 10);
    }
    
    return form.fields;
  }, [form]);

  const validateForm = useCallback(() => {
    if (!form) return [];
    const coreFormIds = ["noncompliance-form", "material-list-form"];
    if (coreFormIds.includes(formId || "")) return [];

    const errors: string[] = [];
    const fieldsToValidate = getFieldsBySection(currentSection as "staff" | "client");

    fieldsToValidate.forEach((field) => {
      if (field.required) {
        const value = formData[field.id];
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors.push(field.id);
        }
      }
    });
    return errors;
  }, [form, formId, formData, currentSection, getFieldsBySection]);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Custom forms that use specialized components
      const customFormIds = [
        "noncompliance-form",
        "material-list-form",
        "sahl-certificate-form",
        "absa-form"
      ];
      const isCustomForm = customFormIds.includes(formId || "");

      const jobPromise = fetch(`/api/jobs?id=${jobId}`, { headers });
      const staffPromise = fetch("/api/auth/users", { headers });
      const formPromise = isCustomForm ? Promise.resolve(null) : fetch(`/api/forms/${formId}`, { headers });

      const [jobResponse, staffResponse, formResponse] = await Promise.all([jobPromise, staffPromise, formPromise]);

      if (!jobResponse.ok) throw new Error(`Failed to fetch job: ${jobResponse.status}`);
      if (!staffResponse.ok) throw new Error(`Failed to fetch staff: ${staffResponse.status}`);
      
      let jobsData = await jobResponse.json();
      let staffData = await staffResponse.json();
      let fetchedForm;

      if (isCustomForm) {
        fetchedForm = {
          id: formId,
          name: formId?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Custom Form",
          fields: [],
        };
      } else {
        if (!formResponse || !formResponse.ok) throw new Error(`Failed to fetch form: ${formResponse?.status}`);
        fetchedForm = await formResponse.json();
      }

      const jobDetails = Array.isArray(jobsData) ? jobsData.find((j) => j.id === jobId) : jobsData;
      if (!jobDetails) throw new Error("Job not found");

      setJob(jobDetails);
      setForm(fetchedForm);
      setStaff(staffData.filter((u: UserType) => u.role === "staff"));

      const savedData = loadSavedData();
      const autoFilledData: Record<string, any> = { ...savedData };

      fetchedForm.fields.forEach((field: FormField) => {
        if (autoFilledData[field.id]) return;
        if (field.autoFillFrom) {
          const value = jobDetails[field.autoFillFrom];
          if (value) autoFilledData[field.id] = value;
        }
      });
      setFormData(autoFilledData);
      saveFormData(autoFilledData);
    } catch (error) {
      setError("Failed to load form data.");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [jobId, formId, autoSaveKey, loadSavedData, saveFormData]);

  useEffect(() => {
    if (jobId && formId) {
      fetchData();
    } else {
      setError("Missing job or form information");
      setLoading(false);
    }
  }, [jobId, formId, fetchData]);

  const handleFieldChange = (fieldId: string, value: any) => {
    const updatedData = { ...formData, [fieldId]: value };
    setFormData(updatedData);
    saveFormData(updatedData);
  };

  const handleNextSection = () => {
    if (currentSection === "staff") {
      // Check if form requires signature
      const requiresSignature = form && ["Clearance Certificate", "SAHL Certificate Form", "ABSA Form", "Discovery Form", "Enhanced Liability Form", "Clearance Certificate Form"].includes(form.name);

      if (requiresSignature) {
        setCurrentSection("client");
      } else {
        // For forms without signature requirement, this shouldn't be called
        // as the staff section shows a Submit button instead
        console.warn("handleNextSection called for non-signature form");
      }
    } else if (currentSection === "client") {
      setCurrentSection("signature");
      setShowSignaturePad(true);
    } else if (currentSection === "signature") {
      // Check if this is a dual signature form
      const isDualSignatureForm = ["liability-form", "discovery-form", "clearance-certificate-form"].includes(formId || "");
      if (isDualSignatureForm) {
        setCurrentSection("staff-signature");
      }
    }
  };

  const handleBackSection = () => {
    if (currentSection === "staff-signature") {
      setCurrentSection("signature");
    } else if (currentSection === "signature") {
      setCurrentSection("client");
    } else if (currentSection === "client") {
      setCurrentSection("staff");
    }
  };

  const handleSignatureComplete = (signatureData: string) => {
    if (currentSection === "signature") {
      // Client signature
      setSignature(signatureData);
      // Save signature to form data
      const updatedData = {
        ...formData,
        signature: signatureData,
      };
      setFormData(updatedData);
      saveFormData(updatedData);
    } else if (currentSection === "staff-signature") {
      // Staff signature
      setSignature_staff(signatureData);
    }
    setShowSignaturePad(false);
  };

  const scrollToFirstError = (errors: string[]) => {
    if (errors.length > 0) {
      const firstErrorElement = document.getElementById(`field-${errors[0]}`);
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validate form before submission
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setSaving(false);
      setError(`Please fill in all required fields. Fields highlighted in red need attention.`);

      // Scroll to first error field
      scrollToFirstError(errors);
      return;
    }

    setValidationErrors([]);

    // Signature is optional for staff - they can submit forms without signature if needed
    // This allows flexibility for closing claims or partial submissions

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const submitData: any = {
        jobId,
        formId,
        data: {
          ...formData,
          signature: signature,
          submissionTimestamp: new Date().toISOString(),
        },
        signature: signature, // Client signature
        signature_staff: signature_staff, // Staff signature (optional)
      };

      const response = await fetch("/api/form-submissions", {
        method: "POST",
        headers,
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        setSuccess(true);
        setHasBeenSubmitted(true);
        // Clear saved data on successful submission
        if (autoSaveKey) {
          localStorage.removeItem(autoSaveKey);
        }

        // Don't auto-navigate, allow user to submit again if needed
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        let errorMessage = "Failed to submit form";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If response body can't be parsed as JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        setError(errorMessage);
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || "";
    const hasValidationError = validationErrors.includes(field.id);
    const isSignatureField = field.type === 'signature';
    if (field.dependsOn && field.showWhen && formData[field.dependsOn] !== field.showWhen) return null;
    const isReadonly = field.readonly || (field.autoFillFrom && value);

    const fieldType = (field.type === 'tel') ? 'text' : field.type;

    return (
      <div key={field.id} id={`field-${field.id}`} className={`space-y-2 ${isSignatureField ? 'hidden' : ''}`}>
        <Label htmlFor={field.id} className={hasValidationError ? "text-red-600 font-medium" : ""}>{field.label}{field.required ? ' *' : ''}</Label>
        {isReadonly && field.autoFillFrom ? (
          <div className="p-2 bg-green-50 border border-green-200 rounded-md"><span className="text-green-800 font-medium">{value}</span><Badge variant="secondary" className="ml-2 text-xs">Auto-filled</Badge></div>
        ) : field.type === "textarea" ? (
          <Textarea id={field.id} value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} readOnly={isReadonly} className={hasValidationError ? "border-red-500" : ""} />
        ) : field.type === "select" ? (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)} disabled={isReadonly}>
            <SelectTrigger><SelectValue placeholder={`Select...`} /></SelectTrigger>
            <SelectContent>{field.options?.map((option) => (<SelectItem key={option} value={option}>{option}</SelectItem>))}</SelectContent>
          </Select>
        ) : field.type === "checkbox" ? (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.id}
              checked={value}
              onChange={(e) => {
                handleFieldChange(field.id, e.target.checked);
                if (hasValidationError) {
                  setValidationErrors(prev => prev.filter(id => id !== field.id));
                }
              }}
              disabled={isReadonly}
            />
            <Label htmlFor={field.id}>{field.label}</Label>
          </div>
        ) : (
          <Input
            id={field.id}
            type={fieldType}
            value={value}
            onChange={(e) => {
              handleFieldChange(field.id, e.target.value);
              if (hasValidationError) {
                setValidationErrors(prev => prev.filter(id => id !== field.id));
              }
            }}
            placeholder={field.placeholder}
            required={false}
            readOnly={isReadonly}
            className={hasValidationError ? "border-red-500 border-2 bg-red-50 focus:border-red-500 focus:ring-red-500" : ""}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentFields = (currentSection !== 'signature' && currentSection !== 'staff-signature') ? getFieldsBySection(currentSection) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        
        <div className="mb-6">
          <div className="flex space-x-2 mb-4">
            <Button
              variant="outline"
              onClick={() => {
                navigate('/', {
                  state: {
                    openFillForms: true,
                    jobId: jobId,
                    fromFormFill: true
                  }
                });
              }}
              className=""
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Forms
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                // Navigate to staff dashboard
                navigate('/');
              }}
              className=""
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fill Form</h1>
              <p className="text-gray-600">{form?.name || "Form"}</p>
            </div>
          </div>

          {/* Progress Indicator - Enhanced for 4-tab workflow for dual signature forms */}
          {["liability-form", "discovery-form", "clearance-certificate-form"].includes(formId || "") && (
            <div className="flex items-center space-x-2 mb-4">
              <div
                className={`flex items-center space-x-2 ${currentSection === "staff" ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSection === "staff" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  <User className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Staff</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div
                className={`flex items-center space-x-2 ${currentSection === "client" ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSection === "client" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  <Smartphone className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Client</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div
                className={`flex items-center space-x-2 ${currentSection === "signature" ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSection === "signature" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  <Check className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Client Sign</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div
                className={`flex items-center space-x-2 ${currentSection === "staff-signature" ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSection === "staff-signature" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  <UserCheck className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Staff Sign</span>
              </div>
            </div>
          )}
        </div>

        {/* Job Information Card */}
        {job && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Title:</span> {job.title}
                </div>
                <div>
                  <span className="font-medium">Client:</span>{" "}
                  {job.insuredName || job.InsuredName || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Claim No:</span>{" "}
                  {job.claimNo || job.ClaimNo || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Policy No:</span>{" "}
                  {job.policyNo || job.PolicyNo || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Address:</span>{" "}
                  {job.riskAddress || job.RiskAddress || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Staff:</span>{" "}
                  {staff.find((s) => s.id === job.assignedTo)?.name || "Unassigned"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto-save indicator */}
        <div className="mb-4 text-sm text-gray-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Form data is automatically saved as you type
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Form submitted successfully! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* --- SPECIALIZED FORM COMPONENTS SECTION --- */}
        
        {form && formId === "noncompliance-form" && job && ( 
          <NoncomplianceForm 
            job={job} 
            assignedStaff={staff.find(s => s.id === job.assignedTo) || null} 
            onSubmit={async (formData) => {
              setSaving(true); 
              setError(null); 
              try { 
                const token = localStorage.getItem("auth_token"); 
                const headers: Record<string, string> = { "Content-Type": "application/json" }; 
                if (token) headers.Authorization = `Bearer ${token}`;
                const response = await fetch("/api/form-submissions", { 
                  method: "POST", 
                  headers, 
                  body: JSON.stringify({ jobId, formId, data: formData }), 
                });
                if (response.ok) handleSuccessfulSubmission(); 
                else { 
                  const e = await response.json().catch(()=>({e:response.statusText}));
                  setError(e.error||"Failed to submit"); 
                }
              } catch (e) { 
                setError("Network error"); 
              } finally { 
                setSaving(false); 
              }
            }} 
          /> 
        )}
        
        {form && formId === "material-list-form" && job && ( 
          <MaterialListForm 
            job={job} 
            assignedStaff={staff.find(s => s.id === job.assignedTo) || null} 
            existingData={editMode ? existingData : undefined} 
            onSubmit={async (formData) => {
              setSaving(true); 
              setError(null); 
              try { 
                const token = localStorage.getItem("auth_token"); 
                const headers: Record<string, string> = { "Content-Type": "application/json" }; 
                if (token) headers.Authorization = `Bearer ${token}`;
                const response = await fetch("/api/form-submissions", { 
                  method: "POST", 
                  headers, 
                  body: JSON.stringify({ jobId, formId, data: formData }), 
                });
                if (response.ok) handleSuccessfulSubmission(); 
                else { 
                  const e = await response.json().catch(()=>({e:response.statusText}));
                  setError(e.error||"Failed to submit"); 
                }
              } catch (e) { 
                setError("Network error"); 
              } finally { 
                setSaving(false); 
              }
            }} 
          /> 
        )}
        
        {form && formId === "liability-form" && job && (
          <EnhancedLiabilityForm
            job={job}
            assignedStaff={staff.find(s => s.id === job.assignedTo) || null}
            onSubmit={async (formData, signature, signature_staff) => {
              setSaving(true);
              setError(null);
              try {
                const token = localStorage.getItem("auth_token");
                const headers: Record<string, string> = { "Content-Type": "application/json" };
                if (token) headers.Authorization = `Bearer ${token}`;
                const response = await fetch("/api/form-submissions", {
                  method: "POST",
                  headers,
                  body: JSON.stringify({
                    jobId,
                    formId,
                    data: formData,
                    signature: signature,
                    signature_staff: signature_staff
                  }),
                });
                if (response.ok) handleSuccessfulSubmission();
                else {
                  const e = await response.json().catch(()=>({e:response.statusText}));
                  setError(e.error||"Failed to submit");
                }
              } catch (e) {
                setError("Network error");
              } finally {
                setSaving(false);
              }
            }}
          />
        )}
        
        {form && formId === "clearance-certificate-form" && job && (
          <ClearanceCertificateForm
            job={job}
            assignedStaff={staff.find(s => s.id === job.assignedTo) || null}
            onSubmit={async (formData, signature, signature_staff) => {
              setSaving(true);
              setError(null);
              try {
                const token = localStorage.getItem("auth_token");
                const headers: Record<string, string> = { "Content-Type": "application/json" };
                if (token) headers.Authorization = `Bearer ${token}`;
                const response = await fetch("/api/form-submissions", {
                  method: "POST",
                  headers,
                  body: JSON.stringify({
                    jobId,
                    formId,
                    data: formData,
                    signature: signature,
                    signature_staff: signature_staff
                  }),
                });
                if (response.ok) handleSuccessfulSubmission();
                else {
                  const e = await response.json().catch(()=>({e:response.statusText}));
                  setError(e.error||"Failed to submit");
                }
              } catch (e) {
                setError("Network error");
              } finally {
                setSaving(false);
              }
            }}
          />
        )}

        {form && formId === "discovery-form" && job && (
          <DiscoveryForm
            job={job}
            assignedStaff={staff.find(s => s.id === job.assignedTo) || null}
            onSubmit={async (formData, signature, signature_staff) => {
              console.log("DiscoveryForm API call in EnhancedFormFillPage:");
              console.log("- signature present:", !!signature);
              console.log("- signature_staff present:", !!signature_staff);
              console.log("- Request body signature fields:", {
                signature: signature ? "Present" : "Missing",
                signature_staff: signature_staff ? "Present" : "Missing"
              });

              setSaving(true);
              setError(null);
              try {
                const token = localStorage.getItem("auth_token");
                const headers: Record<string, string> = { "Content-Type": "application/json" };
                if (token) headers.Authorization = `Bearer ${token}`;
                const response = await fetch("/api/form-submissions", {
                  method: "POST",
                  headers,
                  body: JSON.stringify({
                    jobId,
                    formId,
                    data: formData,
                    signature: signature,
                    signature_staff: signature_staff
                  }),
                });
                if (response.ok) handleSuccessfulSubmission();
                else {
                  const e = await response.json().catch(()=>({e:response.statusText}));
                  setError(e.error||"Failed to submit");
                }
              } catch (e) {
                setError("Network error");
              } finally {
                setSaving(false);
              }
            }}
          />
        )}

        {form && formId === "sahl-certificate-form" && job && (
          <SAHLCertificateForm 
            job={job} 
            assignedStaff={staff.find(s => s.id === job.assignedTo) || null} 
            onSubmit={async (formData) => {
              setSaving(true); 
              setError(null); 
              try { 
                const token = localStorage.getItem("auth_token"); 
                const headers: Record<string, string> = { "Content-Type": "application/json" }; 
                if (token) headers.Authorization = `Bearer ${token}`;
                const response = await fetch("/api/form-submissions", { 
                  method: "POST", 
                  headers, 
                  body: JSON.stringify({ jobId, formId, data: formData }), 
                });
                if (response.ok) handleSuccessfulSubmission(); 
                else { 
                  const e = await response.json().catch(()=>({e:response.statusText}));
                  setError(e.error||"Failed to submit"); 
                }
              } catch (e) { 
                setError("Network error"); 
              } finally { 
                setSaving(false); 
              }
            }} 
          />
        )}

        {form && formId === "absa-form" && job && (
          <ABSAForm 
            job={job} 
            assignedStaff={staff.find(s => s.id === job.assignedTo) || null} 
            onSubmit={async (formData) => {
              setSaving(true); 
              setError(null); 
              try { 
                const token = localStorage.getItem("auth_token"); 
                const headers: Record<string, string> = { "Content-Type": "application/json" }; 
                if (token) headers.Authorization = `Bearer ${token}`;
                const response = await fetch("/api/form-submissions", { 
                  method: "POST", 
                  headers, 
                  body: JSON.stringify({ jobId, formId, data: formData }), 
                });
                if (response.ok) handleSuccessfulSubmission(); 
                else { 
                  const e = await response.json().catch(()=>({e:response.statusText}));
                  setError(e.error||"Failed to submit"); 
                }
              } catch (e) { 
                setError("Network error"); 
              } finally { 
                setSaving(false); 
              }
            }} 
          />
        )}

        {/* Generic Form Section for other forms */}
        {form && !["noncompliance-form", "material-list-form", "liability-form", "clearance-certificate-form", "sahl-certificate-form", "absa-form", "discovery-form"].includes(formId || "") && currentSection !== "signature" && currentSection !== "staff-signature" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {currentSection === "staff" ? "Staff" : "Client"} Section
              </CardTitle>
              <p className="text-gray-600">
                {currentSection === "staff"
                  ? "Complete the staff portion of the form"
                  : "Client to complete this section"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentFields.map(renderField)}
                </div>

                <div className="flex justify-between pt-6 border-t">
                  {currentSection === "client" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackSection}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  )}

                  <div className="flex space-x-4 ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                    {(() => {
                      // Core forms don't require signature
                      const coreFormIds = ["noncompliance-form", "material-list-form"];
                      const isCore = coreFormIds.some(id => form?.name?.toLowerCase().includes(id.replace("-form", "").replace("-", " ")));
                      const requiresSignature = form && !isCore && ["Clearance Certificate", "SAHL Certificate Form", "ABSA Form", "Discovery Form", "Enhanced Liability Form"].includes(form.name);

                      if (currentSection === "staff") {
                        // Only show "Hand to Client" for signature-required forms
                        if (requiresSignature) {
                          return (
                            <Button type="button" onClick={handleNextSection}>
                              Hand to Client
                              <Smartphone className="h-4 w-4 ml-2" />
                            </Button>
                          );
                        } else {
                          // For other forms, submit directly without signature
                          return (
                            <Button type="submit" disabled={saving}>
                              {saving ? "Submitting..." : hasBeenSubmitted ? "Submit Again" : "Submit Form"}
                              <Check className="h-4 w-4 ml-2" />
                            </Button>
                          );
                        }
                      } else {
                        // Client section - show "Get Signature" only for signature-required forms
                        if (requiresSignature) {
                          return (
                            <Button type="button" onClick={handleNextSection}>
                              Get Signature
                              <Smartphone className="h-4 w-4 ml-2" />
                            </Button>
                          );
                        } else {
                          // Should not reach here for non-signature forms
                          return null;
                        }
                      }
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signature Section */}
        {currentSection === "signature" && !showSignaturePad && (
          <Card>
            <CardHeader>
              <CardTitle>Signature Required</CardTitle>
              <p className="text-gray-600">
                Client signature is required to complete the form
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                {signature ? (
                  <div className="space-y-4">
                    <div className="text-green-600 font-medium">
                      ✓ Signature captured
                    </div>
                    <img
                      src={signature}
                      alt="Client signature"
                      className="mx-auto border rounded-lg max-w-md"
                    />
                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowSignaturePad(true)}
                      >
                        Retake Signature
                      </Button>
                      {(() => {
                        const isDualSignatureForm = ["liability-form", "discovery-form", "clearance-certificate-form"].includes(formId || "");
                        if (isDualSignatureForm) {
                          return (
                            <Button
                              onClick={handleNextSection}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Continue to Staff Signature
                            </Button>
                          );
                        } else {
                          return (
                            <Button
                              onClick={handleSubmit}
                              disabled={saving}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {saving ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  {hasBeenSubmitted ? "Submit Again" : "Submit Form"}
                                </>
                              )}
                            </Button>
                          );
                        }
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg">Ready for client signature</p>
                    <Button
                      onClick={() => setShowSignaturePad(true)}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Open Signature Pad
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-start pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackSection}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Client Section
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff Signature Section */}
        {currentSection === "staff-signature" && (
          <Card>
            <CardHeader>
              <CardTitle>Staff Signature Required</CardTitle>
              <p className="text-gray-600">
                Staff signature needed to complete the dual signature process
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                {signature_staff ? (
                  <div className="space-y-4">
                    <div className="text-green-600 font-medium">
                      ✓ Staff signature captured
                    </div>
                    <img
                      src={signature_staff}
                      alt="Staff signature"
                      className="mx-auto border rounded-lg max-w-md"
                    />
                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSignature_staff("");
                          setShowSignaturePad(true);
                        }}
                      >
                        Retake Signature
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Submit Form with Dual Signatures
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg">Ready for staff signature</p>
                    <Button
                      onClick={() => setShowSignaturePad(true)}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Open Staff Signature Pad
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-start pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackSection}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Client Signature
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Full Screen Signature Pad */}
      <FullScreenSignaturePad
        isOpen={showSignaturePad}
        onSignatureComplete={handleSignatureComplete}
        onCancel={() => setShowSignaturePad(false)}
        title={currentSection === "staff-signature" ? "Staff Signature Required" : "Client Signature Required"}
      />
    </div>
  );
}
