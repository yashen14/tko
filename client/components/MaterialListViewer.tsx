import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  List,
  Save,
  AlertCircle,
  FileText,
  Eye,
  Lock,
  Edit,
} from "lucide-react";
import { Job, FormSubmission } from "@shared/types";

interface MaterialItem {
  name: string;
  size: string;
  kwikot: boolean;
  heatTech: boolean;
  techron: boolean;
  quantityRequested: number;
  quantityUsed: number;
  description?: string;
  unitPrice?: number;
  totalPrice?: number;
}

interface MaterialList {
  id: string;
  jobId: string;
  date: string;
  plumber: string;
  claimNumber: string;
  insurance: string;
  propertyAddress: string;
  clientName: string;
  contactNumber: string;
  jobType: "assessment" | "repair" | "replacement" | "maintenance";

  // Standard items
  geyser: MaterialItem;
  dripTray: MaterialItem;
  vacuumBreaker1: MaterialItem;
  vacuumBreaker2: MaterialItem;
  pressureControlValve: MaterialItem;
  nonReturnValve: MaterialItem;
  fogiPack: MaterialItem;
  temperatureReliefValve: MaterialItem;
  isolationValve: MaterialItem;
  copperPipe: MaterialItem;
  electricalIsolator: MaterialItem;
  thermostat: MaterialItem;

  // Extra items
  extraItems: Array<{ name: string; quantity: number; description: string; unitPrice: number }>;

  // Sundries (up to 15 rows)
  sundries: Array<{ 
    name: string; 
    qtyRequested: number; 
    qtyUsed: number; 
    description: string; 
    unitPrice: number; 
    supplier: string;
  }>;

  // Additional materials (up to 5 rows)
  additionalMaterials: Array<{
    name: string;
    qtyRequested: number;
    qtyUsed: number;
    description: string;
    unitPrice: number;
    supplier: string;
    category: string;
  }>;

  // Labor and service details
  laborHours: number;
  laborRate: number;
  serviceCallFee: number;
  transportCost: number;

  // Notes and additional information
  workDescription: string;
  specialInstructions: string;
  additionalComments: string;

  // Totals
  subtotal: number;
  vatAmount: number;
  totalAmount: number;

  jobPhase: "assessment" | "repair" | "replacement";
  completed: boolean;
}

interface MaterialListViewerProps {
  submission: FormSubmission;
  job: Job;
  canEdit?: boolean;
}

const STANDARD_ITEMS = [
  { key: "geyser", label: "Geyser", defaultName: "Geyser" },
  { key: "dripTray", label: "Drip Tray", defaultName: "Drip Tray" },
  { key: "vacuumBreaker1", label: "Vacuum Breaker 1", defaultName: "Cold Vacuum Breaker" },
  { key: "vacuumBreaker2", label: "Vacuum Breaker 2", defaultName: "Hot Vacuum Breaker" },
  { key: "pressureControlValve", label: "Pressure Control Valve", defaultName: "PRV" },
  { key: "nonReturnValve", label: "Non Return Valve", defaultName: "Non Return Valve" },
  { key: "fogiPack", label: "Fogi Pack", defaultName: "Fogi Pack" },
  { key: "temperatureReliefValve", label: "Temperature Relief Valve", defaultName: "Temperature Relief Valve" },
  { key: "isolationValve", label: "Isolation Valve", defaultName: "Isolation Valve" },
  { key: "copperPipe", label: "Copper Pipe", defaultName: "Copper Pipe" },
  { key: "electricalIsolator", label: "Electrical Isolator", defaultName: "Electrical Isolator" },
  { key: "thermostat", label: "Thermostat", defaultName: "Thermostat" },
];

