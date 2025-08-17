import { RequestHandler } from "express";
import { ExtensionRequest } from "@shared/types";

// Import in-memory data from other modules
import { jobs } from "./jobs";
import { users } from "./auth";

// In-memory storage for extension requests
let extensionRequests: ExtensionRequest[] = [];
let extensionRequestCounter = 1;

/**
 * Create a new extension request
 */
export const handleCreateExtensionRequest: RequestHandler = (req, res) => {
  try {
    const { jobId, requestedDueDate, reason } = req.body;
    
    if (!jobId || !requestedDueDate || !reason) {
      return res.status(400).json({ 
        error: "Missing required fields: jobId, requestedDueDate, reason" 
      });
    }

    // Get user ID from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    const staffId = token ? token.replace("mock-token-", "") : "";

    if (!staffId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get staff details
    const staff = users.find(u => u.id === staffId);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Get job details
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Verify staff is assigned to this job
    if (job.assignedTo !== staffId) {
      return res.status(403).json({ error: "You can only request extensions for jobs assigned to you" });
    }

    // Create new extension request
    const newRequest: ExtensionRequest = {
      id: `ext-req-${extensionRequestCounter++}`,
      jobId,
      staffId,
      staffName: staff.name,
      currentDueDate: job.dueDate || new Date().toISOString(),
      requestedDueDate,
      reason,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };

    extensionRequests.push(newRequest);

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Error creating extension request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all extension requests (admin/apollo only)
 */
export const handleGetExtensionRequests: RequestHandler = (req, res) => {
  try {
    // Filter by status if specified
    const status = req.query.status as string;
    let filteredRequests = extensionRequests;

    if (status) {
      filteredRequests = extensionRequests.filter(req => req.status === status);
    }

    // Sort by requestedAt (newest first)
    filteredRequests.sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );

    res.json(filteredRequests);
  } catch (error) {
    console.error("Error fetching extension requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get extension requests count (for notifications)
 */
export const handleGetExtensionRequestsCount: RequestHandler = (req, res) => {
  try {
    const pendingCount = extensionRequests.filter(req => req.status === "pending").length;
    res.json({ count: pendingCount });
  } catch (error) {
    console.error("Error fetching extension requests count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update an extension request (approve/reject)
 */
export const handleUpdateExtensionRequest: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status. Must be 'approved' or 'rejected'" 
      });
    }

    // Get user ID from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    const reviewerId = token ? token.replace("mock-token-", "") : "";

    if (!reviewerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get reviewer details
    const reviewer = users.find(u => u.id === reviewerId);
    if (!reviewer) {
      return res.status(404).json({ error: "Reviewer not found" });
    }

    const requestIndex = extensionRequests.findIndex(req => req.id === id);
    if (requestIndex === -1) {
      return res.status(404).json({ error: "Extension request not found" });
    }

    const request = extensionRequests[requestIndex];
    if (request.status !== "pending") {
      return res.status(400).json({ 
        error: "Cannot update a request that has already been reviewed" 
      });
    }

    // Update the request
    extensionRequests[requestIndex] = {
      ...request,
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: `${reviewer.name} (${reviewer.role})`,
      reviewNotes,
    };

    // If approved, update the job's due date
    if (status === "approved") {
      const jobIndex = jobs.findIndex(j => j.id === request.jobId);
      if (jobIndex !== -1) {
        jobs[jobIndex] = {
          ...jobs[jobIndex],
          dueDate: request.requestedDueDate,
          notes: jobs[jobIndex].notes
            ? `${jobs[jobIndex].notes}\n\n[Extension Approved] ${new Date().toISOString()}: Due date extended to ${new Date(request.requestedDueDate).toLocaleDateString()}. Reason: ${request.reason}`
            : `[Extension Approved] ${new Date().toISOString()}: Due date extended to ${new Date(request.requestedDueDate).toLocaleDateString()}. Reason: ${request.reason}`,
        };
        console.log(`Job ${request.jobId} due date updated to ${request.requestedDueDate}`);
      }
    }

    res.json(extensionRequests[requestIndex]);
  } catch (error) {
    console.error("Error updating extension request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete an extension request
 */
export const handleDeleteExtensionRequest: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    
    const requestIndex = extensionRequests.findIndex(req => req.id === id);
    if (requestIndex === -1) {
      return res.status(404).json({ error: "Extension request not found" });
    }

    extensionRequests.splice(requestIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting extension request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get extension requests for a specific job
 */
export const handleGetJobExtensionRequests: RequestHandler = (req, res) => {
  try {
    const { jobId } = req.params;
    
    const jobRequests = extensionRequests.filter(req => req.jobId === jobId);
    
    // Sort by requestedAt (newest first)
    jobRequests.sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );

    res.json(jobRequests);
  } catch (error) {
    console.error("Error fetching job extension requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
