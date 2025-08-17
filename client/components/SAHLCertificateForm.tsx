import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building, Save, AlertCircle, FileText } from "lucide-react";
import { Job, User } from "@shared/types";

interface SAHLCertificateFormData {
  id: string;
  jobId: string;
  date: string;
  insurance: string;
  claimNumber: string;
  client: string;
  plumber: string;
  address: string;
  
  // SAHL specific fields
  sahLoanNumber: string;
  propertyValue: string;
  workType: string;
  totalCost: string;
  
  // Installation details
  geyserMake: string;
  geyserModel: string;
  geyserCapacity: string;
  installationDate: string;
  warrantyPeriod: string;
  
  // Compliance checks
  municipalApproval: string;
  buildingRegulations: string;
  electricalCompliance: string;
  plumbingCompliance: string;
  
  // Quality assurance
  materialStandard: string;
  installationQuality: string;
  finalTesting: string;
  
  // Certification
  certificationStatement: string;
  certifierName: string;
  certifierRegistration: string;
  certificationDate: string;
  
  additionalNotes: string;
}

interface SAHLCertificateFormProps {
  job: Job;
  assignedStaff: User | null;
  onSubmit: (formData: SAHLCertificateFormData) => void;
  existingData?: SAHLCertificateFormData;
}

export function SAHLCertificateForm({
  job,
  assignedStaff,
  onSubmit,
  existingData,
}: SAHLCertificateFormProps) {
  const [formData, setFormData] = useState<SAHLCertificateFormData>(() => ({
    id: existingData?.id || `sahl-cert-${Date.now()}`,
    jobId: job.id,
    date: existingData?.date || new Date().toISOString().split("T")[0],
    insurance: existingData?.insurance || job.underwriter || job.Underwriter || "",
    claimNumber: existingData?.claimNumber || job.claimNo || job.ClaimNo || "",
    client: existingData?.client || job.insuredName || job.InsuredName || "",
    plumber: existingData?.plumber || assignedStaff?.name || "",
    address: existingData?.address || job.riskAddress || job.RiskAddress || "",
    
    sahLoanNumber: existingData?.sahLoanNumber || job.policyNo || job.PolicyNo || "",
    propertyValue: existingData?.propertyValue || "",
    workType: existingData?.workType || "Geyser Installation",
    totalCost: existingData?.totalCost || "",
    
    geyserMake: existingData?.geyserMake || "",
    geyserModel: existingData?.geyserModel || "",
    geyserCapacity: existingData?.geyserCapacity || "",
    installationDate: existingData?.installationDate || new Date().toISOString().split("T")[0],
    warrantyPeriod: existingData?.warrantyPeriod || "5 years",
    
    municipalApproval: existingData?.municipalApproval || "Approved",
    buildingRegulations: existingData?.buildingRegulations || "Compliant",
    electricalCompliance: existingData?.electricalCompliance || "Compliant",
    plumbingCompliance: existingData?.plumbingCompliance || "Compliant",
    
    materialStandard: existingData?.materialStandard || "SABS Approved",
    installationQuality: existingData?.installationQuality || "Excellent",
    finalTesting: existingData?.finalTesting || "Passed",
    
    certificationStatement: existingData?.certificationStatement || "I hereby certify that the installation work has been completed according to SAHL requirements and industry standards.",
    certifierName: existingData?.certifierName || assignedStaff?.name || "",
    certifierRegistration: existingData?.certifierRegistration || "",
    certificationDate: existingData?.certificationDate || new Date().toISOString().split("T")[0],
    
    additionalNotes: existingData?.additionalNotes || "",
  }));

  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const required = [];
    if (!formData.workType.trim()) required.push("workType");
    if (!formData.geyserMake.trim()) required.push("geyserMake");
    if (!formData.certifierName.trim()) required.push("certifierName");
    
    if (required.length > 0) {
      setRequiredFields(required);
      return;
    }
    
    setRequiredFields([]);
    onSubmit(formData);
  };

  const updateField = (field: keyof SAHLCertificateFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (requiredFields.includes(field)) {
      setRequiredFields(requiredFields.filter(f => f !== field));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center text-blue-800">
          <Building className="h-6 w-6 mr-3" />
          SAHL Certificate Form
          <Badge variant="outline" className="ml-3">
            {formData.workType}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="insurance">Insurance Company</Label>
              <Input
                id="insurance"
                value={formData.insurance}
                onChange={(e) => updateField("insurance", e.target.value)}
                className="bg-blue-50 font-medium"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="claimNumber">Claim Number</Label>
              <Input
                id="claimNumber"
                value={formData.claimNumber}
                onChange={(e) => updateField("claimNumber", e.target.value)}
                className="bg-blue-50 font-medium"
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client Name</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => updateField("client", e.target.value)}
                className="bg-blue-50 font-medium"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="plumber">Plumber/Technician</Label>
              <Input
                id="plumber"
                value={formData.plumber}
                onChange={(e) => updateField("plumber", e.target.value)}
                className="bg-blue-50 font-medium"
                readOnly
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Property Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="bg-blue-50"
              readOnly
            />
          </div>

          <Separator />

          {/* SAHL Specific Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              SAHL Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sahLoanNumber">SAHL Loan Number</Label>
                <Input
                  id="sahLoanNumber"
                  value={formData.sahLoanNumber}
                  onChange={(e) => updateField("sahLoanNumber", e.target.value)}
                  placeholder="Loan account number"
                />
              </div>
              <div>
                <Label htmlFor="propertyValue">Property Value</Label>
                <Input
                  id="propertyValue"
                  value={formData.propertyValue}
                  onChange={(e) => updateField("propertyValue", e.target.value)}
                  placeholder="R 0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workType" className={requiredFields.includes("workType") ? "text-yellow-600" : ""}>
                  Work Type *
                </Label>
                <Select value={formData.workType} onValueChange={(value) => updateField("workType", value)}>
                  <SelectTrigger className={requiredFields.includes("workType") ? "border-yellow-500 bg-yellow-50" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geyser Installation">Geyser Installation</SelectItem>
                    <SelectItem value="Geyser Replacement">Geyser Replacement</SelectItem>
                    <SelectItem value="Plumbing Repair">Plumbing Repair</SelectItem>
                    <SelectItem value="System Upgrade">System Upgrade</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                {requiredFields.includes("workType") && (
                  <p className="text-yellow-600 text-sm mt-1">This field is required</p>
                )}
              </div>
              <div>
                <Label htmlFor="totalCost">Total Cost</Label>
                <Input
                  id="totalCost"
                  value={formData.totalCost}
                  onChange={(e) => updateField("totalCost", e.target.value)}
                  placeholder="R 0.00"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Installation Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Installation Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="geyserMake" className={requiredFields.includes("geyserMake") ? "text-yellow-600" : ""}>
                  Geyser Make *
                </Label>
                <Input
                  id="geyserMake"
                  value={formData.geyserMake}
                  onChange={(e) => updateField("geyserMake", e.target.value)}
                  placeholder="e.g. Kwikot, Heattech"
                  className={requiredFields.includes("geyserMake") ? "border-yellow-500 bg-yellow-50" : ""}
                />
                {requiredFields.includes("geyserMake") && (
                  <p className="text-yellow-600 text-sm mt-1">This field is required</p>
                )}
              </div>
              <div>
                <Label htmlFor="geyserModel">Geyser Model</Label>
                <Input
                  id="geyserModel"
                  value={formData.geyserModel}
                  onChange={(e) => updateField("geyserModel", e.target.value)}
                  placeholder="Model number"
                />
              </div>
              <div>
                <Label htmlFor="geyserCapacity">Capacity</Label>
                <Select value={formData.geyserCapacity} onValueChange={(value) => updateField("geyserCapacity", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100L">100L</SelectItem>
                    <SelectItem value="150L">150L</SelectItem>
                    <SelectItem value="200L">200L</SelectItem>
                    <SelectItem value="250L">250L</SelectItem>
                    <SelectItem value="300L">300L</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="installationDate">Installation Date</Label>
                <Input
                  id="installationDate"
                  type="date"
                  value={formData.installationDate}
                  onChange={(e) => updateField("installationDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="warrantyPeriod">Warranty Period</Label>
                <Select value={formData.warrantyPeriod} onValueChange={(value) => updateField("warrantyPeriod", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 year">1 year</SelectItem>
                    <SelectItem value="2 years">2 years</SelectItem>
                    <SelectItem value="5 years">5 years</SelectItem>
                    <SelectItem value="10 years">10 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Compliance Checks */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Compliance Verification</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="municipalApproval">Municipal Approval</Label>
                <Select value={formData.municipalApproval} onValueChange={(value) => updateField("municipalApproval", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Not Required">Not Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="buildingRegulations">Building Regulations</Label>
                <Select value={formData.buildingRegulations} onValueChange={(value) => updateField("buildingRegulations", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Compliant">Compliant</SelectItem>
                    <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="electricalCompliance">Electrical Compliance</Label>
                <Select value={formData.electricalCompliance} onValueChange={(value) => updateField("electricalCompliance", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Compliant">Compliant</SelectItem>
                    <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                    <SelectItem value="N/A">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="plumbingCompliance">Plumbing Compliance</Label>
                <Select value={formData.plumbingCompliance} onValueChange={(value) => updateField("plumbingCompliance", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Compliant">Compliant</SelectItem>
                    <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quality Assurance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Quality Assurance</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="materialStandard">Material Standard</Label>
                <Select value={formData.materialStandard} onValueChange={(value) => updateField("materialStandard", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SABS Approved">SABS Approved</SelectItem>
                    <SelectItem value="ISO Certified">ISO Certified</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="installationQuality">Installation Quality</Label>
                <Select value={formData.installationQuality} onValueChange={(value) => updateField("installationQuality", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="finalTesting">Final Testing</Label>
                <Select value={formData.finalTesting} onValueChange={(value) => updateField("finalTesting", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Passed">Passed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Certification */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Certification</h3>

            <div>
              <Label htmlFor="certificationStatement">Certification Statement</Label>
              <Textarea
                id="certificationStatement"
                value={formData.certificationStatement}
                onChange={(e) => updateField("certificationStatement", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="certifierName" className={requiredFields.includes("certifierName") ? "text-yellow-600" : ""}>
                  Certifier Name *
                </Label>
                <Input
                  id="certifierName"
                  value={formData.certifierName}
                  onChange={(e) => updateField("certifierName", e.target.value)}
                  placeholder="Name of certifying professional"
                  className={requiredFields.includes("certifierName") ? "border-yellow-500 bg-yellow-50" : ""}
                />
                {requiredFields.includes("certifierName") && (
                  <p className="text-yellow-600 text-sm mt-1">This field is required</p>
                )}
              </div>
              <div>
                <Label htmlFor="certifierRegistration">Registration Number</Label>
                <Input
                  id="certifierRegistration"
                  value={formData.certifierRegistration}
                  onChange={(e) => updateField("certifierRegistration", e.target.value)}
                  placeholder="Professional registration number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="certificationDate">Certification Date</Label>
              <Input
                id="certificationDate"
                type="date"
                value={formData.certificationDate}
                onChange={(e) => updateField("certificationDate", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Additional Notes */}
          <div>
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => updateField("additionalNotes", e.target.value)}
              placeholder="Any additional information or special conditions..."
              rows={3}
            />
          </div>

          {/* Required fields notice */}
          {requiredFields.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">
                  Please fill in all required fields to submit the form
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Submit Certificate
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
