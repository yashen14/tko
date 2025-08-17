import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Save } from "lucide-react";
import { Job, User } from "@shared/types";

interface NoncomplianceFormData {
  id: string;
  jobId: string;
  
  // Basic Information
  date: string;
  insuranceName: string;
  claimNumber: string;
  clientName: string;
  clientSurname: string;
  installersName: string;
  
  // Quotation question
  quotationSupplied: string;
  
  // Compliance Issues (33 questions)
  selectedIssues: string[];
  
  // Plumber Indemnity
  plumberIndemnity: string;
  
  // Geyser Details
  geyserMake: string;
  geyserSerial: string;
  geyserCode: string;
}

interface NoncomplianceFormProps {
  job: Job;
  assignedStaff: User | null;
  onSubmit: (formData: NoncomplianceFormData) => void;
  existingData?: NoncomplianceFormData;
}

// Organized 33 compliance issues
const COMPLIANCE_ISSUES = {
  "Vacuum Breakers": [
    "1. Cold vacuum breaker (Must be 300mm above geyser)",
    "2. Hot vacuum breaker (Must be 300mm above geyser and 430mm away)",
    "3. Vacuum breaker not over drip tray"
  ],
  "Safety Systems": [
    "4. Safety valve not functioning properly",
    "13. PRV not positioned over drip tray",
    "15. No shut off valve to the geyser",
    "16. No electrical isolator switch installed"
  ],
  "Pipe Materials & Installation": [
    "5. Pipes not copper - incorrect material used",
    "6. Geyser brackets missing or inadequate",
    "7. 90 degree short radius bend installed",
    "8. Pipe run exceeds 4m without upsizing to 28mm",
    "9. Missing 1m copper from hot water outlet",
    "10. Missing 1m copper from cold water inlet",
    "11. Pipes in roof not secured properly",
    "32. Incorrect pipe type in ceiling (not copper)",
    "33. Exposed pipes not properly secured or lagged"
  ],
  "Overflow & Drainage": [
    "12. PRV overflow pipe not adequately secured",
    "19. Tray overflow not compliant with regulations",
    "20. Overflow pipe not PVC material",
    "21. Missing brackets every 1m on overflow pipe",
    "22. 90 degree short radius bend on overflow",
    "23. No fall on the overflow outlet pipe"
  ],
  "System Balance": [
    "14. System unbalanced - pressure issues",
    "18. Non return valve missing on unbalanced system"
  ],
  "Electrical": [
    "16. No electrical isolator switch installed",
    "17. Pipes not electrically bonded correctly"
  ],
  "Insulation & Lagging": [
    "24. Inadequate geyser support structure",
    "25. No lagging on hot water pipes",
    "26. Lagging is split or damaged",
    "27. Incorrect type of lagging material"
  ],
  "Access & Maintenance": [
    "28. Inadequate geyser access for maintenance",
    "29. Roof sheets/tiles obstruct geyser replacement",
    "30. Trap door located in bathroom (non-compliant)",
    "31. Trap door requires enlargement for access",
    "32. Trap door to be enlarged or roof access",
    "33. Type of pipe in the ceiling or exposed"
  ]
};

