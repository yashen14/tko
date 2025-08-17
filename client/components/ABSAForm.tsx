import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Save, AlertCircle, CheckSquare, CheckCircle, Edit } from "lucide-react";
import { Job, User } from "@shared/types";
import { FullScreenSignaturePad } from "./FullScreenSignaturePad";

interface ABSAFormData {
  id: string;
  jobId: string;
  date: string;
  insurance: string;
  claimNumber: string;
  client: string;
  plumber: string;
  address: string;
  
  // ABSA specific fields
  absaAccountNumber: string;
  branchCode: string;
  productType: string;
  riskCategory: string;
  
  // Assessment details
  damageDescription: string;
  causeOfDamage: string;
  assessmentDate: string;
  urgencyLevel: string;
  
  // Cost estimates
  materialCost: string;
  labourCost: string;
  totalEstimate: string;
  excessAmount: string;
  
  // Quality checks
  preExistingConditions: boolean;
  properMaintenance: boolean;
  standardsCompliance: boolean;
  safetyRequirements: boolean;
  
  // Authorization
  workAuthorized: string;
  authorizedBy: string;
  authorizationDate: string;
  limitationNotes: string;
  
  // Completion verification
  workCompleted: boolean;
  qualityVerified: boolean;
  clientSatisfaction: string;
  followUpRequired: boolean;
  
  additionalRemarks: string;
}

interface ABSAFormProps {
  job: Job;
  assignedStaff: User | null;
  onSubmit: (formData: ABSAFormData, signature?: string, signature_staff?: string) => void;
  existingData?: ABSAFormData;
}

