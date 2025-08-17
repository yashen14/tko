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
import { Search, Save, AlertCircle, Compass, ArrowRight, Settings, CheckCircle, Edit } from "lucide-react";
import { Job, User } from "@shared/types";
import { FullScreenSignaturePad } from "./FullScreenSignaturePad";

interface DiscoveryFormData {
  id: string;
  jobId: string;
  
  // Header fields - matching Discovery Form Template exactly
  claimNumber: string;        // field-claim-number -> autoFillFrom: "claimNo"
  clientName: string;         // field-client-name -> autoFillFrom: "insuredName" 
  date: string;               // field-date
  address: string;            // field-address -> autoFillFrom: "riskAddress"
  companyName: string;        // field-company-name
  plumberName: string;        // field-plumber-name -> autoFillFrom: "assignedStaffName"
  licenseNumber: string;      // field-license-number
  
  // Action Taken Section
  geyserReplaced: string;     // field-geyser-replaced (Y/N)
  geyserRepair: string;       // field-geyser-repair (Y/N)
  
  // Old Geyser Details Section
  oldGeyserType: string;      // field-old-geyser-type (Electric/Solar/Other)
  oldGeyserOther: string;     // field-old-geyser-other
  oldGeyserSize: string;      // field-old-geyser-size (50/100/150/200/250/300/350)
  oldGeyserMake: string;      // field-old-geyser-make (Heat Tech/Kwikot/Gap/WE/Frankie/Other)
  oldSerialNumber: string;    // field-old-serial-number
  oldCode: string;            // field-old-code
  oldNoTag: string;           // field-old-no-tag
  wallMounted: string;        // field-wall-mounted
  insideRoof: string;         // field-inside-roof
  otherLocation: string;      // field-other-location
  
  // New Geyser Details Section
  newGeyserType: string;      // field-new-geyser-type (Electric/Solar/Other)
  newGeyserMake: string;      // field-new-geyser-make (Heat Tech/Kwikot/Other)
  newGeyserOther: string;     // field-new-geyser-other
  newGeyserSize: string;      // field-new-geyser-size (50/100/150/200/250/300/350)
  newSerialNumber: string;    // field-new-serial-number
  newCode: string;            // field-new-code
  
  // Items Installed Section (Y/N/NA)
  itemGeyser: string;         // field-item-geyser
  itemDripTray: string;       // field-item-drip-tray
  itemVacuumBreakers: string; // field-item-vacuum-breakers
  itemPlatform: string;       // field-item-platform
  itemBonding: string;        // field-item-bonding
  itemIsolator: string;       // field-item-isolator
  itemPressureValve: string;  // field-item-pressure-valve
  itemRelocated: string;      // field-item-relocated
  itemThermostat: string;     // field-item-thermostat
  itemElement: string;        // field-item-element
  itemSafetyValve: string;    // field-item-safety-valve
  itemNonReturn: string;      // field-item-non-return
  
  // Solar Geyser Section (Y/N/NA)
  solarVacuumTubes: string;   // field-solar-vacuum-tubes
  solarFlatPanels: string;    // field-solar-flat-panels
  solarCirculationPump: string; // field-solar-circulation-pump
  solarGeyserWise: string;    // field-solar-geyser-wise
  solarMixingValve: string;   // field-solar-mixing-valve
  solarPanel12v: string;      // field-solar-panel-12v
}

interface DiscoveryFormProps {
  job: Job;
  assignedStaff: User | null;
  onSubmit: (formData: DiscoveryFormData, signature?: string, signature_staff?: string) => void;
  existingData?: DiscoveryFormData;
}

