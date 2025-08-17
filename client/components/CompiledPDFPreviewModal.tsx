import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Job, FormSubmission } from "@shared/types";
import { FileText, Download, Eye, X, Package, AlertCircle, Shield } from "lucide-react";

interface CompiledPDFPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  submissions: FormSubmission[];
  onConfirmDownload: () => void;
}

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

const getFormIcon = (formId: string) => {
  switch (formId) {
    case "material-list-form":
      return <Package className="h-4 w-4 text-blue-600" />;
    case "noncompliance-form":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case "form-liability-certificate":
    case "liability-form":
      return <Shield className="h-4 w-4 text-green-600" />;
    default:
      return <FileText className="h-4 w-4 text-gray-600" />;
  }
};

export function CompiledPDFPreviewModal({
  open,
  onOpenChange,
  job,
  submissions,
  onConfirmDownload
}: CompiledPDFPreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await onConfirmDownload();
    } finally {
      setIsGenerating(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>PDF Compilation Preview</span>
          </DialogTitle>
          <DialogDescription>
            Preview the forms that will be compiled into a single PDF report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Job Title</p>
                  <p className="text-base">{job.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Client</p>
                  <p className="text-base">{job.insuredName || job.InsuredName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Claim Number</p>
                  <p className="text-base">{job.claimNo || job.ClaimNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                    {job.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forms to be Compiled */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Forms to be Compiled ({submissions.length})</CardTitle>
              <p className="text-sm text-gray-600">
                The following forms will be merged into a single PDF document
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.map((submission, index) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      {getFormIcon(submission.formId)}
                      <div>
                        <p className="font-medium">{getFormDisplayName(submission.formId)}</p>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(submission.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {submission.formType || 'Form'}
                    </Badge>
                  </div>
                ))}

                {submissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No forms found for this job</p>
                    <p className="text-sm">Cannot generate compiled PDF without forms</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PDF Structure Preview */}
          {submissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PDF Structure</CardTitle>
                <p className="text-sm text-gray-600">
                  Your compiled PDF will contain the following sections
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                    <span>Title Page (Job summary, client info, generation date)</span>
                  </div>
                  {submissions.map((submission, index) => (
                    <div key={submission.id} className="flex items-center space-x-2 text-sm">
                      <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs">
                        {index + 2}
                      </span>
                      <span>{getFormDisplayName(submission.formId)} (1-2 pages)</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Estimated total pages:</strong> {submissions.length * 2 + 1} pages
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={submissions.length === 0 || isGenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Generating PDF...</span>
                </div>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