export function ABSAForm({
  job,
  assignedStaff,
  onSubmit,
  existingData,
}: ABSAFormProps) {
  const [formData, setFormData] = useState<ABSAFormData>(() => ({
    id: existingData?.id || `absa-form-${Date.now()}`,
    jobId: job.id,
    date: existingData?.date || new Date().toISOString().split("T")[0],
    insurance: existingData?.insurance || job.underwriter || job.Underwriter || "",
    claimNumber: existingData?.claimNumber || job.claimNo || job.ClaimNo || "",
    client: existingData?.client || job.insuredName || job.InsuredName || "",
    plumber: existingData?.plumber || assignedStaff?.name || "",
    address: existingData?.address || job.riskAddress || job.RiskAddress || "",
    
    absaAccountNumber: existingData?.absaAccountNumber || job.policyNo || job.PolicyNo || "",
    branchCode: existingData?.branchCode || "",
    productType: existingData?.productType || "Home Insurance",
    riskCategory: existingData?.riskCategory || "Standard",
    
    damageDescription: existingData?.damageDescription || job.description || "",
    causeOfDamage: existingData?.causeOfDamage || "",
    assessmentDate: existingData?.assessmentDate || new Date().toISOString().split("T")[0],
    urgencyLevel: existingData?.urgencyLevel || "Medium",
    
    materialCost: existingData?.materialCost || "",
    labourCost: existingData?.labourCost || "",
    totalEstimate: existingData?.totalEstimate || "",
    excessAmount: existingData?.excessAmount || job.excess || job.Excess || "",
    
    preExistingConditions: existingData?.preExistingConditions || false,
    properMaintenance: existingData?.properMaintenance || true,
    standardsCompliance: existingData?.standardsCompliance || true,
    safetyRequirements: existingData?.safetyRequirements || true,
    
    workAuthorized: existingData?.workAuthorized || "Pending",
    authorizedBy: existingData?.authorizedBy || "",
    authorizationDate: existingData?.authorizationDate || "",
    limitationNotes: existingData?.limitationNotes || "",
    
    workCompleted: existingData?.workCompleted || false,
    qualityVerified: existingData?.qualityVerified || false,
    clientSatisfaction: existingData?.clientSatisfaction || "",
    followUpRequired: existingData?.followUpRequired || false,
    
    additionalRemarks: existingData?.additionalRemarks || "",
  }));

  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [signature, setSignature] = useState<string>(""); // Client signature
  const [signature_staff, setSignature_staff] = useState<string>(""); // Staff signature
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureType, setSignatureType] = useState<'client' | 'staff'>('client');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const required = [];
    if (!formData.damageDescription.trim()) required.push("damageDescription");
    if (!formData.causeOfDamage.trim()) required.push("causeOfDamage");
    if (!formData.totalEstimate.trim()) required.push("totalEstimate");

    if (required.length > 0) {
      setRequiredFields(required);
      return;
    }

    setRequiredFields([]);
    setFormSubmitted(true);
  };

  const handleFinalSubmit = () => {
    onSubmit(formData, signature, signature_staff);
  };

  const handleSignatureComplete = (signatureData: string) => {
    if (signatureType === 'client') {
      setSignature(signatureData);
    } else {
      setSignature_staff(signatureData);
    }
    setShowSignaturePad(false);
  };

  const updateField = (field: keyof ABSAFormData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    if (requiredFields.includes(field as string)) {
      setRequiredFields(requiredFields.filter(f => f !== field));
    }
  };

  // Auto-calculate total estimate when material or labour costs change
  React.useEffect(() => {
    const material = parseFloat(formData.materialCost.replace(/[^\d.]/g, '') || '0');
    const labour = parseFloat(formData.labourCost.replace(/[^\d.]/g, '') || '0');
    const total = material + labour;
    if (total > 0 && formData.totalEstimate !== `R ${total.toFixed(2)}`) {
      setFormData(prev => ({ ...prev, totalEstimate: `R ${total.toFixed(2)}` }));
    }
  }, [formData.materialCost, formData.labourCost]);

  return (
    <>
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
        <CardTitle className="flex items-center text-red-800">
          <CreditCard className="h-6 w-6 mr-3" />
          ABSA Form
          <Badge variant="outline" className="ml-3">
            {formData.riskCategory}
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
                className="bg-red-50 font-medium"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="claimNumber">Claim Number</Label>
              <Input
                id="claimNumber"
                value={formData.claimNumber}
                onChange={(e) => updateField("claimNumber", e.target.value)}
                className="bg-red-50 font-medium"
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
                className="bg-red-50 font-medium"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="plumber">Technician/Plumber</Label>
              <Input
                id="plumber"
                value={formData.plumber}
                onChange={(e) => updateField("plumber", e.target.value)}
                className="bg-red-50 font-medium"
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
              className="bg-red-50"
              readOnly
            />
          </div>

          <Separator />

          {/* ABSA Specific Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-red-600" />
              ABSA Account Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="absaAccountNumber">ABSA Account Number</Label>
                <Input
                  id="absaAccountNumber"
                  value={formData.absaAccountNumber}
                  onChange={(e) => updateField("absaAccountNumber", e.target.value)}
                  placeholder="Account or policy number"
                />
              </div>
              <div>
                <Label htmlFor="branchCode">Branch Code</Label>
                <Input
                  id="branchCode"
                  value={formData.branchCode}
                  onChange={(e) => updateField("branchCode", e.target.value)}
                  placeholder="ABSA branch code"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productType">Product Type</Label>
                <Select value={formData.productType} onValueChange={(value) => updateField("productType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home Insurance">Home Insurance</SelectItem>
                    <SelectItem value="Building Insurance">Building Insurance</SelectItem>
                    <SelectItem value="Contents Insurance">Contents Insurance</SelectItem>
                    <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="riskCategory">Risk Category</Label>
                <Select value={formData.riskCategory} onValueChange={(value) => updateField("riskCategory", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Special">Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Assessment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Assessment Details</h3>

            <div>
              <Label htmlFor="damageDescription" className={requiredFields.includes("damageDescription") ? "text-yellow-600" : ""}>
                Damage Description *
              </Label>
              <Textarea
                id="damageDescription"
                value={formData.damageDescription}
                onChange={(e) => updateField("damageDescription", e.target.value)}
                placeholder="Detailed description of the damage..."
                className={requiredFields.includes("damageDescription") ? "border-yellow-500 bg-yellow-50" : ""}
                rows={3}
              />
              {requiredFields.includes("damageDescription") && (
                <p className="text-yellow-600 text-sm mt-1">This field is required</p>
              )}
            </div>

            <div>
              <Label htmlFor="causeOfDamage" className={requiredFields.includes("causeOfDamage") ? "text-yellow-600" : ""}>
                Cause of Damage *
              </Label>
              <Textarea
                id="causeOfDamage"
                value={formData.causeOfDamage}
                onChange={(e) => updateField("causeOfDamage", e.target.value)}
                placeholder="What caused the damage..."
                className={requiredFields.includes("causeOfDamage") ? "border-yellow-500 bg-yellow-50" : ""}
                rows={2}
              />
              {requiredFields.includes("causeOfDamage") && (
                <p className="text-yellow-600 text-sm mt-1">This field is required</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assessmentDate">Assessment Date</Label>
                <Input
                  id="assessmentDate"
                  type="date"
                  value={formData.assessmentDate}
                  onChange={(e) => updateField("assessmentDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="urgencyLevel">Urgency Level</Label>
                <Select value={formData.urgencyLevel} onValueChange={(value) => updateField("urgencyLevel", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cost Estimates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Cost Estimates</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="materialCost">Material Cost</Label>
                <Input
                  id="materialCost"
                  value={formData.materialCost}
                  onChange={(e) => updateField("materialCost", e.target.value)}
                  placeholder="R 0.00"
                />
              </div>
              <div>
                <Label htmlFor="labourCost">Labour Cost</Label>
                <Input
                  id="labourCost"
                  value={formData.labourCost}
                  onChange={(e) => updateField("labourCost", e.target.value)}
                  placeholder="R 0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalEstimate" className={requiredFields.includes("totalEstimate") ? "text-yellow-600" : ""}>
                  Total Estimate *
                </Label>
                <Input
                  id="totalEstimate"
                  value={formData.totalEstimate}
                  onChange={(e) => updateField("totalEstimate", e.target.value)}
                  placeholder="R 0.00"
                  className={requiredFields.includes("totalEstimate") ? "border-yellow-500 bg-yellow-50" : ""}
                />
                {requiredFields.includes("totalEstimate") && (
                  <p className="text-yellow-600 text-sm mt-1">This field is required</p>
                )}
              </div>
              <div>
                <Label htmlFor="excessAmount">Excess Amount</Label>
                <Input
                  id="excessAmount"
                  value={formData.excessAmount}
                  onChange={(e) => updateField("excessAmount", e.target.value)}
                  placeholder="R 0.00"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Quality Checks */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <CheckSquare className="h-5 w-5 mr-2 text-green-600" />
              Quality Verification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="preExistingConditions"
                  checked={formData.preExistingConditions}
                  onCheckedChange={(checked) => updateField("preExistingConditions", checked as boolean)}
                />
                <Label htmlFor="preExistingConditions">Pre-existing conditions noted</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="properMaintenance"
                  checked={formData.properMaintenance}
                  onCheckedChange={(checked) => updateField("properMaintenance", checked as boolean)}
                />
                <Label htmlFor="properMaintenance">Proper maintenance evident</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="standardsCompliance"
                  checked={formData.standardsCompliance}
                  onCheckedChange={(checked) => updateField("standardsCompliance", checked as boolean)}
                />
                <Label htmlFor="standardsCompliance">Standards compliance verified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="safetyRequirements"
                  checked={formData.safetyRequirements}
                  onCheckedChange={(checked) => updateField("safetyRequirements", checked as boolean)}
                />
                <Label htmlFor="safetyRequirements">Safety requirements met</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Authorization */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Work Authorization</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workAuthorized">Work Authorization Status</Label>
                <Select value={formData.workAuthorized} onValueChange={(value) => updateField("workAuthorized", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Authorized">Authorized</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Declined">Declined</SelectItem>
                    <SelectItem value="Conditional">Conditional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="authorizedBy">Authorized By</Label>
                <Input
                  id="authorizedBy"
                  value={formData.authorizedBy}
                  onChange={(e) => updateField("authorizedBy", e.target.value)}
                  placeholder="Name of authorizing person"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authorizationDate">Authorization Date</Label>
                <Input
                  id="authorizationDate"
                  type="date"
                  value={formData.authorizationDate}
                  onChange={(e) => updateField("authorizationDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="limitationNotes">Limitations/Notes</Label>
                <Input
                  id="limitationNotes"
                  value={formData.limitationNotes}
                  onChange={(e) => updateField("limitationNotes", e.target.value)}
                  placeholder="Any limitations or special notes"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Completion Verification */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Completion Verification</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="workCompleted"
                  checked={formData.workCompleted}
                  onCheckedChange={(checked) => updateField("workCompleted", checked as boolean)}
                />
                <Label htmlFor="workCompleted">Work completed satisfactorily</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="qualityVerified"
                  checked={formData.qualityVerified}
                  onCheckedChange={(checked) => updateField("qualityVerified", checked as boolean)}
                />
                <Label htmlFor="qualityVerified">Quality verified and tested</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientSatisfaction">Client Satisfaction</Label>
                <Select value={formData.clientSatisfaction} onValueChange={(value) => updateField("clientSatisfaction", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select satisfaction level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Very Satisfied">Very Satisfied</SelectItem>
                    <SelectItem value="Satisfied">Satisfied</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                    <SelectItem value="Dissatisfied">Dissatisfied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="followUpRequired"
                  checked={formData.followUpRequired}
                  onCheckedChange={(checked) => updateField("followUpRequired", checked as boolean)}
                />
                <Label htmlFor="followUpRequired">Follow-up required</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Remarks */}
          <div>
            <Label htmlFor="additionalRemarks">Additional Remarks</Label>
            <Textarea
              id="additionalRemarks"
              value={formData.additionalRemarks}
              onChange={(e) => updateField("additionalRemarks", e.target.value)}
              placeholder="Any additional comments or observations..."
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
            {!formSubmitted ? (
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                <Save className="h-4 w-4 mr-2" />
                Submit Form
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormSubmitted(false)}
                className="bg-gray-100 hover:bg-gray-200"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Form
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>

    {/* Signature Section */}
    {formSubmitted && (
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle className="text-green-600 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Form Completed - Signatures Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Signature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Client Signature</Label>
                <Badge variant={signature ? "default" : "destructive"}>
                  {signature ? "Signed" : "Required"}
                </Badge>
              </div>

              {signature ? (
                <div className="flex items-center gap-4">
                  <img
                    src={signature}
                    alt="Client signature"
                    className="border rounded h-16 w-32 object-contain bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSignatureType('client');
                      setShowSignaturePad(true);
                    }}
                  >
                    Update Signature
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    setSignatureType('client');
                    setShowSignaturePad(true);
                  }}
                  className="w-full"
                >
                  Sign Here
                </Button>
              )}
            </div>

            {/* Staff Signature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Staff Signature</Label>
                <Badge variant={signature_staff ? "default" : "secondary"}>
                  {signature_staff ? "Signed" : "Optional"}
                </Badge>
              </div>

              {signature_staff ? (
                <div className="flex items-center gap-4">
                  <img
                    src={signature_staff}
                    alt="Staff signature"
                    className="border rounded h-16 w-32 object-contain bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSignatureType('staff');
                      setShowSignaturePad(true);
                    }}
                  >
                    Update Signature
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSignatureType('staff');
                    setShowSignaturePad(true);
                  }}
                  className="w-full"
                >
                  Sign Here (Optional)
                </Button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleFinalSubmit}
              disabled={!signature}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
            >
              {!signature ? "Client Signature Required" : "Complete Submission"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Signature Pad */}
    <FullScreenSignaturePad
      isOpen={showSignaturePad}
      onSignatureComplete={handleSignatureComplete}
      onCancel={() => setShowSignaturePad(false)}
      title={`${signatureType === 'client' ? 'Client' : 'Staff'} Signature Required`}
    />
    </>
  );
}
