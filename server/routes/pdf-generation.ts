import { RequestHandler } from "express";
import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import moment from "moment";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getSignaturePosition, getDualSignaturePositions } from "../config/signaturePositions";
import { users } from "./auth";

// Dummy data generator for empty or invalid fields
function generateDummyFormData(formType: string, existingData: any = {}): any {
  const dummyData = {
    // Common fields across all forms
    "field-csa-ref": "CSA-2024-001",
    "field-full-name": "John Smith",
    "field-claim-number": "CLM-123456789",
    "field-property-address": "123 Main Street, Johannesburg, 2001",
    "field-cause-damage": "Geyser burst due to age",
    "field-contact-number": "011-555-0123",
    "field-email": "john.smith@example.com",
    "field-date": new Date().toISOString().split('T')[0],
    "assessmentDate": new Date().toISOString().split('T')[0],
    "materialCost": "R 2,500.00",
    "labourCost": "R 1,500.00",
    "totalEstimate": "R 4,000.00",
    "clientName": "John Smith",
    "claimNo": "CLM-123456789",
    "underwriter": "ABSA Insurance Company Limited",
    "plumberName": "Demo Plumber",
    "plumberLicense": "PL-12345",
    "completionDate": new Date().toISOString().split('T')[0],
    "workDescription": "Geyser replacement and plumbing repairs",

    // Form-specific dummy data
    ...(formType === 'absa-form' && {
      "field-certificate-number": "ABSA-CERT-2024-001",
      "field-installation-date": new Date().toISOString().split('T')[0],
      "field-geyser-model": "Kwikot 150L Electric",
      "field-pressure-valve": "Yes - Installed",
      "field-vacuum-breaker": "Yes - Installed",
      "field-thermostat": "Dual Element - Working"
    }),

    ...(formType === 'clearance-certificate-form' && {
      "field-clearance-number": "CLEAR-2024-001",
      "field-inspection-date": new Date().toISOString().split('T')[0],
      "field-installation-compliant": "Yes",
      "field-safety-standards": "SANS 10254 Compliant"
    }),

    ...(formType === 'sahl-certificate-form' && {
      "field-sahl-number": "SAHL-2024-001",
      "field-warranty-period": "5 Years",
      "field-installer-details": "Demo Installer - Lic: SAHL-12345"
    }),

    ...(formType === 'discovery-form' && {
      "field-discovery-ref": "DISC-2024-001",
      "field-geyser-size": "150 Litres",
      "field-element-type": "Dual Element 3000W"
    }),

    ...(formType === 'liability-form' && {
      "field-liability-number": "LIB-2024-001",
      "field-coverage-amount": "R 1,000,000.00",
      "field-policy-number": "POL-987654321"
    }),

    ...(formType === 'noncompliance-form' && {
      "field-noncompliance-ref": "NC-2024-001",
      "field-issue-description": "Minor plumbing adjustments required",
      "field-resolution-date": new Date().toISOString().split('T')[0],
      "field-compliance-status": "Resolved"
    }),

    ...(formType === 'material-list-form' && {
      "materialCost": "R 2,500.00",
      "plumberName": "Demo Plumber",
      "date": new Date().toISOString().split('T')[0]
    })
  };

  // Merge existing data with dummy data, preferring existing data
  const mergedData = { ...dummyData };

  // Only use dummy values for empty, null, undefined, or invalid fields
  Object.keys(existingData).forEach(key => {
    const value = existingData[key];
    if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
      mergedData[key] = value;
    }
  });

  console.log(`Generated dummy data for ${formType}:`, {
    originalKeys: Object.keys(existingData),
    dummyKeys: Object.keys(dummyData),
    mergedKeys: Object.keys(mergedData),
    emptyFieldsReplaced: Object.keys(dummyData).filter(key =>
      !existingData[key] || existingData[key] === '' || existingData[key] === 'N/A'
    ).length
  });

  return mergedData;
}

// Middleware to check admin role
const requireAdmin: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token ? token.replace("mock-token-", "") : "";

  if (userId !== "admin-1") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to process dual signatures
async function processDualSignatures(pdfDoc: any, formData: any, formType: string, page: any): Promise<void> {
  const dualPositions = getDualSignaturePositions(formType);

  if (!dualPositions) {
    // Fallback to single signature for forms that don't support dual signatures
    const signatureData = formData["signature"] || formData["field-signature"];
    if (signatureData) {
      await processSingleSignature(pdfDoc, signatureData, formType, page);
    }
    return;
  }

  // Process client signature
  const clientSignature = formData["signature"];
  if (clientSignature) {
    try {
      console.log("Processing client signature for", formType);
      const imageBytes = await processSignatureForTransparency(clientSignature);
      const signatureImage = await pdfDoc.embedPng(imageBytes);

      const pageHeight = page.getHeight();
      page.drawImage(signatureImage, {
        x: dualPositions.signature.x,
        y: pageHeight - dualPositions.signature.y - dualPositions.signature.height,
        width: dualPositions.signature.width,
        height: dualPositions.signature.height,
        opacity: dualPositions.signature.opacity || 0.7,
      });

      // Add client signature label
      page.drawText("Client Signature", {
        x: dualPositions.signature.x,
        y: pageHeight - dualPositions.signature.y + 15,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      });
    } catch (error) {
      console.error("Error processing client signature:", error);
    }
  }

  // Process staff signature
  const staffSignature = formData["signature_staff"];
  if (staffSignature) {
    try {
      console.log("Processing staff signature for", formType);
      const imageBytes = await processSignatureForTransparency(staffSignature);
      const signatureImage = await pdfDoc.embedPng(imageBytes);

      const pageHeight = page.getHeight();
      page.drawImage(signatureImage, {
        x: dualPositions.signature_staff.x,
        y: pageHeight - dualPositions.signature_staff.y - dualPositions.signature_staff.height,
        width: dualPositions.signature_staff.width,
        height: dualPositions.signature_staff.height,
        opacity: dualPositions.signature_staff.opacity || 0.7,
      });

      // Add staff signature label
      page.drawText("Staff Signature", {
        x: dualPositions.signature_staff.x,
        y: pageHeight - dualPositions.signature_staff.y + 15,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      });
    } catch (error) {
      console.error("Error processing staff signature:", error);
    }
  }
}

// Helper function to process single signature (legacy support)
async function processSingleSignature(pdfDoc: any, signatureData: string, formType: string, page: any): Promise<void> {
  try {
    const imageBytes = await processSignatureForTransparency(signatureData);
    const signatureImage = await pdfDoc.embedPng(imageBytes);
    const sigPosition = getSignaturePosition(formType);
    const pageHeight = page.getHeight();

    page.drawImage(signatureImage, {
      x: sigPosition.x,
      y: pageHeight - sigPosition.y - sigPosition.height, // Convert from top-left to bottom-left coordinate system
      width: sigPosition.width,
      height: sigPosition.height,
      opacity: sigPosition.opacity || 0.7,
    });
  } catch (error) {
    console.error("Error processing single signature:", error);
  }
}

// Helper function to process signature and ensure transparent background
async function processSignatureForTransparency(signatureData: string): Promise<Uint8Array> {
  try {
    let imageBytes: Uint8Array;

    if (signatureData.startsWith("data:image/")) {
      // Data URL - extract base64 data
      const base64Data = signatureData.split(",")[1];
      imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    } else {
      // Regular URL - fetch the image
      const response = await fetch(signatureData);
      imageBytes = new Uint8Array(await response.arrayBuffer());
    }

    // If it's already a PNG with transparency, return as is
    // PNG signature: 89 50 4E 47
    if (imageBytes[0] === 0x89 && imageBytes[1] === 0x50 &&
        imageBytes[2] === 0x4E && imageBytes[3] === 0x47) {
      return imageBytes;
    }

    return imageBytes;
  } catch (error) {
    console.error("Error processing signature:", error);
    throw error;
  }
}

// Mock form submissions data (in real app, this would come from database)
import { formSubmissions } from "./forms";