export function DiscoveryForm({
  job,
  assignedStaff,
  onSubmit,
  existingData,
}: DiscoveryFormProps) {
  const [formData, setFormData] = useState<DiscoveryFormData>(() => ({
    id: existingData?.id || `discovery-form-${Date.now()}`,
    jobId: job.id,
    
    // Header fields with auto-fill matching template
    claimNumber: existingData?.claimNumber || job.claimNo || job.ClaimNo || "",
    clientName: existingData?.clientName || job.insuredName || job.InsuredName || "",
    date: existingData?.date || new Date().toISOString().split("T")[0],
    address: existingData?.address || job.riskAddress || job.RiskAddress || "",
    companyName: existingData?.companyName || "BlockBusters And Partners",
    plumberName: existingData?.plumberName || assignedStaff?.name || "",
    licenseNumber: existingData?.licenseNumber || "",
    
    // Action taken
    geyserReplaced: existingData?.geyserReplaced || "",
    geyserRepair: existingData?.geyserRepair || "",
    
    // Old geyser details
    oldGeyserType: existingData?.oldGeyserType || "",
    oldGeyserOther: existingData?.oldGeyserOther || "",
    oldGeyserSize: existingData?.oldGeyserSize || "",
    oldGeyserMake: existingData?.oldGeyserMake || "",
    oldSerialNumber: existingData?.oldSerialNumber || "",
    oldCode: existingData?.oldCode || "",
    oldNoTag: existingData?.oldNoTag || "",
    wallMounted: existingData?.wallMounted || "",
    insideRoof: existingData?.insideRoof || "",
    otherLocation: existingData?.otherLocation || "",
    
    // New geyser details
    newGeyserType: existingData?.newGeyserType || "",
    newGeyserMake: existingData?.newGeyserMake || "",
    newGeyserOther: existingData?.newGeyserOther || "",
    newGeyserSize: existingData?.newGeyserSize || "",
    newSerialNumber: existingData?.newSerialNumber || "",
    newCode: existingData?.newCode || "",
    
    // Items installed
    itemGeyser: existingData?.itemGeyser || "",
    itemDripTray: existingData?.itemDripTray || "",
    itemVacuumBreakers: existingData?.itemVacuumBreakers || "",
    itemPlatform: existingData?.itemPlatform || "",
    itemBonding: existingData?.itemBonding || "",
    itemIsolator: existingData?.itemIsolator || "",
    itemPressureValve: existingData?.itemPressureValve || "",
    itemRelocated: existingData?.itemRelocated || "",
    itemThermostat: existingData?.itemThermostat || "",
    itemElement: existingData?.itemElement || "",
    itemSafetyValve: existingData?.itemSafetyValve || "",
    itemNonReturn: existingData?.itemNonReturn || "",
    
    // Solar items
    solarVacuumTubes: existingData?.solarVacuumTubes || "",
    solarFlatPanels: existingData?.solarFlatPanels || "",
    solarCirculationPump: existingData?.solarCirculationPump || "",
    solarGeyserWise: existingData?.solarGeyserWise || "",
    solarMixingValve: existingData?.solarMixingValve || "",
    solarPanel12v: existingData?.solarPanel12v || "",
  }));

  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [signature, setSignature] = useState<string>(""); // Client signature
  const [signature_staff, setSignature_staff] = useState<string>(""); // Staff signature
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureType, setSignatureType] = useState<'client' | 'staff'>('client');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    // No validation - allow submission with missing fields
  };

  const handleFinalSubmit = () => {
    console.log("DiscoveryForm final submit:");
    console.log("- signature present:", !!signature);
    console.log("- signature_staff present:", !!signature_staff);
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

  const updateField = (field: keyof DiscoveryFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center text-purple-800">
          <Search className="h-6 w-6 mr-3" />
          Discovery Form
          <Badge variant="outline" className="ml-3">
            Geyser Assessment
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {formSubmitted && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                ✓ Form completed - Review details below before signing
              </p>
            </div>
          )}
          
          {/* Header Information - Discovery Template Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="claimNumber">Claim Number</Label>
              <Input
                id="claimNumber"
                value={formData.claimNumber}
                onChange={(e) => updateField("claimNumber", e.target.value)}
                placeholder="Claim Number"
                className="bg-purple-50 font-medium"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="clientName">Client</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => updateField("clientName", e.target.value)}
                placeholder="Client Name"
                className="bg-purple-50 font-medium"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Property Address"
                className="bg-purple-50 font-medium"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="Company Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plumberName">Plumber's Name</Label>
              <Input
                id="plumberName"
                value={formData.plumberName}
                onChange={(e) => updateField("plumberName", e.target.value)}
                placeholder="Plumber's Name"
                className="bg-purple-50 font-medium"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => updateField("licenseNumber", e.target.value)}
                placeholder="License Number"
              />
            </div>
          </div>

          <Separator />

          {/* Action Taken Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Compass className="h-5 w-5 mr-2 text-purple-600" />
              Action Taken
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="geyserReplaced">Geyser Replaced</Label>
                <Select value={formData.geyserReplaced} onValueChange={(value) => updateField("geyserReplaced", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Y">Y</SelectItem>
                    <SelectItem value="N">N</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="geyserRepair">Geyser Repair</Label>
                <Select value={formData.geyserRepair} onValueChange={(value) => updateField("geyserRepair", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Y">Y</SelectItem>
                    <SelectItem value="N">N</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Old Geyser Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Old Geyser Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="oldGeyserType">Old Geyser Type</Label>
                <Select value={formData.oldGeyserType} onValueChange={(value) => updateField("oldGeyserType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electric">Electric</SelectItem>
                    <SelectItem value="Solar">Solar</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="oldGeyserSize">Old Geyser Size</Label>
                <Select value={formData.oldGeyserSize} onValueChange={(value) => updateField("oldGeyserSize", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="150">150</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="350">350</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="oldGeyserMake">Old Geyser Make</Label>
                <Select value={formData.oldGeyserMake} onValueChange={(value) => updateField("oldGeyserMake", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Heat Tech">Heat Tech</SelectItem>
                    <SelectItem value="Kwikot">Kwikot</SelectItem>
                    <SelectItem value="Gap">Gap</SelectItem>
                    <SelectItem value="WE">WE</SelectItem>
                    <SelectItem value="Frankie">Frankie</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.oldGeyserType === "Other" && (
              <div>
                <Label htmlFor="oldGeyserOther">Old Geyser Other (specify)</Label>
                <Input
                  id="oldGeyserOther"
                  value={formData.oldGeyserOther}
                  onChange={(e) => updateField("oldGeyserOther", e.target.value)}
                  placeholder="Please specify"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="oldSerialNumber">Old Serial Number</Label>
                <Input
                  id="oldSerialNumber"
                  value={formData.oldSerialNumber}
                  onChange={(e) => updateField("oldSerialNumber", e.target.value)}
                  placeholder="Serial Number"
                />
              </div>
              <div>
                <Label htmlFor="oldCode">Old Code</Label>
                <Input
                  id="oldCode"
                  value={formData.oldCode}
                  onChange={(e) => updateField("oldCode", e.target.value)}
                  placeholder="Code"
                />
              </div>
              <div>
                <Label htmlFor="oldNoTag">Old No Tag</Label>
                <Input
                  id="oldNoTag"
                  value={formData.oldNoTag}
                  onChange={(e) => updateField("oldNoTag", e.target.value)}
                  placeholder="No Tag"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="wallMounted">Wall Mounted</Label>
                <Input
                  id="wallMounted"
                  value={formData.wallMounted}
                  onChange={(e) => updateField("wallMounted", e.target.value)}
                  placeholder="Wall Mounted"
                />
              </div>
              <div>
                <Label htmlFor="insideRoof">Inside Roof</Label>
                <Input
                  id="insideRoof"
                  value={formData.insideRoof}
                  onChange={(e) => updateField("insideRoof", e.target.value)}
                  placeholder="Inside Roof"
                />
              </div>
              <div>
                <Label htmlFor="otherLocation">Other Location</Label>
                <Input
                  id="otherLocation"
                  value={formData.otherLocation}
                  onChange={(e) => updateField("otherLocation", e.target.value)}
                  placeholder="Other Location"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* New Geyser Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">New Geyser Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="newGeyserType">New Geyser Type</Label>
                <Select value={formData.newGeyserType} onValueChange={(value) => updateField("newGeyserType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electric">Electric</SelectItem>
                    <SelectItem value="Solar">Solar</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newGeyserSize">New Geyser Size</Label>
                <Select value={formData.newGeyserSize} onValueChange={(value) => updateField("newGeyserSize", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="150">150</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="350">350</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newGeyserMake">New Geyser Make</Label>
                <Select value={formData.newGeyserMake} onValueChange={(value) => updateField("newGeyserMake", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Heat Tech">Heat Tech</SelectItem>
                    <SelectItem value="Kwikot">Kwikot</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.newGeyserMake === "Other" && (
              <div>
                <Label htmlFor="newGeyserOther">New Geyser Other (specify)</Label>
                <Input
                  id="newGeyserOther"
                  value={formData.newGeyserOther}
                  onChange={(e) => updateField("newGeyserOther", e.target.value)}
                  placeholder="Please specify"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newSerialNumber">New Serial Number</Label>
                <Input
                  id="newSerialNumber"
                  value={formData.newSerialNumber}
                  onChange={(e) => updateField("newSerialNumber", e.target.value)}
                  placeholder="Serial Number"
                />
              </div>
              <div>
                <Label htmlFor="newCode">New Code</Label>
                <Input
                  id="newCode"
                  value={formData.newCode}
                  onChange={(e) => updateField("newCode", e.target.value)}
                  placeholder="Code"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Items Installed Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Items Installed</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: "itemGeyser", label: "Geyser" },
                { id: "itemDripTray", label: "Drip Tray" },
                { id: "itemVacuumBreakers", label: "Vacuum Breakers" },
                { id: "itemPlatform", label: "Platform" },
                { id: "itemBonding", label: "Bonding" },
                { id: "itemIsolator", label: "Isolator" },
                { id: "itemPressureValve", label: "Pressure Valve" },
                { id: "itemRelocated", label: "Relocated" },
                { id: "itemThermostat", label: "Thermostat" },
                { id: "itemElement", label: "Element" },
                { id: "itemSafetyValve", label: "Safety Valve" },
                { id: "itemNonReturn", label: "Non Return" },
              ].map((item) => (
                <div key={item.id}>
                  <Label htmlFor={item.id}>{item.label}</Label>
                  <Select value={formData[item.id as keyof DiscoveryFormData] as string} onValueChange={(value) => updateField(item.id as keyof DiscoveryFormData, value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Y</SelectItem>
                      <SelectItem value="N">N</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Solar Geyser Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Solar Geyser Items</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: "solarVacuumTubes", label: "Vacuum Tubes" },
                { id: "solarFlatPanels", label: "Flat Panels" },
                { id: "solarCirculationPump", label: "Circulation Pump" },
                { id: "solarGeyserWise", label: "Geyser Wise" },
                { id: "solarMixingValve", label: "Mixing Valve" },
                { id: "solarPanel12v", label: "Solar Panel 12V" },
              ].map((item) => (
                <div key={item.id}>
                  <Label htmlFor={item.id}>{item.label}</Label>
                  <Select value={formData[item.id as keyof DiscoveryFormData] as string} onValueChange={(value) => updateField(item.id as keyof DiscoveryFormData, value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Y</SelectItem>
                      <SelectItem value="N">N</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            {!formSubmitted ? (
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                <Save className="h-4 w-4 mr-2" />
                Submit Discovery Form
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
      <Card className="w-full">
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
    </div>
  );
}
