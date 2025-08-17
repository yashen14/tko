import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Job, User, Company, Form } from "@shared/types";
import {
  Loader2,
  FileText,
  ExternalLink,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Timer,
  Send
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SendAgainModal } from "@/components/SendAgainModal";

interface JobEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onJobUpdated: () => void;
}

// Duration options from 1 hour to 4 hours in 30-minute intervals
const DURATION_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
  { value: 210, label: "3.5 hours" },
  { value: 240, label: "4 hours" },
];

// Time slots in 30-minute intervals
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00"
];

export function JobEditModal({
  open,
  onOpenChange,
  job,
  onJobUpdated,
}: JobEditModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sendAgainModalOpen, setSendAgainModalOpen] = useState(false);

  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    companyId: "",
    formId: "",
    status: "pending" as "pending" | "in_progress" | "completed",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
    duration: 120, // Default 2 hours
    scheduledTime: "09:00",
  });

  useEffect(() => {
    if (open) {
      setDataLoading(true);
      fetchData();
      if (job) {
        setJobData({
          title: job.title,
          description: job.description,
          assignedTo: job.assignedTo,
          companyId: job.companyId || "",
          formId: job.formId || "",
          status: job.status,
          priority: job.priority,
          dueDate: job.dueDate ? job.dueDate.split("T")[0] : "",
          duration: job.duration || 120,
          scheduledTime: job.dueDate ? new Date(job.dueDate).toTimeString().slice(0, 5) : "09:00",
        });
        if (job.dueDate) {
          setSelectedDate(new Date(job.dueDate));
        }
      }
      setError(null);
    }
  }, [open, job]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [usersRes, companiesRes, formsRes] = await Promise.all([
        fetch("/api/auth/users", { headers }),
        fetch("/api/companies", { headers }),
        fetch("/api/forms", { headers }),
      ]);

      const [usersData, companiesData, formsData] = await Promise.all([
        usersRes.json(),
        companiesRes.json(),
        formsRes.json(),
      ]);

      setStaff(usersData.filter((u: User) => u.role === "staff"));
      setCompanies(companiesData);
      setForms(formsData);
    } catch (error) {
      setError("Failed to load data");
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    // Check permissions - supervisors can only assign jobs, not edit details
    if (user?.role === "supervisor") {
      if (jobData.assignedTo === job.assignedTo) {
        setError("No changes to save");
        return;
      }
      // Only allow changing assignedTo
      const updateData = { assignedTo: jobData.assignedTo };
      await updateJob(updateData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!jobData.title.trim()) {
        setError("Job title is required");
        setLoading(false);
        return;
      }

      // Create complete datetime with date and time
      let finalJobData = { ...jobData };
      if (jobData.dueDate && jobData.scheduledTime) {
        const dueDateTime = new Date(`${jobData.dueDate}T${jobData.scheduledTime}:00`);
        finalJobData.dueDate = dueDateTime.toISOString();
      }

      await updateJob(finalJobData);
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (updateData: any) => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api/jobs/${job!.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      onJobUpdated();
      onOpenChange(false);
    } else {
      const errorData = await response.json();
      setError(errorData.error || "Failed to update job");
    }
  };

  const handleFillForm = () => {
    if (!job || !job.formId) {
      setError("No form attached to this job");
      return;
    }

    navigate("/fill-form", {
      state: { jobId: job.id, formId: job.formId },
    });
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const canEdit = user?.role === "admin";
  const canAssign = user?.role === "admin" || user?.role === "supervisor";

  const handleSendAgain = async (jobId: string, reason: string, additionalNotes?: string, assignTo?: string) => {
    if (!job) return;

    try {
      // Create a duplicate job excluding forms
      const duplicateJob = {
        ...job,
        id: undefined, // Remove ID so backend creates new job
        title: `${job.title} (${reason})`,
        description: `${job.description}\n\nSend Again Reason: ${reason}${additionalNotes ? `\nNotes: ${additionalNotes}` : ''}`,
        status: "pending" as const,
        assignedTo: assignTo || job.assignedTo,
        formId: "", // Exclude form
        formIds: [], // Exclude multiple forms
        dueDate: "", // Clear scheduling to avoid overlaps
        sendAgainReason: reason,
        sendAgainNotes: additionalNotes || "",
        originalJobId: job.id,
        sentAgainAt: new Date().toISOString(),
        notes: `Sent again by ${user?.name || 'Unknown'} at ${new Date().toLocaleString()}\nReason: ${reason}${additionalNotes ? `\nAdditional Notes: ${additionalNotes}` : ''}\n\nOriginal Notes:\n${job.notes || 'None'}`
      };

      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers,
        body: JSON.stringify(duplicateJob),
      });

      if (response.ok) {
        onJobUpdated(); // Refresh the job list
        setSendAgainModalOpen(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create duplicate job");
      }
    } catch (error) {
      setError("Network error occurred while creating duplicate job");
    }
  };

  if (!job) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{canEdit ? "Edit Job" : "Job Details"}</DialogTitle>
          <DialogDescription>
            {canEdit
              ? "Update job information, schedule, and assignments"
              : canAssign
                ? "View job details and manage assignments"
                : "View job details"}
          </DialogDescription>
        </DialogHeader>

        {dataLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-1">
            {/* Main Form - 2 columns */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={jobData.title}
                      onChange={(e) =>
                        setJobData({ ...jobData, title: e.target.value })
                      }
                      placeholder="Enter job title"
                      disabled={!canEdit}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={jobData.status}
                      onValueChange={(
                        value: "pending" | "in_progress" | "completed",
                      ) => setJobData({ ...jobData, status: value })}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="pending" value="pending">
                          Pending
                        </SelectItem>
                        <SelectItem key="in_progress" value="in_progress">
                          In Progress
                        </SelectItem>
                        <SelectItem key="completed" value="completed">
                          Completed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={jobData.description}
                    onChange={(e) =>
                      setJobData({ ...jobData, description: e.target.value })
                    }
                    placeholder="Enter job description"
                    disabled={!canEdit}
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assign to Staff</Label>
                    <Select
                      value={jobData.assignedTo}
                      onValueChange={(value) =>
                        setJobData({ ...jobData, assignedTo: value })
                      }
                      disabled={!canAssign}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={jobData.priority}
                      onValueChange={(value: "low" | "medium" | "high") =>
                        setJobData({ ...jobData, priority: value })
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="low" value="low">
                          Low
                        </SelectItem>
                        <SelectItem key="medium" value="medium">
                          Medium
                        </SelectItem>
                        <SelectItem key="high" value="high">
                          High
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyId">Company</Label>
                    <Select
                      value={jobData.companyId}
                      onValueChange={(value) =>
                        setJobData({ ...jobData, companyId: value })
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="formId">Attach Form</Label>
                    <div className="flex gap-2">
                      <Select
                        value={jobData.formId}
                        onValueChange={(value) =>
                          setJobData({ ...jobData, formId: value })
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select form" />
                        </SelectTrigger>
                        <SelectContent>
                          {forms.map((form) => (
                            <SelectItem key={form.id} value={form.id}>
                              {form.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {job.formId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleFillForm}
                          className="flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Fill
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={jobData.dueDate}
                    onChange={(e) => {
                      setJobData({ ...jobData, dueDate: e.target.value });
                      if (e.target.value) {
                        setSelectedDate(new Date(e.target.value));
                      }
                    }}
                    disabled={!canEdit}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    {canEdit || canAssign ? "Cancel" : "Close"}
                  </Button>
                  {(canEdit || canAssign) && (
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          {canEdit ? "Update Job" : "Update Assignment"}
                        </>
                      )}
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setSendAgainModalOpen(true)}
                      disabled={loading}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Again
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Duration Control Block */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Timer className="h-4 w-4 mr-2" />
                    Duration Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Estimated Duration</Label>
                    <Select
                      value={jobData.duration.toString()}
                      onValueChange={(value) =>
                        setJobData({ ...jobData, duration: parseInt(value) })
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select
                      value={jobData.scheduledTime}
                      onValueChange={(value) =>
                        setJobData({ ...jobData, scheduledTime: value })
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium text-blue-900">Schedule Summary</div>
                      <div className="text-blue-700">
                        <div>Start: {jobData.scheduledTime}</div>
                        <div>
                          End:{" "}
                          {(() => {
                            const [hours, minutes] = jobData.scheduledTime.split(":").map(Number);
                            const endTime = new Date();
                            endTime.setHours(hours, minutes + jobData.duration, 0, 0);
                            return endTime.toTimeString().slice(0, 5);
                          })()}
                        </div>
                        <div>Duration: {Math.floor(jobData.duration / 60)}h {jobData.duration % 60}m</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Job Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Created:</span>
                    <br />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>
                    <br />
                    {new Date(job.updatedAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Priority:</span>
                    <br />
                    <Badge
                      variant={
                        job.priority === "high"
                          ? "destructive"
                          : job.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {job.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <br />
                    <Badge variant="outline">
                      {job.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar Preview Block */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Calendar Preview
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setSelectedDate(newDate);
                        }}
                        disabled={!canEdit}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setSelectedDate(newDate);
                        }}
                        disabled={!canEdit}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center text-sm font-medium">
                      {selectedDate.toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                        <div key={day} className="text-center font-medium text-gray-500 p-2">
                          {day}
                        </div>
                      ))}
                      
                      {generateCalendarDays().map((date, index) => {
                        const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                        const isSelected = jobData.dueDate === date.toISOString().split('T')[0];
                        const isToday = date.toDateString() === new Date().toDateString();
                        
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (canEdit && isCurrentMonth) {
                                const dateStr = date.toISOString().split('T')[0];
                                setJobData({ ...jobData, dueDate: dateStr });
                                setSelectedDate(date);
                              }
                            }}
                            disabled={!canEdit || !isCurrentMonth}
                            className={`
                              p-2 text-xs rounded-lg transition-colors
                              ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                              ${isSelected ? 'bg-blue-500 text-white' : ''}
                              ${isToday && !isSelected ? 'bg-blue-100 text-blue-900' : ''}
                              ${canEdit && isCurrentMonth ? 'hover:bg-blue-50' : ''}
                              ${!canEdit || !isCurrentMonth ? 'cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Information */}
              {(job.claimNo || job.policyNo || job.insuredName) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm max-h-48 overflow-y-auto">
                    {(job.claimNo || job.ClaimNo) && (
                      <div>
                        <span className="font-medium">Claim No:</span>
                        <br />
                        {job.claimNo || job.ClaimNo}
                      </div>
                    )}
                    {(job.policyNo || job.PolicyNo) && (
                      <div>
                        <span className="font-medium">Policy No:</span>
                        <br />
                        {job.policyNo || job.PolicyNo}
                      </div>
                    )}
                    {(job.insuredName || job.InsuredName) && (
                      <div>
                        <span className="font-medium">Client:</span>
                        <br />
                        {job.insuredName || job.InsuredName}
                      </div>
                    )}
                    {(job.insCell || job.InsCell) && (
                      <div>
                        <span className="font-medium">Contact:</span>
                        <br />
                        {job.insCell || job.InsCell}
                      </div>
                    )}
                    {(job.riskAddress || job.RiskAddress) && (
                      <div>
                        <span className="font-medium">Address:</span>
                        <br />
                        {job.riskAddress || job.RiskAddress}
                      </div>
                    )}
                    {(job.excess || job.Excess) && (
                      <div>
                        <span className="font-medium">Excess:</span>
                        <br />
                        <span className="text-green-600 font-medium">
                          {job.excess || job.Excess}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Additional Information */}
              {Object.entries(job)
                .filter(
                  ([key, value]) =>
                    value &&
                    typeof value === "string" &&
                    ![
                      "id", "title", "description", "assignedTo", "assignedBy",
                      "companyId", "formId", "status", "priority", "dueDate",
                      "createdAt", "updatedAt", "notes", "carryOver", "duration",
                      "claimNo", "policyNo", "insuredName", "insCell",
                      "riskAddress", "excess", "ClaimNo", "PolicyNo",
                      "InsuredName", "InsCell", "RiskAddress", "Excess",
                    ].includes(key),
                )
                .slice(0, 10).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm max-h-48 overflow-y-auto">
                    {Object.entries(job)
                      .filter(
                        ([key, value]) =>
                          value &&
                          typeof value === "string" &&
                          ![
                            "id", "title", "description", "assignedTo", "assignedBy",
                            "companyId", "formId", "status", "priority", "dueDate",
                            "createdAt", "updatedAt", "notes", "carryOver", "duration",
                            "claimNo", "policyNo", "insuredName", "insCell",
                            "riskAddress", "excess", "ClaimNo", "PolicyNo",
                            "InsuredName", "InsCell", "RiskAddress", "Excess",
                          ].includes(key),
                      )
                      .slice(0, 10)
                      .map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </span>
                          <br />
                          {String(value).length > 50
                            ? `${String(value).substring(0, 50)}...`
                            : String(value)}
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>

      <SendAgainModal
        open={sendAgainModalOpen}
        onOpenChange={setSendAgainModalOpen}
        job={job}
        onSendAgain={handleSendAgain}
        availableStaff={staff}
      />
    </Dialog>
  );
}