export const handleGenerateFormPDF: RequestHandler = async (req, res) => {
  try {
    const { submissionId } = req.params;
    console.log("PDF Generation - Requested submissionId:", submissionId);
    console.log(
      "PDF Generation - Available submissions:",
      formSubmissions.length,
    );
    console.log(
      "PDF Generation - Available submission IDs:",
      formSubmissions.map((s) => s.id),
    );

    if (!submissionId) {
      console.error("PDF Generation - Missing submissionId");
      return res.status(400).json({ error: "Submission ID is required" });
    }

    // Find the form submission
    const submission = formSubmissions.find((sub) => sub.id === submissionId);

    if (!submission) {
      console.error(
        "PDF Generation - Submission not found for ID:",
        submissionId,
      );
      return res.status(404).json({ error: "Form submission not found" });
    }

    console.log("PDF Generation - Found submission:", {
      id: submission.id,
      formId: submission.formId,
      submittedBy: submission.submittedBy,
      dataKeys: Object.keys(submission.data || {}),
    });

    // Handle different form types
    let pdfBytes: Uint8Array;

    console.log(
      "PDF Generation - Attempting to generate PDF for form type:",
      submission.formId,
    );

    switch (submission.formId) {
      case "form-absa-certificate":
      case "absa-form":
        console.log("PDF Generation - Generating ABSA PDF");
        pdfBytes = await generateABSAPDF(submission);
        break;
      case "form-clearance-certificate":
      case "clearance-certificate-form":
        console.log("PDF Generation - Generating Clearance PDF");
        pdfBytes = await generateClearancePDF(submission);
        break;
      case "form-sahl-certificate":
      case "sahl-certificate-form":
        console.log("PDF Generation - Generating SAHL PDF");
        pdfBytes = await generateSAHLPDF(submission);
        break;
      case "form-discovery-geyser":
      case "discovery-form":
        console.log("PDF Generation - Generating Discovery PDF");
        pdfBytes = await generateDiscoveryPDF(submission);
        break;
      case "form-liability-certificate":
      case "liability-form":
        console.log("PDF Generation - Generating Liability PDF");
        pdfBytes = await generateLiabilityPDF(submission);
        break;
      case "noncompliance-form":
        console.log("PDF Generation - Generating Noncompliance PDF");
        pdfBytes = await generateNoncompliancePDF(submission);
        break;
      case "material-list-form":
        console.log("PDF Generation - Generating Material List PDF");
        pdfBytes = await generateMaterialListPDF(submission);
        break;
      default:
        console.error(
          "PDF Generation - Unsupported form type:",
          submission.formId,
        );
        return res
          .status(400)
          .json({ error: "PDF generation not supported for this form type" });
    }

    console.log(
      "PDF Generation - Successfully generated PDF, size:",
      pdfBytes.length,
      "bytes",
    );

    // Get proper form name for download
    let fileName;
    switch (submission.formId) {
      case "noncompliance-form":
        fileName = "Non_Compliance_Form.pdf";
        break;
      case "material-list-form":
        fileName = "Material_List_Form.pdf";
        break;
      case "liability-form":
        fileName = "Liability_Form.pdf";
        break;
      case "clearance-certificate-form":
        fileName = "Clearance_Certificate_Form.pdf";
        break;
      case "sahl-certificate-form":
        fileName = "SAHL_Certificate_Form.pdf";
        break;
      case "absa-form":
      case "form-absa-certificate":
        fileName = "ABSA_Form.pdf";
        break;
      case "discovery-form":
      case "form-discovery-geyser":
        fileName = "Discovery_Form.pdf";
        break;
      default:
        // Get job data to prevent undefined-job filenames
        const jobTitle = submission.jobData?.title || submission.jobTitle || 'job';
        const cleanJobTitle = jobTitle.replace(/[^a-zA-Z0-9]/g, '_');
        fileName = `${submission.formId || 'form'}-${cleanJobTitle}-${submission.submissionNumber || Date.now()}.pdf`;
    }

    // Set response headers
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${fileName}`,
    });

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

async function generateABSAPDF(submission: any): Promise<Uint8Array> {
  // Generate dummy data for empty fields to ensure PDF can be viewed properly
  const data = generateDummyFormData('absa-form', submission.data);
  const inputPath = path.join(
    __dirname,
    "../../public/forms/ABSACertificate.pdf",
  );

  let pdfDoc: PDFDocument;
  let useTemplate = false;

  try {
    const templateBuffer = await fs.readFile(inputPath);
    pdfDoc = await PDFDocument.load(templateBuffer);
    useTemplate = true;
  } catch (error) {
    console.warn("ABSA PDF template not found, creating basic PDF:", error);
    pdfDoc = await PDFDocument.create();
  }

  if (useTemplate) {
    try {
      const form = pdfDoc.getForm();

      // Fill form fields based on your working example
      form.getTextField('CSA Ref').setText(data["field-csa-ref"] || "");
      form.getTextField('Full name of Insured').setText(data["field-full-name"] || "");
      form.getTextField('Claim no').setText(data["field-claim-number"] || "");
      form.getTextField('Property address').setText(data["field-property-address"] || "");
      form.getTextField('Cause of damage').setText(data["field-cause-damage"] || "");
      form.getTextField('IWe confirm that the work undertaken by').setText(data["field-staff-name-absa"] || "");

      // Handle radio button for excess paid - fixed logic
      const excessPaid = data["field-excess-paid-absa"];
      if (excessPaid === "Yes" || excessPaid === "yes") {
        form.getRadioGroup('Group1').select('Choice1');
      } else {
        form.getRadioGroup('Group1').select('Choice2');
      }

      // Set date with correct format
      form.getTextField('Text2').setText(moment().format('Do,MM'));

      // Handle signature if present
      const signatureData = data["signature"] || data["field-signature"] || data["field-signature-absa"];
      if (signatureData) {
        try {
          console.log("Processing signature for ABSA PDF:", signatureData.substring(0, 50) + "...");

          // Process signature to ensure transparent background
          const imageBytes = await processSignatureForTransparency(signatureData);
          const pngImage = await pdfDoc.embedPng(imageBytes);
          const firstPage = pdfDoc.getPages()[0];

          // Get configured signature position for ABSA form
          const sigPosition = getSignaturePosition("absa-form");

          firstPage.drawImage(pngImage, {
            x: sigPosition.x,
            y: sigPosition.y,
            width: sigPosition.width,
            height: sigPosition.height,
            opacity: 0.8, // 80% visible as requested
          });

          console.log("Successfully added signature to ABSA PDF");
        } catch (signatureError) {
          console.error("Could not add signature to ABSA PDF:", signatureError);
        }
      } else {
        console.log("No signature found in ABSA form data");
      }

      // Handle checkboxes with correct mapping based on your working example
      console.log("Processing ABSA checkboxes...");

      // Process each checkbox field (CheckBox1 to CheckBox13)
      for (let i = 1; i <= 13; i++) {
        const fieldKey = `field-checkbox${i}`;
        const checkboxValue = data[fieldKey];

        if (checkboxValue && checkboxValue > 0) {
          const amun = checkboxValue - 1; // Convert to 0-based index
          const rowNumber = i + 1; // CheckBox1 -> row 2, CheckBox2 -> row 3, etc.
          const checkboxId = `Check Box3.${rowNumber}.${amun}`;

          try {
            form.getCheckBox(checkboxId).check();
            console.log(`Checked ABSA checkbox: ${fieldKey} = ${checkboxValue} -> ${checkboxId}`);
          } catch (checkboxError) {
            console.warn(`ABSA Checkbox ${checkboxId} not found for field ${fieldKey}:`, checkboxError.message);
          }
        } else if (data[fieldKey] !== undefined) {
          console.log(`ABSA field ${fieldKey} = ${data[fieldKey]} (no checkbox to check)`);
        }
      }

      // Form flattening removed as requested
    } catch (templateError) {
      console.warn(
        "Error filling template, creating basic PDF:",
        templateError,
      );
      useTemplate = false;
    }
  }

  if (!useTemplate) {
    // Create a basic PDF with form data
    const page = pdfDoc.addPage([600, 800]);

    page.drawText("ABSA Certificate", {
      x: 50,
      y: 750,
      size: 20,
    });

    let yPosition = 700;
    const formFields = [
      { label: "CSA Ref", value: data["field-csa-ref"] },
      { label: "Full Name of Insured", value: data["field-full-name"] },
      { label: "Claim Number", value: data["field-claim-number"] },
      { label: "Property Address", value: data["field-property-address"] },
      { label: "Cause of Damage", value: data["field-cause-damage"] },
      { label: "Staff Name", value: data["field-staff-name-absa"] },
      { label: "Excess Paid", value: data["field-excess-paid-absa"] },
      { label: "Date", value: moment().format("Do,MM") },
    ];

    formFields.forEach(({ label, value }) => {
      if (value && yPosition > 50) {
        page.drawText(`${label}: ${value}`, {
          x: 50,
          y: yPosition,
          size: 12,
        });
        yPosition -= 25;
      }
    });
  }
  return await pdfDoc.save();
}

async function generateClearancePDF(submission: any): Promise<Uint8Array> {
  // Generate dummy data for empty fields to ensure PDF can be viewed properly
  const data = generateDummyFormData('clearance-certificate-form', submission.data);
  const inputPath = path.join(
    __dirname,
    "../../public/forms/BBPClearanceCertificate.pdf",
  );

  const pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
  const form = pdfDoc.getForm();

  // Helper function to safely convert values to strings
  const safeText = (value: any): string => {
    if (value === null || value === undefined || value === 'undefined' || Number.isNaN(value)) {
      return '';
    }
    return String(value).trim();
  };

  // Fill text fields - use core form field names first, then fallback with safe text handling
  const cnameText = safeText(data.cname || data["field-cname"]);
  if (cnameText) form.getTextField("CName").setText(cnameText);

  const crefText = safeText(data.cref || data["field-cref"]);
  if (crefText) form.getTextField("CRef").setText(crefText);

  const caddressText = safeText(data.caddress || data["field-caddress"]);
  if (caddressText) form.getTextField("CAddress").setText(caddressText);

  const cdamageText = safeText(data.cdamage || data["field-cdamage"]);
  if (cdamageText) form.getTextField("CDamage").setText(cdamageText);

  const gcommentsText = safeText(data.gcomments || data["field-gcomments"]);
  if (gcommentsText) form.getTextField("GComments").setText(gcommentsText);

  const scopeworkText = safeText(data.scopework || data["field-scopework"]);
  if (scopeworkText) form.getTextField("ScopeWork").setText(scopeworkText);

  const oldGeyserValue = data.oldgeyser || data["field-oldgeyser"];
  const oldGeyserText = oldGeyserValue === "Other"
    ? safeText(data["field-oldgeyser-details"])
    : safeText(oldGeyserValue);
  if (oldGeyserText) form.getTextField("OLDGEYSER").setText(oldGeyserText);

  const newGeyserValue = data.newgeyser || data["field-newgeyser"];
  const newGeyserText = newGeyserValue === "Other"
    ? safeText(data["field-newgeyser-details"])
    : safeText(newGeyserValue);
  if (newGeyserText) form.getTextField("NEWGEYSER").setText(newGeyserText);

  const staffText = safeText(data.staff || data["field-staff"]);
  if (staffText) form.getTextField("Staff").setText(staffText);

  const dateText = safeText(data.date) || moment().format("DD/MM/YYYY");
  form.getTextField("Date_UAAD").setText(dateText);

  // Quality Yes/No logic - use core form field names first
  const yesNoFields = [
    { coreField: "cquality1", field: "field-cquality1", yes: "CQuality1yes", no: "CQuality1" },
    { coreField: "cquality2", field: "field-cquality2", yes: "CQuality2yes", no: "CQuality2No" },
    { coreField: "cquality3", field: "field-cquality3", yes: "CQuality3Yes", no: "CQuality3No" },
    { coreField: "cquality4", field: "field-cquality4", yes: "CQuality4Yes", no: "CQuality4No" },
    { coreField: "cquality5", field: "field-cquality5", yes: "CQuality5Yes", no: "CQuality5No" },
  ];

  yesNoFields.forEach(({ coreField, field, yes, no }) => {
    const val = (data[coreField] || data[field] || "").toLowerCase();
    try {
      if (val === "yes") form.getTextField(yes).setText("XX");
      else if (val === "no") form.getTextField(no).setText("XX");
    } catch (e) {
      console.warn(`Could not set field ${val === "yes" ? yes : no}:`, e.message);
    }
  });

  // Workmanship rating (1–10) - use core form field name first
  const rating = parseInt(data.cquality6 || data["field-cquality6"], 10);
  if (!isNaN(rating) && rating >= 1 && rating <= 10) {
    form.getTextField(`CQuality6=${rating}`).setText("XX");
  }

  // Excess Paid: Yes/No + Amount - use core form field names
  const excess = (data.excess || data["field-excess"] || "").toLowerCase();
  if (excess === "yes") {
    form.getTextField("Excess=Yes").setText("XX");
  } else if (excess === "no") {
    form.getTextField("Excess=No").setText("XX");
  }

  const amountText = safeText(data.amount || data["field-amount"]);
  if (amountText) {
    form.getTextField("Excess").setText(amountText);
  }

  // Handle dual signatures for clearance certificate form
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  if (firstPage) {
    console.log("generateClearancePDF - Processing signatures for submission:", submission.id);
    console.log("generateClearancePDF - Submission signatures available:", {
      signature: !!submission.signature,
      signature_staff: !!submission.signature_staff
    });
    await processDualSignatures(pdfDoc, submission, "clearance-certificate-form", firstPage);
  } else {
    console.error("No pages found in Clearance PDF for signature placement");
  }

  form.flatten();
  return await pdfDoc.save();
}

async function generateSAHLPDF(submission: any): Promise<Uint8Array> {
  // Generate dummy data for empty fields to ensure PDF can be viewed properly
  const data = generateDummyFormData('sahl-certificate-form', submission.data);
  const inputPath = path.join(__dirname, "../../public/forms/sahlld.pdf");

  const pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
  const form = pdfDoc.getForm();

  // Fill basic text fields
  form.getTextField("ClientName_ZIUG").setText(data["field-clientname"] || "");
  form.getTextField("ClientRef").setText(data["field-clientref"] || "");
  form.getTextField("ClientAddress").setText(data["field-clientaddress"] || "");
  form.getTextField("ClientDamage").setText(data["field-clientdamage"] || "");
  form.getTextField("StaffName").setText(data["field-staffname"] || "");
  form
    .getTextField("textarea_26kyol")
    .setText(data["field-scopework-general"] || "");
  form.getTextField("Date").setText(moment().format("MMMM Do, YYYY"));

  // Yes/No checkboxes mapped - improved handling
  const yesNoCheckboxes = [
    { field: "field-checkbox1", yes: "CheckBox1-1", no: "CheckBox1-2" },
    { field: "field-checkbox2", yes: "CheckBox2-1", no: "CheckBox2-2" },
    { field: "field-checkbox3", yes: "CheckBox3-1", no: "CheckBox3-2" },
    { field: "field-checkbox4", yes: "CheckBox4-1", no: "CheckBox4-2" },
    { field: "field-checkbox5", yes: "CheckBox5-1", no: "CheckBox5-2" },
    { field: "field-checkbox7", yes: "CheckBox7-1", no: "CheckBox7-2" },
  ];

  yesNoCheckboxes.forEach(({ field, yes, no }) => {
    const val = (data[field] || "").toLowerCase();
    try {
      if (val === "yes" || val === "y") {
        const yesField = form.getFieldMaybe(yes);
        if (yesField) {
          form.getTextField(yes).setText("XX");
          console.log(`Set SAHL yes field: ${yes}`);
        } else {
          console.warn(`SAHL yes field not found: ${yes}`);
        }
      } else if (val === "no" || val === "n") {
        const noField = form.getFieldMaybe(no);
        if (noField) {
          form.getTextField(no).setText("XX");
          console.log(`Set SAHL no field: ${no}`);
        } else {
          console.warn(`SAHL no field not found: ${no}`);
        }
      }
    } catch (error) {
      console.warn(`Error setting SAHL checkbox for ${field}:`, error);
    }
  });

  // Workmanship rating (1–10)
  const rating = parseInt(data["field-checkbox6"], 10);
  if (!isNaN(rating) && rating >= 1 && rating <= 10) {
    const ratingField = `CheckBox6-${rating}`;
    form.getTextField(ratingField).setText("XX");
  }

  // Signature handling - check multiple possible signature field names
  const signatureData =
    data["signature"] ||
    data["field-signature"] ||
    data["field-signature-sahl"];
  if (signatureData) {
    try {
      console.log(
        "Processing signature for SAHL PDF:",
        signatureData.substring(0, 50) + "...",
      );

      // Process signature to ensure transparent background
      const imageBytes = await processSignatureForTransparency(signatureData);
      const pngImage = await pdfDoc.embedPng(imageBytes);

      // Calculate appropriate size for signature
      const maxWidth = 150;
      const maxHeight = 60;
      const imageWidth = pngImage.width;
      const imageHeight = pngImage.height;

      let scaleX = maxWidth / imageWidth;
      let scaleY = maxHeight / imageHeight;
      let scale = Math.min(scaleX, scaleY, 0.5);

      const finalWidth = imageWidth * scale;
      const finalHeight = imageHeight * scale;
      const page = pdfDoc.getPages()[0];

      // Get configured signature position for SAHL form
      const sigPosition = getSignaturePosition("sahl-certificate-form");

      page.drawImage(pngImage, {
        x: sigPosition.x,
        y: sigPosition.y,
        width: Math.min(finalWidth, sigPosition.width),
        height: Math.min(finalHeight, sigPosition.height),
        opacity: sigPosition.opacity || 0.7, // Make signature see-through
      });

      console.log("Successfully added signature to SAHL PDF");
    } catch (signatureError) {
      console.error("Could not add signature to SAHL PDF:", signatureError);
    }
  } else {
    console.log("No signature found in SAHL form data");
  }

  form.flatten();
  return await pdfDoc.save();
}

async function generateDiscoveryPDF(submission: any): Promise<Uint8Array> {
  console.log("generateDiscoveryPDF - Starting generation for submission:", submission?.id);

  if (!submission) {
    throw new Error("No submission provided to generateDiscoveryPDF");
  }

  // Generate dummy data for empty fields to ensure PDF can be viewed properly
  const data = generateDummyFormData('discovery-form', submission.data || {});
  console.log("generateDiscoveryPDF - Form data keys:", Object.keys(data));

  const inputPath = path.join(__dirname, "../../public/forms/desco.pdf");
  console.log("generateDiscoveryPDF - Input path:", inputPath);

  const pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
  const form = pdfDoc.getForm();

  // Helper function to safely set text fields
  const safeSetTextField = (fieldName: string, value: string) => {
    try {
      const field = form.getFieldMaybe(fieldName);
      if (field && field.constructor.name === "PDFTextField") {
        form.getTextField(fieldName).setText(value || "");
        console.log(`Set Discovery field ${fieldName}: ${value}`);
      } else {
        console.warn(`Discovery field ${fieldName} not found or not a text field`);
      }
    } catch (error) {
      console.warn(`Error setting Discovery field ${fieldName}:`, error.message);
    }
  };

  // Map form fields from React input names to PDF field names with error handling
  safeSetTextField("ClaimNo", data["field-claim-number"] || "");
  safeSetTextField("ClientName", data["field-client-name"] || "");
  safeSetTextField("Date", data["field-date"] || moment().format("MMMM Do, YYYY"));
  safeSetTextField("Address", data["field-address"] || "");
  safeSetTextField("company", data["field-company-name"] || "");
  safeSetTextField("staff", data["field-plumber-name"] || "");
  safeSetTextField("license number", data["field-license-number"] || "");

  // Action taken — geyser replaced/repair with error handling
  try {
    if ((data["field-geyser-replaced"] || "").toUpperCase() === "Y") {
      safeSetTextField("geyserreplaced_Y", "XX");
    } else {
      safeSetTextField("geyserreplaced_N", "XX");
    }
  } catch (error) {
    console.warn("Error setting geyser replaced fields:", error.message);
  }

  try {
    if ((data["field-geyser-repair"] || "").toUpperCase() === "Y") {
      safeSetTextField("geyserrepaired_Y", "XX");
    } else {
      safeSetTextField("geyserrepaired_N", "XX");
    }
  } catch (error) {
    console.warn("Error setting geyser repair fields:", error.message);
  }

  // Old geyser type with safe field setting
  const oldType = data["field-old-geyser-type"]?.toLowerCase();
  safeSetTextField("ELECTRICgeyser", oldType === "electric" ? "X" : "");
  safeSetTextField("SOLARgeyser", oldType === "solar" ? "X" : "");
  safeSetTextField("OTHERgeyser", oldType === "other" ? "X" : "");
  safeSetTextField("OTHERgeyserspecs", data["field-old-geyser-other"] || "");

  // Old size & make - improved handling
  const sizes = ["50", "100", "150", "200", "250", "300", "350"];
  const oldGeyserSize = data["field-old-geyser-size"];
  console.log(`Setting old geyser size: ${oldGeyserSize}`);

  sizes.forEach((s) => {
    const fieldName = `geyserSize${s}`;
    try {
      const field = form.getFieldMaybe(fieldName);
      if (field) {
        const shouldCheck = oldGeyserSize === s || oldGeyserSize === `${s}L`;
        form.getTextField(fieldName).setText(shouldCheck ? "X" : "");
        if (shouldCheck) {
          console.log(`Set old geyser size field: ${fieldName}`);
        }
      } else {
        console.warn(`Old geyser size field not found: ${fieldName}`);
      }
    } catch (error) {
      console.warn(`Error setting old geyser size ${fieldName}:`, error);
    }
  });
  const makeOld = data["field-old-geyser-make"];
  safeSetTextField("HeatTechgeyser", makeOld === "Heat Tech" ? "X" : "");
  safeSetTextField("KwiKotgeyser", makeOld === "Kwikot" ? "X" : "");
  safeSetTextField("OtherTypegeyser", makeOld === "Other" ? "X" : "");

  safeSetTextField("serialgeyser", data["field-old-serial-number"] || "");
  safeSetTextField("geysercode", data["field-old-code"] || "");
  safeSetTextField("notag", data["field-old-no-tag"] || "");
  safeSetTextField("wallmountedgeyser", data["field-wall-mounted"] === "Y" ? "X" : "");
  safeSetTextField("inroofgeyser", data["field-inside-roof"] === "Y" ? "X" : "");
  safeSetTextField("OtherAreageyser", data["field-other-location"] || "");

  // New geyser type with safe field setting
  const newType = data["field-new-geyser-type"]?.toLowerCase();
  safeSetTextField("newgeyserELECTRIC", newType === "electric" ? "X" : "");
  safeSetTextField("newgeyserSOLAR", newType === "solar" ? "X" : "");
  safeSetTextField("newgeyserOTHER", newType === "other" ? "X" : "");
  safeSetTextField("newgeyserOTHERTEXT", data["field-new-geyser-other"] || "");

  // New size & make - improved handling
  const newGeyserSize = data["field-new-geyser-size"];
  console.log(`Setting new geyser size: ${newGeyserSize}`);

  sizes.forEach((s) => {
    const fieldName = `NEWgeyserSize${s}`;
    try {
      const field = form.getFieldMaybe(fieldName);
      if (field) {
        const shouldCheck = newGeyserSize === s || newGeyserSize === `${s}L`;
        form.getTextField(fieldName).setText(shouldCheck ? "X" : "");
        if (shouldCheck) {
          console.log(`Set new geyser size field: ${fieldName}`);
        }
      } else {
        console.warn(`New geyser size field not found: ${fieldName}`);
      }
    } catch (error) {
      console.warn(`Error setting new geyser size ${fieldName}:`, error);
    }
  });
  const makeNew = data["field-new-geyser-make"];
  safeSetTextField("newgeyserHEATECH", makeNew === "Heat Tech" ? "X" : "");
  safeSetTextField("newgeyserKWIKOT", makeNew === "Kwikot" ? "X" : "");

  safeSetTextField("NEWserialgeyser", data["field-new-serial-number"] || "");
  safeSetTextField("NEWgeysercode", data["field-new-code"] || "");

  // Installed items Y/N/NA - improved handling
  const itemFields = {
    "field-item-geyser": "INSTALLEDgeyser",
    "field-item-drip-tray": "INSTALLEDDrip",
    "field-item-vacuum-breakers": "INSTALLEDVB",
    "field-item-platform": "INSTALLEDPlatform",
    "field-item-bonding": "INSTALLEDBonding",
    "field-item-isolator": "INSTALLEDIsolator",
    "field-item-pressure-valve": "INSTALLEDPCV",
    "field-item-relocated": "INSTALLEDRelocated",
    "field-item-thermostat": "INSTALLEDThermostat",
    "field-item-element": "INSTALLEDElement",
    "field-item-safety-valve": "INSTALLEDSafetyValve",
    "field-item-non-return": "INSTALLEDNonreturn",
  };

  Object.entries(itemFields).forEach(([field, pdfKey]) => {
    const val = (data[field] || "").toUpperCase();
    const suffix =
      val === "Y" || val === "YES"
        ? "YES"
        : val === "N" || val === "NO"
          ? "NO"
          : "NA";
    const targetFieldName = pdfKey + suffix;

    try {
      const targetField = form.getFieldMaybe(targetFieldName);
      if (targetField) {
        form.getTextField(targetFieldName).setText("XX");
        console.log(`Set field ${targetFieldName} for ${field} = ${val}`);
      } else {
        console.warn(`Field ${targetFieldName} not found in PDF`);
      }
    } catch (error) {
      console.warn(`Error setting field ${targetFieldName}:`, error);
    }
  });

  // Solar items - improved handling
  const solarFields = {
    "field-solar-vacuum-tubes": "SOLARVacuumTubes",
    "field-solar-flat-panels": "SOLARFlatPanels",
    "field-solar-circulation-pump": "SOLARCirculationPump",
    "field-solar-geyser-wise": "SOLARGeyserWise",
    "field-solar-mixing-valve": "SOLARMixingValve",
    "field-solar-panel-12v": "SOLAR12VPanel",
  };

  Object.entries(solarFields).forEach(([field, pdfKey]) => {
    const val = (data[field] || "").toUpperCase();
    const suffix =
      val === "Y" || val === "YES"
        ? "YES"
        : val === "N" || val === "NO"
          ? "NO"
          : "NA";
    const targetFieldName = pdfKey + suffix;

    try {
      const targetField = form.getFieldMaybe(targetFieldName);
      if (targetField) {
        form.getTextField(targetFieldName).setText("XX");
        console.log(`Set solar field ${targetFieldName} for ${field} = ${val}`);
      } else {
        console.warn(`Solar field ${targetFieldName} not found in PDF`);
      }
    } catch (error) {
      console.warn(`Error setting solar field ${targetFieldName}:`, error);
    }
  });

  // Handle dual signatures for discovery form
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  if (firstPage) {
    console.log("generateDiscoveryPDF - Processing signatures for submission:", submission.id);
    console.log("generateDiscoveryPDF - Submission signatures available:", {
      signature: !!submission.signature,
      signature_staff: !!submission.signature_staff
    });
    await processDualSignatures(pdfDoc, submission, "discovery-form", firstPage);
  } else {
    console.error("No pages found in Discovery PDF for signature placement");
  }

  form.flatten();
  console.log("generateDiscoveryPDF - Saving PDF document");
  const pdfBytes = await pdfDoc.save();
  console.log("generateDiscoveryPDF - PDF saved successfully, size:", pdfBytes.length);
  return pdfBytes;
}

async function generateLiabilityPDF(submission: any): Promise<Uint8Array> {
  // Generate dummy data for empty fields to ensure PDF can be viewed properly
  const data = generateDummyFormData('liability-form', submission.data);
  const inputPath = path.join(__dirname, "../../public/forms/liabWave.pdf");

  const pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
  const form = pdfDoc.getForm();

  // Helper function to safely convert values to strings
  const safeText = (value: any): string => {
    if (value === null || value === undefined || value === 'undefined' || Number.isNaN(value)) {
      return '';
    }
    return String(value).trim();
  };

  // Basic info - fix date formatting and safe text handling
  const dateText = safeText(data.date) || moment().format("DD/MM/YYYY");
  form.getTextField("L_Date").setText(dateText);

  const insuranceText = safeText(data.insurance || data["field-liability-insurance"]);
  if (insuranceText) form.getTextField("L_Insurance").setText(insuranceText);

  const claimText = safeText(data.claimNumber || data["field-liability-claim-number"]);
  if (claimText) form.getTextField("L_ClaimNumber").setText(claimText);

  const clientText = safeText(data.client || data["field-client-name"]);
  if (clientText) form.getTextField("C_Name").setText(clientText);

  const plumberText = safeText(data.plumber || data["field-plumber-name"]);
  if (plumberText) form.getTextField("P_Name").setText(plumberText);

  // L1 to L8 - handle assessment items as X marks
  if (data.selectedAssessmentItems && Array.isArray(data.selectedAssessmentItems)) {
    // Map assessment items to L1-L8 fields based on what's selected
    const assessmentMap = {
      "Existing Pipes/Fittings": "L1",
      "Roof Entry": "L2",
      "Geyser Enclosure": "L3",
      "Wiring (Electrical/Alarm)": "L4",
      "Waterproofing": "L5",
      "Pipes Not Secured": "L6",
      "Increase/Decrease in Pressure": "L7",
      "Drip Tray Installation": "L8"
    };

    data.selectedAssessmentItems.forEach((item: string) => {
      if (assessmentMap[item]) {
        form.getTextField(assessmentMap[item]).setText("XX");
      }
    });
  }

  // Fallback to individual L1-L8 fields if needed
  for (let i = 1; i <= 8; i++) {
    if (data[`field-l${i}`] && !form.getTextField(`L${i}`).getText()) {
      form.getTextField(`L${i}`).setText(data[`field-l${i}`]);
    }
  }

  // Extra info - map core form fields to PDF fields with safe text handling
  const pressureBeforeText = safeText(data.pressureTestBefore || data["field-old-geyser-liability"]);
  if (pressureBeforeText) form.getTextField("P_KPABEFORE").setText(pressureBeforeText);

  const pressureAfterText = safeText(data.pressureTestAfter || data["field-new-geyser-liability"]);
  if (pressureAfterText) form.getTextField("P_KPAAFTER").setText(pressureAfterText);

  const tempBeforeText = safeText(data.thermostatSettingBefore || data["field-temp-before-liability"]);
  if (tempBeforeText) form.getTextField("T_BEFORE").setText(tempBeforeText);

  const tempAfterText = safeText(data.thermostatSettingAfter || data["field-temp-after-liability"]);
  if (tempAfterText) form.getTextField("T_AFTER").setText(tempAfterText);

  const commentsText = safeText(data.additionalComments || data["field-general-comments-liability"]);
  if (commentsText) form.getTextField("textarea_33bxdi").setText(commentsText);

  // Handle Water Hammer before/after with safe text
  const waterHammerBeforeText = safeText(data.waterHammerBefore);
  if (waterHammerBeforeText) {
    try {
      form.getTextField("WH_Yes").setText(waterHammerBeforeText);
    } catch (e) {
      console.warn("WH_Yes field not found:", e.message);
    }
  }

  const waterHammerAfterText = safeText(data.waterHammerAfter);
  if (waterHammerAfterText) {
    try {
      form.getTextField("WHA_Yes").setText(waterHammerAfterText);
    } catch (e) {
      console.warn("WHA_Yes field not found:", e.message);
    }
  }

  // Handle "Was Excess Paid" field properly
  if (data.wasExcessPaid) {
    const val = data.wasExcessPaid.toLowerCase();
    if (val === "yes") {
      try {
        form.getTextField("EI_Yes").setText("XX");
      } catch (e) {
        console.warn("EI_Yes field not found in PDF");
      }
    } else if (val === "no") {
      try {
        form.getTextField("EI_No").setText("XX");
      } catch (e) {
        console.warn("EI_No field not found in PDF");
      }
    }
  }

  // Yes/No mapped fields - fallback for older field names
  const yesNoFields = [
    { formYes: "WH_Yes", formNo: "WH_No", field: "field-l9wh" },
    { formYes: "WHA_Yes", formNo: "WHA_No", field: "field-additional-work" },
    {
      formYes: "EI_Yes",
      formNo: "EI_No",
      field: "field-excess-paid-liability",
    },
    { formYes: null, formNo: "Geyser_No", field: "field-geyser-installed" },
    {
      formYes: "Balanced_System_Yes",
      formNo: "Balanced_System_YesBalanced_System_No",
      field: "field-balanced-system",
    },
    { formYes: "NRValve_Yes", formNo: "NRValve_No", field: "field-nr-valve" },
  ];

  yesNoFields.forEach(({ formYes, formNo, field }) => {
    const val = (data[field] || "").toLowerCase();
    try {
      if (val === "yes" && formYes && !form.getTextField(formYes).getText()) {
        form.getTextField(formYes).setText("XX");
      } else if (val === "no" && formNo && !form.getTextField(formNo).getText()) {
        form.getTextField(formNo).setText("XX");
      }
    } catch (e) {
      console.warn(`Could not set liability field ${val === "yes" ? formYes : formNo}:`, e.message);
    }
  });

  // Handle dual signatures for liability form
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  if (firstPage) {
    console.log("generateLiabilityPDF - Processing signatures for submission:", submission.id);
    console.log("generateLiabilityPDF - Submission signatures available:", {
      signature: !!submission.signature,
      signature_staff: !!submission.signature_staff
    });
    await processDualSignatures(pdfDoc, submission, "liability-form", firstPage);
  } else {
    console.error("No pages found in Liability PDF for signature placement");
  }

  form.flatten();
  return await pdfDoc.save();
}

// Additional route handlers for PDF generation system
export const handleJobPDFGeneration: RequestHandler = async (req, res) => {
  res.status(501).json({ error: "Job PDF generation not implemented yet" });
};

export const handleGetFormTemplates: RequestHandler = async (req, res) => {
  res.status(501).json({ error: "Form templates not implemented yet" });
};

export const handleUpdatePDFConfig: RequestHandler = async (req, res) => {
  res.status(501).json({ error: "PDF config update not implemented yet" });
};

export const handleIndividualFormPDF: RequestHandler = async (req, res) => {
  // This should route to the main PDF generation function
  return handleGenerateFormPDF(req, res);
};

export const handleAdminPDFTemplates: RequestHandler = async (req, res) => {
  res.status(501).json({ error: "Admin PDF templates not implemented yet" });
};

export const handleSetPDFTemplateAssociation: RequestHandler = async (
  req,
  res,
) => {
  res
    .status(501)
    .json({ error: "PDF template association not implemented yet" });
};

export const handleTestPDF: RequestHandler = async (req, res) => {
  try {
    // Create a simple test PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    page.drawText("Test PDF Generation", {
      x: 50,
      y: 750,
      size: 20,
    });

    page.drawText(`Generated at: ${new Date().toISOString()}`, {
      x: 50,
      y: 700,
      size: 12,
    });

    const pdfBytes = await pdfDoc.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=test.pdf",
    });

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating test PDF:", error);
    res.status(500).json({ error: "Failed to generate test PDF" });
  }
};

export const handleJobCompiledPDF: RequestHandler = async (req, res) => {
  console.log("handleJobCompiledPDF function called");
  try {
    const { jobId } = req.params;
    const { submissionIds, jobTitle, claimNumber, clientName } = req.body;

    console.log(`Generating compiled PDF for job ${jobId} with ${submissionIds?.length || 0} submissions`);
    console.log("Request body:", req.body);

    if (!submissionIds || submissionIds.length === 0) {
      console.log("No submission IDs provided, returning 400");
      return res.status(400).json({ error: "No submission IDs provided" });
    }

    // For debugging, just return a simple success response first
    console.log("Returning test success response");
    return res.status(200).json({
      message: "Test response - compiled PDF endpoint working",
      jobId,
      submissionCount: submissionIds.length
    });

    // Create a new PDF document to hold all compiled forms
    const compiledPdfDoc = await PDFDocument.create();

    // Add title page
    const titlePage = compiledPdfDoc.addPage([612, 792]); // Letter size
    titlePage.drawText("Job Report", {
      x: 50,
      y: 750,
      size: 24,
    });

    titlePage.drawText(`Job: ${jobTitle || 'Unknown Job'}`, {
      x: 50,
      y: 700,
      size: 14,
    });

    titlePage.drawText(`Client: ${clientName || 'N/A'}`, {
      x: 50,
      y: 680,
      size: 14,
    });

    titlePage.drawText(`Claim: ${claimNumber || 'N/A'}`, {
      x: 50,
      y: 660,
      size: 14,
    });

    titlePage.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: 640,
      size: 14,
    });

    titlePage.drawText(`Number of forms: ${submissionIds.length}`, {
      x: 50,
      y: 620,
      size: 14,
    });

    // Process each submission and add to compiled PDF
    for (let i = 0; i < submissionIds.length; i++) {
      const submissionId = submissionIds[i];
      console.log(`Processing submission ${i + 1}/${submissionIds.length}: ${submissionId}`);

      try {
        // Find the submission from formSubmissions
        const submission = formSubmissions.find((sub) => sub.id === submissionId);

        if (!submission) {
          console.warn(`Submission ${submissionId} not found, skipping`);
          continue;
        }

        console.log(`Found submission for form type: ${submission.formId}`);

        // Generate individual PDF for this submission
        let individualPdfBytes: Uint8Array;

        switch (submission.formId) {
          case "form-absa-certificate":
          case "absa-form":
            individualPdfBytes = await generateABSAPDF(submission);
            break;
          case "form-clearance-certificate":
          case "clearance-certificate-form":
            individualPdfBytes = await generateClearancePDF(submission);
            break;
          case "form-sahl-certificate":
          case "sahl-certificate-form":
            individualPdfBytes = await generateSAHLPDF(submission);
            break;
          case "form-discovery-geyser":
          case "discovery-form":
            individualPdfBytes = await generateDiscoveryPDF(submission);
            break;
          case "form-liability-certificate":
          case "liability-form":
            individualPdfBytes = await generateLiabilityPDF(submission);
            break;
          case "noncompliance-form":
            individualPdfBytes = await generateNoncompliancePDF(submission);
            break;
          case "material-list-form":
            individualPdfBytes = await generateMaterialListPDF(submission);
            break;
          default:
            console.warn(`Unsupported form type: ${submission.formId}, skipping`);
            continue;
        }

        // Load the individual PDF and copy its pages to the compiled PDF
        const individualPdfDoc = await PDFDocument.load(individualPdfBytes);
        const pageIndices = individualPdfDoc.getPageIndices();

        console.log(`Copying ${pageIndices.length} pages from ${submission.formId}`);

        // Copy all pages from the individual PDF
        const copiedPages = await compiledPdfDoc.copyPages(individualPdfDoc, pageIndices);
        copiedPages.forEach((page) => compiledPdfDoc.addPage(page));

      } catch (error) {
        console.error(`Error processing submission ${submissionId}:`, error);
        // Continue with other submissions even if one fails
      }
    }

    // Generate the final compiled PDF
    const compiledPdfBytes = await compiledPdfDoc.save();

    console.log(`Successfully generated compiled PDF with ${compiledPdfDoc.getPageCount()} total pages`);

    // Set response headers
    const fileName = `job-${jobId}-compiled-report.pdf`;
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${fileName}`,
    });

    res.send(Buffer.from(compiledPdfBytes));

  } catch (error) {
    console.error("Error generating compiled PDF:", error);
    res.status(500).json({
      error: "Failed to generate compiled PDF",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

async function generateNoncompliancePDF(submission: any): Promise<Uint8Array> {
  // Generate dummy data for empty fields to ensure PDF can be viewed properly
  const data = generateDummyFormData('noncompliance-form', submission.data);
  const inputPath = path.join(
    __dirname,
    "../../public/forms/Noncompliance.pdf",
  );

  let pdfDoc: PDFDocument;
  let useTemplate = true;

  try {
    pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
    const form = pdfDoc.getForm();

    // Auto-fill basic information fields - use correct PDF field names
    try {
      // Helper function to safely convert values to strings and handle objects
      const safeText = (value: any): string => {
        if (value === null || value === undefined || value === 'undefined' || Number.isNaN(value)) {
          return '';
        }
        if (typeof value === 'object') {
          return '';
        }
        return String(value).trim();
      };

      if (data.date) {
        const dateText = safeText(data.date);
        if (dateText) {
          try {
            form.getTextField("Date").setText(dateText);
          } catch (e) {
            console.warn("Date field not found:", e.message);
          }
        }
      }
      if (data.insuranceName) {
        const insuranceText = safeText(data.insuranceName);
        if (insuranceText) {
          try {
            // Handle duplicate I_Name fields - set both if they exist
            const iNameFields = form.getFields().filter(field => field.getName() === 'I_Name');
            if (iNameFields.length > 0) {
              iNameFields.forEach((field, index) => {
                try {
                  form.getTextField(field.getName()).setText(insuranceText);
                  console.log(`Set I_Name field ${index + 1}:`, insuranceText);
                } catch (e) {
                  console.warn(`Could not set I_Name field ${index + 1}:`, e.message);
                }
              });
            } else {
              form.getTextField("I_Name").setText(insuranceText);
            }
          } catch (e) {
            console.warn("Insurance name field not found:", e.message);
          }
        }
      }
      if (data.claimNumber) {
        const claimText = safeText(data.claimNumber);
        if (claimText) {
          try {
            form.getTextField("C_Number").setText(claimText);
          } catch (e) {
            console.warn("Claim number field not found:", e.message);
          }
        }
      }
      if (data.clientName) {
        const clientText = safeText(data.clientName);
        if (clientText) {
          try {
            form.getTextField("C_FName").setText(clientText);
          } catch (e) {
            console.warn("Client name field not found:", e.message);
          }
        }
      }
      if (data.installersName) {
        const installerText = safeText(data.installersName);
        if (installerText) {
          try {
            // Try different possible field names for installer/staff
            const staffFieldNames = ['Staff', 'Installer', 'InstallersName'];
            let fieldSet = false;
            for (const fieldName of staffFieldNames) {
              try {
                form.getTextField(fieldName).setText(installerText);
                console.log(`Set ${fieldName} field:`, installerText);
                fieldSet = true;
                break;
              } catch (e) {
                // Try next field name
              }
            }
            if (!fieldSet) {
              console.warn("No installer/staff field found with names:", staffFieldNames);
            }
          } catch (e) {
            console.warn("Installer field error:", e.message);
          }
        }
      }
      if (data.geyserMake) {
        const makeText = safeText(data.geyserMake);
        if (makeText) form.getTextField("Geyser_make").setText(makeText);
      }
      if (data.geyserSerial) {
        const serialText = safeText(data.geyserSerial);
        if (serialText) form.getTextField("Geyser_Serial").setText(serialText);
      }
      if (data.geyserCode) {
        const codeText = safeText(data.geyserCode);
        if (codeText) form.getTextField("Geyser_Code").setText(codeText);
      }

      // Handle quotation supplied - place X in Quote_Y or Quote_N
      if (data.quotationSupplied) {
        const quotation = safeText(data.quotationSupplied).toLowerCase();
        if (quotation === "yes") {
          try {
            form.getTextField("Quote_Y").setText("XX");
            console.log("Set Quote_Y: X");
          } catch (e) {
            console.warn("Quote_Y field not found:", e.message);
          }
        } else if (quotation === "no") {
          try {
            form.getTextField("Quote_N").setText("XX");
            console.log("Set Quote_N: X");
          } catch (e) {
            console.warn("Quote_N field not found:", e.message);
          }
        }
      }

      // Handle plumber indemnity - place X in EG_PI to A_PI fields
      if (data.plumberIndemnity) {
        const indemnityMap = {
          "Electric geyser": "EG_PI",
          "Solar geyser": "SG_PI",
          "Heat pump": "HP_PI",
          "Pipe Repairs": "PR_PI",
          "Assessment": "A_PI"
        };
        const fieldName = indemnityMap[data.plumberIndemnity];
        if (fieldName) {
          try {
            form.getTextField(fieldName).setText("XX");
            console.log(`Set ${fieldName}: X for plumber indemnity: ${data.plumberIndemnity}`);
          } catch (e) {
            console.warn(`Plumber indemnity field ${fieldName} not found:`, e.message);
          }
        }
      }

    } catch (fieldError) {
      console.warn("Some fields not found in template:", fieldError);
    }

    // Handle selected compliance issues - map to n1-n33 text fields with 'X'
    // The selectedIssues array contains indices (0-32) corresponding to the 33 compliance issues
    if (data.selectedIssues && Array.isArray(data.selectedIssues)) {
      console.log('Processing selectedIssues:', data.selectedIssues);
      data.selectedIssues.forEach((issueIndex: any) => {
        // Convert to number and then to 1-based field number (n1-n33)
        const index = parseInt(String(issueIndex));
        const fieldNumber = index + 1;
        if (fieldNumber >= 1 && fieldNumber <= 33 && !isNaN(fieldNumber)) {
          try {
            // Use text field instead of checkbox and place 'X'
            form.getTextField(`n${fieldNumber}`).setText("XX");
            console.log(`Successfully set n${fieldNumber}: X for compliance issue ${index + 1}`);
          } catch (e) {
            console.warn(`Field n${fieldNumber} not found in PDF:`, e.message);
          }
        } else {
          console.warn(`Invalid issue index: ${issueIndex}, calculated field number: ${fieldNumber}`);
        }
      });
    } else {
      console.log('No selectedIssues found or not an array:', typeof data.selectedIssues, data.selectedIssues);
    }

    form.flatten();
  } catch (templateError) {
    console.warn("Error filling template, creating basic PDF:", templateError);
    useTemplate = false;
  }

  if (!useTemplate) {
    // Create a basic PDF with form data
    pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    page.drawText("Non-Compliance Form", {
      x: 50,
      y: 750,
      size: 20,
    });

    let yPosition = 700;
    const formFields = [
      { label: "Date", value: data.date },
      { label: "Insurance Name", value: data.insuranceName },
      { label: "Claim Number", value: data.claimNumber },
      { label: "Client Name", value: data.clientName },
      { label: "Client Surname", value: data.clientSurname },
      { label: "Installers Name", value: data.installersName },
      { label: "Quotation Supplied", value: data.quotationSupplied },
      { label: "Plumber Indemnity", value: data.plumberIndemnity },
      { label: "Geyser Make", value: data.geyserMake },
      { label: "Geyser Serial", value: data.geyserSerial },
      { label: "Geyser Code", value: data.geyserCode },
    ];

    formFields.forEach(({ label, value }) => {
      if (value && yPosition > 50) {
        page.drawText(`${label}: ${value}`, {
          x: 50,
          y: yPosition,
          size: 12,
        });
        yPosition -= 25;
      }
    });

    // Add selected issues
    if (data.selectedIssues && Array.isArray(data.selectedIssues)) {
      page.drawText("Selected Issues:", {
        x: 50,
        y: yPosition - 10,
        size: 14,
      });
      yPosition -= 30;

      data.selectedIssues.forEach((issue: string) => {
        if (yPosition > 50) {
          page.drawText(`• ${issue}`, {
            x: 60,
            y: yPosition,
            size: 10,
          });
          yPosition -= 15;
        }
      });
    }
  }

  return await pdfDoc.save();
}

async function generateMaterialListPDF(submission: any): Promise<Uint8Array> {
  console.log("generateMaterialListPDF - Starting generation for submission:", submission?.id);

  // Check if submission exists
  if (!submission) {
    throw new Error("No submission provided to generateMaterialListPDF");
  }

  // Generate dummy data for empty fields to ensure PDF can be viewed properly
  const data = generateDummyFormData('material-list-form', submission.data || {});
  console.log("generateMaterialListPDF - Form data keys:", Object.keys(data));
  console.log("generateMaterialListPDF - Data content:", JSON.stringify(data, null, 2));

  const inputPath = path.join(
    __dirname,
    "../../public/forms/ML.pdf",
  );

  console.log("generateMaterialListPDF - Input path:", inputPath);

  let pdfDoc: PDFDocument;
  let useTemplate = true;

  try {
    console.log("generateMaterialListPDF - Loading PDF template");
    const fileBuffer = await fs.readFile(inputPath);
    console.log("generateMaterialListPDF - File loaded, size:", fileBuffer.length);

    pdfDoc = await PDFDocument.load(fileBuffer);
    console.log("generateMaterialListPDF - PDF document loaded");

    const form = pdfDoc.getForm();
    console.log("generateMaterialListPDF - Form extracted from PDF");

    // Auto-fill basic information fields - using correct PDF field names and safe text handling
    try {
      // Helper function to safely convert values to strings and handle objects
      const safeText = (value: any): string => {
        if (value === null || value === undefined || value === 'undefined' || Number.isNaN(value)) {
          return '';
        }
        if (typeof value === 'object') {
          // Don't convert objects to string as they become "[object Object]"
          return '';
        }
        return String(value).trim();
      };

      if (data.date) {
        const dateText = safeText(data.date);
        if (dateText) form.getTextField("ML_Date").setText(dateText);
      }
      if (data.plumber) {
        const plumberText = safeText(data.plumber);
        if (plumberText) form.getTextField("ML_Plumber").setText(plumberText);
      }
      if (data.claimNumber) {
        const claimText = safeText(data.claimNumber);
        if (claimText) form.getTextField("ML_ClaimNumber").setText(claimText);
      }
      if (data.insurance) {
        const insuranceText = safeText(data.insurance);
        if (insuranceText) form.getTextField("ML_Insurance").setText(insuranceText);
      }

      // Handle geyser information - check for both simple values and object structure
      const geyserData = data.geyser || {};
      const geyserSize = data.geyserSize || geyserData.size;
      if (geyserSize) {
        const sizeText = safeText(geyserSize);
        if (sizeText) form.getTextField("Geyser_Size").setText(sizeText);
      }

      // Handle geyser brand selection - map to correct PDF field names
      const geyserBrand = data.geyserBrand || geyserData.brand;
      if (geyserBrand) {
        const brandMap = {
          "Kwikot": "Geyser_Kwikot",
          "Heat Tech": "Geyser_Heat Tech", // Note: space in field name
          "Techron": "Geyser_Techron"
        };
        const brandField = brandMap[geyserBrand];
        if (brandField) {
          try {
            form.getTextField(brandField).setText("XX");
            console.log(`Set geyser brand ${brandField}: X`);
          } catch (e) {
            console.warn(`Geyser brand field ${brandField} not found:`, e.message);
          }
        }
      }

      // Handle material items with sizes and brands
      const materials = [
        {
          data: data.dripTray || {},
          sizeField: "Drip_Tray",
          brandPrefix: "Drip_Tray",
          fallbackSize: data.dripTraySize
        },
        {
          data: data.vacuumBreaker1 || {},
          sizeField: "Vacumm_B",
          brandPrefix: "VB",
          fallbackSize: typeof data.vacuumBreaker1 === 'string' ? data.vacuumBreaker1 : null
        },
        {
          data: data.pressureControlValve || {},
          sizeField: "P_CValve",
          brandPrefix: "PCV",
          fallbackSize: typeof data.pressureControlValve === 'string' ? data.pressureControlValve : null
        },
        {
          data: data.nonReturnValve || {},
          sizeField: "Non_return",
          brandPrefix: "NRV",
          fallbackSize: typeof data.nonReturnValve === 'string' ? data.nonReturnValve : null
        },
        {
          data: data.fogiPack || {},
          sizeField: "Fogi_Pack",
          brandPrefix: null, // No brand fields for Fogi Pack
          fallbackSize: typeof data.fogiPack === 'string' ? data.fogiPack : null
        }
      ];

      materials.forEach(material => {
        // Set size field
        const size = material.fallbackSize || material.data.size;
        if (size) {
          const sizeText = safeText(size);
          if (sizeText) {
            try {
              form.getTextField(material.sizeField).setText(sizeText);
              console.log(`Set ${material.sizeField}:`, sizeText);
            } catch (e) {
              console.warn(`Field ${material.sizeField} not found:`, e.message);
            }
          }
        }

        // Set brand checkboxes if applicable
        if (material.brandPrefix && material.data.brand) {
          const brandMap = {
            "Kwikot": `${material.brandPrefix}_Kwikot`,
            "Heat Tech": `${material.brandPrefix}_HeatTech`,
            "Techron": material.brandPrefix === "PCV" ? `${material.brandPrefix}_Technron` : `${material.brandPrefix}_Techron` // Note: PCV has "Technron"
          };
          const brandField = brandMap[material.data.brand];
          if (brandField) {
            try {
              form.getTextField(brandField).setText("XX");
              console.log(`Set brand ${brandField}: X`);
            } catch (e) {
              console.warn(`Brand field ${brandField} not found:`, e.message);
            }
          }
        }
      });

      // Handle sundries array with quantities
      if (data.sundries && Array.isArray(data.sundries)) {
        console.log('Processing sundries array:', data.sundries.length, 'items');
        data.sundries.forEach((sundry: any, index: number) => {
          if (index < 15) {
            const sundryIndex = index + 1;

            // Set sundry name
            const sundryName = safeText(sundry.name || sundry);
            if (sundryName) {
              try {
                form.getTextField(`Sundries${sundryIndex}`).setText(sundryName);
                console.log(`Set Sundries${sundryIndex}:`, sundryName);
              } catch (e) {
                console.warn(`Sundries${sundryIndex} field not found:`, e.message);
              }
            }

            // Set quantity requested
            if (sundry.qtyRequested || sundry.quantityRequested) {
              const qtyReq = safeText(sundry.qtyRequested || sundry.quantityRequested);
              if (qtyReq) {
                try {
                  form.getTextField(`SundriesQR${sundryIndex}`).setText(qtyReq);
                  console.log(`Set SundriesQR${sundryIndex}:`, qtyReq);
                } catch (e) {
                  console.warn(`SundriesQR${sundryIndex} field not found:`, e.message);
                }
              }
            }

            // Set quantity used
            if (sundry.qtyUsed || sundry.quantityUsed) {
              const qtyUsed = safeText(sundry.qtyUsed || sundry.quantityUsed);
              if (qtyUsed) {
                try {
                  form.getTextField(`SundriesQU${sundryIndex}`).setText(qtyUsed);
                  console.log(`Set SundriesQU${sundryIndex}:`, qtyUsed);
                } catch (e) {
                  console.warn(`SundriesQU${sundryIndex} field not found:`, e.message);
                }
              }
            }
          }
        });
      }

      // Handle extraItem1 and extraItem2
      const extraItems = [
        { data: data.extraItem1, nameField: "Extra_Item", qtyField: "Extra_ItemQty" },
        { data: data.extraItem2, nameField: "Extra_Item2", qtyField: "Extra_ItemQty2" }
      ];

      extraItems.forEach(item => {
        if (item.data) {
          const itemData = typeof item.data === 'object' ? item.data : { name: item.data };

          // Set item name
          const itemName = safeText(itemData.name);
          if (itemName) {
            try {
              form.getTextField(item.nameField).setText(itemName);
              console.log(`Set ${item.nameField}:`, itemName);
            } catch (e) {
              console.warn(`${item.nameField} field not found:`, e.message);
            }
          }

          // Set quantity
          if (itemData.quantity) {
            const quantity = safeText(itemData.quantity);
            if (quantity) {
              try {
                form.getTextField(item.qtyField).setText(quantity);
                console.log(`Set ${item.qtyField}:`, quantity);
              } catch (e) {
                console.warn(`${item.qtyField} field not found:`, e.message);
              }
            }
          }
        }
      });

      // Handle additional materials in Added1-5 fields
      if (data.additionalMaterials) {
        const materialsText = safeText(data.additionalMaterials);
        if (materialsText) {
          const materials = materialsText.split('\n').filter(m => m.trim());
          materials.forEach((material, index) => {
            if (index < 5) {
              const addedIndex = index + 1;
              const materialText = safeText(material);
              if (materialText) {
                try {
                  form.getTextField(`Added${addedIndex}`).setText(materialText);
                  console.log(`Set Added${addedIndex}:`, materialText);
                } catch (e) {
                  console.warn(`Added${addedIndex} field not found:`, e.message);
                }
              }
            }
          });
        }
      }

      // Handle any Added items with quantities if they exist in data
      for (let i = 1; i <= 5; i++) {
        const addedItem = data[`added${i}`] || data[`addedItem${i}`];
        if (addedItem) {
          const itemData = typeof addedItem === 'object' ? addedItem : { name: addedItem };

          // Set added item name
          const itemName = safeText(itemData.name);
          if (itemName) {
            try {
              form.getTextField(`Added${i}`).setText(itemName);
              console.log(`Set Added${i}:`, itemName);
            } catch (e) {
              console.warn(`Added${i} field not found:`, e.message);
            }
          }

          // Set quantities if available
          if (itemData.qtyRequested || itemData.quantityRequested) {
            const qtyReq = safeText(itemData.qtyRequested || itemData.quantityRequested);
            if (qtyReq) {
              try {
                form.getTextField(`Added${i}_Req`).setText(qtyReq);
                console.log(`Set Added${i}_Req:`, qtyReq);
              } catch (e) {
                console.warn(`Added${i}_Req field not found:`, e.message);
              }
            }
          }

          if (itemData.qtyUsed || itemData.quantityUsed) {
            const qtyUsed = safeText(itemData.qtyUsed || itemData.quantityUsed);
            if (qtyUsed) {
              try {
                form.getTextField(`Added${i}_Used`).setText(qtyUsed);
                console.log(`Set Added${i}_Used:`, qtyUsed);
              } catch (e) {
                console.warn(`Added${i}_Used field not found:`, e.message);
              }
            }
          }
        }
      }

      console.log('Material list PDF generation - all fields processed');

    } catch (fieldError) {
      console.warn("Some fields not found in template:", fieldError);
    }

    form.flatten();
  } catch (templateError) {
    console.warn("Error filling template, creating basic PDF:", templateError);
    useTemplate = false;
  }

  if (!useTemplate) {
    console.log("generateMaterialListPDF - Using fallback template creation");
    // Create a basic PDF with form data
    pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    page.drawText("Material List Form", {
      x: 50,
      y: 750,
      size: 20,
    });

    let yPosition = 700;
    const formFields = [
      { label: "Date", value: data.date },
      { label: "Plumber", value: data.plumber },
      { label: "Claim Number", value: data.claimNumber },
      { label: "Insurance", value: data.insurance },
    ];

    formFields.forEach(({ label, value }) => {
      if (value && yPosition > 50) {
        page.drawText(`${label}: ${value}`, {
          x: 50,
          y: yPosition,
          size: 12,
        });
        yPosition -= 25;
      }
    });
  }

  // Process signatures before saving
  try {
    console.log("generateMaterialListPDF - Processing signatures");
    const firstPage = pdfDoc.getPages()[0];
    if (firstPage) {
      console.log("generateMaterialListPDF - Has signatures to process:", !!(submission.signature || submission.signature_staff));

      // Check if this form supports signatures based on signaturePositions
      const dualPositions = getDualSignaturePositions("material-list-form");
      if (dualPositions || submission.signature || submission.signature_staff) {
        console.log("generateMaterialListPDF - Processing dual signatures");
        await processDualSignatures(pdfDoc, submission, "material-list-form", firstPage);
      } else {
        console.log("generateMaterialListPDF - No signature positions configured for material-list-form");
      }
    }
  } catch (signatureError) {
    console.error("generateMaterialListPDF - Error processing signatures:", signatureError);
    // Continue without signatures rather than failing
  }

  try {
    console.log("generateMaterialListPDF - Saving PDF document");
    const pdfBytes = await pdfDoc.save();
    console.log("generateMaterialListPDF - PDF saved successfully, size:", pdfBytes.length);
    return pdfBytes;
  } catch (saveError) {
    console.error("generateMaterialListPDF - Error saving PDF:", saveError);
    throw new Error(`Failed to save Material List PDF: ${saveError.message}`);
  }
}

// Non-compliance PDF generation
export const handleGenerateNoncompliancePDF: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;
    const q = req.query;

    // Parse selectedIssues from JSON string
    const selectedIssues = q.selectedIssues
      ? JSON.parse(q.selectedIssues as string)
      : [];

    const data = {
      ...q,
      selectedIssues: selectedIssues,
    };

    const inputPath = path.join(
      __dirname,
      "../../public/forms/Noncompliance.pdf",
    );
    const outputPath = path.join(
      __dirname,
      "../temp",
      `noncompliance-${id}-${Date.now()}.pdf`,
    );

    const pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
    const form = pdfDoc.getForm();

    // Fill text fields
    try {
      form.getTextField("C_Number").setText((data.claimNumber as string) || "");
      form.getTextField("C_FName").setText((data.clientName as string) || "");
      form.getTextField("I_Name").setText((data.insuranceName as string) || "");
      form
        .getTextField("Date")
        .setText((data.date as string) || moment().format("YYYY-MM-DD"));
      form
        .getTextField("Geyser_make")
        .setText((data.geyserMake as string) || "");
      form.getTextField("Geyser_Serial").setText((data.serial as string) || "");
      form.getTextField("Geyser_Code").setText((data.code as string) || "");
    } catch (fieldError) {
      console.warn("Some text fields not found in PDF:", fieldError);
    }

    // Plumber Indemnity
    const PI_MAP = {
      "Electric geyser": "EG_PI",
      "Solar geyser": "SG_PI",
      "Heat pump": "HP_PI",
      "Pipe Repairs": "PR_PI",
      Assessment: "A_PI",
    };
    const plumberField = PI_MAP[data.plumberIndemnity as string];
    if (plumberField) {
      try {
        form.getCheckBox(plumberField).check();
      } catch (checkboxError) {
        console.warn(`Checkbox ${plumberField} not found in PDF`);
      }
    }

    // Quotation Available
    try {
      if (data.quotationAvailable === "YES")
        form.getCheckBox("Quote_Y").check();
      if (data.quotationAvailable === "NO") form.getCheckBox("Quote_N").check();
    } catch (checkboxError) {
      console.warn("Quotation checkboxes not found in PDF");
    }

    // Selected Issues (checkboxes n1–n33) - improved handling
    console.log("Processing selected issues:", data.selectedIssues);
    (data.selectedIssues || []).forEach((index: number) => {
      // Try multiple possible field name patterns
      const possibleFieldNames = [
        `n${index + 1}`,
        `checkbox${index + 1}`,
        `issue${index + 1}`,
        `item${index + 1}`,
        `Check Box${index + 1}`,
        `CheckBox${index + 1}`,
      ];

      let fieldFound = false;
      for (const fieldName of possibleFieldNames) {
        try {
          const field = form.getFieldMaybe(fieldName);
          if (field && field.constructor.name === "PDFCheckBox") {
            form.getCheckBox(fieldName).check();
            console.log(`Successfully checked field: ${fieldName}`);
            fieldFound = true;
            break;
          }
        } catch (checkboxError) {
          // Continue to next field name
        }
      }

      if (!fieldFound) {
        console.warn(`No checkbox field found for index ${index + 1}`);
      }
    });

    form.flatten();

    const pdfBytes = await pdfDoc.save();

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, pdfBytes);

    res.download(outputPath, `noncompliance-${id}.pdf`, async (err) => {
      if (!err) await fs.unlink(outputPath);
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Failed to generate Noncompliance PDF");
  }
};

// Material List PDF generation
export const handleGenerateMaterialListPDF: RequestHandler = async (
  req,
  res,
) => {
  console.log("handleGenerateMaterialListPDF - Route hit with method:", req.method);
  console.log("handleGenerateMaterialListPDF - Request params:", req.params);
  console.log("handleGenerateMaterialListPDF - Request body keys:", Object.keys(req.body));

  try {
    // Check if this is a material list object or individual fields
    const isCompleteMaterialList = req.body.id && req.body.jobId;
    console.log("handleGenerateMaterialListPDF - isCompleteMaterialList:", isCompleteMaterialList);

    let materialListData;
    if (isCompleteMaterialList) {
      // Handle material list object format from MaterialListViewer
      materialListData = req.body;
    } else {
      // Handle individual fields format (legacy)
      const {
        date,
        plumber,
        claimNumber,
        insurance,
        geyser,
        dripTray,
        vacuumBreaker1,
        vacuumBreaker2,
        pressureControlValve,
        nonReturnValve,
        fogiPack,
        extraItem1,
        extraItem2,
        sundries,
        additionalMaterials,
      } = req.body;

      materialListData = {
        date,
        plumber,
        claimNumber,
        insurance,
        geyser,
        dripTray,
        vacuumBreaker1,
        vacuumBreaker2,
        pressureControlValve,
        nonReturnValve,
        fogiPack,
        extraItem1,
        extraItem2,
        sundries,
        additionalMaterials,
      };
    }

    const filePath = path.join(
      __dirname,
      "../../public/forms/ML.pdf",
    );
    console.log("handleGenerateMaterialListPDF - Attempting to read PDF file at:", filePath);

    let pdfBytes;
    try {
      pdfBytes = await fs.readFile(filePath);
      console.log("handleGenerateMaterialListPDF - PDF file read successfully, size:", pdfBytes.length);
    } catch (fileError) {
      console.error("handleGenerateMaterialListPDF - Error reading PDF file:", fileError);
      return res.status(500).json({ error: "PDF template file not found or unreadable" });
    }

    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(pdfBytes);
      console.log("handleGenerateMaterialListPDF - PDF document loaded successfully");
    } catch (loadError) {
      console.error("handleGenerateMaterialListPDF - Error loading PDF document:", loadError);
      return res.status(500).json({ error: "PDF template file is corrupted or invalid" });
    }

    let form;
    try {
      form = pdfDoc.getForm();
      console.log("handleGenerateMaterialListPDF - PDF form extracted successfully");

      // Log available form fields for debugging
      const fields = form.getFields();
      console.log("handleGenerateMaterialListPDF - Available form fields:", fields.map(f => f.getName()));

    } catch (formError) {
      console.error("handleGenerateMaterialListPDF - Error extracting form from PDF:", formError);
      return res.status(500).json({ error: "PDF template does not contain a fillable form" });
    }

    // Core fields - with error handling for missing fields
    try {
      console.log("handleGenerateMaterialListPDF - Starting to fill core fields");
      form.getTextField("ML_Date").setText(materialListData.date || "");
      form.getTextField("ML_Plumber").setText(materialListData.plumber || "");
      form.getTextField("ML_ClaimNumber").setText(materialListData.claimNumber || "");
      form.getTextField("ML_Insurance").setText(materialListData.insurance || "");
      console.log("handleGenerateMaterialListPDF - Core fields filled successfully");
    } catch (fieldError) {
      console.error("handleGenerateMaterialListPDF - Error filling core fields:", fieldError);
      // Continue with a simplified approach if specific fields don't exist
    }

    // Helper: fill brand checkboxes - use X instead of Unicode
    const fillBrand = (item: any, prefix: string) => {
      if (item?.kwikot) form.getTextField(`${prefix}_Kwikot`).setText("XX");
      if (item?.heatTech) form.getTextField(`${prefix}_HeatTech`).setText("XX");
      if (item?.techron) form.getTextField(`${prefix}_Techron`).setText("XX");
    };

    // Geyser
    form.getTextField("Geyser_Size").setText(materialListData.geyser?.size || "");
    fillBrand(materialListData.geyser, "Geyser");

    // Drip Tray
    form.getTextField("Drip_Tray").setText(materialListData.dripTray?.size || "");
    fillBrand(materialListData.dripTray, "Drip_Tray");

    // Vacuum Breakers
    const vbCombinedSize =
      `${materialListData.vacuumBreaker1?.size || ""} ${materialListData.vacuumBreaker2?.size || ""}`.trim();
    form.getTextField("Vacumm_B").setText(vbCombinedSize);
    fillBrand(materialListData.vacuumBreaker1, "VB"); // You could merge VB1 and VB2 logic if needed

    // Pressure Control Valve
    form.getTextField("P_CValve").setText(materialListData.pressureControlValve?.size || "");
    fillBrand(materialListData.pressureControlValve, "PCV");

    // Non Return Valve
    form.getTextField("Non_return").setText(materialListData.nonReturnValve?.size || "");
    fillBrand(materialListData.nonReturnValve, "NRV");

    // Fogi Pack
    form.getTextField("Fogi_Pack").setText(materialListData.fogiPack?.size || "");

    // Extra Items
    const extraItems = materialListData.extraItems || [];
    const extraItem1 = extraItems[0] || {};
    const extraItem2 = extraItems[1] || {};

    form.getTextField("Extra_Item").setText(extraItem1.name || "");
    form
      .getTextField("Extra_ItemQty")
      .setText(extraItem1.quantity?.toString() || "");

    form.getTextField("Extra_Item2").setText(extraItem2.name || "");
    form
      .getTextField("Extra_ItemQty2")
      .setText(extraItem2.quantity?.toString() || "");

    // Sundries (names & quantities)
    const sundries = materialListData.sundries || [];
    sundries.forEach((s, i) => {
      if (i < 15) {
        form.getTextField(`Sundries${i + 1}`).setText(s.name || "");
        form
          .getTextField(`SundriesQR${i + 1}`)
          .setText(s.qtyRequested?.toString() || "");
        form
          .getTextField(`SundriesQU${i + 1}`)
          .setText(s.qtyUsed?.toString() || "");
      }
    });

    // Additional Materials
    const additionalMaterials = materialListData.additionalMaterials || [];
    additionalMaterials.forEach((a, i) => {
      if (i < 5) {
        form.getTextField(`Added${i + 1}`).setText(a.name || "");
        form
          .getTextField(`Added${i + 1}_Req`)
          .setText(a.qtyRequested?.toString() || "");
        form
          .getTextField(`Added${i + 1}_Used`)
          .setText(a.qtyUsed?.toString() || "");
      }
    });

    const pdfBytesModified = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Material_List_Filled.pdf",
    );
    res.send(pdfBytesModified);
  } catch (error) {
    console.error("Failed to generate Material List PDF", error);
    res.status(500).send("Failed to generate PDF");
  }
};

