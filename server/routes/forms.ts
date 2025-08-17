import { RequestHandler } from "express";
import {
  Form,
  FormField,
  CreateFormRequest,
  FormSubmission,
} from "@shared/types";
import { predefinedForms, getAllPredefinedForms } from "./predefinedForms";
import { saveFormSubmissionToMongo } from "../utils/mongoDataAccess";

// Mock storage - in production, use a proper database
export let forms: Form[] = [...predefinedForms]; // Initialize with predefined forms

// Core forms with variable mappings
const coreForms: Form[] = [
  {
    id: "noncompliance-form",
    name: "Non Compliance Form",
    description: "Assessment form for non-compliance issues and geyser replacement",
    fields: [
      { id: "date", label: "Date", type: "date", required: false, autoFillFrom: "currentDate" },
      { id: "insuranceName", label: "Insurance Name", type: "text", required: false, autoFillFrom: "underwriter" },
      { id: "claimNumber", label: "Claim Number", type: "text", required: false, autoFillFrom: "claimNo" },
      { id: "clientName", label: "Client Name", type: "text", required: false, autoFillFrom: "insuredName" },
      { id: "clientSurname", label: "Client Surname", type: "text", required: false },
      { id: "installersName", label: "Installers Name", type: "text", required: false, autoFillFrom: "assignedStaffName" },
      { id: "quotationSupplied", label: "Quotation Supplied?", type: "select", options: ["Yes", "No"], required: false },
      { id: "plumberIndemnity", label: "Plumber Indemnity", type: "select", options: ["Electric geyser", "Solar geyser", "Heat pump", "Pipe Repairs", "Assessment"], required: false },
      { id: "geyserMake", label: "Geyser Make", type: "text", required: false },
      { id: "geyserSerial", label: "Geyser Serial", type: "text", required: false },
      { id: "geyserCode", label: "Geyser Code", type: "text", required: false },
      { id: "selectedIssues", label: "Selected Compliance Issues", type: "checkbox", required: false }
    ],
    isTemplate: false,
    pdfTemplate: "Noncompliance.pdf",
    formType: "assessment",
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "material-list-form",
    name: "Material List Form",
    description: "Comprehensive material list for geyser installation projects",
    fields: [
      { id: "date", label: "Date", type: "date", required: false, autoFillFrom: "currentDate" },
      { id: "plumber", label: "Plumber Name", type: "text", required: false, autoFillFrom: "assignedStaffName" },
      { id: "claimNumber", label: "Claim Number", type: "text", required: false, autoFillFrom: "claimNo" },
      { id: "insurance", label: "Insurance Company", type: "text", required: false, autoFillFrom: "underwriter" },
      { id: "geyserSize", label: "Geyser Size", type: "select", options: ["50L", "100L", "150L", "200L", "250L", "300L"], required: false },
      { id: "geyserBrand", label: "Geyser Brand", type: "select", options: ["Kwikot", "Heat Tech", "Techron", "Other"], required: false },
      { id: "dripTraySize", label: "Drip Tray Size", type: "text", required: false },
      { id: "vacuumBreaker1", label: "Vacuum Breaker 1", type: "text", required: false },
      { id: "vacuumBreaker2", label: "Vacuum Breaker 2", type: "text", required: false },
      { id: "pressureControlValve", label: "Pressure Control Valve", type: "text", required: false },
      { id: "nonReturnValve", label: "Non Return Valve", type: "text", required: false },
      { id: "fogiPack", label: "Fogi Pack", type: "text", required: false },
      { id: "additionalMaterials", label: "Additional Materials", type: "textarea", required: false }
    ],
    isTemplate: false,
    pdfTemplate: "ML.pdf",
    formType: "materials",
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "liability-form",
    name: "Enhanced Liability Form",
    description: "Enhanced liability waiver form with comprehensive assessment - dual signature support",
    fields: [
      // Header Information - matching template structure
      { id: "date", label: "Date", type: "date", required: false, autoFillFrom: "currentDate" },
      { id: "insurance", label: "Insurance", type: "text", required: false, autoFillFrom: "underwriter" },
      { id: "claimNumber", label: "Claim Number", type: "text", required: false, autoFillFrom: "claimNo" },
      { id: "client", label: "Client", type: "text", required: false, autoFillFrom: "insuredName" },
      { id: "plumber", label: "Plumber", type: "text", required: false, autoFillFrom: "assignedStaffName" },
      { id: "wasExcessPaid", label: "Was Excess Paid?", type: "select", options: ["yes", "no"], required: false },

      // Assessment Items - as checkbox array (staff section)
      { id: "selectedAssessmentItems", label: "Assessment Items", type: "checkbox", required: false, section: "staff", options: ["Existing Pipes/Fittings", "Roof Entry", "Geyser Enclosure", "Wiring (Electrical/Alarm)", "Waterproofing", "Pipes Not Secured", "Increase/Decrease in Pressure", "Drip Tray Installation", "Vacuum Breaker Positioning", "Pressure Control Valve", "Non-Return Valve", "Safety Valve Operation", "Thermostat Calibration", "Element Condition", "Electrical Connections"] },

      // Before/After Comparisons (staff section)
      { id: "waterHammerBefore", label: "Water Hammer Before", type: "text", required: false, section: "staff" },
      { id: "waterHammerAfter", label: "Water Hammer After", type: "text", required: false, section: "staff" },
      { id: "pressureTestBefore", label: "Pressure Test Before (Rating)", type: "text", required: false, section: "staff" },
      { id: "pressureTestAfter", label: "Pressure Test After (Rating)", type: "text", required: false, section: "staff" },
      { id: "thermostatSettingBefore", label: "Thermostat Setting Before", type: "text", required: false, section: "staff" },
      { id: "thermostatSettingAfter", label: "Thermostat Setting After", type: "text", required: false, section: "staff" },
      { id: "externalIsolatorBefore", label: "External Isolator Before", type: "text", required: false, section: "staff" },
      { id: "externalIsolatorAfter", label: "External Isolator After", type: "text", required: false, section: "staff" },
      { id: "numberOfGeysersBefore", label: "Number of Geysers on Property Before", type: "text", required: false, section: "staff" },
      { id: "numberOfGeysersAfter", label: "Number of Geysers on Property After", type: "text", required: false, section: "staff" },
      { id: "balancedSystemBefore", label: "Balanced System Before", type: "text", required: false, section: "staff" },
      { id: "balancedSystemAfter", label: "Balanced System After", type: "text", required: false, section: "staff" },
      { id: "nonReturnValveBefore", label: "Non Return Valve Before", type: "text", required: false, section: "staff" },
      { id: "nonReturnValveAfter", label: "Non Return Valve After", type: "text", required: false, section: "staff" },

      // Additional Assessment Questions (client section)
      { id: "pipeInstallation", label: "Pipe Installation Quality", type: "select", options: ["excellent", "good", "acceptable", "poor", "not-applicable"], required: false, section: "client" },
      { id: "pipeInsulation", label: "Pipe Insulation", type: "select", options: ["adequate", "inadequate", "missing", "not-required"], required: false, section: "client" },
      { id: "pressureRegulation", label: "Pressure Regulation", type: "select", options: ["within-limits", "too-high", "too-low", "not-tested"], required: false, section: "client" },
      { id: "temperatureControl", label: "Temperature Control", type: "select", options: ["functioning", "erratic", "not-functioning", "needs-adjustment"], required: false, section: "client" },
      { id: "safetyCompliance", label: "Safety Compliance", type: "select", options: ["compliant", "minor-issues", "major-issues", "non-compliant"], required: false, section: "client" },
      { id: "workmanshipQuality", label: "Workmanship Quality", type: "select", options: ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"], required: false, section: "client" },
      { id: "materialStandards", label: "Material Standards", type: "select", options: ["sabs-approved", "iso-certified", "non-standard", "unknown"], required: false, section: "client" },
      { id: "installationCertificate", label: "Installation Certificate", type: "select", options: ["issued", "pending", "not-required", "rejected"], required: false, section: "client" },
      { id: "additionalComments", label: "Additional Comments", type: "textarea", required: false, section: "client" }
    ],
    isTemplate: false,
    pdfTemplate: "liabWave.pdf",
    formType: "liability",
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "clearance-certificate-form",
    name: "Clearance Certificate Form",
    description: "BBP clearance certificate for geyser installations - matching template exactly",
    fields: [
      // Header fields - matching Discovery Form Template pattern
      { id: "date", label: "Date", type: "date", required: false, autoFillFrom: "currentDate" },
      { id: "claimNumber", label: "Claim Number", type: "text", required: false, autoFillFrom: "claimNo" },
      { id: "clientName", label: "Client Name", type: "text", required: false, autoFillFrom: "insuredName" },
      { id: "address", label: "Property Address", type: "text", required: false, autoFillFrom: "riskAddress" },
      { id: "plumberName", label: "Plumber/Technician", type: "text", required: false, autoFillFrom: "assignedStaffName" },

      // Core template fields - matching Clearance Certificate Template exactly
      { id: "cname", label: "Client Name", type: "text", required: true, placeholder: "Client Name", autoFillFrom: "clientName" },
      { id: "cref", label: "Reference", type: "text", required: true, placeholder: "Claim Number", autoFillFrom: "claimNo" },
      { id: "caddress", label: "Property Address", type: "text", required: true, placeholder: "Property Address" },
      { id: "cdamage", label: "Cause of damage", type: "text", required: true, placeholder: "Cause of damage" },
      { id: "staff", label: "Staff operated", type: "text", required: true, autoFillFrom: "assignedStaffName", readonly: true },
      { id: "scopework", label: "Scope of Work Comments", type: "text", required: true, placeholder: "Scope of work details" },
      { id: "oldgeyser", label: "OLD GEYSER DETAILS", type: "select", required: true, options: ["None", "Other"] },
      { id: "newgeyser", label: "NEW GEYSER DETAILS", type: "select", required: true, options: ["None", "Other"] },

      // Quality assessment - Client Section (matching template questions exactly)
      { id: "cquality1", label: "Did the service Provider make an appointment to inspect damage?", type: "select", required: true, options: ["Yes", "No"], section: "client" },
      { id: "cquality2", label: "Did the service Provider Keep to the appointment?", type: "select", required: true, options: ["Yes", "No"], section: "client" },
      { id: "cquality3", label: "Were the staff neat and presentable?", type: "select", required: true, options: ["Yes", "No"], section: "client" },
      { id: "cquality4", label: "Did the service Provider Keep you informed on the progress of job?", type: "select", required: true, options: ["Yes", "No"], section: "client" },
      { id: "cquality5", label: "Did the service Provider clean the site before leaving?", type: "select", required: true, options: ["Yes", "No"], section: "client" },
      { id: "cquality6", label: "Please rate the standard of the workmanship and service overall?", type: "select", required: true, options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], section: "client" },

      // Excess payment
      { id: "excess", label: "Was Excess Paid:", type: "select", required: true, options: ["Yes", "No"] },
      { id: "amount", label: "Excess Amount Paid:", type: "number", required: true, placeholder: "0", autoCalculate: true },

      // Comments
      { id: "gcomments", label: "General Comments:", type: "text", required: true, placeholder: "General comments", section: "client" }
    ],
    isTemplate: false,
    pdfTemplate: "BBPClearanceCertificate.pdf",
    formType: "certificate",
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "discovery-form",
    name: "Discovery Form",
    description: "Comprehensive geyser installation and replacement form - matching template exactly",
    fields: [
      // Client Details Section - matching template exactly
      { id: "claimNumber", label: "Claim Number", type: "text", required: true, placeholder: "Claim Number", autoFillFrom: "claimNo" },
      { id: "clientName", label: "Client", type: "text", required: true, placeholder: "Client Name", autoFillFrom: "insuredName" },
      { id: "date", label: "Date", type: "date", required: true },
      { id: "address", label: "Address", type: "text", required: true, placeholder: "Property Address", autoFillFrom: "riskAddress" },
      { id: "companyName", label: "Company Name", type: "text", required: true, placeholder: "Company Name", defaultValue: "BlockBusters And Partners" },
      { id: "plumberName", label: "Plumber's Name", type: "text", required: true, placeholder: "Plumber's Name", autoFillFrom: "assignedStaffName" },
      { id: "licenseNumber", label: "License Number", type: "text", required: false, placeholder: "License Number" },

      // Action Taken Section
      { id: "geyserReplaced", label: "Geyser Replaced", type: "select", required: true, options: ["Y", "N"], section: "staff" },
      { id: "geyserRepair", label: "Geyser Repair", type: "select", required: true, options: ["Y", "N"], section: "staff" },

      // Old Geyser Details Section
      { id: "oldGeyserType", label: "Old Geyser Type", type: "select", required: true, options: ["Electric", "Solar", "Other"], section: "staff" },
      { id: "oldGeyserOther", label: "Old Geyser Other (if Other selected)", type: "text", required: false, placeholder: "Please specify", dependsOn: "oldGeyserType", showWhen: "Other" },
      { id: "oldGeyserSize", label: "Old Geyser Size", type: "select", required: true, options: ["50", "100", "150", "200", "250", "300", "350"], section: "staff" },
      { id: "oldGeyserMake", label: "Old Geyser Make", type: "select", required: true, options: ["Heat Tech", "Kwikot", "Gap", "WE", "Frankie", "Other"], section: "staff" },
      { id: "oldSerialNumber", label: "Old Serial Number", type: "text", required: false, placeholder: "Serial Number" },
      { id: "oldCode", label: "Old Code", type: "text", required: false, placeholder: "Code" },
      { id: "oldNoTag", label: "Old No Tag", type: "text", required: false, placeholder: "No Tag" },
      { id: "wallMounted", label: "Wall Mounted", type: "text", required: false, placeholder: "Wall Mounted" },
      { id: "insideRoof", label: "Inside Roof", type: "text", required: false, placeholder: "Inside Roof" },
      { id: "otherLocation", label: "Other Location", type: "text", required: false, placeholder: "Other Location" },

      // New Geyser Details Section
      { id: "newGeyserType", label: "New Geyser Type", type: "select", required: true, options: ["Electric", "Solar", "Other"], section: "staff" },
      { id: "newGeyserMake", label: "New Geyser Make", type: "select", required: true, options: ["Heat Tech", "Kwikot", "Other"], section: "staff" },
      { id: "newGeyserOther", label: "New Geyser Other (if Other selected)", type: "text", required: false, placeholder: "Please specify", dependsOn: "newGeyserMake", showWhen: "Other" },
      { id: "newGeyserSize", label: "New Geyser Size", type: "select", required: true, options: ["50", "100", "150", "200", "250", "300", "350"], section: "staff" },
      { id: "newSerialNumber", label: "New Serial Number", type: "text", required: false, placeholder: "Serial Number" },
      { id: "newCode", label: "New Code", type: "text", required: false, placeholder: "Code" },

      // Items Installed Section
      { id: "itemGeyser", label: "Geyser", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "itemDripTray", label: "Drip Tray", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "itemVacuumBreakers", label: "Vacuum Breakers", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "itemPlatform", label: "Platform", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "itemBonding", label: "Bonding", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "itemIsolator", label: "Isolator", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "itemPressureValve", label: "Pressure Valve", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "itemRelocated", label: "Relocated", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "itemThermostat", label: "Thermostat", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "itemElement", label: "Element", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "itemSafetyValve", label: "Safety Valve", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "itemNonReturn", label: "Non Return", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },

      // Solar Geyser Section
      { id: "solarVacuumTubes", label: "Vacuum Tubes", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "solarFlatPanels", label: "Flat Panels", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "solarCirculationPump", label: "Circulation Pump", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "solarGeyserWise", label: "Geyser Wise", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "solarMixingValve", label: "Mixing Valve", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" },
      { id: "solarPanel12v", label: "Solar Panel 12V", type: "select", required: true, options: ["Y", "N", "N/A"], section: "staff" }
    ],
    isTemplate: false,
    pdfTemplate: "desco.pdf",
    formType: "discovery",
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initialize forms with PDF forms included
async function initializeForms() {
  try {
    const allForms = await getAllPredefinedForms();
    // Merge core forms with existing forms, giving priority to core forms
    const existingFormIds = allForms.map((f: any) => f.id);
    const newCoreForms = coreForms.filter(cf => !existingFormIds.includes(cf.id));
    forms = [...allForms, ...newCoreForms];
  } catch (error) {
    console.error("Error initializing forms with PDF forms:", error);
    // Fallback to core forms plus legacy forms
    const existingFormIds = predefinedForms.map((f: any) => f.id);
    const newCoreForms = coreForms.filter(cf => !existingFormIds.includes(cf.id));
    forms = [...predefinedForms, ...newCoreForms];
  }
}

// Initialize on module load
initializeForms();
export let formSubmissions: FormSubmission[] = [];

// Reset all form submissions on startup
formSubmissions.length = 0;
let formIdCounter = predefinedForms.length + 1;
let submissionIdCounter = 1;

// Initialize form submissions from MongoDB
async function initializeFormSubmissions() {
  try {
    // Import MongoDB models
    const { connectToDatabase } = await import("../utils/mongodb");
    const { FormSubmission: MongoFormSubmission } = await import("../models");

    await connectToDatabase();

    // Load existing form submissions from MongoDB
    const existingSubmissions = await MongoFormSubmission.find({}).sort({
      submittedAt: -1,
    });

    if (existingSubmissions.length > 0) {
      formSubmissions = existingSubmissions.map((submission: any) => ({
        id: submission.id,
        jobId: submission.jobId,
        formId: submission.formId,
        formType: submission.formType || "standard",
        data: submission.data,
        signature: submission.signature,
        submittedBy: submission.submittedBy,
        submittedAt: submission.submittedAt,
      }));

      // Update counter to avoid ID conflicts
      submissionIdCounter =
        Math.max(
          ...formSubmissions.map(
            (fs) => parseInt(fs.id.replace("submission-", "")) || 0,
          ),
        ) + 1;

      console.log(
        `Loaded ${formSubmissions.length} form submissions from MongoDB`,
      );
    }
  } catch (error) {
    console.error("Error initializing form submissions from MongoDB:", error);
    // Continue with empty array as fallback
  }
}

// Initialize form submissions
initializeFormSubmissions();

// Schema parser for form creation
function parseFormSchema(schema: string): Omit<FormField, "id">[] {
  const fields: Omit<FormField, "id">[] = [];

  // Split by lines and clean
  const lines = schema
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    // Skip headers or obvious non-field lines
    if (
      line.includes("Details") ||
      line.includes("Notification") ||
      line.includes("Appointment")
    ) {
      continue;
    }

    // Check if line contains a field pattern (word followed by tab/colon and value)
    const fieldMatch = line.match(/^([^:\t]+)[\t:]\s*(.*)$/);

    if (fieldMatch) {
      const label = fieldMatch[1].trim();
      const sampleValue = fieldMatch[2].trim();

      let fieldType: FormField["type"] = "text";
      let required = true;

      // Determine field type based on label and sample value
      if (label.toLowerCase().includes("email")) {
        fieldType = "email";
      } else if (
        label.toLowerCase().includes("date") ||
        sampleValue.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) ||
        sampleValue.match(/\d{1,2}\s+\w+\s+\d{4}/)
      ) {
        fieldType = "date";
      } else if (
        label.toLowerCase().includes("amount") ||
        label.toLowerCase().includes("sum") ||
        label.toLowerCase().includes("estimate") ||
        sampleValue.match(/^\d+\.?\d*$/)
      ) {
        fieldType = "number";
      } else if (
        label.toLowerCase().includes("description") ||
        label.toLowerCase().includes("address") ||
        sampleValue.length > 50
      ) {
        fieldType = "textarea";
      } else if (
        label.toLowerCase().includes("status") ||
        label.toLowerCase().includes("section") ||
        label.toLowerCase().includes("peril")
      ) {
        fieldType = "select";
      }

      fields.push({
        type: fieldType,
        label,
        required,
        placeholder: fieldType === "select" ? undefined : `Enter ${label}`,
        options:
          fieldType === "select"
            ? ["Current", "Pending", "Completed"]
            : undefined,
      });
    }
  }

  return fields;
}

export const handleCreateForm: RequestHandler = (req, res) => {
  try {
    const formData: CreateFormRequest = req.body;

    if (!formData.name) {
      return res.status(400).json({ error: "Form name is required" });
    }

    let fields = formData.fields;

    // Parse schema if provided
    if (formData.rawSchema) {
      const parsedFields = parseFormSchema(formData.rawSchema);
      if (parsedFields.length > 0) {
        fields = parsedFields;
      }
    }

    // Add IDs to fields
    const fieldsWithIds: FormField[] = fields.map((field, index) => ({
      ...field,
      id: `field-${formIdCounter}-${index + 1}`,
    }));

    const newForm: Form = {
      id: `form-${formIdCounter++}`,
      name: formData.name,
      description: formData.description,
      fields: fieldsWithIds,
      isTemplate: formData.isTemplate,
      restrictedToCompanies: formData.restrictedToCompanies || [],
      createdBy: "admin-1", // Mock admin user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    forms.push(newForm);
    res.status(201).json(newForm);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetForms: RequestHandler = (req, res) => {
  try {
    const { isTemplate, companyId } = req.query;

    let filteredForms = forms;

    if (isTemplate !== undefined) {
      filteredForms = filteredForms.filter(
        (form) => form.isTemplate === (isTemplate === "true"),
      );
    }

    if (companyId) {
      filteredForms = filteredForms.filter(
        (form) =>
          form.restrictedToCompanies.length === 0 ||
          form.restrictedToCompanies.includes(companyId as string),
      );
    }

    res.json(filteredForms);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetForm: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const form = forms.find((f) => f.id === id);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateForm: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const formIndex = forms.findIndex((form) => form.id === id);

    if (formIndex === -1) {
      return res.status(404).json({ error: "Form not found" });
    }

    forms[formIndex] = {
      ...forms[formIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    res.json(forms[formIndex]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleSubmitForm: RequestHandler = async (req, res) => {
  try {
    const { jobId, formId, data, signature, signature_staff } = req.body;

    // Map signature fields from form data if direct signature parameters are not provided
    let finalSignature = signature;
    let finalSignature_staff = signature_staff;

    // If no direct signatures provided, try to extract from form data
    if (!finalSignature && !finalSignature_staff) {
      // Check for signature fields in form data based on form type
      const signatureFieldMappings: Record<string, {client: string, staff: string}> = {
        "form-clearance-certificate": {
          client: "field-signature-clearance",
          staff: "field-signature-staff-clearance"
        },
        "form-discovery-geyser": {
          client: "field-signature-discovery",
          staff: "field-signature-staff-discovery"
        },
        "form-liability-certificate": {
          client: "field-signature-liability",
          staff: "field-signature-staff-liability"
        }
      };

      const mapping = signatureFieldMappings[formId];
      if (mapping) {
        finalSignature = data[mapping.client] || finalSignature;
        finalSignature_staff = data[mapping.staff] || finalSignature_staff;
        console.log("Mapped signatures from form data:");
        console.log("- Client signature mapped from", mapping.client, ":", !!finalSignature);
        console.log("- Staff signature mapped from", mapping.staff, ":", !!finalSignature_staff);
      }
    }

    // Debug logging for signature data
    console.log("Form submission received:");
    console.log("- jobId:", jobId);
    console.log("- formId:", formId);
    console.log("- signature present:", !!finalSignature);
    console.log("- signature type:", typeof finalSignature);
    console.log("- signature length:", finalSignature ? finalSignature.length : 0);
    console.log("- signature_staff present:", !!finalSignature_staff);
    console.log("- signature_staff type:", typeof finalSignature_staff);
    console.log("- signature_staff length:", finalSignature_staff ? finalSignature_staff.length : 0);
    console.log("- signature_staff value:", finalSignature_staff === "" ? "Empty string" : finalSignature_staff === undefined ? "Undefined" : finalSignature_staff === null ? "Null" : "Has data");

    if (!jobId || !formId || !data) {
      return res.status(400).json({
        error: "jobId, formId, and data are required",
      });
    }

    // Get user from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "admin-1";

    // Check existing submissions for this job/form combination
    const existingSubmissions = formSubmissions.filter(
      (sub) =>
        sub.jobId === jobId &&
        sub.formId === formId &&
        sub.submittedBy === userId,
    );

    // No submission limits for staff - they can submit as many times as needed
    // This allows staff to close claims or fill forms without restrictions

    // Determine submission number (1, 2, or 3)
    const submissionNumber = existingSubmissions.length + 1;

    const submission: FormSubmission = {
      id: `submission-${submissionIdCounter++}`,
      jobId,
      formId,
      submittedBy: userId,
      data,
      submittedAt: new Date().toISOString(),
      submissionNumber,
      signature: finalSignature, // Client signature (mapped if necessary)
      signature_staff: finalSignature_staff, // Staff signature (mapped if necessary)
    };

    // Debug logging for the submission object
    console.log("Submission object before MongoDB save:");
    console.log("- signature field:", submission.signature ? "Present" : "Missing");
    console.log("- signature_staff field:", submission.signature_staff ? "Present" : "Missing");
    console.log("- signature_staff in submission object:", submission.signature_staff === "" ? "Empty string" : submission.signature_staff === undefined ? "Undefined" : submission.signature_staff === null ? "Null" : "Has data");
    console.log("- Full submission signature fields:", {
      signature: submission.signature ? "Has data" : submission.signature,
      signature_staff: submission.signature_staff ? "Has data" : submission.signature_staff
    });

    formSubmissions.push(submission);

    // Save to MongoDB
    try {
      await saveFormSubmissionToMongo(submission);
    } catch (mongoError) {
      console.error("Failed to sync form submission to MongoDB:", mongoError);
      // Continue with local storage as fallback
    }

    res.status(201).json({
      ...submission,
      message: `Form submitted successfully (submission ${submissionNumber}/3)`,
      remainingSubmissions: 3 - submissionNumber,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleSubmitDualSignature: RequestHandler = async (req, res) => {
  try {
    const { jobId, formId, signatures, clientName, staffId } = req.body;

    if (!jobId || !formId || !signatures) {
      return res.status(400).json({
        error: "jobId, formId, and signatures are required",
      });
    }

    // Validate that at least client signature exists for dual signature forms
    const dualSignatureForms = ["liability-form", "discovery-form", "clearance-certificate-form", "absa-form", "sahl-certificate-form", "noncompliance-form", "material-list-form"];
    if (dualSignatureForms.includes(formId)) {
      if (!signatures.client?.data) {
        return res.status(400).json({
          error: "Client signature is required for this form type",
        });
      }
      // Staff signature is optional but recommended
    }

    // Create signature submission
    const signatureSubmission = {
      id: `dual-signature-${jobId}-${formId}-${Date.now()}`,
      jobId,
      formId,
      formType: "dual-signature",
      data: {
        signatures,
        clientName,
        staffId,
      },
      signatures,
      submittedBy: staffId || "system",
      submittedAt: new Date().toISOString(),
      signatureStatus: {
        clientRequired: true,
        staffRequired: true,
        clientSigned: !!signatures.client?.data,
        staffSigned: !!signatures.staff?.data,
        isComplete: !!(signatures.client?.data && signatures.staff?.data)
      }
    };

    formSubmissions.push(signatureSubmission);

    // Save to MongoDB
    try {
      await saveFormSubmissionToMongo(signatureSubmission);
    } catch (mongoError) {
      console.error("Failed to sync dual signature to MongoDB:", mongoError);
    }

    res.status(201).json({
      success: true,
      submission: signatureSubmission,
      message: "Dual signatures submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting dual signature:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetDualSignatures: RequestHandler = (req, res) => {
  try {
    const { jobId, formId } = req.query;

    let signatures = formSubmissions.filter(
      (sub) => sub.formType === "dual-signature" || sub.signatures
    );

    if (jobId) {
      signatures = signatures.filter((sub) => sub.jobId === jobId);
    }

    if (formId) {
      signatures = signatures.filter((sub) => sub.formId === formId);
    }

    res.json(signatures);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetFormSubmissions: RequestHandler = (req, res) => {
  try {
    const { jobId, formId, submittedBy } = req.query;

    let filteredSubmissions = formSubmissions;

    if (jobId) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => sub.jobId === jobId,
      );
    }

    if (formId) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => sub.formId === formId,
      );
    }

    if (submittedBy) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => sub.submittedBy === submittedBy,
      );
    }

    res.json(filteredSubmissions);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteForm: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin (simple check for mock implementation)
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "";

    if (userId !== "admin-1") {
      return res
        .status(403)
        .json({ error: "Only administrators can delete forms" });
    }

    const formIndex = forms.findIndex((form) => form.id === id);

    if (formIndex === -1) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Remove the form
    forms.splice(formIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleParseFormSchema: RequestHandler = (req, res) => {
  try {
    const { schema } = req.body;

    if (!schema) {
      return res.status(400).json({ error: "Schema is required" });
    }

    const fields = parseFormSchema(schema);
    res.json({ fields });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a specific form submission
export const handleUpdateFormSubmission: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check user permissions
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "";

    const submissionIndex = formSubmissions.findIndex(sub => sub.id === id);
    if (submissionIndex === -1) {
      return res.status(404).json({ error: "Form submission not found" });
    }

    const submission = formSubmissions[submissionIndex];

    // Allow admins to edit any submission, or staff to edit their own material list submissions
    const isAdmin = userId === "admin-1";
    const isStaffOwner = submission.submittedBy === userId;
    const isMaterialListForm = submission.formId === "material-list-form";

    if (!isAdmin && !(isStaffOwner && isMaterialListForm)) {
      return res.status(403).json({
        error: "You can only edit your own material list submissions"
      });
    }

    // Update the submission
    const updatedSubmission = {
      ...submission,
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    };

    formSubmissions[submissionIndex] = updatedSubmission;

    // Update in MongoDB if available
    try {
      const { connectToDatabase } = await import("../utils/mongodb");
      const { FormSubmission: MongoFormSubmission } = await import("../models");

      await connectToDatabase();
      await MongoFormSubmission.findOneAndUpdate(
        { id: id },
        {
          ...updateData,
          updatedAt: new Date().toISOString(),
          updatedBy: userId
        }
      );
    } catch (mongoError) {
      console.warn("Could not update form submission in MongoDB:", mongoError);
    }

    res.json(updatedSubmission);
  } catch (error) {
    console.error("Error updating form submission:", error);
    res.status(500).json({ error: "Failed to update form submission" });
  }
};

// Delete a specific form submission
export const handleDeleteFormSubmission: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "";

    if (userId !== "admin-1") {
      return res.status(403).json({ error: "Only administrators can delete form submissions" });
    }

    const submissionIndex = formSubmissions.findIndex(sub => sub.id === id);

    if (submissionIndex === -1) {
      return res.status(404).json({ error: "Form submission not found" });
    }

    const deletedSubmission = formSubmissions[submissionIndex];

    // Remove from local array
    formSubmissions.splice(submissionIndex, 1);

    // Delete from MongoDB if available
    try {
      const { connectToDatabase } = await import("../utils/mongodb");
      const { FormSubmission: MongoFormSubmission } = await import("../models");

      await connectToDatabase();
      await MongoFormSubmission.findOneAndDelete({ id: id });
    } catch (mongoError) {
      console.warn("Could not delete form submission from MongoDB:", mongoError);
    }

    res.json({
      success: true,
      message: "Form submission deleted successfully",
      deletedSubmission
    });
  } catch (error) {
    console.error("Error deleting form submission:", error);
    res.status(500).json({ error: "Failed to delete form submission" });
  }
};

// Clear all form submissions data
export const handleClearAllFormSubmissions: RequestHandler = async (req, res) => {
  try {
    // Store current count for response
    const currentCount = formSubmissions.length;

    // Clear local array
    formSubmissions.length = 0;

    // Clear MongoDB data
    try {
      const { connectToDatabase } = await import("../utils/mongodb");
      const { FormSubmission: MongoFormSubmission } = await import("../models");

      await connectToDatabase();
      const deleteResult = await MongoFormSubmission.deleteMany({});
      console.log(`Cleared ${deleteResult.deletedCount} form submissions from MongoDB`);
    } catch (mongoError) {
      console.error("Failed to clear form submissions from MongoDB:", mongoError);
    }

    // Reset submission counter
    submissionIdCounter = 1;

    res.json({
      success: true,
      message: "All form submissions have been cleared successfully",
      clearedCount: currentCount,
    });
  } catch (error) {
    console.error("Error clearing form submissions:", error);
    res.status(500).json({ error: "Failed to clear form submissions" });
  }
};
