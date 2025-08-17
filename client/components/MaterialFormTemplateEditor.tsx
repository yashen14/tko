import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Edit, Save, X, Package, AlertCircle, Shield } from "lucide-react";

interface FormField {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox" | "date";
  required: boolean;
  placeholder?: string;
  options?: string[];
  section: string;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  icon: "Package" | "AlertCircle" | "Shield";
  color: "blue" | "red" | "green";
  sections: string[];
  fields: FormField[];
}

interface MaterialFormTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateType?: "material-list" | "noncompliance" | "liability";
  onSave?: (template: FormTemplate) => void;
}

const INITIAL_TEMPLATES: Record<string, FormTemplate> = {
  "material-list": {
    id: "material-list",
    name: "Material List",
    description: "Complete material tracking",
    icon: "Package",
    color: "blue",
    sections: ["Standard Items", "Pipes", "Sundries", "Additional Materials"],
    fields: [
      {
        id: "client-name",
        name: "clientName",
        label: "Client Name",
        type: "text",
        required: true,
        placeholder: "Enter client name",
        section: "Standard Items"
      },
      {
        id: "geyser-make",
        name: "geyserMake",
        label: "Geyser Make",
        type: "select",
        required: true,
        options: ["Kwikot", "Rheem", "Heatech", "Other"],
        section: "Standard Items"
      },
      {
        id: "geyser-size",
        name: "geyserSize",
        label: "Geyser Size (L)",
        type: "select",
        required: true,
        options: ["100L", "150L", "200L", "250L", "300L"],
        section: "Standard Items"
      },
      {
        id: "element-size",
        name: "elementSize",
        label: "Element Size",
        type: "select",
        required: false,
        options: ["2000W", "3000W", "4000W"],
        section: "Standard Items"
      },
      {
        id: "pipe-type",
        name: "pipeType",
        label: "Pipe Type",
        type: "select",
        required: true,
        options: ["15mm Copper", "22mm Copper", "20mm Plastic", "25mm Plastic"],
        section: "Pipes"
      },
      {
        id: "pipe-length",
        name: "pipeLength",
        label: "Pipe Length (m)",
        type: "number",
        required: true,
        placeholder: "Enter length in meters",
        section: "Pipes"
      }
    ]
  },
  "noncompliance": {
    id: "noncompliance",
    name: "Non Compliance",
    description: "33-question compliance form",
    icon: "AlertCircle",
    color: "red",
    sections: ["Electrical Safety", "Plumbing Compliance", "Installation Standards"],
    fields: [
      {
        id: "cold-vacuum-breaker",
        name: "coldVacuumBreaker",
        label: "Cold vacuum breaker (mandatory for all areas)",
        type: "select",
        required: true,
        options: ["Yes", "No", "N/A"],
        section: "Plumbing Compliance"
      },
      {
        id: "hot-vacuum-breaker",
        name: "hotVacuumBreaker",
        label: "Hot vacuum breaker (mandatory for all areas)",
        type: "select",
        required: true,
        options: ["Yes", "No", "N/A"],
        section: "Plumbing Compliance"
      },
      {
        id: "isolation-valve-cold",
        name: "isolationValveCold",
        label: "Isolation valve on cold water supply",
        type: "select",
        required: true,
        options: ["Yes", "No", "N/A"],
        section: "Plumbing Compliance"
      },
      {
        id: "isolation-valve-hot",
        name: "isolationValveHot",
        label: "Isolation valve on hot water supply",
        type: "select",
        required: true,
        options: ["Yes", "No", "N/A"],
        section: "Plumbing Compliance"
      }
    ]
  },
  "liability": {
    id: "liability",
    name: "Enhanced Liability",
    description: "Before/after assessment",
    icon: "Shield",
    color: "green",
    sections: ["Before Assessment", "After Assessment", "Comparison"],
    fields: [
      {
        id: "property-condition-before",
        name: "propertyConditionBefore",
        label: "Property Condition (Before)",
        type: "textarea",
        required: true,
        placeholder: "Describe property condition before work",
        section: "Before Assessment"
      },
      {
        id: "property-condition-after",
        name: "propertyConditionAfter",
        label: "Property Condition (After)",
        type: "textarea",
        required: true,
        placeholder: "Describe property condition after work",
        section: "After Assessment"
      },
      {
        id: "damages-observed",
        name: "damagesObserved",
        label: "Damages Observed",
        type: "select",
        required: true,
        options: ["None", "Minor", "Moderate", "Significant"],
        section: "Comparison"
      }
    ]
  }
};

