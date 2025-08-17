import { RequestHandler } from "express";
import { PDFDocument } from "pdf-lib";
import { formSubmissions } from "./forms";
import {
  handleGenerateFormPDF,
} from "./pdf-generation";

export const handleJobCompiledPDF: RequestHandler = async (req, res) => {
  console.log("handleJobCompiledPDF function called");
  try {
    const { jobId } = req.params;
    const { submissionIds, jobTitle, claimNumber, clientName } = req.body;

    console.log(`Generating compiled PDF for job ${jobId} with ${submissionIds?.length || 0} submissions`);

    if (!submissionIds || submissionIds.length === 0) {
      console.log("No submission IDs provided");
      return res.status(400).json({ error: "No submission IDs provided" });
    }

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
        // Find the submission
        const submission = formSubmissions.find((sub) => sub.id === submissionId);

        if (!submission) {
          console.warn(`Submission ${submissionId} not found, skipping`);
          continue;
        }

        console.log(`Found submission for form type: ${submission.formId}`);

        // Check if submission has empty or missing data that will be filled with dummy data
        const dataKeys = Object.keys(submission.data || {});
        const emptyFields = dataKeys.filter(key =>
          !submission.data[key] || submission.data[key] === '' || submission.data[key] === 'N/A'
        );

        if (emptyFields.length > 0) {
          console.log(`📝 Form ${submission.formId} has ${emptyFields.length} empty fields that will be filled with demo data for PDF viewing:`, emptyFields);
        }

        // Generate individual PDF using the form PDF handler
        // Create a mock request/response to use existing PDF generation
        const mockReq = {
          params: { submissionId: submissionId }
        } as any;

        let individualPdfBytes: Uint8Array;

        // Use existing PDF generation logic
        const mockRes = {
          status: (code: number) => mockRes,
          json: (data: any) => mockRes,
          set: (headers: any) => mockRes,
          send: (buffer: Buffer) => {
            individualPdfBytes = new Uint8Array(buffer);
          }
        } as any;

        try {
          await handleGenerateFormPDF(mockReq, mockRes);

          if (!individualPdfBytes) {
            console.warn(`Failed to generate PDF for submission ${submissionId}, skipping`);
            continue;
          }

          // Load the individual PDF and copy its pages to the compiled PDF
          const individualPdfDoc = await PDFDocument.load(individualPdfBytes);
          const pageIndices = individualPdfDoc.getPageIndices();

          console.log(`Copying ${pageIndices.length} pages from ${submission.formId}`);

          // Copy all pages from the individual PDF
          const copiedPages = await compiledPdfDoc.copyPages(individualPdfDoc, pageIndices);
          copiedPages.forEach((page) => compiledPdfDoc.addPage(page));
        } catch (pdfGenError) {
          console.error(`Error generating PDF for submission ${submissionId}:`, pdfGenError);
          continue;
        }

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
