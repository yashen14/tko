import { RequestHandler } from "express";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import multer from "multer";
import { forms } from "./forms";

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "forms");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename for PDFs
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware to check admin role
export const requireAdmin: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token ? token.replace("mock-token-", "") : "";

  if (userId !== "admin-1") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// Get all PDF files in the forms directory
export const handleGetPdfFiles: RequestHandler = async (req, res) => {
  try {
    const formsDir = path.join(process.cwd(), "public", "forms");

    if (!fs.existsSync(formsDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(formsDir);
    const pdfFiles = files
      .filter((file) => file.toLowerCase().endsWith(".pdf"))
      .map((file) => {
        const filePath = path.join(formsDir, file);
        const stats = fs.statSync(filePath);
        
        // Find forms that use this PDF
        const mappedForms = forms
          .filter((form) => form.pdfTemplate === file)
          .map((form) => form.name);

        return {
          name: file,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          mappedForms,
        };
      });

    res.json(pdfFiles);
  } catch (error) {
    console.error("Error getting PDF files:", error);
    res.status(500).json({ error: "Failed to get PDF files" });
  }
};

// Upload a new PDF file
export const handleUploadPdf: RequestHandler = [
  requireAdmin,
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      const fileInfo = {
        name: req.file.filename,
        size: req.file.size,
        lastModified: new Date().toISOString(),
        mappedForms: [],
      };

      res.status(201).json({
        message: "PDF uploaded successfully",
        file: fileInfo,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
      res.status(500).json({ error: "Failed to upload PDF" });
    }
  },
];

// Rename a PDF file
export const handleRenamePdf: RequestHandler = async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    if (!oldName || !newName) {
      return res.status(400).json({ error: "Old name and new name are required" });
    }

    if (!newName.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "New name must end with .pdf" });
    }

    const formsDir = path.join(process.cwd(), "public", "forms");
    const oldPath = path.join(formsDir, oldName);
    const newPath = path.join(formsDir, newName);

    if (!fs.existsSync(oldPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    if (fs.existsSync(newPath)) {
      return res.status(400).json({ error: "A file with the new name already exists" });
    }

    // Rename the file
    fs.renameSync(oldPath, newPath);

    // Update any forms that reference this PDF
    forms.forEach((form) => {
      if (form.pdfTemplate === oldName) {
        form.pdfTemplate = newName;
        form.updatedAt = new Date().toISOString();
      }
    });

    res.json({
      message: "PDF renamed successfully",
      oldName,
      newName,
    });
  } catch (error) {
    console.error("Error renaming PDF:", error);
    res.status(500).json({ error: "Failed to rename PDF" });
  }
};

// Delete a PDF file
export const handleDeletePdf: RequestHandler = async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({ error: "File name is required" });
    }

    const formsDir = path.join(process.cwd(), "public", "forms");
    const filePath = path.join(formsDir, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check if any forms are using this PDF
    const dependentForms = forms.filter((form) => form.pdfTemplate === fileName);

    if (dependentForms.length > 0) {
      return res.status(400).json({
        error: "Cannot delete PDF - it is being used by forms",
        dependentForms: dependentForms.map((form) => form.name),
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.json({
      message: "PDF deleted successfully",
      fileName,
    });
  } catch (error) {
    console.error("Error deleting PDF:", error);
    res.status(500).json({ error: "Failed to delete PDF" });
  }
};

// Get form-to-database variable mappings
export const handleGetVariableMappings: RequestHandler = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = forms.find((f) => f.id === formId);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Generate variable mappings based on form fields
    const mappings = form.fields.map((field) => ({
      id: `mapping-${field.id}`,
      formFieldId: field.id,
      formFieldLabel: field.label,
      pdfVariable: field.id.replace(/[^a-zA-Z0-9]/g, "_"),
      databaseColumn: field.id.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase(),
      required: field.required,
      fieldType: field.type,
      autoFillFrom: field.autoFillFrom || null,
    }));

    res.json({
      formId,
      formName: form.name,
      mappings,
    });
  } catch (error) {
    console.error("Error getting variable mappings:", error);
    res.status(500).json({ error: "Failed to get variable mappings" });
  }
};

