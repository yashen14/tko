import { RequestHandler } from "express";
import {
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  ParsedJobData,
} from "@shared/types";
import { users } from "./auth";

// Jobs storage - synchronized with MongoDB
export let jobs: Job[] = [];
let jobIdCounter = 1;
let meoJobCounter = 1;

// Initialize job counter based on existing jobs to prevent ID conflicts
export function initializeJobCounter() {
  if (jobs.length > 0) {
    const maxId = Math.max(
      ...jobs
        .map(job => job.id)
        .filter(id => id.startsWith('job-'))
        .map(id => parseInt(id.replace('job-', ''), 10))
        .filter(num => !isNaN(num))
    );
    jobIdCounter = maxId + 1;

    // Initialize MEO22 counter based on existing MEO job numbers
    const maxMeoNumber = Math.max(
      0,
      ...jobs
        .map(job => job.meoJobNumber)
        .filter(meoNum => meoNum && meoNum.startsWith('MEO22-'))
        .map(meoNum => parseInt(meoNum.replace('MEO22-', ''), 10))
        .filter(num => !isNaN(num))
    );
    meoJobCounter = maxMeoNumber + 1;

    console.log(`Job counter initialized to ${jobIdCounter} based on existing jobs`);
    console.log(`MEO22 counter initialized to ${meoJobCounter} based on existing MEO job numbers`);
  }
}

// Parse format where field names are on one line followed by values on the next line
function parseLineByLineFormat(lines: string[]): ParsedJobData {
  const data: ParsedJobData = {};

  // Field name patterns to look for - order matters for specificity
  const fieldPatterns = {
    ClaimNo: /^ClaimNo$/i,
    ClaimEstimate: /^Claim\s+Estimate$/i,
    ClaimStatus: /^Claim\s+Status$/i,
    ClaimSpecialist: /^ClaimSpecialist$/i,
    PolicyNo: /^PolicyNo$/i,
    SPMNo: /^SPM\s+No$/i,
    Underwriter: /^Underwriter$/i,
    Branch: /^Branch$/i,
    Broker: /^Broker$/i,
    Email: /^Email$/i,
    RiskAddress: /^Risk\s+Address$/i,
    InsuredName: /^Insured\s+Name$/i,
    InsCell: /^Ins\s+Cell$/i,
    InsHometel: /^Ins\s+Home\s+Tel$/i,
    InsEmail: /^Ins\s+Email$/i,
    SumInsured: /^Sum\s+Insured$/i,
    IncidentDate: /^Incident\s+Date$/i,
    DescriptionOfLoss: /^Description\s+of\s+Loss$/i,
    Section: /^Section$/i,
    Peril: /^Peril$/i,
    Excess: /^Excess$/i,
    DateReported: /^Date\s+Reported$/i,
  };

  let isLineByLineFormat = false;

  // Helper function to check if a line is a field name
  const isFieldName = (line: string): boolean => {
    return Object.values(fieldPatterns).some(pattern => pattern.test(line));
  };

  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i].trim();
    const nextLine = lines[i + 1].trim();

    // Check if current line matches any field pattern
    for (const [fieldKey, pattern] of Object.entries(fieldPatterns)) {
      if (pattern.test(currentLine)) {
        isLineByLineFormat = true;

        // If next line has content and doesn't match another field pattern, it's the value
        if (nextLine && !isFieldName(nextLine)) {
          let value = nextLine;

          // Handle multi-line values (especially for Description of Loss)
          if (fieldKey === 'DescriptionOfLoss') {
            let j = i + 1;
            const multiLineValue = [nextLine];

            // Continue reading lines until we hit another field name
            while (j + 1 < lines.length) {
              const followingLine = lines[j + 1].trim();
              if (followingLine && !isFieldName(followingLine)) {
                multiLineValue.push(followingLine);
                j++;
              } else {
                break;
              }
            }
            value = multiLineValue.join(' ').trim();
            i = j; // Skip the lines we've processed
          }

          // Store the value using the exact field key
          data[fieldKey] = value;
        }
        break;
      }
    }
  }

  // Only return data if we detected the line-by-line format
  return isLineByLineFormat ? data : {};
}

