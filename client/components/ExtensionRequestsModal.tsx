import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExtensionRequest, Job } from "@shared/types";
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Check, 
  X, 
  AlertCircle,
  ExternalLink 
} from "lucide-react";

interface ExtensionRequestsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestsUpdated: () => void;
}

export function ExtensionRequestsModal({
  open,
  onOpenChange,
  onRequestsUpdated,
}: ExtensionRequestsModalProps) {
  const [requests, setRequests] = useState<ExtensionRequest[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchExtensionRequests();
      fetchJobs();
    }
  }, [open]);

  const fetchExtensionRequests = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/extension-requests", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch extension requests:", error);
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/jobs", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  const handleRequestAction = async (requestId: string, action: "approved" | "rejected") => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/extension-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          status: action,
          reviewNotes: reviewNotes[requestId] || "",
        }),
      });

      if (response.ok) {
        await fetchExtensionRequests();
        onRequestsUpdated();
        setReviewNotes(prev => ({ ...prev, [requestId]: "" }));
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action} extension request`);
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getJobDetails = (jobId: string) => {
    return jobs.find(job => job.id === jobId);
  };

  const pendingRequests = requests.filter(req => req.status === "pending");
  const reviewedRequests = requests.filter(req => req.status !== "pending");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Extension Requests Management
          </DialogTitle>
          <DialogDescription>
            Review and manage job extension requests from staff members
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Pending Requests */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Pending Requests ({pendingRequests.length})
            </h3>
            
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No pending extension requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => {
                  const job = getJobDetails(request.jobId);
                  return (
                    <Card key={request.id} className="border-l-4 border-l-orange-500">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center space-x-2">
                              <span>{job?.title || "Unknown Job"}</span>
                              <Badge variant="outline">
                                {job?.claimNo || job?.ClaimNo || "No Claim"}
                              </Badge>
                            </CardTitle>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {request.staffName}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                Requested: {new Date(request.requestedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (job) {
                                  // Open job details in new window or navigate
                                  window.open(`/admin?jobId=${job.id}`, '_blank');
                                }
                              }}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Job
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Current Due Date</Label>
                            <p className="text-lg font-semibold text-red-600">
                              {new Date(request.currentDueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Requested Due Date</Label>
                            <p className="text-lg font-semibold text-green-600">
                              {new Date(request.requestedDueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">Reason for Extension</Label>
                          <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-800">
                            {request.reason}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor={`notes-${request.id}`} className="text-sm font-medium text-gray-600">
                            Review Notes (Optional)
                          </Label>
                          <Textarea
                            id={`notes-${request.id}`}
                            placeholder="Add notes about your decision..."
                            value={reviewNotes[request.id] || ""}
                            onChange={(e) => 
                              setReviewNotes(prev => ({
                                ...prev,
                                [request.id]: e.target.value
                              }))
                            }
                            className="mt-1"
                          />
                        </div>

                        <div className="flex space-x-3 pt-2">
                          <Button
                            onClick={() => handleRequestAction(request.id, "approved")}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                          >
                            <Check className="h-4 w-4" />
                            <span>Approve Extension</span>
                          </Button>
                          <Button
                            onClick={() => handleRequestAction(request.id, "rejected")}
                            disabled={loading}
                            variant="destructive"
                            className="flex items-center space-x-2"
                          >
                            <X className="h-4 w-4" />
                            <span>Reject Request</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recently Reviewed Requests */}
          {reviewedRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-600" />
                Recently Reviewed ({reviewedRequests.slice(0, 5).length})
              </h3>
              <div className="space-y-3">
                {reviewedRequests.slice(0, 5).map((request) => {
                  const job = getJobDetails(request.jobId);
                  return (
                    <Card key={request.id} className="border-l-4 border-l-gray-300">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{job?.title || "Unknown Job"}</h4>
                            <p className="text-sm text-gray-600">
                              {request.staffName} • {request.status === "approved" ? "Approved" : "Rejected"}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={request.status === "approved" ? "default" : "destructive"}>
                              {request.status.toUpperCase()}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {request.reviewedAt && new Date(request.reviewedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