// Save PDF signature position
export const handleSavePDFSignaturePosition: RequestHandler = async (req, res) => {
  try {
    const { pdfName, position, formType } = req.body;

    if (!pdfName || !position) {
      return res.status(400).json({ error: "PDF name and position are required" });
    }

    // Import the signature position functions
    const { updateSignaturePosition } = await import("../config/signaturePositions");

    // Determine form type from PDF name if not provided
    let actualFormType = formType;
    if (!actualFormType) {
      const pdfToFormMap: Record<string, string> = {
        "ABSACertificate.pdf": "absa-form",
        "BBPClearanceCertificate.pdf": "clearance-certificate-form",
        "sahlld.pdf": "sahl-certificate-form",
        "DiscoveryCS.pdf": "discovery-form",
        "liabWave.pdf": "liability-form",
        "Noncompliance.pdf": "noncompliance-form",
        "ML.pdf": "material-list-form",
        // Add additional form mappings
        "form-absa-certificate": "absa-form",
        "form-clearance-certificate": "clearance-certificate-form",
        "form-sahl-certificate": "sahl-certificate-form",
        "form-discovery-geyser": "discovery-form",
        "form-liability-certificate": "liability-form"
      };
      actualFormType = pdfToFormMap[pdfName] || pdfToFormMap[formType] || "default";
    }

    // Update signature position in configuration
    const newPosition = {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      opacity: 0.7 // Make signatures see-through
    };

    updateSignaturePosition(actualFormType, newPosition);

    // Update the source code file
    await updateSignaturePositionInSourceCode(actualFormType, newPosition);

    console.log(`Signature position updated for ${actualFormType}:`, newPosition);

    res.json({
      message: "Signature position saved successfully to source code",
      formType: actualFormType,
      pdfName,
      position: newPosition
    });
  } catch (error) {
    console.error("Error saving PDF signature position:", error);
    res.status(500).json({ error: "Failed to save signature position" });
  }
};

// Save PDF dual signature positions
export const handleSavePDFDualSignaturePosition: RequestHandler = async (req, res) => {
  try {
    const { pdfName, dualPositions, formType } = req.body;

    if (!pdfName || !dualPositions) {
      return res.status(400).json({ error: "PDF name and dual positions are required" });
    }

    // Import the signature position functions
    const { updateSignaturePosition } = await import("../config/signaturePositions");

    // Determine form type from PDF name if not provided
    let actualFormType = formType;
    if (!actualFormType) {
      const pdfToFormMap: Record<string, string> = {
        "ABSACertificate.pdf": "absa-form",
        "BBPClearanceCertificate.pdf": "clearance-certificate-form",
        "sahlld.pdf": "sahl-certificate-form",
        "desco.pdf": "discovery-form",
        "liabWave.pdf": "liability-form",
        "Noncompliance.pdf": "noncompliance-form",
        "ML.pdf": "material-list-form",
      };
      actualFormType = pdfToFormMap[pdfName] || pdfToFormMap[formType] || "default";
    }

    // Update dual signature positions in configuration
    const newDualPositions = {
      client: {
        x: dualPositions.client.x,
        y: dualPositions.client.y,
        width: dualPositions.client.width,
        height: dualPositions.client.height,
        opacity: dualPositions.client.opacity || 0.7
      },
      staff: {
        x: dualPositions.staff.x,
        y: dualPositions.staff.y,
        width: dualPositions.staff.width,
        height: dualPositions.staff.height,
        opacity: dualPositions.staff.opacity || 0.7
      }
    };

    updateSignaturePosition(actualFormType, newDualPositions);

    // Update the source code file
    await updateDualSignaturePositionInSourceCode(actualFormType, newDualPositions);

    console.log(`Dual signature positions updated for ${actualFormType}:`, newDualPositions);

    res.json({
      message: "Dual signature positions saved successfully to source code",
      formType: actualFormType,
      pdfName,
      dualPositions: newDualPositions
    });
  } catch (error) {
    console.error("Error saving PDF dual signature positions:", error);
    res.status(500).json({ error: "Failed to save dual signature positions" });
  }
};