export function MaterialListViewer({ submission, job, canEdit = false }: MaterialListViewerProps) {
  const [materialList, setMaterialList] = useState<MaterialList | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Parse the submission data to get the material list
    if (submission.data) {
      setMaterialList(submission.data as MaterialList);
    }
    setLoading(false);
  }, [submission]);

  const canEditUsedQuantities = canEdit && (job.status === "completed" || job.status === "in_progress");

  const updateSundry = (index: number, field: string, value: any) => {
    if (!materialList || !canEditUsedQuantities) return;
    
    setMaterialList((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sundries: prev.sundries.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      };
    });
    setHasChanges(true);
  };

  const updateAdditionalMaterial = (index: number, field: string, value: any) => {
    if (!materialList || !canEditUsedQuantities) return;
    
    setMaterialList((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        additionalMaterials: prev.additionalMaterials.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      };
    });
    setHasChanges(true);
  };

  const updateMaterialItem = (
    itemKey: keyof MaterialList,
    field: keyof MaterialItem,
    value: any,
  ) => {
    if (!materialList || !canEditUsedQuantities) return;
    
    setMaterialList((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [itemKey]: {
          ...(prev[itemKey] as MaterialItem),
          [field]: value,
        },
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!materialList || !hasChanges) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/form-submissions/${submission.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          data: materialList,
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        alert("Material list updated successfully!");
      } else {
        console.error("Failed to update material list");
        alert("Failed to update material list. Please try again.");
      }
    } catch (error) {
      console.error("Error updating material list:", error);
      alert("Error updating material list. Please try again.");
    }
  };

  const generatePDF = async () => {
    if (!materialList) return;

    const url = `/api/generate-material-list-pdf/${materialList.id}`;
    console.log("MaterialListViewer - Attempting to generate PDF with URL:", url);
    console.log("MaterialListViewer - Material list data:", materialList);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialList),
      });

      console.log("MaterialListViewer - Response status:", response.status);
      console.log("MaterialListViewer - Response headers:", [...response.headers.entries()]);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ML.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const MaterialItemComponent = ({
    item,
    itemKey,
    label,
  }: {
    item: MaterialItem;
    itemKey: keyof MaterialList;
    label: string;
  }) => (
    <Card className="p-4">
      <h4 className="font-medium mb-3 flex items-center">
        <Package className="h-4 w-4 mr-2" />
        {label}
        {!canEditUsedQuantities && <Lock className="h-3 w-3 ml-2 text-gray-400" />}
      </h4>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Label className="text-xs">Size</Label>
          <Input
            value={item.size}
            readOnly
            className="text-sm bg-gray-50"
          />
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Input
            value={item.description || ""}
            readOnly
            className="text-sm bg-gray-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Label className="text-xs">Quantity Requested</Label>
          <Input
            type="number"
            value={item.quantityRequested}
            readOnly
            className="text-sm bg-gray-50"
          />
        </div>
        <div>
          <Label className="text-xs">Unit Price (R)</Label>
          <Input
            type="number"
            value={item.unitPrice || 0}
            readOnly
            className="text-sm bg-gray-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={item.kwikot}
            disabled
            className="text-sm"
          />
          <Label className="text-xs">Kwikot</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={item.heatTech}
            disabled
            className="text-sm"
          />
          <Label className="text-xs">Heat Tech</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={item.techron}
            disabled
            className="text-sm"
          />
          <Label className="text-xs">Techron</Label>
        </div>
      </div>

      {canEditUsedQuantities ? (
        <div>
          <Label className="text-xs flex items-center">
            <Edit className="h-3 w-3 mr-1" />
            Quantity Used (Editable)
          </Label>
          <Input
            type="number"
            value={item.quantityUsed}
            onChange={(e) =>
              updateMaterialItem(
                itemKey,
                "quantityUsed",
                parseInt(e.target.value) || 0,
              )
            }
            className="text-sm border-blue-300 focus:border-blue-500"
          />
        </div>
      ) : (
        <div>
          <Label className="text-xs">Quantity Used</Label>
          <Input
            type="number"
            value={item.quantityUsed}
            readOnly
            className="text-sm bg-gray-50"
          />
        </div>
      )}

      <div className="mt-2 text-xs font-medium text-blue-600">
        Total: R{((item.quantityRequested || 0) * (item.unitPrice || 0)).toFixed(2)}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!materialList) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No material list data found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Material List - {job.title}
              <Badge variant="outline" className="ml-2">
                {materialList.jobPhase}
              </Badge>
              {canEditUsedQuantities && (
                <Badge variant="secondary" className="ml-2">
                  <Edit className="h-3 w-3 mr-1" />
                  Can Edit Qty Used
                </Badge>
              )}
            </div>
            <div className="flex space-x-2">
              <Button onClick={generatePDF} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              {canEditUsedQuantities && hasChanges && (
                <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!canEditUsedQuantities && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <Lock className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  This is a read-only view of your submitted material list. 
                  {job.status === "completed" ? " Since the job is completed, you can only view the data." : " You can only edit quantity used when the job is in progress or completed."}
                </span>
              </div>
            </div>
          )}

          {canEditUsedQuantities && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Edit className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800">
                  You can now edit the "Quantity Used" fields for items where you've entered quantities requested. All other fields are locked.
                </span>
              </div>
            </div>
          )}

          {/* Job Details - Read Only */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs font-medium">Date</Label>
              <Input
                value={materialList.date}
                readOnly
                className="text-sm bg-white"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Plumber</Label>
              <Input
                value={materialList.plumber}
                readOnly
                className="text-sm bg-white"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Claim Number</Label>
              <Input
                value={materialList.claimNumber}
                readOnly
                className="text-sm bg-white"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Insurance</Label>
              <Input
                value={materialList.insurance}
                readOnly
                className="text-sm bg-white"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Property Address</Label>
              <Input
                value={materialList.propertyAddress}
                readOnly
                className="text-sm bg-white"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Client Name</Label>
              <Input
                value={materialList.clientName}
                readOnly
                className="text-sm bg-white"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Contact Number</Label>
              <Input
                value={materialList.contactNumber}
                readOnly
                className="text-sm bg-white"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Job Type</Label>
              <Input
                value={materialList.jobType}
                readOnly
                className="text-sm bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standard Items */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STANDARD_ITEMS.map(({ key, label }) => (
              <MaterialItemComponent
                key={key}
                item={materialList[key as keyof MaterialList] as MaterialItem}
                itemKey={key as keyof MaterialList}
                label={label}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extra Items - Read Only */}
      {materialList.extraItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extra Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {materialList.extraItems.map((item, index) => (
                <div key={`extra-item-${index}`} className="grid grid-cols-4 gap-3 p-3 border rounded-lg bg-gray-50">
                  <Input value={item.name} readOnly placeholder="Item name" />
                  <Input value={item.description} readOnly placeholder="Description" />
                  <Input type="number" value={item.quantity} readOnly placeholder="Quantity" />
                  <Input type="number" value={item.unitPrice} readOnly placeholder="Unit Price" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sundries - With editable Qty Used if allowed */}
      {materialList.sundries.some(s => s.name || s.qtyRequested > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Sundries
              {canEditUsedQuantities && (
                <Badge variant="secondary" className="ml-2">
                  <Edit className="h-3 w-3 mr-1" />
                  Qty Used Editable
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-6 gap-3 font-semibold text-xs text-gray-600 pb-2 border-b">
                <div>Name</div>
                <div>Description</div>
                <div>Qty Requested</div>
                <div>Qty Used</div>
                <div>Unit Price</div>
                <div>Supplier</div>
              </div>
              {materialList.sundries
                .filter(sundry => sundry.name || sundry.qtyRequested > 0)
                .map((sundry, index) => (
                  <div key={`sundry-${index}`} className="grid grid-cols-6 gap-3 p-2 border rounded-lg">
                    <Input
                      value={sundry.name}
                      readOnly
                      className="text-sm bg-gray-50"
                    />
                    <Input
                      value={sundry.description}
                      readOnly
                      className="text-sm bg-gray-50"
                    />
                    <Input
                      type="number"
                      value={sundry.qtyRequested}
                      readOnly
                      className="text-sm bg-gray-50"
                    />
                    <Input
                      type="number"
                      value={sundry.qtyUsed}
                      onChange={(e) => updateSundry(index, "qtyUsed", parseInt(e.target.value) || 0)}
                      disabled={!canEditUsedQuantities}
                      className={canEditUsedQuantities ? "text-sm border-blue-300 focus:border-blue-500" : "text-sm bg-gray-50"}
                    />
                    <Input
                      type="number"
                      value={sundry.unitPrice}
                      readOnly
                      className="text-sm bg-gray-50"
                    />
                    <Input
                      value={sundry.supplier}
                      readOnly
                      className="text-sm bg-gray-50"
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Materials - With editable Qty Used if allowed */}
      {materialList.additionalMaterials.some(m => m.name || m.qtyRequested > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Additional Materials
              {canEditUsedQuantities && (
                <Badge variant="secondary" className="ml-2">
                  <Edit className="h-3 w-3 mr-1" />
                  Qty Used Editable
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-3 font-semibold text-xs text-gray-600 pb-2 border-b">
                <div>Name</div>
                <div>Category</div>
                <div>Description</div>
                <div>Qty Requested</div>
                <div>Qty Used</div>
                <div>Unit Price</div>
                <div>Supplier</div>
              </div>
              {materialList.additionalMaterials
                .filter(material => material.name || material.qtyRequested > 0)
                .map((material, index) => (
                  <div key={`additional-material-${index}`} className="grid grid-cols-7 gap-3 p-2 border rounded-lg">
                    <Input
                      value={material.name}
                      readOnly
                      className="text-sm bg-gray-50"
                    />
                    <Input
                      value={material.category}
                      readOnly
                      className="text-sm bg-gray-50"
                    />
                    <Input
                      value={material.description}
                      readOnly
                      className="text-sm bg-gray-50"
                    />
                    <Input
                      type="number"
                      value={material.qtyRequested}
                      readOnly
                      className="text-sm bg-gray-50"
                    />
                    <Input
                      type="number"
                      value={material.qtyUsed}
                      onChange={(e) => updateAdditionalMaterial(index, "qtyUsed", parseInt(e.target.value) || 0)}
                      disabled={!canEditUsedQuantities}
                      className={canEditUsedQuantities ? "text-sm border-blue-300 focus:border-blue-500" : "text-sm bg-gray-50"}
                    />
                    <Input
                      type="number"
                      value={material.unitPrice}
                      readOnly
                      className="text-sm bg-gray-50"
                    />
                    <Input
                      value={material.supplier}
                      readOnly
                      className="text-sm bg-gray-50"
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Labor and Service Details - Read Only */}
      <Card>
        <CardHeader>
          <CardTitle>Labor and Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Labor Hours</Label>
              <Input
                type="number"
                value={materialList.laborHours}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Labor Rate (R/hour)</Label>
              <Input
                type="number"
                value={materialList.laborRate}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Service Call Fee (R)</Label>
              <Input
                type="number"
                value={materialList.serviceCallFee}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Transport Cost (R)</Label>
              <Input
                type="number"
                value={materialList.transportCost}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Description and Comments - Read Only */}
      <Card>
        <CardHeader>
          <CardTitle>Work Description and Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Work Description</Label>
              <div className="p-3 bg-gray-50 rounded border min-h-[80px] text-sm">
                {materialList.workDescription || "No description provided"}
              </div>
            </div>
            <div>
              <Label>Special Instructions</Label>
              <div className="p-3 bg-gray-50 rounded border min-h-[60px] text-sm">
                {materialList.specialInstructions || "No special instructions"}
              </div>
            </div>
            <div>
              <Label>Additional Comments</Label>
              <div className="p-3 bg-gray-50 rounded border min-h-[80px] text-sm">
                {materialList.additionalComments || "No additional comments"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-md ml-auto">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R{materialList.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (15%):</span>
              <span>R{materialList.vatAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount:</span>
              <span>R{materialList.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button onClick={generatePDF} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        {canEditUsedQuantities && hasChanges && (
          <Button onClick={handleSave} className="px-6 bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Save Quantity Used Updates
          </Button>
        )}
      </div>
    </div>
  );
}