// Enhanced text parser for job data - supports up to 80 fields exactly as parsed
function parseJobText(text: string): ParsedJobData {
  const data: ParsedJobData = {};
  const maxFields = 80;
  let fieldCount = 0;

  // Clean and normalize the text
  const cleanText = text.replace(/\s+/g, " ").trim();
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  // First try the new line-by-line format where field names are on one line and values on the next
  const lineByLineData = parseLineByLineFormat(lines);
  if (Object.keys(lineByLineData).length > 0) {
    Object.assign(data, lineByLineData);
    fieldCount = Object.keys(lineByLineData).length;
  } else {
    // Process each line to extract ALL key-value pairs (existing logic)
    for (const line of lines) {
      if (fieldCount >= maxFields) break;

    // Skip header lines
    if (
      line.includes("Service Provider Appointment") ||
      line.includes("Claim Appointment") ||
      line.includes("Notification Details")
    ) {
      continue;
    }

    // Handle tab-separated format (most common)
    if (line.includes("\t")) {
      const parts = line
        .split("\t")
        .map((part) => part.trim())
        .filter((part) => part);

      for (let i = 0; i < parts.length - 1 && fieldCount < maxFields; i += 2) {
        const key = parts[i];
        const value = parts[i + 1];

        if (key && value) {
          // Use exact key names as parsed, just clean them slightly
          const cleanKey = key.replace(/[^\w\s]/g, "").replace(/\s+/g, "");
          if (cleanKey && !data[cleanKey]) {
            data[cleanKey] = value;
            fieldCount++;
          }
        }
      }
    }
    // Handle colon-separated format
    else if (line.includes(":")) {
      const colonIndex = line.indexOf(":");
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      if (key && value && fieldCount < maxFields) {
        const cleanKey = key.replace(/[^\w\s]/g, "").replace(/\s+/g, "");
        if (cleanKey && !data[cleanKey]) {
          data[cleanKey] = value;
          fieldCount++;
        }
      }
    }
  }
  }

  // Also extract using enhanced patterns for known fields
  const enhancedPatterns = {
    ClaimNo: /(?:ClaimNo|Claim No|Claim)\s*[:\t]\s*([^\s\t]+)/i,
    PolicyNo: /(?:PolicyNo|Policy No|Policy)\s*[:\t]\s*([^\s\t]+)/i,
    SPMNo: /(?:SPM No|SPMNo|SPM)\s*[:\t]\s*([^\s\t]+)/i,
    Underwriter: /Underwriter\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    Branch: /Branch\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    Broker: /Broker\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    ClaimSpecialist:
      /(?:ClaimSpecialist|Claim Specialist)\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    Email: /Email\s*[:\t]\s*([^\s\t]+@[^\s\t]+)/i,
    RiskAddress:
      /(?:Risk Address|Home Address|Address)\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    InsuredName:
      /(?:Insured Name|Client|Name)\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    InsCell: /(?:Ins Cell|Contact|Cell|Phone)\s*[:\t]\s*([+\d\s\-()]+)/i,
    Excess: /Excess\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
  };

  // Fill in any missing standard fields
  for (const [key, pattern] of Object.entries(enhancedPatterns)) {
    if (fieldCount >= maxFields) break;

    if (!data[key]) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        data[key] = match[1].trim();
        fieldCount++;
      }
    }
  }

  return data;
}