export function NoncomplianceForm({
  job,
  assignedStaff,
  onSubmit,
  existingData,
}: NoncomplianceFormProps) {
  const [formData, setFormData] = useState<NoncomplianceFormData>(() => ({
    id: existingData?.id || `noncompliance-${Date.now()}`,
    jobId: job.id,
    
    // Basic Information - auto-filled from job
    date: existingData?.date || new Date().toISOString().split("T")[0],
    insuranceName: existingData?.insuranceName || job.underwriter || job.Underwriter || "",
    claimNumber: existingData?.claimNumber || job.claimNo || job.ClaimNo || "",
    clientName: existingData?.clientName || job.insuredName || job.InsuredName || "",
    clientSurname: existingData?.clientSurname || "",
    installersName: existingData?.installersName || assignedStaff?.name || "",
    
    quotationSupplied: existingData?.quotationSupplied || "",
    selectedIssues: existingData?.selectedIssues || [],
    plumberIndemnity: existingData?.plumberIndemnity || "",
    geyserMake: existingData?.geyserMake || "",
    geyserSerial: existingData?.geyserSerial || "",
    geyserCode: existingData?.geyserCode || "",
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof NoncomplianceFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleIssue = (issue: string) => {
    const currentIssues = formData.selectedIssues;
    if (currentIssues.includes(issue)) {
      updateField("selectedIssues", currentIssues.filter(i => i !== issue));
    } else {
      updateField("selectedIssues", [...currentIssues, issue]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
        <CardTitle className="flex items-center text-red-800">
          <AlertTriangle className="h-6 w-6 mr-3" />
          Non Compliance Form
          <Badge variant="outline" className="ml-3">
            {formData.selectedIssues.length} issues selected
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    className="bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="insuranceName">Insurance Name</Label>
                  <Input
                    id="insuranceName"
                    value={formData.insuranceName}
                    onChange={(e) => updateField("insuranceName", e.target.value)}
                    placeholder="e.g. ABSA Insurance Company Limited"
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
                    placeholder="e.g. 5586142"
                    className="bg-red-50 font-medium"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => updateField("clientName", e.target.value)}
                    placeholder="e.g. FRANCISCO MRS JM & MR M"
                    className="bg-red-50 font-medium"
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="clientSurname">Client Surname</Label>
                  <Input
                    id="clientSurname"
                    value={formData.clientSurname}
                    onChange={(e) => updateField("clientSurname", e.target.value)}
                    placeholder="e.g. alsahim"
                  />
                </div>
                <div>
                  <Label htmlFor="installersName">Installers Name</Label>
                  <Input
                    id="installersName"
                    value={formData.installersName}
                    onChange={(e) => updateField("installersName", e.target.value)}
                    placeholder="e.g. Zaundre"
                    className="bg-red-50 font-medium"
                    readOnly
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Quotation Question */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quotation Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="quotationSupplied">
                  Was a quotation supplied to meet these critical compliance requirements?
                </Label>
                <Select value={formData.quotationSupplied} onValueChange={(value) => updateField("quotationSupplied", value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select Yes or No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">Yes</SelectItem>
                    <SelectItem value="NO">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* 33 Compliance Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Non-compliance Issues Assessment (33 Points)</CardTitle>
              <p className="text-sm text-gray-600">
                {formData.selectedIssues.length} issues selected
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(COMPLIANCE_ISSUES).map(([category, issues]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-semibold text-gray-800 border-b pb-1">{category}</h4>
                  <div className="space-y-2">
                    {issues.map((issue) => (
                      <div key={issue} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                        <Checkbox
                          id={issue}
                          checked={formData.selectedIssues.includes(issue)}
                          onCheckedChange={() => toggleIssue(issue)}
                          className="mt-1"
                        />
                        <Label htmlFor={issue} className="flex-1 text-sm leading-relaxed cursor-pointer">
                          {issue}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Separator />

          {/* Plumber Indemnity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plumber Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="plumberIndemnity">Plumbers Indemnity</Label>
                <Select value={formData.plumberIndemnity} onValueChange={(value) => updateField("plumberIndemnity", value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electric geyser">Electric geyser</SelectItem>
                    <SelectItem value="Solar geyser">Solar geyser</SelectItem>
                    <SelectItem value="Heat pump">Heat pump</SelectItem>
                    <SelectItem value="Pipe Repairs">Pipe Repairs</SelectItem>
                    <SelectItem value="Assessment">Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Geyser Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Geyser Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="geyserMake">Geyser Make</Label>
                  <Input
                    id="geyserMake"
                    value={formData.geyserMake}
                    onChange={(e) => updateField("geyserMake", e.target.value)}
                    placeholder="Enter geyser make"
                  />
                </div>
                <div>
                  <Label htmlFor="geyserSerial">Serial</Label>
                  <Input
                    id="geyserSerial"
                    value={formData.geyserSerial}
                    onChange={(e) => updateField("geyserSerial", e.target.value)}
                    placeholder="Enter serial number"
                  />
                </div>
                <div>
                  <Label htmlFor="geyserCode">Code</Label>
                  <Input
                    id="geyserCode"
                    value={formData.geyserCode}
                    onChange={(e) => updateField("geyserCode", e.target.value)}
                    placeholder="Enter code"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              <Save className="h-4 w-4 mr-2" />
              Submit Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
