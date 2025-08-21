import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Save, AlertCircle, ArrowRight, Settings, PenTool } from "lucide-react";
import { Job, User } from "@shared/types";
import { FullScreenSignaturePad } from "./FullScreenSignaturePad";

interface LiabilityFormData {
  id: string;
  jobId: string;
  date: string;
  insurance: string;
  claimNumber: string;
  client: string;
  plumber: string;
  wasExcessPaid: string;

  // Assessment items - now as checkboxes that place X in PDF
  selectedAssessmentItems: string[];

  // Before/After sections
  waterHammerBefore: string;
  waterHammerAfter: string;
  pressureTestBefore: string;
  pressureTestAfter: string;
  thermostatSettingBefore: string;
  thermostatSettingAfter: string;
  externalIsolatorBefore: string;
  externalIsolatorAfter: string;
  numberOfGeysersBefore: string;
  numberOfGeysersAfter: string;
  balancedSystemBefore: string;
  balancedSystemAfter: string;
  nonReturnValveBefore: string;
  nonReturnValveAfter: string;

  // Additional core form questions after water hammer
  pipeInstallation: string;
  pipeInsulation: string;
  pressureRegulation: string;
  temperatureControl: string;
  safetyCompliance: string;
  workmanshipQuality: string;
  materialStandards: string;
  installationCertificate: string;

  additionalComments: string;
}

interface EnhancedLiabilityFormProps {
  job: Job;
  assignedStaff: User | null;
  onSubmit: (formData: LiabilityFormData, signature?: string, signature_staff?: string) => void;
  existingData?: LiabilityFormData;
}

