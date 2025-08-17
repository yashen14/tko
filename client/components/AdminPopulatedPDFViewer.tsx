import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Download,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminPopulatedPDFViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formSubmission: {
    id: string;
    formId: string;
    jobId: string;
    submittedBy: string;
    submittedAt: string;
    data: Record<string, any>;
  };
  jobDetails?: {
    id: string;
    title: string;
    description: string;
    companyName?: string;
  };
}

export function AdminPopulatedPDFViewer({
  open,
  onOpenChange,
  formSubmission,
  jobDetails
}: AdminPopulatedPDFViewerProps) {
  const { user } = useAuth();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (open && formSubmission && isAdmin) {
      generatePopulatedPDF();
    }
  }, [open, formSubmission, isAdmin]);

  const generatePopulatedPDF = async () => {
    if (!isAdmin) {
      setError("Admin access required to view populated PDFs");
      return;
    }

    setLoading(true);
    setError(null);

    // Create AbortController to handle request cancellation
    const abortController = new AbortController();

    try {
      const token = localStorage.getItem("auth_token");
      const url = `/api/admin/forms/${formSubmission.formId}/submissions/${formSubmission.id}/populated-pdf`;

      console.log("Generating PDF for:", {
        formId: formSubmission.formId,
        submissionId: formSubmission.id,
        url: url,
        hasToken: !!token
      });

      const response = await fetch(url, {
        signal: abortController.signal,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'user-role': user?.role || 'user'
        },
      });

      console.log("Response status:", response.status, response.statusText);

      if (response.ok) {
        console.log("Response is OK, getting blob...");
        const blob = await response.blob();
        console.log("Blob size:", blob.size, "type:", blob.type);

        // Check if request was aborted before creating URL
        if (abortController.signal.aborted) {
          console.log("Request was aborted, not creating PDF URL");
          return;
        }

        const objectUrl = window.URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
        console.log("PDF URL created successfully");
      } else {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          // Clone the response to read it as text if needed
          const responseClone = response.clone();
          const errorText = await responseClone.text();
          console.log("Error response text:", errorText);
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorJson.message || errorText;
            } catch {
              errorMessage = errorText;
            }
          }
        } catch (readError) {
          console.warn("Could not read error response body:", readError);
        }
        throw new Error(`Failed to generate PDF: ${errorMessage}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Request was aborted");
        return;
      }
      console.error("Error generating populated PDF:", error);
      setError(error instanceof Error ? error.message : "Failed to generate PDF");
    } finally {
      setLoading(false);
    }

    // Cleanup function
    return () => {
      abortController.abort();
    };
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = `populated-${formSubmission.formId}-${formSubmission.jobId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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

  const formatDataValue = (value: any): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      return '[Signature/Image Data]';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value || '');
  };

  // Cleanup URL when component unmounts or dialog closes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!open && pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [open]);

  if (!isAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-300" />
            <p className="text-gray-600">
              Admin access is required to view populated form PDFs.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <div className="flex items-center gap-2">
                  Populated Form Data: {getFormDisplayName(formSubmission.formId)}
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin Only
                  </Badge>
                </div>
                {jobDetails && (
                  <p className="text-sm text-gray-600 mt-1">
                    Job: {jobDetails.title}
                    {jobDetails.companyName && ` • ${jobDetails.companyName}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* PDF Viewer */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="bg-gray-50 p-3 border-b">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Populated PDF Preview
              </h3>
            </div>
            <div className="flex-1 bg-gray-100 flex items-center justify-center">
              {loading && (
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating populated PDF...</p>
                </div>
              )}
              
              {error && (
                <div className="text-center max-w-md">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button
                    variant="outline"
                    onClick={generatePopulatedPDF}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Retry
                  </Button>
                </div>
              )}
              
              {pdfUrl && !loading && !error && (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="Populated Form PDF"
                />
              )}
            </div>
          </div>

          {/* Form Data Summary */}
          <div className="w-80 flex flex-col">
            <div className="bg-gray-50 p-3 border-b">
              <h3 className="font-medium text-gray-900">Form Data Summary</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Submission Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div>
                    <span className="font-medium">Submitted by:</span>
                    <br />
                    <span className="text-gray-600">{formSubmission.submittedBy}</span>
                  </div>
                  <div>
                    <span className="font-medium">Submitted at:</span>
                    <br />
                    <span className="text-gray-600">
                      {new Date(formSubmission.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Job ID:</span>
                    <br />
                    <span className="text-gray-600">{formSubmission.jobId}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Form Fields</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-3">
                  {Object.entries(formSubmission.data || {}).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-100 pb-2 last:border-b-0">
                      <div className="font-medium text-gray-700 mb-1">
                        {key.replace(/^field-/, '').replace(/-/g, ' ').toUpperCase()}
                      </div>
                      <div className="text-gray-600 break-words">
                        {formatDataValue(value)}
                      </div>
                    </div>
                  ))}
                  {Object.keys(formSubmission.data || {}).length === 0 && (
                    <p className="text-gray-400 italic">No form data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
