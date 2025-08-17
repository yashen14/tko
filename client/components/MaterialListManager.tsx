import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Package,
  Wrench,
  List,
  Save,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Job } from "@shared/types";

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

  // Extra items (expandable)
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

interface MaterialListManagerProps {
  job: Job;
  onMaterialListSave: (materialList: MaterialList) => void;
  existingMaterialList?: MaterialList;
}

const DEFAULT_MATERIAL_ITEM: MaterialItem = {
  name: "",
  size: "",
  kwikot: false,
  heatTech: false,
  techron: false,
  quantityRequested: 0,
  quantityUsed: 0,
  description: "",
  unitPrice: 0,
  totalPrice: 0,
};

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

export function MaterialListManager({
  job,
  onMaterialListSave,
  existingMaterialList,
}: MaterialListManagerProps) {
  const [materialList, setMaterialList] = useState<MaterialList>(() => {
    const defaultSundries = Array.from({ length: 15 }, (_, i) => ({
      name: "",
      qtyRequested: 0,
      qtyUsed: 0,
      description: "",
      unitPrice: 0,
      supplier: "",
    }));

    const defaultAdditionalMaterials = Array.from({ length: 5 }, (_, i) => ({
      name: "",
      qtyRequested: 0,
      qtyUsed: 0,
      description: "",
      unitPrice: 0,
      supplier: "",
      category: "",
    }));

    return {
      id: existingMaterialList?.id || `ml-${Date.now()}`,
      jobId: job.id,
      date: existingMaterialList?.date || new Date().toISOString().split("T")[0],
      plumber: existingMaterialList?.plumber || job.assignedTo,
      claimNumber: existingMaterialList?.claimNumber || job.claimNo || job.ClaimNo || "",
      insurance: existingMaterialList?.insurance || job.companyId || "",
      propertyAddress: existingMaterialList?.propertyAddress || job.riskAddress || "",
      clientName: existingMaterialList?.clientName || job.insuredName || job.InsuredName || "",
      contactNumber: existingMaterialList?.contactNumber || "",
      jobType: existingMaterialList?.jobType || "assessment",

      geyser: existingMaterialList?.geyser || { ...DEFAULT_MATERIAL_ITEM, name: "Geyser" },
      dripTray: existingMaterialList?.dripTray || { ...DEFAULT_MATERIAL_ITEM, name: "Drip Tray" },
      vacuumBreaker1: existingMaterialList?.vacuumBreaker1 || { ...DEFAULT_MATERIAL_ITEM, name: "Cold Vacuum Breaker" },
      vacuumBreaker2: existingMaterialList?.vacuumBreaker2 || { ...DEFAULT_MATERIAL_ITEM, name: "Hot Vacuum Breaker" },
      pressureControlValve: existingMaterialList?.pressureControlValve || { ...DEFAULT_MATERIAL_ITEM, name: "PRV" },
      nonReturnValve: existingMaterialList?.nonReturnValve || { ...DEFAULT_MATERIAL_ITEM, name: "Non Return Valve" },
      fogiPack: existingMaterialList?.fogiPack || { ...DEFAULT_MATERIAL_ITEM, name: "Fogi Pack" },
      temperatureReliefValve: existingMaterialList?.temperatureReliefValve || { ...DEFAULT_MATERIAL_ITEM, name: "Temperature Relief Valve" },
      isolationValve: existingMaterialList?.isolationValve || { ...DEFAULT_MATERIAL_ITEM, name: "Isolation Valve" },
      copperPipe: existingMaterialList?.copperPipe || { ...DEFAULT_MATERIAL_ITEM, name: "Copper Pipe" },
      electricalIsolator: existingMaterialList?.electricalIsolator || { ...DEFAULT_MATERIAL_ITEM, name: "Electrical Isolator" },
      thermostat: existingMaterialList?.thermostat || { ...DEFAULT_MATERIAL_ITEM, name: "Thermostat" },

      extraItems: existingMaterialList?.extraItems || [],
      sundries: existingMaterialList?.sundries || defaultSundries,
      additionalMaterials: existingMaterialList?.additionalMaterials || defaultAdditionalMaterials,

      laborHours: existingMaterialList?.laborHours || 0,
      laborRate: existingMaterialList?.laborRate || 0,
      serviceCallFee: existingMaterialList?.serviceCallFee || 0,
      transportCost: existingMaterialList?.transportCost || 0,

      workDescription: existingMaterialList?.workDescription || "",
      specialInstructions: existingMaterialList?.specialInstructions || "",
      additionalComments: existingMaterialList?.additionalComments || "",

      subtotal: existingMaterialList?.subtotal || 0,
      vatAmount: existingMaterialList?.vatAmount || 0,
      totalAmount: existingMaterialList?.totalAmount || 0,

      jobPhase: existingMaterialList?.jobPhase || (job.status === "completed" ? "replacement" : "assessment"),
      completed: existingMaterialList?.completed || false,
    };
  });

  const canEditUsedQuantities = job.status === "completed" || job.status === "in_progress";

  const updateMaterialItem = (
    itemKey: keyof MaterialList,
    field: keyof MaterialItem,
    value: any,
  ) => {
    setMaterialList((prev) => ({
      ...prev,
      [itemKey]: {
        ...(prev[itemKey] as MaterialItem),
        [field]: value,
      },
    }));
  };

  const addExtraItem = () => {
    setMaterialList((prev) => ({
      ...prev,
      extraItems: [...prev.extraItems, { name: "", quantity: 0, description: "", unitPrice: 0 }],
    }));
  };

  const removeExtraItem = (index: number) => {
    setMaterialList((prev) => ({
      ...prev,
      extraItems: prev.extraItems.filter((_, i) => i !== index),
    }));
  };

  const updateExtraItem = (index: number, field: string, value: any) => {
    setMaterialList((prev) => ({
      ...prev,
      extraItems: prev.extraItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const updateSundry = (index: number, field: string, value: any) => {
    setMaterialList((prev) => ({
      ...prev,
      sundries: prev.sundries.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const updateAdditionalMaterial = (index: number, field: string, value: any) => {
    setMaterialList((prev) => ({
      ...prev,
      additionalMaterials: prev.additionalMaterials.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const calculateTotals = () => {
    // Calculate subtotal from all items
    const standardItemsTotal = STANDARD_ITEMS.reduce((total, { key }) => {
      const item = materialList[key as keyof MaterialList] as MaterialItem;
      return total + (item.quantityRequested * (item.unitPrice || 0));
    }, 0);

    const extraItemsTotal = materialList.extraItems.reduce((total, item) => 
      total + (item.quantity * item.unitPrice), 0);

    const sundriesTotal = materialList.sundries.reduce((total, item) => 
      total + (item.qtyRequested * item.unitPrice), 0);

    const additionalMaterialsTotal = materialList.additionalMaterials.reduce((total, item) => 
      total + (item.qtyRequested * item.unitPrice), 0);

    const laborTotal = materialList.laborHours * materialList.laborRate;
    const subtotal = standardItemsTotal + extraItemsTotal + sundriesTotal + additionalMaterialsTotal + laborTotal + materialList.serviceCallFee + materialList.transportCost;
    const vatAmount = subtotal * 0.15; // 15% VAT
    const totalAmount = subtotal + vatAmount;

    setMaterialList(prev => ({
      ...prev,
      subtotal,
      vatAmount,
      totalAmount,
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [materialList.laborHours, materialList.laborRate, materialList.serviceCallFee, materialList.transportCost]);

  const handleSave = () => {
    calculateTotals();
    onMaterialListSave(materialList);
  };

  const generatePDF = async () => {
    try {
      const response = await fetch(`/api/generate-material-list-pdf/${materialList.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialList),
      });

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
      </h4>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Label className="text-xs">Size</Label>
          <Input
            value={item.size}
            onChange={(e) =>
              updateMaterialItem(itemKey, "size", e.target.value)
            }
            placeholder="Enter size"
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Input
            value={item.description || ""}
            onChange={(e) =>
              updateMaterialItem(itemKey, "description", e.target.value)
            }
            placeholder="Enter description"
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Label className="text-xs">Quantity Requested</Label>
          <Input
            type="number"
            value={item.quantityRequested}
            onChange={(e) =>
              updateMaterialItem(
                itemKey,
                "quantityRequested",
                parseInt(e.target.value) || 0,
              )
            }
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Unit Price (R)</Label>
          <Input
            type="number"
            step="0.01"
            value={item.unitPrice || 0}
            onChange={(e) =>
              updateMaterialItem(
                itemKey,
                "unitPrice",
                parseFloat(e.target.value) || 0,
              )
            }
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={item.kwikot}
            onCheckedChange={(checked) => {
              if (checked) {
                updateMaterialItem(itemKey, "heatTech", false);
                updateMaterialItem(itemKey, "techron", false);
              }
              updateMaterialItem(itemKey, "kwikot", checked);
            }}
          />
          <Label className="text-xs">Kwikot</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={item.heatTech}
            onCheckedChange={(checked) => {
              if (checked) {
                updateMaterialItem(itemKey, "kwikot", false);
                updateMaterialItem(itemKey, "techron", false);
              }
              updateMaterialItem(itemKey, "heatTech", checked);
            }}
          />
          <Label className="text-xs">Heat Tech</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={item.techron}
            onCheckedChange={(checked) => {
              if (checked) {
                updateMaterialItem(itemKey, "kwikot", false);
                updateMaterialItem(itemKey, "heatTech", false);
              }
              updateMaterialItem(itemKey, "techron", checked);
            }}
          />
          <Label className="text-xs">Techron</Label>
        </div>
      </div>

      <div className="text-xs text-green-600 mb-2 flex items-center">
        <AlertCircle className="h-3 w-3 mr-1" />
        Optional for Enhanced Liability Waiver Form - Select only one manufacturer
      </div>

      {canEditUsedQuantities && (
        <div>
          <Label className="text-xs">Quantity Used</Label>
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
            className="text-sm"
            placeholder="Enter after job starts"
          />
        </div>
      )}

      <div className="mt-2 text-xs font-medium text-blue-600">
        Total: R{((item.quantityRequested || 0) * (item.unitPrice || 0)).toFixed(2)}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <List className="h-5 w-5 mr-2" />
              Material List - {job.title}
              <Badge variant="outline" className="ml-2">
                {materialList.jobPhase}
              </Badge>
            </div>
            <Button onClick={generatePDF} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate PDF
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Job Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs font-medium">Date</Label>
              <Input
                type="date"
                value={materialList.date}
                onChange={(e) =>
                  setMaterialList((prev) => ({ ...prev, date: e.target.value }))
                }
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Plumber</Label>
              <Input
                value={materialList.plumber}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    plumber: e.target.value,
                  }))
                }
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-green-600">
                Claim Number *
              </Label>
              <Input
                value={materialList.claimNumber}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    claimNumber: e.target.value,
                  }))
                }
                className="text-sm"
                placeholder="Auto-filled from job"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Insurance</Label>
              <Input
                value={materialList.insurance}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    insurance: e.target.value,
                  }))
                }
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Property Address</Label>
              <Input
                value={materialList.propertyAddress}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    propertyAddress: e.target.value,
                  }))
                }
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Client Name</Label>
              <Input
                value={materialList.clientName}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    clientName: e.target.value,
                  }))
                }
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Contact Number</Label>
              <Input
                value={materialList.contactNumber}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    contactNumber: e.target.value,
                  }))
                }
                className="text-sm"
                placeholder="Client contact"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Job Type</Label>
              <Select
                value={materialList.jobType}
                onValueChange={(value: any) =>
                  setMaterialList((prev) => ({ ...prev, jobType: value }))
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="replacement">Replacement</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!canEditUsedQuantities && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  Quantity used can only be filled when job is in progress or completed
                </span>
              </div>
            </div>
          )}
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

      {/* Extra Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Extra Items</CardTitle>
            <Button onClick={addExtraItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Extra Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {materialList.extraItems.map((item, index) => (
              <div key={`extra-item-${index}`} className="grid grid-cols-5 gap-3 p-3 border rounded-lg">
                <Input
                  value={item.name}
                  onChange={(e) => updateExtraItem(index, "name", e.target.value)}
                  placeholder="Item name"
                />
                <Input
                  value={item.description}
                  onChange={(e) => updateExtraItem(index, "description", e.target.value)}
                  placeholder="Description"
                />
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateExtraItem(index, "quantity", parseInt(e.target.value) || 0)}
                  placeholder="Quantity"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateExtraItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  placeholder="Unit Price"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeExtraItem(index)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sundries - 15 rows */}
      <Card>
        <CardHeader>
          <CardTitle>Sundries (15 rows available)</CardTitle>
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
            {materialList.sundries.map((sundry, index) => (
              <div key={`sundry-${index}`} className="grid grid-cols-6 gap-3 p-2 border rounded-lg">
                <Input
                  value={sundry.name}
                  onChange={(e) => updateSundry(index, "name", e.target.value)}
                  placeholder={`Sundry ${index + 1}`}
                  className="text-sm"
                />
                <Input
                  value={sundry.description}
                  onChange={(e) => updateSundry(index, "description", e.target.value)}
                  placeholder="Description"
                  className="text-sm"
                />
                <Input
                  type="number"
                  value={sundry.qtyRequested}
                  onChange={(e) => updateSundry(index, "qtyRequested", parseInt(e.target.value) || 0)}
                  placeholder="Qty"
                  className="text-sm"
                />
                <Input
                  type="number"
                  value={sundry.qtyUsed}
                  onChange={(e) => updateSundry(index, "qtyUsed", parseInt(e.target.value) || 0)}
                  placeholder="Used"
                  disabled={!canEditUsedQuantities}
                  className="text-sm"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={sundry.unitPrice}
                  onChange={(e) => updateSundry(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  placeholder="Price"
                  className="text-sm"
                />
                <Input
                  value={sundry.supplier}
                  onChange={(e) => updateSundry(index, "supplier", e.target.value)}
                  placeholder="Supplier"
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Materials - 5 rows */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Materials (5 rows available)</CardTitle>
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
            {materialList.additionalMaterials.map((material, index) => (
              <div key={`additional-material-${index}`} className="grid grid-cols-7 gap-3 p-2 border rounded-lg">
                <Input
                  value={material.name}
                  onChange={(e) => updateAdditionalMaterial(index, "name", e.target.value)}
                  placeholder={`Material ${index + 1}`}
                  className="text-sm"
                />
                <Input
                  value={material.category}
                  onChange={(e) => updateAdditionalMaterial(index, "category", e.target.value)}
                  placeholder="Category"
                  className="text-sm"
                />
                <Input
                  value={material.description}
                  onChange={(e) => updateAdditionalMaterial(index, "description", e.target.value)}
                  placeholder="Description"
                  className="text-sm"
                />
                <Input
                  type="number"
                  value={material.qtyRequested}
                  onChange={(e) => updateAdditionalMaterial(index, "qtyRequested", parseInt(e.target.value) || 0)}
                  placeholder="Qty"
                  className="text-sm"
                />
                <Input
                  type="number"
                  value={material.qtyUsed}
                  onChange={(e) => updateAdditionalMaterial(index, "qtyUsed", parseInt(e.target.value) || 0)}
                  placeholder="Used"
                  disabled={!canEditUsedQuantities}
                  className="text-sm"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={material.unitPrice}
                  onChange={(e) => updateAdditionalMaterial(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  placeholder="Price"
                  className="text-sm"
                />
                <Input
                  value={material.supplier}
                  onChange={(e) => updateAdditionalMaterial(index, "supplier", e.target.value)}
                  placeholder="Supplier"
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Labor and Service Details */}
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
                step="0.5"
                value={materialList.laborHours}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    laborHours: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="Hours"
              />
            </div>
            <div>
              <Label>Labor Rate (R/hour)</Label>
              <Input
                type="number"
                step="0.01"
                value={materialList.laborRate}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    laborRate: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="Rate"
              />
            </div>
            <div>
              <Label>Service Call Fee (R)</Label>
              <Input
                type="number"
                step="0.01"
                value={materialList.serviceCallFee}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    serviceCallFee: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="Fee"
              />
            </div>
            <div>
              <Label>Transport Cost (R)</Label>
              <Input
                type="number"
                step="0.01"
                value={materialList.transportCost}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    transportCost: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="Cost"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Description and Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Work Description and Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Work Description</Label>
              <Textarea
                value={materialList.workDescription}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    workDescription: e.target.value,
                  }))
                }
                placeholder="Describe the work to be performed..."
                rows={3}
              />
            </div>
            <div>
              <Label>Special Instructions</Label>
              <Textarea
                value={materialList.specialInstructions}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    specialInstructions: e.target.value,
                  }))
                }
                placeholder="Any special instructions or requirements..."
                rows={2}
              />
            </div>
            <div>
              <Label>Additional Comments</Label>
              <Textarea
                value={materialList.additionalComments}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    additionalComments: e.target.value,
                  }))
                }
                placeholder="Additional notes or comments..."
                rows={3}
              />
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

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button onClick={generatePDF} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Generate PDF
        </Button>
        <Button onClick={handleSave} className="px-6">
          <Save className="h-4 w-4 mr-2" />
          Save Material List
        </Button>
      </div>
    </div>
  );
}
