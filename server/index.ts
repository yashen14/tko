import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleLogin,
  handleGetUsers,
  handleVerifyToken,
  handleUpdateUser,
  handleUpdateUserPassword,
  handleDeleteUser,
} from "./routes/auth";
import {
  handleCreateJob,
  handleGetJobs,
  handleUpdateJob,
  handleDeleteJob,
  handleParseJobText,
  handleCheckJobExists,
  handleGetJobNotes,
  handleAddJobNote,
  handleDiscardJob,
  handleGetDiscardedJobs,
  handleReinvokeJob,
  handleDeleteDiscardedJob,
} from "./routes/jobs";
import {
  handleCreateForm,
  handleGetForms,
  handleGetForm,
  handleUpdateForm,
  handleDeleteForm,
  handleSubmitForm,
  handleGetFormSubmissions,
  handleUpdateFormSubmission,
  handleDeleteFormSubmission,
  handleParseFormSchema,
  handleClearAllFormSubmissions,
  handleSubmitDualSignature,
  handleGetDualSignatures,
} from "./routes/forms";
import {
  handleCreateCompany,
  handleGetCompanies,
  handleGetCompany,
  handleUpdateCompany,
  handleDeleteCompany,
} from "./routes/companies";
import {
  handleCreateExtensionRequest,
  handleGetExtensionRequests,
  handleGetExtensionRequestsCount,
  handleUpdateExtensionRequest,
  handleDeleteExtensionRequest,
  handleGetJobExtensionRequests,
} from "./routes/extensionRequests";
import {
  handleGetStaffProfile,
  handleUpdateStaffProfile,
  handleGetStaffPhotos,
  handleUploadJobPhoto,
  handleGetJobPhotos,
  handleCheckIn,
  handleUploadProfileImage,
  uploadMiddleware,
  profileUploadMiddleware,
} from "./routes/staff";
import {
  handleSendEmail,
  handleAutoSendFormSubmission,
} from "./routes/email";
import {
  handleCheckIn as handleTimeCheckIn,
  handleCheckOut,
  handleTimeLog,
  handleGetTimeRecords,
  handleExportTimeRecords,
} from "./routes/timeTracking";
import {
  handleUpdateUserSalary,
  handleGetUserSalary,
  handleGetAllSalaries,
  handleDeleteUserSalary,
} from "./routes/salary";
import multer from "multer";

// Multer setup for form data parsing
const upload = multer();
import {
  handleSubmitSignature,
  handleGetSignatures,
} from "./routes/signatures";
import {
  handleJobPDFGeneration,
  handleGetFormTemplates,
  handleUpdatePDFConfig,
  handleIndividualFormPDF,
  handleAdminPDFTemplates,
  handleSetPDFTemplateAssociation,
  handleTestPDF,
  handleGenerateABSAPDF,
  handleGenerateLiabilityPDF,
  handleGenerateSAHLPDF,
  handleGenerateClearancePDF,
  handleGenerateAdminPopulatedPDF,
  handleGenerateDiscoveryPDF,
  handleGenerateNoncompliancePDF,
  handleGenerateMaterialListPDF,
} from "./routes/pdf-generation";
import { handleJobCompiledPDF } from "./routes/compiled-pdf";
import { adminFormRoutes, requireAdmin } from "./routes/adminFormManagement";
import {
  handleGetSignaturePositions,
  handleUpdateSignaturePositions,
  handleGetAllSignaturePositions,
  handleResetSignaturePositions
} from "./routes/signaturePositions";
import MongoSyncService from "./services/mongoSync";