export const handleCreateJob: RequestHandler = async (req, res) => {
  try {
    const jobData: CreateJobRequest = req.body;

    // Extract user ID from authorization header
    const token = req.headers.authorization?.replace("Bearer ", "");
    const currentUserId = token ? token.replace("mock-token-", "") : "admin-1";

    if (!jobData.title) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!jobData.assignedTo) {
      return res
        .status(400)
        .json({ error: "Please assign the job to a staff member" });
    }

    let parsedData: ParsedJobData = {};

    // Parse raw text if provided
    if (jobData.rawText) {
      parsedData = parseJobText(jobData.rawText);
    }

    // Auto-detect company based on parsed text or provided text
    let companyId = jobData.companyId;
    if (!companyId && (jobData.rawText || jobData.description)) {
      const textToSearch = (
        jobData.rawText +
        " " +
        jobData.description
      ).toLowerCase();

      if (textToSearch.includes("absa")) {
        companyId = "company-2"; // ABSA Insurance Company Limited
      } else if (textToSearch.includes("sahl")) {
        companyId = "company-1"; // SAHL Insurance Company Ltd
      } else {
        companyId = "company-3"; // Discovery Insurance (default)
      }
    }

    // Auto-attach appropriate forms based on company
    let requiredFormIds: string[] = [];
    let optionalFormIds: string[] = [];
    let primaryFormId = jobData.formId;

    // Required forms for all jobs
    requiredFormIds = [
      "form-clearance-certificate", // REQUIRED - Clearance Certificate
      "material-list-form", // REQUIRED - Material List Form
      "noncompliance-form", // REQUIRED - Non Compliance Form
    ];

    // All other forms are optional
    optionalFormIds = [
      "form-sahl-certificate", // OPTIONAL - SAHL Certificate Form
      "form-absa-certificate", // OPTIONAL - ABSA Form
      "form-liability-certificate", // OPTIONAL - Liability Form
      "form-discovery-geyser", // OPTIONAL - Discovery Form
    ];

    // Company-specific forms are now included in the main optional forms list

    // Primary form is always clearance certificate
    primaryFormId = primaryFormId || "form-clearance-certificate";

    // Combine required and optional forms - required forms come first
    const finalFormIds = Array.from(
      new Set([
        ...requiredFormIds, // Required forms (only clearance certificate)
        ...(jobData.formIds || []), // Any explicitly requested forms
        ...optionalFormIds, // Optional forms
      ]),
    );

    // Calculate initial pricing for Zaundre
    let pricing;
    if (jobData.assignedTo === "staff-4") {
      // Zaundre
      pricing = {
        type: "call-out" as const,
        amount: 120,
        staffId: jobData.assignedTo,
      };
    }

    // Generate MEO22 job number
    const meoJobNumber = `MEO22-${String(meoJobCounter++).padStart(3, '0')}`;

    const newJob: Job = {
      id: `job-${jobIdCounter++}`,
      title: jobData.title,
      description: jobData.description,
      assignedTo: jobData.assignedTo,
      assignedBy: currentUserId, // User who created the job
      companyId: companyId,
      formId: primaryFormId,
      formIds: finalFormIds,
      status: "pending",
      priority: jobData.priority,
      dueDate: jobData.dueDate,
      category: jobData.category,
      categoryOther: jobData.categoryOther,
      pricing: pricing,
      isAssisting: false,
      meoJobNumber: meoJobNumber, // Add MEO22 job tracking number
      ...parsedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    jobs.push(newJob);

    // Immediately save to MongoDB to prevent data loss
    try {
      const { saveJobToMongo } = await import("../utils/mongoDataAccess");
      await saveJobToMongo(newJob);
      console.log(`Job ${newJob.id} saved to MongoDB immediately`);
    } catch (mongoError) {
      console.error("Failed to save job to MongoDB:", mongoError);
      // Don't fail the request, but log the error
    }

    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetJobs: RequestHandler = (req, res) => {
  try {
    const { assignedTo, status } = req.query;

    let filteredJobs = jobs;

    if (assignedTo) {
      filteredJobs = filteredJobs.filter(
        (job) => job.assignedTo === assignedTo,
      );
    }

    if (status) {
      filteredJobs = filteredJobs.filter((job) => job.status === status);
    }

    res.json(filteredJobs);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateJob: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateJobRequest = req.body;

    const jobIndex = jobs.findIndex((job) => job.id === id);

    if (jobIndex === -1) {
      return res.status(404).json({ error: "Job not found" });
    }

    const currentJob = jobs[jobIndex];

    // Update pricing for Zaundre based on category or status changes
    let updatedPricing = currentJob.pricing;
    if (currentJob.assignedTo === "staff-4" && !currentJob.isAssisting) {
      if (updates.category === "Geyser Replacement") {
        updatedPricing = {
          type: "replacement",
          amount: 250,
          staffId: currentJob.assignedTo,
        };
      } else if (
        updates.status === "completed" &&
        currentJob.category !== "Geyser Assessment"
      ) {
        // Job turned into a repair
        updatedPricing = {
          type: "repair",
          amount: 200,
          staffId: currentJob.assignedTo,
        };
      } else if (
        updates.category &&
        updates.category !== "Geyser Replacement"
      ) {
        // Reset to call-out for other categories
        updatedPricing = {
          type: "call-out",
          amount: 120,
          staffId: currentJob.assignedTo,
        };
      }
    }

    const updatedJob = {
      ...currentJob,
      ...updates,
      pricing: updatedPricing,
      updatedAt: new Date().toISOString(),
    };

    jobs[jobIndex] = updatedJob;

    // Immediately save to MongoDB to prevent data loss
    try {
      const { saveJobToMongo } = await import("../utils/mongoDataAccess");
      await saveJobToMongo(updatedJob);
      console.log(`Job ${updatedJob.id} updated and saved to MongoDB immediately`);
    } catch (mongoError) {
      console.error("Failed to save updated job to MongoDB:", mongoError);
    }

    res.json(jobs[jobIndex]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteJob: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "";

    if (userId !== "admin-1") {
      return res.status(403).json({ error: "Only administrators can delete jobs" });
    }

    const jobIndex = jobs.findIndex((job) => job.id === id);

    if (jobIndex === -1) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Delete all form submissions associated with this job
    try {
      const { formSubmissions } = await import("./forms");

      // Get all submissions for this job
      const jobSubmissions = formSubmissions.filter((sub) => sub.jobId === id);

      // Remove submissions from array
      const updatedSubmissions = formSubmissions.filter((sub) => sub.jobId !== id);

      // Update the formSubmissions array
      const formsModule = await import("./forms");
      formsModule.formSubmissions.length = 0;
      formsModule.formSubmissions.push(...updatedSubmissions);

      console.log(`Deleted ${jobSubmissions.length} form submissions for job ${id}`);

      // Also try to delete from MongoDB if available
      try {
        const { connectToDatabase } = await import("../utils/mongodb");
        const { FormSubmission: MongoFormSubmission } = await import("../models");

        await connectToDatabase();
        const deletedCount = await MongoFormSubmission.deleteMany({ jobId: id });
        console.log(`Deleted ${deletedCount.deletedCount} form submissions from MongoDB for job ${id}`);
      } catch (mongoError) {
        console.warn("Could not delete form submissions from MongoDB:", mongoError);
        // Continue with job deletion even if MongoDB cleanup fails
      }
    } catch (error) {
      console.warn("Could not delete form submissions:", error);
      // Continue with job deletion even if form cleanup fails
    }

    // Remove the job from memory
    const deletedJob = jobs.splice(jobIndex, 1)[0];

    // Immediately delete from MongoDB
    try {
      const { connectToDatabase } = await import("../utils/mongodb");
      const { Job: MongoJob } = await import("../models");

      await connectToDatabase();
      await MongoJob.deleteOne({ id: id });
      console.log(`Job ${id} deleted from MongoDB immediately`);
    } catch (mongoError) {
      console.error("Failed to delete job from MongoDB:", mongoError);
    }

    res.status(200).json({
      message: "Job and all associated forms deleted successfully",
      deletedJobId: id
    });
  } catch (error) {
    console.error("Error in handleDeleteJob:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleParseJobText: RequestHandler = (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const parsedData = parseJobText(text);
    res.json(parsedData);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCheckJobExists: RequestHandler = (req, res) => {
  try {
    const { claimNo, policyNo, title } = req.query;

    // Check if job already exists based on claim number, policy number, or exact title
    const existingJob = jobs.find((job) => {
      if (claimNo && job.claimNo === claimNo) return true;
      if (policyNo && job.policyNo === policyNo) return true;
      if (title && job.title === title) return true;
      return false;
    });

    if (existingJob) {
      res.json({ exists: true, job: existingJob });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mock storage for job notes
let jobNotes: Array<{
  id: string;
  jobId: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}> = [];
let noteIdCounter = 1;

// Reset job notes on startup
jobNotes.length = 0;

// Discarded jobs storage
let discardedJobs: Array<{
  id: string;
  originalJob: Job;
  discardedAt: string;
  discardedBy: string;
  reason: string;
  previousAssignee?: string;
}> = [];
let discardedJobIdCounter = 1;

export const handleGetJobNotes: RequestHandler = (req, res) => {
  try {
    const { jobId } = req.params;

    const notes = jobNotes
      .filter((note) => note.jobId === jobId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleAddJobNote: RequestHandler = (req, res) => {
  try {
    const { jobId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Note content is required" });
    }

    // Get user from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "admin-1";

    // Get user info from imported users

    const user = users.find((u) => u.id === userId);
    const userName = user ? user.name : "Unknown User";

    const newNote = {
      id: `note-${noteIdCounter++}`,
      jobId,
      content: content.trim(),
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date().toISOString(),
    };

    jobNotes.push(newNote);
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDiscardJob: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, previousAssignee } = req.body;

    // Get user from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "admin-1";

    const jobIndex = jobs.findIndex((job) => job.id === id);

    if (jobIndex === -1) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobs[jobIndex];

    // Create discarded job record
    const discardedJob = {
      id: `discarded-${discardedJobIdCounter++}`,
      originalJob: { ...job },
      discardedAt: new Date().toISOString(),
      discardedBy: userId,
      reason: reason || "No reason provided",
      previousAssignee,
    };

    discardedJobs.push(discardedJob);

    // Update the original job - remove assignment and set to pending
    const updatedJob = {
      ...job,
      assignedTo: "",
      status: "pending",
      updatedAt: new Date().toISOString(),
    };

    jobs[jobIndex] = updatedJob;

    // Immediately save updated job to MongoDB
    try {
      const { saveJobToMongo } = await import("../utils/mongoDataAccess");
      await saveJobToMongo(updatedJob);
      console.log(`Discarded job ${updatedJob.id} saved to MongoDB immediately`);
    } catch (mongoError) {
      console.error("Failed to save discarded job to MongoDB:", mongoError);
    }

    res.json({
      message: "Job discarded successfully",
      discardedJob,
      updatedJob: jobs[jobIndex]
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetDiscardedJobs: RequestHandler = (req, res) => {
  try {
    res.json(discardedJobs);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleReinvokeJob: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignTo, reason } = req.body;

    const discardedJobIndex = discardedJobs.findIndex((dJob) => dJob.id === id);

    if (discardedJobIndex === -1) {
      return res.status(404).json({ error: "Discarded job not found" });
    }

    const discardedJob = discardedJobs[discardedJobIndex];
    const originalJob = discardedJob.originalJob;

    // Create a new job based on the original
    const newJob: Job = {
      ...originalJob,
      id: `job-${jobIdCounter++}`,
      assignedTo: assignTo || "",
      status: assignTo ? "pending" : "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reinvokedFrom: discardedJob.id,
      reinvokeReason: reason || "Reinvoked from discarded jobs",
    } as any;

    jobs.push(newJob);

    // Immediately save new job to MongoDB
    try {
      const { saveJobToMongo } = await import("../utils/mongoDataAccess");
      await saveJobToMongo(newJob);
      console.log(`Reinvoked job ${newJob.id} saved to MongoDB immediately`);
    } catch (mongoError) {
      console.error("Failed to save reinvoked job to MongoDB:", mongoError);
    }

    // Remove from discarded jobs
    discardedJobs.splice(discardedJobIndex, 1);

    res.json({
      message: "Job reinvoked successfully",
      job: newJob,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteDiscardedJob: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const discardedJobIndex = discardedJobs.findIndex((dJob) => dJob.id === id);

    if (discardedJobIndex === -1) {
      return res.status(404).json({ error: "Discarded job not found" });
    }

    discardedJobs.splice(discardedJobIndex, 1);

    res.json({ message: "Discarded job deleted permanently" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