export function EnhancedLiabilityForm({
  job,
  assignedStaff,
  onSubmit,
  existingData,
}: EnhancedLiabilityFormProps) {
  // Assessment items that can be selected
  const assessmentItems = [
    "Existing Pipes/Fittings",
    "Roof Entry",
    "Geyser Enclosure",
    "Wiring (Electrical/Alarm)",
    "Waterproofing",
    "Pipes Not Secured",
    "Increase/Decrease in Pressure",
    "Drip Tray Installation",
    "Vacuum Breaker Positioning",
    "Pressure Control Valve",
    "Non-Return Valve",
    "Safety Valve Operation",
    "Thermostat Calibration",
    "Element Condition",
    "Electrical Connections",
  ];

  const [formData, setFormData] = useState<LiabilityFormData>(() => ({
    id: existingData?.id || `liability-${Date.now()}`,
    jobId: job.id,
    date: existingData?.date || new Date().toISOString().split("T")[0],
    insurance: existingData?.insurance || job.underwriter || job.Underwriter || "",
    claimNumber: existingData?.claimNumber || job.claimNo || job.ClaimNo || "",
    client: existingData?.client || job.insuredName || job.InsuredName || "",
    plumber: existingData?.plumber || assignedStaff?.name || "",
    wasExcessPaid: existingData?.wasExcessPaid || "",
    selectedAssessmentItems: existingData?.selectedAssessmentItems || [],
    waterHammerBefore: existingData?.waterHammerBefore || "",
    waterHammerAfter: existingData?.waterHammerAfter || "",
    pressureTestBefore: existingData?.pressureTestBefore || "",
    pressureTestAfter: existingData?.pressureTestAfter || "",
    thermostatSettingBefore: existingData?.thermostatSettingBefore || "",
    thermostatSettingAfter: existingData?.thermostatSettingAfter || "",
    externalIsolatorBefore: existingData?.externalIsolatorBefore || "",
    externalIsolatorAfter: existingData?.externalIsolatorAfter || "",
    numberOfGeysersBefore: existingData?.numberOfGeysersBefore || "",
    numberOfGeysersAfter: existingData?.numberOfGeysersAfter || "",
    balancedSystemBefore: existingData?.balancedSystemBefore || "",
    balancedSystemAfter: existingData?.balancedSystemAfter || "",
    nonReturnValveBefore: existingData?.nonReturnValveBefore || "",
    nonReturnValveAfter: existingData?.nonReturnValveAfter || "",
    pipeInstallation: existingData?.pipeInstallation || "",
    pipeInsulation: existingData?.pipeInsulation || "",
    pressureRegulation: existingData?.pressureRegulation || "",
    temperatureControl: existingData?.temperatureControl || "",
    safetyCompliance: existingData?.safetyCompliance || "",
    workmanshipQuality: existingData?.workmanshipQuality || "",
    materialStandards: existingData?.materialStandards || "",
    installationCertificate: existingData?.installationCertificate || "",
    additionalComments: existingData?.additionalComments || "",
  }));

  const [signature, setSignature] = useState<string>(""); // Client signature
  const [signature_staff, setSignature_staff] = useState<string>(""); // Staff signature
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureType, setSignatureType] = useState<'client' | 'staff'>('client');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const updateField = (field: keyof LiabilityFormData, value: string | string[]) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAssessmentItemChange = (item: string, checked: boolean) => {
    if (checked) {
      updateField("selectedAssessmentItems", [...formData.selectedAssessmentItems, item]);
    } else {
      updateField("selectedAssessmentItems", formData.selectedAssessmentItems.filter((i) => i !== item));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Enhanced Liability Waiver Form
            <Badge variant="outline" className="ml-2">
              {job.title}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
            {formSubmitted && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">
                  ✓ Form completed - Add signatures below before final submission
                </p>
              </div>
            )}

            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Insurance</Label>
                <Input
                  value={formData.insurance}
                  onChange={(e) => updateField("insurance", e.target.value)}
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Claim Number
                </Label>
                <Input
                  value={formData.claimNumber}
                  onChange={(e) => updateField("claimNumber", e.target.value)}
                  className="text-sm bg-white"
                  placeholder="Auto-filled from job"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Client</Label>
                <Input
                  value={formData.client}
                  onChange={(e) => updateField("client", e.target.value)}
                  className="text-sm bg-white"
                  placeholder="Auto-filled from job"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Plumber</Label>
                <Input
                  value={formData.plumber}
                  onChange={(e) => updateField("plumber", e.target.value)}
                  className="text-sm bg-white"
                  placeholder="Auto-filled from assigned staff"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Was Excess Paid?</Label>
                <Select value={formData.wasExcessPaid} onValueChange={(value) => updateField("wasExcessPaid", value)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Assessment Items */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Staff Section</Badge>
                <h3 className="text-lg font-semibold">Assessment Items</h3>
              </div>
              <p className="text-sm text-gray-600">
                Select all items that were assessed during the inspection:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {assessmentItems.map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={item}
                      checked={formData.selectedAssessmentItems.includes(item)}
                      onCheckedChange={(checked) => handleAssessmentItemChange(item, checked as boolean)}
                    />
                    <Label htmlFor={item} className="text-sm cursor-pointer">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Before/After Assessment */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Staff Section</Badge>
                <h3 className="text-lg font-semibold">Before/After Assessment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Before</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Water Hammer</Label>
                      <Input
                        value={formData.waterHammerBefore}
                        onChange={(e) => updateField("waterHammerBefore", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Pressure Test (Rating)</Label>
                      <Input
                        value={formData.pressureTestBefore}
                        onChange={(e) => updateField("pressureTestBefore", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Thermostat Setting</Label>
                      <Input
                        value={formData.thermostatSettingBefore}
                        onChange={(e) => updateField("thermostatSettingBefore", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">External Isolator</Label>
                      <Input
                        value={formData.externalIsolatorBefore}
                        onChange={(e) => updateField("externalIsolatorBefore", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Number of Geysers on Property</Label>
                      <Input
                        value={formData.numberOfGeysersBefore}
                        onChange={(e) => updateField("numberOfGeysersBefore", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Balanced System</Label>
                      <Input
                        value={formData.balancedSystemBefore}
                        onChange={(e) => updateField("balancedSystemBefore", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Non Return Valve</Label>
                      <Input
                        value={formData.nonReturnValveBefore}
                        onChange={(e) => updateField("nonReturnValveBefore", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">After</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Water Hammer</Label>
                      <Input
                        value={formData.waterHammerAfter}
                        onChange={(e) => updateField("waterHammerAfter", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Pressure Test (Rating)</Label>
                      <Input
                        value={formData.pressureTestAfter}
                        onChange={(e) => updateField("pressureTestAfter", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Thermostat Setting</Label>
                      <Input
                        value={formData.thermostatSettingAfter}
                        onChange={(e) => updateField("thermostatSettingAfter", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">External Isolator</Label>
                      <Input
                        value={formData.externalIsolatorAfter}
                        onChange={(e) => updateField("externalIsolatorAfter", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Number of Geysers on Property</Label>
                      <Input
                        value={formData.numberOfGeysersAfter}
                        onChange={(e) => updateField("numberOfGeysersAfter", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Balanced System</Label>
                      <Input
                        value={formData.balancedSystemAfter}
                        onChange={(e) => updateField("balancedSystemAfter", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Non Return Valve</Label>
                      <Input
                        value={formData.nonReturnValveAfter}
                        onChange={(e) => updateField("nonReturnValveAfter", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Assessment Questions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Client Section</Badge>
                <h3 className="text-lg font-semibold">Additional Assessment Questions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Pipe Installation Quality</Label>
                  <Select value={formData.pipeInstallation} onValueChange={(value) => updateField("pipeInstallation", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="acceptable">Acceptable</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="not-applicable">Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Pipe Insulation</Label>
                  <Select value={formData.pipeInsulation} onValueChange={(value) => updateField("pipeInsulation", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adequate">Adequate</SelectItem>
                      <SelectItem value="inadequate">Inadequate</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="not-required">Not Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Pressure Regulation</Label>
                  <Select value={formData.pressureRegulation} onValueChange={(value) => updateField("pressureRegulation", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="within-limits">Within Limits</SelectItem>
                      <SelectItem value="too-high">Too High</SelectItem>
                      <SelectItem value="too-low">Too Low</SelectItem>
                      <SelectItem value="not-tested">Not Tested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Temperature Control</Label>
                  <Select value={formData.temperatureControl} onValueChange={(value) => updateField("temperatureControl", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="functioning">Functioning</SelectItem>
                      <SelectItem value="erratic">Erratic</SelectItem>
                      <SelectItem value="not-functioning">Not Functioning</SelectItem>
                      <SelectItem value="needs-adjustment">Needs Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Safety Compliance</Label>
                  <Select value={formData.safetyCompliance} onValueChange={(value) => updateField("safetyCompliance", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliant">Compliant</SelectItem>
                      <SelectItem value="minor-issues">Minor Issues</SelectItem>
                      <SelectItem value="major-issues">Major Issues</SelectItem>
                      <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Workmanship Quality (1-10)</Label>
                  <Select value={formData.workmanshipQuality} onValueChange={(value) => updateField("workmanshipQuality", value)}>
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

                <div>
                  <Label className="text-sm font-medium">Material Standards</Label>
                  <Select value={formData.materialStandards} onValueChange={(value) => updateField("materialStandards", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sabs-approved">SABS Approved</SelectItem>
                      <SelectItem value="iso-certified">ISO Certified</SelectItem>
                      <SelectItem value="non-standard">Non-Standard</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Installation Certificate</Label>
                  <Select value={formData.installationCertificate} onValueChange={(value) => updateField("installationCertificate", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="issued">Issued</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="not-required">Not Required</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Additional Comments</Label>
                <Textarea
                  value={formData.additionalComments}
                  onChange={(e) => updateField("additionalComments", e.target.value)}
                  className="text-sm"
                  rows={4}
                  placeholder="Enter detailed notes on any specific findings or recommendations..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4">
              {!formSubmitted ? (
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
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

      {/* Signature Section - Always Visible */}
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardTitle className="flex items-center text-blue-800">
            <PenTool className="h-6 w-6 mr-3" />
            Signatures
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
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
                    onError={(e) => {
                      console.error("LiabilityForm: Client signature image failed to load", signature);
                      e.currentTarget.style.display = 'none';
                    }}
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
                    onError={(e) => {
                      console.error("LiabilityForm: Staff signature image failed to load", signature_staff);
                      e.currentTarget.style.display = 'none';
                    }}
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

            {/* Final Submit */}
            {formSubmitted && (
              <div className="pt-4 border-t">
                <Button
                  onClick={handleFinalSubmit}
                  disabled={!signature}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Submit Liability Form
                </Button>
                {!signature && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Client signature is required to submit
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Form Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Before/After Fields:</strong> Enter numbers, words, or
              simply "X" as needed for each assessment item.
            </p>
            <p>
              <strong>Primary Items:</strong> Assess each item and mark with
              appropriate values or "X" if not applicable.
            </p>
            <p>
              <strong>Additional Comments:</strong> Use this section to provide
              detailed notes on any specific findings or recommendations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Signature Pad */}
      <FullScreenSignaturePad
        isOpen={showSignaturePad}
        onSignatureComplete={handleSignatureComplete}
        onCancel={() => setShowSignaturePad(false)}
        title={`${signatureType === 'client' ? 'Client' : 'Staff'} Signature Required`}
      />
    </div>
  );
}