export function MaterialFormTemplateEditor({
  open,
  onOpenChange,
  templateType = "material-list",
  onSave
}: MaterialFormTemplateEditorProps) {
  const [template, setTemplate] = useState<FormTemplate>(INITIAL_TEMPLATES[templateType]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FormField["type"]>("text");
  const [newFieldSection, setNewFieldSection] = useState("");
  const [newSectionName, setNewSectionName] = useState("");

  useEffect(() => {
    if (templateType && INITIAL_TEMPLATES[templateType]) {
      setTemplate(INITIAL_TEMPLATES[templateType]);
    }
  }, [templateType]);

  const handleSave = () => {
    onSave?.(template);
    onOpenChange(false);
  };

  const addField = () => {
    if (!newFieldName || !newFieldLabel || !newFieldSection) return;

    const newField: FormField = {
      id: `${newFieldName}-${Date.now()}`,
      name: newFieldName,
      label: newFieldLabel,
      type: newFieldType,
      required: false,
      section: newFieldSection
    };

    setTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));

    setNewFieldName("");
    setNewFieldLabel("");
    setNewFieldType("text");
  };

  const deleteField = (fieldId: string) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const addSection = () => {
    if (!newSectionName || template.sections.includes(newSectionName)) return;

    setTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSectionName]
    }));

    setNewSectionName("");
  };

  const deleteSection = (sectionName: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s !== sectionName),
      fields: prev.fields.filter(field => field.section !== sectionName)
    }));
  };

  const getIcon = () => {
    switch (template.icon) {
      case "Package": return <Package className="h-5 w-5" />;
      case "AlertCircle": return <AlertCircle className="h-5 w-5" />;
      case "Shield": return <Shield className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getColorClasses = () => {
    switch (template.color) {
      case "blue": return "bg-blue-100 text-blue-800 border-blue-200";
      case "red": return "bg-red-100 text-red-800 border-red-200";
      case "green": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>Edit {template.name} Template</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="template-info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="template-info">Template Info</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
            </TabsList>

            <TabsContent value="template-info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Template Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={template.name}
                      onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={template.description}
                      onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-color">Color Theme</Label>
                    <Select
                      value={template.color}
                      onValueChange={(value: "blue" | "red" | "green") => 
                        setTemplate(prev => ({ ...prev, color: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sections" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Form Sections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="New section name"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                    />
                    <Button onClick={addSection}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Section
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {template.sections.map((section, index) => (
                      <div key={section} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{section}</span>
                          <Badge variant="secondary">
                            {template.fields.filter(f => f.section === section).length} fields
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSection(section)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Form Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    <Input
                      placeholder="Field name"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                    />
                    <Input
                      placeholder="Field label"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                    />
                    <Select value={newFieldType} onValueChange={(value: FormField["type"]) => setNewFieldType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newFieldSection} onValueChange={setNewFieldSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {template.sections.map(section => (
                          <SelectItem key={section} value={section}>{section}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addField} className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Field
                  </Button>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {template.sections.map(section => (
                      <div key={section}>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">{section}</h4>
                        {template.fields
                          .filter(field => field.section === section)
                          .map(field => (
                            <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                              <div className="flex-1">
                                {editingField === field.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={field.label}
                                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                                    />
                                    <div className="flex space-x-2">
                                      <Select
                                        value={field.type}
                                        onValueChange={(value: FormField["type"]) => updateField(field.id, { type: value })}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="text">Text</SelectItem>
                                          <SelectItem value="number">Number</SelectItem>
                                          <SelectItem value="select">Select</SelectItem>
                                          <SelectItem value="textarea">Textarea</SelectItem>
                                          <SelectItem value="checkbox">Checkbox</SelectItem>
                                          <SelectItem value="date">Date</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button size="sm" onClick={() => setEditingField(null)}>
                                        <Save className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-medium">{field.label}</span>
                                    <div className="text-sm text-gray-500">
                                      {field.name} • {field.type} {field.required && "• Required"}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                                >
                                  {editingField === field.id ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteField(field.id)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className={getColorClasses()}>
            <Save className="h-4 w-4 mr-1" />
            Save Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