// Function to update the signature positions file with new dual positions
async function updateDualSignaturePositionInSourceCode(formType: string, dualPositions: any) {
  try {
    const configPath = path.join(__dirname, "../config/signaturePositions.ts");
    console.log(`Updating dual signature positions for form type: ${formType}`);
    console.log(`New dual positions:`, dualPositions);

    // Import and update the position configuration directly
    const { signaturePositions, updateSignaturePosition } = await import("../config/signaturePositions");

    // Update the in-memory configuration
    updateSignaturePosition(formType, dualPositions);

    // Read the current file content
    let fileContent = await fsPromises.readFile(configPath, "utf-8");

    // Create the new position string with proper formatting
    const newDualPositionString = `"${formType}": {
    client: {
      x: ${dualPositions.client.x},
      y: ${dualPositions.client.y},
      width: ${dualPositions.client.width},
      height: ${dualPositions.client.height},
      opacity: ${dualPositions.client.opacity || 0.7}
    },
    staff: {
      x: ${dualPositions.staff.x},
      y: ${dualPositions.staff.y},
      width: ${dualPositions.staff.width},
      height: ${dualPositions.staff.height},
      opacity: ${dualPositions.staff.opacity || 0.7}
    }
  }`;

    // Use a more precise regex to find and replace the form position
    const formPositionPattern = new RegExp(
      `"${formType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}":\s*{[\s\S]*?}(?=\s*,\s*"[^"]+"|\s*}\s*;)`,
      'g'
    );

    if (formPositionPattern.test(fileContent)) {
      // Replace existing position
      fileContent = fileContent.replace(formPositionPattern, newDualPositionString);
      console.log(`Updated existing dual signature position for ${formType}`);
    } else {
      // Add new position before the closing brace
      const insertionPattern = /(};\s*$)/;
      const match = fileContent.match(insertionPattern);

      if (match) {
        const insertionPoint = match.index;
        const beforeInsertion = fileContent.substring(0, insertionPoint);
        const afterInsertion = fileContent.substring(insertionPoint);

        // Determine if we need a comma
        const needsComma = !beforeInsertion.trim().endsWith('{') && beforeInsertion.includes('"');
        const separator = needsComma ? ',\n  ' : '\n  ';

        fileContent = beforeInsertion + separator + newDualPositionString + '\n' + afterInsertion;
        console.log(`Added new dual signature position for ${formType}`);
      }
    }

    await fsPromises.writeFile(configPath, fileContent, "utf-8");
    console.log(`Successfully updated signature positions file for ${formType}`);

  } catch (error) {
    console.error(`Error updating signature positions file for ${formType}:`, error);
    throw error;
  }
}

// Function to update the signature positions file with new position
async function updateSignaturePositionInSourceCode(formType: string, position: any) {
  try {
    const configPath = path.join(__dirname, "../config/signaturePositions.ts");
    console.log(`Updating signature position for form type: ${formType}`);
    console.log(`New position:`, position);

    // Import and update the position configuration directly
    const { signaturePositions, updateSignaturePosition } = await import("../config/signaturePositions");

    // Update the in-memory configuration
    updateSignaturePosition(formType, position);

    // Read the current file content
    let fileContent = await fsPromises.readFile(configPath, "utf-8");

    // Create the new position string with proper formatting
    const newPositionString = `"${formType}": {
    x: ${position.x},
    y: ${position.y},
    width: ${position.width},
    height: ${position.height},
    opacity: ${position.opacity || 0.7}
  }`;

    // Use a more precise regex to find and replace the form position
    const formPositionPattern = new RegExp(
      `"${formType.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}":\\s*{[\\s\\S]*?}(?=\\s*,\\s*"[^"]+"|\\s*}\\s*;)`,
      'g'
    );

    if (formPositionPattern.test(fileContent)) {
      // Replace existing position
      fileContent = fileContent.replace(formPositionPattern, newPositionString);
      console.log(`Updated existing signature position for ${formType}`);
    } else {
      // Add new position before the closing brace
      const insertionPattern = /(};\\s*$)/;
      const match = fileContent.match(insertionPattern);

      if (match) {
        const insertionPoint = match.index;
        const beforeInsertion = fileContent.substring(0, insertionPoint);
        const afterInsertion = fileContent.substring(insertionPoint);

        // Determine if we need a comma
        const needsComma = !beforeInsertion.trim().endsWith('{') && beforeInsertion.includes('"');
        const separator = needsComma ? ',\\n  ' : '\\n  ';

        fileContent = beforeInsertion + separator + newPositionString + '\\n' + afterInsertion;
        console.log(`Added new signature position for ${formType}`);
      }
    }

    await fsPromises.writeFile(configPath, fileContent, "utf-8");
    console.log(`✅ Successfully updated signature position in source code for ${formType}`);

  } catch (error) {
    console.error("Error updating source code:", error);
    throw error;
  }
}

