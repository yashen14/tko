import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Job, User, Form, FormSubmission } from "@shared/types";
import {
  FileText,
  Package,
  AlertCircle,
  Shield,
  CheckCircle,
  ExternalLink,
  Building,
  CreditCard,
  Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AdditionalFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  assignedStaff: User | null;
}

export function AdditionalFormsModal({
  isOpen,
  onClose,
  job,
  assignedStaff,
}: AdditionalFormsModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittedForms, setSubmittedForms] = useState<FormSubmission[]>([]);

  useEffect(() => {
    if (isOpen && job) {
      fetchData();
    }
  }, [isOpen, job]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [formsRes, submissionsRes] = await Promise.all([
        fetch("/api/forms", { headers }),
        fetch(`/api/form-submissions?jobId=${job.id}`, { headers }),
      ]);

      const [formsData, submissionsData] = await Promise.all([
        formsRes.json(),
        submissionsRes.json(),
      ]);

      setForms(formsData);
      setSubmissions(submissionsData);
      setSubmittedForms(submissionsData);
    } catch (error) {
      console.error("Failed to load forms data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFillForm = (formId: string) => {
    navigate("/fill-form", {
      state: { jobId: job.id, formId },
    });
    onClose();
  };

  const isFormSubmitted = (formId: string) => {
    return submissions.some((s) => s.formId === formId);
  };

  const isFormStamped = (formId: string) => {
    const submission = submissions.find((s) => s.formId === formId);
    return submission?.isStamped || false;
  };

  const getAvailableForms = () => {
    return forms.filter(
      (f) =>
        f.id === job?.formId ||
        job?.formIds?.includes(f.id) ||
        f.isTemplate
    );
  };

  // Core forms that appear on every job
  const coreFormTypes = [
  { id: "noncompliance-form", name: "Non Compliance Form", shortName: "NCompliance", icon: AlertCircle, color: "red" },
  { id: "material-list-form", name: "Material List Form", shortName: "Materials", icon: Package, color: "blue" },
  { id: "liability-form", name: "Liability Form", shortName: "Liability", icon: Shield, color: "green" },
  { id: "discovery-form", name: "Discovery Form", shortName: "Discovery", icon: Search, color: "purple" },
  { id: "clearance-certificate-form", name: "Clearance Certificate Form", shortName: "Certificate", icon: Shield, color: "blue" },
];

  // Company-specific forms removed - keeping only core forms

  const handleFormSubmissionUpdate = (newSubmission: FormSubmission) => {
    setSubmittedForms(prev => [...prev, newSubmission]);
    setSubmissions(prev => [...prev, newSubmission]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const groupSubmissionsByDate = () => {
    const grouped = submittedForms.reduce((acc, submission) => {
      const date = formatDate(submission.submittedAt);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(submission);
      return acc;
    }, {} as Record<string, FormSubmission[]>);

    return Object.entries(grouped).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  };

  const getFormName = (formId: string, useShortName = false) => {
    const coreForm = coreFormTypes.find(f => f.id === formId);
    if (coreForm) return useShortName ? coreForm.shortName : coreForm.name;

    const dbForm = forms.find(f => f.id === formId);
    if (dbForm) {
      if (useShortName) {
        // Short names for specific forms
        if (dbForm.name.includes('Clearance Certificate')) return 'Clearance';
        if (dbForm.name.includes('SAHL Certificate')) return 'SAHL';
        if (dbForm.name.includes('ABSA')) return 'ABSA';
        if (dbForm.name.includes('Liability')) return 'Liab';
        if (dbForm.name.includes('Discovery')) return 'Disco';
      }
      return dbForm.name;
    }
    return "Unknown Form";
  };

  const FormButton = ({ formType, isSubmitted }: { formType: any, isSubmitted: boolean }) => {
    const Icon = formType.icon;
    
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-${formType.color}-100`}>
            <Icon className={`h-5 w-5 text-${formType.color}-600`} />
          </div>
          <div>
            <span className="font-medium text-gray-900 sm:text-sm">
              <span className="hidden sm:inline">{formType.name}</span>
              <span className="sm:hidden">{formType.shortName}</span>
            </span>
            {isSubmitted && (
              <div className="mt-2">
                <hr className="border-gray-200 mb-2" />
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Submitted by {user?.name || 'Staff'}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant={isSubmitted ? "outline" : "default"}
          onClick={() => handleFillForm(formType.id)}
          className={`${isSubmitted ? "text-green-600 border-green-300" : ""} sm:px-2 sm:py-1`}
        >
          {isSubmitted ? (
            <>
              <span className="hidden sm:flex sm:items-center">
                <ExternalLink className="h-3 w-3 mr-1" />
                Submit Again
              </span>
              <span className="sm:hidden">
                <ExternalLink className="h-4 w-4" />
              </span>
            </>
          ) : (
            <>
              <span className="hidden sm:flex sm:items-center">
                <FileText className="h-3 w-3 mr-1" />
                Fill Form
              </span>
              <span className="sm:hidden">
                <FileText className="h-4 w-4" />
              </span>
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Fill Forms
            <Badge variant="outline" className="ml-2">
              {job.title}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Column - Forms */}
          <div className="space-y-6">
            <ScrollArea className="h-[calc(95vh-200px)]">
              {/* Core Forms Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Core Forms</CardTitle>
                  <p className="text-sm text-gray-600">Required for every job</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {coreFormTypes.map((formType) => {
                    const isSubmitted = isFormSubmitted(formType.id);
                    return (
                      <FormButton 
                        key={formType.id} 
                        formType={formType} 
                        isSubmitted={isSubmitted} 
                      />
                    );
                  })}
                </CardContent>
              </Card>


              {/* Standard Forms from Database */}
              {getAvailableForms().length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Job Assigned Forms</CardTitle>
                    <p className="text-sm text-gray-600">Forms specifically assigned to this job</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {getAvailableForms().map((form) => {
                      const isSubmitted = isFormSubmitted(form.id);
                      
                      const getFormIcon = (formId: string) => {
                        if (formId.includes('absa')) return { icon: Shield, color: 'blue' };
                        if (formId.includes('sahl')) return { icon: Shield, color: 'green' };
                        if (formId.includes('discovery')) return { icon: Shield, color: 'purple' };
                        if (formId.includes('material')) return { icon: Package, color: 'blue' };
                        if (formId.includes('noncompliance')) return { icon: AlertCircle, color: 'red' };
                        if (formId.includes('liability')) return { icon: Shield, color: 'green' };
                        if (formId.includes('clearance')) return { icon: Shield, color: 'green' };
                        return { icon: FileText, color: 'gray' };
                      };

                      const formIconInfo = getFormIcon(form.id);
                      const FormIcon = formIconInfo.icon;

                      return (
                        <div key={form.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-${formIconInfo.color}-100`}>
                              <FormIcon className={`h-5 w-5 text-${formIconInfo.color}-600`} />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 sm:text-sm">
                                <span className="hidden sm:inline">{form.name}</span>
                                <span className="sm:hidden">{getFormName(form.id, true)}</span>
                              </span>
                              {isSubmitted && (
                                <div className="mt-2">
                                  <hr className="border-gray-200 mb-2" />
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Submitted by {user?.name || 'Staff'}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isSubmitted ? "outline" : "default"}
                            onClick={() => handleFillForm(form.id)}
                            className={`${isSubmitted ? "text-green-600 border-green-300" : ""} sm:px-2 sm:py-1`}
                          >
                            {isSubmitted ? (
                              <>
                                <span className="hidden sm:flex sm:items-center">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Submit Again
                                </span>
                                <span className="sm:hidden">
                                  <ExternalLink className="h-4 w-4" />
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="hidden sm:flex sm:items-center">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Fill Form
                                </span>
                                <span className="sm:hidden">
                                  <FileText className="h-4 w-4" />
                                </span>
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </ScrollArea>
          </div>

          {/* Right Column - Submitted Forms */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submitted Forms</CardTitle>
                <p className="text-sm text-gray-600">Forms completed for this job</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(95vh-250px)]">
                  {submittedForms.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No forms submitted yet</p>
                      <p className="text-sm">Fill out forms to see them here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupSubmissionsByDate().map(([date, dateSubmissions]) => (
                        <div key={date} className="space-y-3">
                          <h4 className="font-medium text-gray-700 border-b pb-1">{date}</h4>
                          <div className="grid gap-3">
                            {dateSubmissions.map((submission) => (
                              <div
                                key={submission.id}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-sm">
                                      {getFormName(submission.formId)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(submission.submittedAt).toLocaleTimeString()}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Complete
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