// Helper function to get form data by ID (mock implementation)
async function getFormDataById(id: string): Promise<any> {
  // This should fetch from your database
  // For now returning empty object
  return {};
}

// Specific form PDF generation handlers matching your implementation
export const handleGenerateABSAPDF: RequestHandler = async (req, res) => {
  try {
    const data = req.body;
    const tempDir = path.join(__dirname, "../temp");
    const outputPath = path.join(
      tempDir,
      `ABSACertificate_filled_${Date.now()}.pdf`,
    );

    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    const pdfBytes = await generateABSAPDF({ data });

    // Save the file to disk first
    await fs.writeFile(outputPath, pdfBytes);

    // Then send the file for download
    res.download(outputPath, "ABSACertificate_filled.pdf", async (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Error sending the PDF file.");
      } else {
        // Delete the temp file after download
        try {
          await fs.unlink(outputPath);
        } catch (unlinkErr) {
          console.error("Failed to delete temp file:", unlinkErr);
        }
      }
    });
  } catch (err) {
    console.error("Error generating ABSA PDF:", err);
    res.status(500).send("Failed to generate ABSA PDF.");
  }
};

export const handleGenerateLiabilityPDF: RequestHandler = async (req, res) => {
  try {
    const data = req.query;
    const tempDir = path.join(__dirname, "../temp");
    const outputPath = path.join(
      tempDir,
      `LiabilityReport_filled_${Date.now()}.pdf`,
    );

    await fs.mkdir(tempDir, { recursive: true });

    const pdfBytes = await generateLiabilityPDF({ data });

    await fs.writeFile(outputPath, pdfBytes);

    res.download(outputPath, "LiabilityReport.pdf", async (err) => {
      if (err) {
        console.error("Error sending liability PDF:", err);
        res.status(500).send("Error sending the liability PDF file.");
      } else {
        try {
          await fs.unlink(outputPath);
        } catch (unlinkErr) {
          console.error("Failed to delete temp liability PDF:", unlinkErr);
        }
      }
    });
  } catch (err) {
    console.error("Error generating liability PDF:", err);
    res.status(500).send("Failed to generate liability PDF.");
  }
};