// Update form variable mappings
export const handleUpdateVariableMappings: RequestHandler = async (req, res) => {
  try {
    const { formId } = req.params;
    const { mappings } = req.body;

    const formIndex = forms.findIndex((f) => f.id === formId);
    if (formIndex === -1) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Update form fields based on mappings
    mappings.forEach((mapping: any) => {
      const fieldIndex = forms[formIndex].fields.findIndex(
        (field) => field.id === mapping.formFieldId
      );

      if (fieldIndex !== -1) {
        forms[formIndex].fields[fieldIndex] = {
          ...forms[formIndex].fields[fieldIndex],
          autoFillFrom: mapping.autoFillFrom,
          required: mapping.required,
        };
      }
    });

    forms[formIndex].updatedAt = new Date().toISOString();

    res.json({
      message: "Variable mappings updated successfully",
      formId,
      mappings,
    });
  } catch (error) {
    console.error("Error updating variable mappings:", error);
    res.status(500).json({ error: "Failed to update variable mappings" });
  }
};

// Link a PDF template to a form
export const handleLinkPdfToForm: RequestHandler = async (req, res) => {
  try {
    const { formId, pdfFileName } = req.body;

    if (!formId || !pdfFileName) {
      return res.status(400).json({ error: "Form ID and PDF filename are required" });
    }

    const formIndex = forms.findIndex((f) => f.id === formId);
    if (formIndex === -1) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Check if PDF file exists
    const formsDir = path.join(process.cwd(), "public", "forms");
    const pdfPath = path.join(formsDir, pdfFileName);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "PDF file not found" });
    }

    // Link PDF to form
    forms[formIndex].pdfTemplate = pdfFileName;
    forms[formIndex].updatedAt = new Date().toISOString();

    res.json({
      message: "PDF linked to form successfully",
      formId,
      pdfFileName,
      formName: forms[formIndex].name,
    });
  } catch (error) {
    console.error("Error linking PDF to form:", error);
    res.status(500).json({ error: "Failed to link PDF to form" });
  }
};

// Unlink PDF from form
export const handleUnlinkPdfFromForm: RequestHandler = async (req, res) => {
  try {
    const { formId } = req.params;

    const formIndex = forms.findIndex((f) => f.id === formId);
    if (formIndex === -1) {
      return res.status(404).json({ error: "Form not found" });
    }

    const oldPdfTemplate = forms[formIndex].pdfTemplate;
    forms[formIndex].pdfTemplate = undefined;
    forms[formIndex].updatedAt = new Date().toISOString();

    res.json({
      message: "PDF unlinked from form successfully",
      formId,
      oldPdfTemplate,
      formName: forms[formIndex].name,
    });
  } catch (error) {
    console.error("Error unlinking PDF from form:", error);
    res.status(500).json({ error: "Failed to unlink PDF from form" });
  }
};

// Get database schema information
export const handleGetDatabaseSchema: RequestHandler = async (req, res) => {
  try {
    // Generate schema information based on all forms
    const schema = {
      formSubmissions: {
        id: { type: "string", primary: true },
        jobId: { type: "string", required: true },
        formId: { type: "string", required: true },
        formType: { type: "string", required: false },
        submittedBy: { type: "string", required: true },
        submittedAt: { type: "datetime", required: true },
        signature: { type: "object", required: false },
        data: { type: "object", required: true },
      },
      dynamicFormFields: {},
    };

    // Add dynamic fields from all forms
    forms.forEach((form) => {
      form.fields.forEach((field) => {
        const columnName = field.id.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        schema.dynamicFormFields[columnName] = {
          type: field.type,
          required: field.required,
          formId: form.id,
          formName: form.name,
          fieldLabel: field.label,
          autoFillFrom: field.autoFillFrom,
        };
      });
    });

    res.json({
      schema,
      totalForms: forms.length,
      totalFields: Object.keys(schema.dynamicFormFields).length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting database schema:", error);
    res.status(500).json({ error: "Failed to get database schema" });
  }
};

// Export all handlers with admin middleware applied
export const adminFormRoutes = {
  getPdfFiles: [requireAdmin, handleGetPdfFiles],
  uploadPdf: handleUploadPdf, // Already includes requireAdmin in upload middleware chain
  renamePdf: [requireAdmin, handleRenamePdf],
  deletePdf: [requireAdmin, handleDeletePdf],
  getVariableMappings: [requireAdmin, handleGetVariableMappings],
  updateVariableMappings: [requireAdmin, handleUpdateVariableMappings],
  linkPdfToForm: [requireAdmin, handleLinkPdfToForm],
  unlinkPdfFromForm: [requireAdmin, handleUnlinkPdfFromForm],
  getDatabaseSchema: [requireAdmin, handleGetDatabaseSchema],
  savePDFSignaturePosition: [requireAdmin, handleSavePDFSignaturePosition],
  savePDFDualSignaturePosition: [requireAdmin, handleSavePDFDualSignaturePosition],
};
