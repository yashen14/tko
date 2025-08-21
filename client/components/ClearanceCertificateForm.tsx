import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Save, AlertCircle, CheckCircle, ArrowRight, Settings, PenTool } from "lucide-react";
import { Job, User } from "@shared/types";
import { FullScreenSignaturePad } from "./FullScreenSignaturePad";

interface ClearanceCertificateFormData {
  id: string;
  jobId: string;
  date: string;
  
  // Header fields - matching Discovery Form Template pattern
  claimNumber: string; // field-claim-number -> autoFillFrom: "claimNo"
  clientName: string;  // field-client-name -> autoFillFrom: "insuredName"
  address: string;     // field-address -> autoFillFrom: "riskAddress"
  plumberName: string; // field-plumber-name -> autoFillFrom: "assignedStaffName"
  
  // Core Clearance Certificate Template fields
  cname: string;       // field-cname -> autoFillFrom: "clientName"
  cref: string;        // field-cref -> autoFillFrom: "claimNo"
  caddress: string;    // field-caddress (Property Address)
  cdamage: string;     // field-cdamage (Cause of damage)
  staff: string;       // field-staff -> autoFillFrom: "assignedStaffName"
  scopework: string;   // field-scopework (Scope of Work Comments)
  oldgeyser: string;   // field-oldgeyser (OLD GEYSER DETAILS)
  newgeyser: string;   // field-newgeyser (NEW GEYSER DETAILS)
  
  // Quality assessment fields - matching template (Client Section)
  cquality1: string;   // field-cquality1 - "Did the service Provider make an appointment to inspect damage?"
  cquality2: string;   // field-cquality2 - "Did the service Provider Keep to the appointment?"
  cquality3: string;   // field-cquality3 - "Were the staff neat and presentable?"
  cquality4: string;   // field-cquality4 - "Did the service Provider Keep you informed on the progress of job?"
  cquality5: string;   // field-cquality5 - "Did the service Provider clean the site before leaving?"
  cquality6: string;   // field-cquality6 - "Please rate the standard of the workmanship and service overall?" (1-10)
  
  // Excess payment fields
  excess: string;      // field-excess - "Was Excess Paid:" (Yes/No)
  amount: string;      // field-amount - "Excess Amount Paid:"
  
  // Comments
  gcomments: string;   // field-gcomments - "General Comments:"
}

interface ClearanceCertificateFormProps {
  job: Job;
  assignedStaff: User | null;
  onSubmit: (formData: ClearanceCertificateFormData, signature?: string, signature_staff?: string) => void;
  existingData?: ClearanceCertificateFormData;
}