export const handleGenerateSAHLPDF: RequestHandler = async (req, res) => {
  try {
    const data = req.query;
    const tempDir = path.join(__dirname, "../temp");
    const outputPath = path.join(
      tempDir,
      `SAHLReport_filled_${Date.now()}.pdf`,
    );

    await fs.mkdir(tempDir, { recursive: true });

    const pdfBytes = await generateSAHLPDF({ data });

    await fs.writeFile(outputPath, pdfBytes);

    res.download(outputPath, "SAHLReport.pdf", async (err) => {
      if (err) {
        console.error("Error sending SAHL PDF:", err);
        if (!res.headersSent)
          res.status(500).send("Error sending the SAHL PDF file.");
      } else {
        try {
          await fs.unlink(outputPath);
        } catch (unlinkErr) {
          console.error("Failed to delete temp SAHL PDF:", unlinkErr);
        }
      }
    });
  } catch (err) {
    console.error("Error generating SAHL PDF:", err);
    res.status(500).send("Failed to generate SAHL PDF.");
  }
};

export const handleGenerateClearancePDF: RequestHandler = async (req, res) => {
  try {
    const data = req.query;
    const tempDir = path.join(__dirname, "../temp");
    const outputPath = path.join(
      tempDir,
      `BBPClearanceCertificate_filled_${Date.now()}.pdf`,
    );

    await fs.mkdir(tempDir, { recursive: true });

    const pdfBytes = await generateClearancePDF({ data });

    await fs.writeFile(outputPath, pdfBytes);

    res.download(outputPath, "BBPClearanceCertificate.pdf", async (err) => {
      if (err) {
        console.error("Error sending Clearance PDF:", err);
        if (!res.headersSent)
          res.status(500).send("Error sending the Clearance PDF file.");
      } else {
        try {
          await fs.unlink(outputPath);
        } catch (unlinkErr) {
          console.error("Failed to delete temp Clearance PDF:", unlinkErr);
        }
      }
    });
  } catch (err) {
    console.error("Error generating Clearance PDF:", err);
    res.status(500).send("Failed to generate Clearance PDF.");
  }
};