export async function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Job Management System API v1.0" });
  });

  // Debug route to test compiled PDF endpoint
  app.get("/api/debug/routes", (_req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      }
    });
    res.json({ message: "Routes debug", routes: routes.filter(r => r.path.includes('compiled-pdf')) });
  });

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/verify", handleVerifyToken);
  app.get("/api/auth/users", handleGetUsers);
  app.put("/api/auth/users/:id", handleUpdateUser);
  app.put("/api/auth/users/:id/password", handleUpdateUserPassword);
  app.delete("/api/auth/users/:id", handleDeleteUser);

  // Job routes
  app.post("/api/jobs", handleCreateJob);
  app.get("/api/jobs", handleGetJobs);
  app.get("/api/jobs/check-exists", handleCheckJobExists);
  app.put("/api/jobs/:id", handleUpdateJob);
  app.delete("/api/jobs/:id", handleDeleteJob);
  app.post("/api/jobs/parse", handleParseJobText);

  // Job notes routes
  app.get("/api/jobs/:jobId/notes", handleGetJobNotes);
  app.post("/api/jobs/:jobId/notes", handleAddJobNote);

  // Discarded jobs routes
  app.post("/api/jobs/:id/discard", handleDiscardJob);
  app.get("/api/jobs/discarded", handleGetDiscardedJobs);
  app.post("/api/jobs/discarded/:id/reinvoke", handleReinvokeJob);
  app.delete("/api/jobs/discarded/:id", handleDeleteDiscardedJob);

  // Form routes
  app.post("/api/forms", handleCreateForm);
  app.get("/api/forms", handleGetForms);
  app.get("/api/forms/:id", handleGetForm);
  app.put("/api/forms/:id", handleUpdateForm);
  app.delete("/api/forms/:id", handleDeleteForm);
  app.post("/api/forms/parse-schema", handleParseFormSchema);

  // Form submission routes
  app.post("/api/form-submissions", handleSubmitForm);
  app.get("/api/form-submissions", handleGetFormSubmissions);

  // Dual signature routes
  app.post("/api/dual-signatures", handleSubmitDualSignature);
  app.get("/api/dual-signatures", handleGetDualSignatures);
  app.put("/api/form-submissions/:id", handleUpdateFormSubmission);
  app.delete("/api/form-submissions/:id", handleDeleteFormSubmission);
  app.delete("/api/form-submissions/clear-all", handleClearAllFormSubmissions);

  // Extension request routes
  app.post("/api/extension-requests", handleCreateExtensionRequest);
  app.get("/api/extension-requests", handleGetExtensionRequests);
  app.get("/api/extension-requests/count", handleGetExtensionRequestsCount);
  app.put("/api/extension-requests/:id", handleUpdateExtensionRequest);
  app.delete("/api/extension-requests/:id", handleDeleteExtensionRequest);
  app.get("/api/jobs/:jobId/extension-requests", handleGetJobExtensionRequests);

  // Company routes
  app.post("/api/companies", handleCreateCompany);
  app.get("/api/companies", handleGetCompanies);
  app.get("/api/companies/:id", handleGetCompany);
  app.put("/api/companies/:id", handleUpdateCompany);
  app.delete("/api/companies/:id", handleDeleteCompany);

  // Staff profile routes
  app.get("/api/staff/profile/:staffId", handleGetStaffProfile);
  app.put("/api/staff/profile/:staffId", handleUpdateStaffProfile);
  app.post(
    "/api/staff/profile/:staffId/image",
    profileUploadMiddleware,
    handleUploadProfileImage,
  );
  app.get("/api/staff/:staffId/photos", handleGetStaffPhotos);
  app.post(
    "/api/staff/:staffId/photos",
    uploadMiddleware,
    handleUploadJobPhoto,
  );
  app.get("/api/jobs/:jobId/photos", handleGetJobPhotos);
  app.post("/api/staff/:staffId/checkin", handleTimeCheckIn);
  app.post("/api/staff/:staffId/checkout", handleCheckOut);
  app.post("/api/staff/:staffId/time-log", handleTimeLog);

  // Time tracking routes (admin only)
  app.get("/api/admin/time-records", handleGetTimeRecords);
  app.get("/api/admin/time-records/export", handleExportTimeRecords);

  // Salary management routes
  app.get("/api/admin/salaries", handleGetAllSalaries);
  app.get("/api/users/:userId/salary", handleGetUserSalary);
  app.put("/api/users/:userId/salary", handleUpdateUserSalary);
  app.delete("/api/users/:userId/salary", handleDeleteUserSalary);

  // Signature routes
  app.post("/api/signatures", handleSubmitSignature);
  app.get("/api/signatures", handleGetSignatures);

  // Signature position management routes
  app.get("/api/signature-positions", handleGetAllSignaturePositions);
  app.get("/api/signature-positions/:formType", handleGetSignaturePositions);
  app.post("/api/signature-positions", handleUpdateSignaturePositions);
  app.post("/api/signature-positions/reset", handleResetSignaturePositions);

  // PDF Generation routes
  app.get("/api/jobs/:jobId/pdf", handleJobPDFGeneration);
  console.log("Registering compiled PDF route: POST /api/jobs/:jobId/compiled-pdf");
  app.post("/api/jobs/:jobId/compiled-pdf", (req, res) => {
    console.log("Compiled PDF route hit with jobId:", req.params.jobId);
    console.log("Request body keys:", Object.keys(req.body || {}));
    return handleJobCompiledPDF(req, res);
  });
  app.get("/api/forms/templates", handleGetFormTemplates);
  app.put("/api/jobs/:jobId/pdf-config", handleUpdatePDFConfig);

  // Individual form PDF routes (for staff)
  app.get(
    "/api/forms/:formId/submissions/:submissionId/pdf",
    handleIndividualFormPDF,
  );

  // Specific form PDF generation routes
  app.post(
    "/api/generate-ABSACertificat-pdf",
    upload.none(),
    handleGenerateABSAPDF,
  );
  app.get("/api/generate-liability-pdf", handleGenerateLiabilityPDF);
  app.get("/api/generate-sahl-pdf", handleGenerateSAHLPDF);
  app.get("/api/generate-clearance-pdf", handleGenerateClearancePDF);
  app.get("/api/admin/forms/:formId/submissions/:submissionId/populated-pdf", requireAdmin, handleGenerateAdminPopulatedPDF);
  app.get("/api/discovery/:id", handleGenerateDiscoveryPDF);
  app.get(
    "/api/generate-noncompliance-pdf/:id",
    handleGenerateNoncompliancePDF,
  );
  app.post("/api/fill-material-list-pdf", handleGenerateMaterialListPDF);

  // Debug route to test if routing works
  app.get("/api/test-route/:id", (req, res) => {
    console.log("Test route hit with ID:", req.params.id);
    res.json({ message: "Test route works", id: req.params.id, timestamp: new Date().toISOString() });
  });

  // Simple test route for PDF generation
  app.post("/api/generate-material-list-pdf/:id", (req, res) => {
    console.log("ROUTE HIT: Material list PDF generation route called with ID:", req.params.id);
    console.log("ROUTE HIT: Request method:", req.method);
    console.log("ROUTE HIT: Body keys:", Object.keys(req.body || {}));

    // For now, just return a success response to test routing
    res.status(200).json({
      message: "PDF generation route working",
      id: req.params.id,
      timestamp: new Date().toISOString(),
      bodyKeys: Object.keys(req.body || {})
    });
  });


  // Admin PDF template management routes
  app.get("/api/admin/pdf-templates", handleAdminPDFTemplates);
  app.post(
    "/api/admin/pdf-template-association",
    handleSetPDFTemplateAssociation,
  );

  // Admin Form Management routes (admin only)
  app.get("/api/admin/pdf-files", ...adminFormRoutes.getPdfFiles);
  app.post("/api/admin/upload-pdf", ...adminFormRoutes.uploadPdf);
  app.post("/api/admin/pdf-signature-position", ...adminFormRoutes.savePDFSignaturePosition);
  app.post("/api/admin/pdf-dual-signature-position", ...adminFormRoutes.savePDFDualSignaturePosition);
  app.post("/api/admin/rename-pdf", ...adminFormRoutes.renamePdf);
  app.delete("/api/admin/delete-pdf/:fileName", ...adminFormRoutes.deletePdf);
  app.get("/api/admin/forms/:formId/variable-mappings", ...adminFormRoutes.getVariableMappings);
  app.put("/api/admin/forms/:formId/variable-mappings", ...adminFormRoutes.updateVariableMappings);
  app.post("/api/admin/link-pdf-form", ...adminFormRoutes.linkPdfToForm);
  app.delete("/api/admin/forms/:formId/unlink-pdf", ...adminFormRoutes.unlinkPdfFromForm);
  app.get("/api/admin/database-schema", ...adminFormRoutes.getDatabaseSchema);

  // PDF test route for debugging
  app.get("/api/test-pdf", handleTestPDF);

  // Legacy demo route
  app.get("/api/demo", handleDemo);

  // MongoDB sync routes
  app.post("/api/mongo/sync", async (req, res) => {
    try {
      const syncService = MongoSyncService.getInstance();
      await syncService.manualSync();
      res.json({ success: true, message: "Manual sync completed" });
    } catch (error) {
      console.error("Manual sync error:", error);
      res.status(500).json({ success: false, error: "Sync failed" });
    }
  });

  app.get("/api/mongo/status", (req, res) => {
    const syncService = MongoSyncService.getInstance();
    const status = syncService.getSyncStatus();
    res.json(status);
  });

  // Email routes
  app.post("/api/send-email", handleSendEmail);
  app.post("/api/send-form-submission", handleAutoSendFormSubmission);

  // Initialize data from MongoDB - Load existing jobs, users, and form submissions
  const { initializeDataFromMongo } = await import("./utils/mongoDataAccess");
  await initializeDataFromMongo();

  // Initialize MongoDB sync service - Keep data in sync
  const syncService = MongoSyncService.getInstance();
  syncService.startSync(5); // Sync every 5 minutes

  return app;
}
