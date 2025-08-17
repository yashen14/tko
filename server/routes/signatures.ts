import { Request, Response } from "express";
import { formSubmissions } from "./forms";
import { FormSubmission as MongoFormSubmission } from "../models";
import connectToDatabase from "../utils/mongodb";

interface SignatureSubmission {
  jobId: string;
  formType: "material" | "noncompliance" | "liability" | "signature" | "clearance-certificate" | "discovery" | "absa" | "sahl-certificate";
  signature?: string; // Main signature (client signature for dual forms)
  signature_staff?: string; // Staff signature for dual signature forms
  formData?: any;
  submittedBy: string;
}

export async function handleSubmitSignature(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      jobId,
      formType,
      signature,
      signature_staff,
      formData,
      submittedBy,
    }: SignatureSubmission = req.body;

    if (!jobId || (!signature && !signature_staff) || !submittedBy) {
      res.status(400).json({
        error: "Missing required fields: jobId, at least one signature, submittedBy",
      });
      return;
    }

    // Determine if this is a dual signature form
    const dualSignatureForms = ["liability", "clearance-certificate", "discovery"];
    const isDualSignatureForm = dualSignatureForms.includes(formType);

    // Create submission object
    const submission = {
      id: `signature-${jobId}-${Date.now()}`,
      jobId,
      formId: `${formType}-form`,
      formType: isDualSignatureForm ? "dual-signature" : "signature",
      data: {
        ...(signature && { signature }),
        ...(signature_staff && { signature_staff }),
        ...formData,
      },
      ...(signature && { signature }),
      ...(signature_staff && { signature_staff }),
      submittedBy,
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(isDualSignatureForm && {
        signatureStatus: {
          clientRequired: true,
          staffRequired: true,
          clientSigned: !!signature,
          staffSigned: !!signature_staff,
          isComplete: !!(signature && signature_staff)
        }
      })
    };

    // Save to local array (existing system)
    formSubmissions.push(submission);

    // Save to MongoDB
    try {
      await connectToDatabase();
      await MongoFormSubmission.findOneAndUpdate(
        { id: submission.id },
        submission,
        { upsert: true, new: true },
      );
      console.log(`Signature synced to MongoDB: ${submission.id}`);
    } catch (mongoError) {
      console.error("Failed to sync signature to MongoDB:", mongoError);
      // Don't fail the request if MongoDB sync fails
    }

    res.status(201).json({
      success: true,
      submission,
      message: isDualSignatureForm
        ? `Dual signature submitted successfully (${signature ? 'Client' : ''}${signature && signature_staff ? ' & ' : ''}${signature_staff ? 'Staff' : ''})`
        : "Signature submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting signature:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleGetSignatures(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { jobId } = req.query;

    let signatures = formSubmissions.filter(
      (sub) => sub.formType === "signature" || sub.formType === "dual-signature" || sub.signature || sub.signature_staff,
    );

    if (jobId) {
      signatures = signatures.filter((sub) => sub.jobId === jobId);
    }

    res.json(signatures);
  } catch (error) {
    console.error("Error fetching signatures:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