export const handleGenerateDiscoveryPDF: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id;
    const tempDir = path.join(__dirname, "../temp");
    const outputPath = path.join(tempDir, `discovery-${id}-${Date.now()}.pdf`);

    await fs.mkdir(tempDir, { recursive: true });

    // For discovery, we'd need to get the product data from database
    // For now, using req.body as fallback
    const data = req.body || req.query;

    const pdfBytes = await generateDiscoveryPDF({ data });

    await fs.writeFile(outputPath, pdfBytes);

    res.download(outputPath, `discovery-${id}.pdf`, async (err) => {
      if (!err) {
        try {
          await fs.unlink(outputPath);
        } catch (unlinkErr) {
          console.error("Failed to delete temp discovery PDF:", unlinkErr);
        }
      }
    });
  } catch (err) {
    console.error("Error generating discovery PDF:", err);
    res.status(500).send("Failed generating discovery PDF.");
  }
};

// Admin-only route to generate populated PDF for viewing with form data
export const handleGenerateAdminPopulatedPDF: RequestHandler = async (req, res) => {
  try {
    const { formId, submissionId } = req.params;

    console.log("Admin PDF Generation - Starting route for Form ID:", formId, "Submission ID:", submissionId);
    console.log("Admin PDF Generation - Request params:", req.params);
    console.log("Admin PDF Generation - Request headers:", req.headers);

    // Use the same form submissions as the regular PDF generation route
    console.log("Admin PDF Generation - Using formSubmissions from forms module");
    console.log("Admin PDF Generation - formSubmissions type:", typeof formSubmissions);
    console.log("Admin PDF Generation - formSubmissions defined:", !!formSubmissions);
    console.log("Admin PDF Generation - Available submissions:", formSubmissions.length);
    console.log("Admin PDF Generation - Available submission IDs:", formSubmissions.map((s) => s.id));

    if (!submissionId) {
      return res.status(400).json({ error: "Submission ID is required" });
    }

    // Find the form submission
    const submission = formSubmissions.find((sub) => sub.id === submissionId);

    if (!submission) {
      console.error("Admin PDF Generation - Submission not found for ID:", submissionId);
      return res.status(404).json({ error: "Form submission not found" });
    }

    console.log("Admin PDF Generation - Found submission:", {
      id: submission.id,
      formId: submission.formId,
      submittedBy: submission.submittedBy,
      dataKeys: Object.keys(submission.data || {}),
    });

    // Validate submission data
    if (!submission.data) {
      console.warn("Admin PDF Generation - No data found in submission");
      submission.data = {}; // Ensure data object exists
    }

    // Generate populated PDF based on form type
    let pdfBytes: Uint8Array;

    try {
      console.log("Admin PDF Generation - Generating PDF for form type:", submission.formId);
      console.log("Admin PDF Generation - Checking switch cases for:", submission.formId);

      switch (submission.formId) {
        case "form-absa-certificate":
        case "absa-form":
          console.log("Admin PDF Generation - Generating ABSA PDF");
          pdfBytes = await generateABSAPDF(submission);
          break;
        case "form-clearance-certificate":
        case "clearance-certificate-form":
          console.log("Admin PDF Generation - Generating Clearance PDF");
          pdfBytes = await generateClearancePDF(submission);
          break;
        case "form-sahl-certificate":
        case "sahl-certificate-form":
          console.log("Admin PDF Generation - Generating SAHL PDF");
          pdfBytes = await generateSAHLPDF(submission);
          break;
        case "form-discovery-geyser":
        case "discovery-form":
          console.log("Admin PDF Generation - Generating Discovery PDF");
          console.log("Admin PDF Generation - Calling generateDiscoveryPDF with submission:", submission.id);
          console.log("Admin PDF Generation - Submission data keys:", Object.keys(submission.data || {}));
          pdfBytes = await generateDiscoveryPDF(submission);
          console.log("Admin PDF Generation - Discovery PDF generation completed, pdfBytes defined:", !!pdfBytes);
          if (pdfBytes) {
            console.log("Admin PDF Generation - Discovery PDF size:", pdfBytes.length);
          }
          break;
        case "form-liability-certificate":
        case "liability-form":
          console.log("Admin PDF Generation - Generating Liability PDF");
          pdfBytes = await generateLiabilityPDF(submission);
          break;
        case "noncompliance-form":
          console.log("Admin PDF Generation - Generating Noncompliance PDF");
          pdfBytes = await generateNoncompliancePDF(submission);
          break;
        case "material-list-form":
          console.log("Admin PDF Generation - Generating Material List PDF");
          console.log("Admin PDF Generation - Calling generateMaterialListPDF with submission:", submission.id);
          pdfBytes = await generateMaterialListPDF(submission);
          console.log("Admin PDF Generation - Material List PDF generation completed, pdfBytes defined:", !!pdfBytes);
          break;
        default:
          console.error("Admin PDF Generation - Unsupported form type:", submission.formId);
          return res.status(400).json({ error: `Unsupported form type: ${submission.formId}` });
      }

      if (!pdfBytes) {
        console.error("Admin PDF Generation - PDF generation returned null/undefined");
        return res.status(500).json({
          error: "PDF generation failed - no data returned",
          formType: submission.formId
        });
      }

      console.log("Admin PDF Generation - PDF generated successfully, size:", pdfBytes.length, "bytes");
    } catch (pdfError) {
      console.error("Admin PDF Generation - Error during PDF generation:", pdfError);
      console.error("Admin PDF Generation - Error stack:", pdfError.stack);
      return res.status(500).json({
        error: "Failed to generate PDF",
        details: pdfError instanceof Error ? pdfError.message : String(pdfError),
        stack: pdfError instanceof Error ? pdfError.stack : undefined,
        formType: submission.formId
      });
    }

    // Validate pdfBytes before setting headers
    if (!pdfBytes || !pdfBytes.length) {
      console.error("Admin PDF Generation - Invalid PDF data:", {
        pdfBytesExists: !!pdfBytes,
        pdfBytesLength: pdfBytes?.length
      });
      return res.status(500).json({
        error: "Invalid PDF data generated",
        formType: submission.formId
      });
    }

    // Send PDF as response for browser viewing
    console.log("Admin PDF Generation - Sending PDF response");
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBytes.length.toString());
    res.setHeader('Content-Disposition', 'inline; filename="populated-form.pdf"');
    res.setHeader('Cache-Control', 'no-cache');

    // Convert Uint8Array to Buffer and send
    const buffer = Buffer.from(pdfBytes);
    res.end(buffer);

  } catch (error) {
    console.error("Error generating admin populated PDF:", error);
    res.status(500).json({
      error: "Failed to generate populated PDF",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