export function ClearanceCertificateForm({
  job,
  assignedStaff,
  onSubmit,
  existingData,
}: ClearanceCertificateFormProps) {
  const [formData, setFormData] = useState<ClearanceCertificateFormData>(() => ({
    id: existingData?.id || `clearance-cert-${Date.now()}`,
    jobId: job.id,
    date: existingData?.date || new Date().toISOString().split("T")[0],
    
    // Header fields - matching Discovery Form Template autoFillFrom patterns
    claimNumber: existingData?.claimNumber || job.claimNo || job.ClaimNo || "",
    clientName: existingData?.clientName || job.insuredName || job.InsuredName || "",
    address: existingData?.address || job.riskAddress || job.RiskAddress || "",
    plumberName: existingData?.plumberName || assignedStaff?.name || "",
    
    // Core template fields with auto-fill matching template
    cname: existingData?.cname || job.insuredName || job.InsuredName || "", // autoFillFrom: "clientName"
    cref: existingData?.cref || job.claimNo || job.ClaimNo || "", // autoFillFrom: "claimNo"
    caddress: existingData?.caddress || job.riskAddress || job.RiskAddress || "",
    cdamage: existingData?.cdamage || "",
    staff: existingData?.staff || assignedStaff?.name || "", // autoFillFrom: "assignedStaffName"
    scopework: existingData?.scopework || "",
    oldgeyser: existingData?.oldgeyser || "None",
    newgeyser: existingData?.newgeyser || "None",
    
    // Quality assessment fields - Yes/No and rating
    cquality1: existingData?.cquality1 || "",
    cquality2: existingData?.cquality2 || "",
    cquality3: existingData?.cquality3 || "",
    cquality4: existingData?.cquality4 || "",
    cquality5: existingData?.cquality5 || "",
    cquality6: existingData?.cquality6 || "", // 1-10 rating
    
    // Excess payment
    excess: existingData?.excess || "",
    amount: existingData?.amount || "",
    
    // Comments
    gcomments: existingData?.gcomments || "",
  }));

  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [signature, setSignature] = useState<string>(""); // Client signature
  const [signature_staff, setSignature_staff] = useState<string>(""); // Staff signature
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureType, setSignatureType] = useState<'client' | 'staff'>('client');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    // No validation - allow submission with missing fields
    setRequiredFields([]);
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

  const updateField = (field: keyof ClearanceCertificateFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center text-green-800">
            <Shield className="h-6 w-6 mr-3" />
            Clearance Certificate
            <Badge variant="outline" className="ml-3">
              BBP Document
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {formSubmitted && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">
                  ✓ Form completed - Add signatures below before final submission
                </p>
              </div>
            )}
            
            {/* Header Information - Discovery Form Template Pattern */}
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
                <Label htmlFor="claimNumber">Claim Number</Label>
                <Input
                  id="claimNumber"
                  value={formData.claimNumber}
                  onChange={(e) => updateField("claimNumber", e.target.value)}
                  className="bg-green-50 font-medium"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => updateField("clientName", e.target.value)}
                  className="bg-green-50 font-medium"
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Property Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="bg-green-50 font-medium"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="plumberName">Plumber/Technician</Label>
                <Input
                  id="plumberName"
                  value={formData.plumberName}
                  onChange={(e) => updateField("plumberName", e.target.value)}
                  className="bg-green-50 font-medium"
                  readOnly
                />
              </div>
            </div>

            <Separator />

            {/* Certificate Details - Template Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Certificate Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cname">Client Name</Label>
                  <Input
                    id="cname"
                    value={formData.cname}
                    onChange={(e) => updateField("cname", e.target.value)}
                    placeholder="Client Name"
                  />
                </div>
                <div>
                  <Label htmlFor="cref">Reference/Claim Number</Label>
                  <Input
                    id="cref"
                    value={formData.cref}
                    onChange={(e) => updateField("cref", e.target.value)}
                    placeholder="Claim Number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="caddress">Property Address</Label>
                <Input
                  id="caddress"
                  value={formData.caddress}
                  onChange={(e) => updateField("caddress", e.target.value)}
                  placeholder="Property Address"
                />
              </div>

              <div>
                <Label htmlFor="cdamage">Cause of Damage</Label>
                <Input
                  id="cdamage"
                  value={formData.cdamage}
                  onChange={(e) => updateField("cdamage", e.target.value)}
                  placeholder="Cause of damage"
                />
              </div>

              <div>
                <Label htmlFor="staff">Staff Member</Label>
                <Input
                  id="staff"
                  value={formData.staff}
                  onChange={(e) => updateField("staff", e.target.value)}
                  className="bg-green-50 font-medium"
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="scopework">Scope of Work Comments</Label>
                <Textarea
                  id="scopework"
                  value={formData.scopework}
                  onChange={(e) => updateField("scopework", e.target.value)}
                  placeholder="Scope of work details"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="oldgeyser">Old Geyser Details</Label>
                  <Select value={formData.oldgeyser} onValueChange={(value) => updateField("oldgeyser", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="newgeyser">New Geyser Details</Label>
                  <Select value={formData.newgeyser} onValueChange={(value) => updateField("newgeyser", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quality Assessment - Client Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Badge variant="outline" className="mr-2">Client Section</Badge>
                Quality Assessment
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cquality1">Did the service Provider make an appointment to inspect damage?</Label>
                  <Select value={formData.cquality1} onValueChange={(value) => updateField("cquality1", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cquality2">Did the service Provider Keep to the appointment?</Label>
                  <Select value={formData.cquality2} onValueChange={(value) => updateField("cquality2", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cquality3">Were the staff neat and presentable?</Label>
                  <Select value={formData.cquality3} onValueChange={(value) => updateField("cquality3", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cquality4">Did the service Provider Keep you informed on the progress of job?</Label>
                  <Select value={formData.cquality4} onValueChange={(value) => updateField("cquality4", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cquality5">Did the service Provider clean the site before leaving?</Label>
                  <Select value={formData.cquality5} onValueChange={(value) => updateField("cquality5", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cquality6">Please rate the standard of the workmanship and service overall? (1-10)</Label>
                  <Select value={formData.cquality6} onValueChange={(value) => updateField("cquality6", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(10)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Excess Payment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Excess Payment</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="excess">Was Excess Paid?</Label>
                  <Select value={formData.excess} onValueChange={(value) => updateField("excess", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Excess Amount Paid</Label>
                  <Input
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => updateField("amount", e.target.value)}
                    placeholder="0"
                    type="number"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Comments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Comments</h3>

              <div>
                <Label htmlFor="gcomments">General Comments</Label>
                <Textarea
                  id="gcomments"
                  value={formData.gcomments}
                  onChange={(e) => updateField("gcomments", e.target.value)}
                  placeholder="General comments"
                  rows={3}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4">
              {!formSubmitted ? (
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Proceed to Signatures
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormSubmitted(false)}
                  className="bg-gray-100 hover:bg-gray-200"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Form Details
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Signature Section */}
      {formSubmitted && (
        <Card className="w-full">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
            <CardTitle className="flex items-center text-blue-800">
              <PenTool className="h-6 w-6 mr-3" />
              Signatures Required
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Client Signature */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Client Signature</h3>
                    <p className="text-sm text-gray-600">
                      Required: {formData.cname || formData.clientName || "Client"}
                    </p>
                  </div>
                  <Badge variant={signature ? "default" : "secondary"}>
                    {signature ? "Signed" : "Required"}
                  </Badge>
                </div>

                {signature ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                      <p className="text-sm text-green-700 font-medium">✓ Client signature captured</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowClientSignaturePad(true)}
                      size="sm"
                    >
                      Update Signature
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowClientSignaturePad(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Add Client Signature
                  </Button>
                )}
              </div>

              {/* Staff Signature */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Staff Signature</h3>
                    <p className="text-sm text-gray-600">
                      Optional: {formData.staff || assignedStaff?.name || "Staff"}
                    </p>
                  </div>
                  <Badge variant={signature_staff ? "default" : "secondary"}>
                    {signature_staff ? "Signed" : "Optional"}
                  </Badge>
                </div>

                {signature_staff ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <p className="text-sm text-blue-700 font-medium">✓ Staff signature captured</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowStaffSignaturePad(true)}
                      size="sm"
                    >
                      Update Signature
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowStaffSignaturePad(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Add Staff Signature
                  </Button>
                )}
              </div>

              {/* Final Submit */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleFinalSubmit}
                  disabled={!signature}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Submit Clearance Certificate
                </Button>
                {!signature && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Client signature is required to submit
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signature Pads */}
      {showClientSignaturePad && (
        <FullScreenSignaturePad
          title="Client Signature"
          subtitle={`Please sign to confirm the clearance certificate details for ${formData.cname || formData.clientName}`}
          onSave={(signatureData) => {
            setSignature(signatureData);
            setShowClientSignaturePad(false);
          }}
          onCancel={() => setShowClientSignaturePad(false)}
        />
      )}

      {showStaffSignaturePad && (
        <FullScreenSignaturePad
          title="Staff Signature"
          subtitle={`Staff signature for ${formData.staff || assignedStaff?.name}`}
          onSave={(signatureData) => {
            setSignature_staff(signatureData);
            setShowStaffSignaturePad(false);
          }}
          onCancel={() => setShowStaffSignaturePad(false)}
        />
      )}
    </div>
  );
}
