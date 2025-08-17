import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Background3D, Background3DProvider } from "@/components/Background3D";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  User,
  Calendar,
  List,
  StickyNote,
  Camera,
  Download,
  Edit,
  MapPin,
  Briefcase,
  Trash2,
  Eye,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  LogOut,
  Menu,
  Map,
  Navigation,
} from "lucide-react";
import { Job, Form, FormSubmission } from "@shared/types";

import { JobExtensionModal } from "@/components/JobExtensionModal";
import { JobDetailsModal } from "@/components/JobDetailsModal";
import { JobNotesModal } from "@/components/JobNotesModal";
import { StaffProfileEditModal } from "@/components/StaffProfileEditModal";
import { AdditionalFormsModal } from "@/components/AdditionalFormsModal";
import { MapView } from "@/components/MapView";
import { MaterialListViewer } from "@/components/MaterialListViewer";
import { useLocation } from "react-router-dom";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [jobsCollapsed, setJobsCollapsed] = useState(true);

  const [showJobExtension, setShowJobExtension] = useState(false);
  const [selectedJobForExtension, setSelectedJobForExtension] =
    useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] =
    useState<Job | null>(null);
  const [showJobNotes, setShowJobNotes] = useState(false);
  const [selectedJobForNotes, setSelectedJobForNotes] = useState<Job | null>(
    null,
  );
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showAdditionalForms, setShowAdditionalForms] = useState(false);
  const [selectedJobForForms, setSelectedJobForForms] = useState<Job | null>(
    null,
  );
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [lastCheckOut, setLastCheckOut] = useState<string | null>(null);
  const [currentJobTimes, setCurrentJobTimes] = useState<Record<string, { startTime: string }>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [showCompletedForms, setShowCompletedForms] = useState(false);
  const [formsSearchTerm, setFormsSearchTerm] = useState("");
  const [jobViewTab, setJobViewTab] = useState<"active" | "completed">("active");
  const [activeFormTab, setActiveFormTab] = useState<"jobs" | "jobless">("jobs");
  const [showMap, setShowMap] = useState(false);
  const [showMaterialListViewer, setShowMaterialListViewer] = useState(false);
  const [selectedMaterialListSubmission, setSelectedMaterialListSubmission] = useState<FormSubmission | null>(null);

  useEffect(() => {
    if (user && (user.role === "staff" || user.role === "supervisor" || user.role === "admin" || user.role === "apollo")) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Handle navigation state from form submission
  useEffect(() => {
    const state = location.state as any;
    if (state?.openFillForms && state?.jobId) {
      // Show success message if provided
      if (state.message) {
        alert(state.message);
      }
      // Find the job and open Fill Forms modal
      setTimeout(() => {
        const job = jobs.find(j => j.id === state.jobId);
        if (job) {
          setSelectedJobForForms(job);
          setShowAdditionalForms(true);
        }
      }, 500);
      // Clear the state to prevent reopening on subsequent visits
      window.history.replaceState({}, document.title);
    }
  }, [location.state, jobs]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [jobsRes, formsRes, submissionsRes] = await Promise.all([
        fetch(`/api/jobs?assignedTo=${user.id}`, { headers }),
        fetch("/api/forms", { headers }),
        fetch(`/api/form-submissions?submittedBy=${user.id}`, { headers }),
      ]);

      const [jobsData, formsData, submissionsData] = await Promise.all([
        jobsRes.json(),
        formsRes.json(),
        submissionsRes.json(),
      ]);

      setJobs(jobsData);
      setForms(formsData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getJobForms = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return [];

    const formIds = job.formIds || (job.formId ? [job.formId] : []);
    return forms.filter((f) => formIds.includes(f.id));
  };

  const getJobForm = (jobId: string) => {
    const jobForms = getJobForms(jobId);
    return jobForms.length > 0 ? jobForms[0] : null;
  };

  const isFormSubmitted = (jobId: string) => {
    return submissions.some((s) => s.jobId === jobId);
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Handle job time tracking
      if (status === "in_progress" && !currentJobTimes[jobId]) {
        // Start job timer
        await logJobTime(jobId, "job_start");
        setCurrentJobTimes(prev => ({
          ...prev,
          [jobId]: { startTime: new Date().toISOString() }
        }));
      } else if (status === "completed" && currentJobTimes[jobId]) {
        // End job timer
        await logJobTime(jobId, "job_end");
        setCurrentJobTimes(prev => {
          const updated = { ...prev };
          delete updated[jobId];
          return updated;
        });
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        console.error("Failed to update job status");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  const logJobTime = async (jobId: string, type: "job_start" | "job_end") => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              await fetch(`/api/staff/${user.id}/time-log`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  type,
                  jobId,
                  location: {
                    latitude,
                    longitude,
                    address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                  },
                }),
              });
            } catch (error) {
              console.error("Error logging job time:", error);
            }
          },
          async (error) => {
            // Fallback without location
            try {
              await fetch(`/api/staff/${user.id}/time-log`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  type,
                  jobId,
                }),
              });
            } catch (error) {
              console.error("Error logging job time:", error);
            }
          }
        );
      } else {
        // Geolocation not supported
        await fetch(`/api/staff/${user.id}/time-log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            type,
            jobId,
          }),
        });
      }
    } catch (error) {
      console.error("Error logging job time:", error);
    }
  };

  const startJobTimer = async (jobId: string) => {
    try {
      const startTime = new Date().toISOString();
      setCurrentJobTimes(prev => ({
        ...prev,
        [jobId]: { startTime }
      }));

      // Log the job start event
      await logJobTime(jobId, "job_start");
    } catch (error) {
      console.error("Error starting job timer:", error);
    }
  };

  const stopJobTimer = async (jobId: string) => {
    try {
      // Log the job end event
      await logJobTime(jobId, "job_end");

      // Remove the timer from current job times
      setCurrentJobTimes(prev => {
        const updated = { ...prev };
        delete updated[jobId];
        return updated;
      });
    } catch (error) {
      console.error("Error stopping job timer:", error);
    }
  };

  const handleExtendJob = (job: Job) => {
    setSelectedJobForExtension(job);
    setShowJobExtension(true);
  };

  const handleViewJobDetails = (job: Job) => {
    setSelectedJobForDetails(job);
    setShowJobDetails(true);
  };

  const handleAddNote = (job: Job) => {
    setSelectedJobForNotes(job);
    setShowJobNotes(true);
  };

  const handleCheckIn = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");

      // Get current location or use default coordinates
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const response = await fetch(`/api/staff/${user.id}/checkin`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  latitude,
                  longitude,
                  address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                }),
              });

              if (response.ok) {
                setIsCheckedIn(true);
                setLastCheckIn(new Date().toISOString());
                setLastCheckOut(null);
                alert("Successfully checked in!");
              } else {
                console.error("Check-in failed:", await response.text());
                alert("Check-in failed. Please try again.");
              }
            } catch (error) {
              console.error("Check-in error:", error);
              alert("Check-in failed. Please try again.");
            }
          },
          async (error) => {
            console.error("Geolocation error:", error);
            // Fallback to office coordinates if geolocation fails
            try {
              const response = await fetch(`/api/staff/${user.id}/checkin`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  latitude: -26.1076, // Default Johannesburg office coordinates
                  longitude: 28.0567,
                  address: "Office Location",
                }),
              });

              if (response.ok) {
                setIsCheckedIn(true);
                setLastCheckIn(new Date().toISOString());
                setLastCheckOut(null);
                alert("Successfully checked in with office location!");
              } else {
                console.error("Check-in failed:", await response.text());
                alert("Check-in failed. Please try again.");
              }
            } catch (error) {
              console.error("Check-in error:", error);
              alert("Check-in failed. Please try again.");
            }
          }
        );
      } else {
        // Geolocation not supported, use office coordinates
        const response = await fetch(`/api/staff/${user.id}/checkin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            latitude: -26.1076, // Default Johannesburg office coordinates
            longitude: 28.0567,
            address: "Office Location",
          }),
        });

        if (response.ok) {
          setIsCheckedIn(true);
          setLastCheckIn(new Date().toISOString());
          setLastCheckOut(null);
          alert("Successfully checked in with office location!");
        } else {
          console.error("Check-in failed:", await response.text());
          alert("Check-in failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Check-in failed:", error);
      alert("Check-in failed. Please try again.");
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");

      // Get current location or use default coordinates
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const response = await fetch(`/api/staff/${user.id}/checkout`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  latitude,
                  longitude,
                  address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                }),
              });

              if (response.ok) {
                setIsCheckedIn(false);
                setLastCheckOut(new Date().toISOString());
                // Clear any active job times
                setCurrentJobTimes({});
                alert("Successfully checked out!");
              } else {
                console.error("Check-out failed:", await response.text());
                alert("Check-out failed. Please try again.");
              }
            } catch (error) {
              console.error("Check-out error:", error);
              alert("Check-out failed. Please try again.");
            }
          },
          async (error) => {
            console.error("Geolocation error:", error);
            // Fallback to office coordinates if geolocation fails
            try {
              const response = await fetch(`/api/staff/${user.id}/checkout`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  latitude: -26.1076, // Default Johannesburg office coordinates
                  longitude: 28.0567,
                  address: "Office Location",
                }),
              });

              if (response.ok) {
                setIsCheckedIn(false);
                setLastCheckOut(new Date().toISOString());
                setCurrentJobTimes({});
                alert("Successfully checked out with office location!");
              } else {
                console.error("Check-out failed:", await response.text());
                alert("Check-out failed. Please try again.");
              }
            } catch (error) {
              console.error("Check-out error:", error);
              alert("Check-out failed. Please try again.");
            }
          }
        );
      } else {
        // Geolocation not supported, use office coordinates
        const response = await fetch(`/api/staff/${user.id}/checkout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            latitude: -26.1076, // Default Johannesburg office coordinates
            longitude: 28.0567,
            address: "Office Location",
          }),
        });

        if (response.ok) {
          setIsCheckedIn(false);
          setLastCheckOut(new Date().toISOString());
          setCurrentJobTimes({});
          alert("Successfully checked out with office location!");
        } else {
          console.error("Check-out failed:", await response.text());
          alert("Check-out failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Check-out failed:", error);
      alert("Check-out failed. Please try again.");
    }
  };

  const handleDownloadFormPDF = async (submission: FormSubmission) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/forms/${submission.formId}/submissions/${submission.id}/pdf`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Determine correct PDF name based on form type
        let pdfName;
        if (submission.formType?.includes('noncompliance')) {
          pdfName = 'Noncompliance.pdf';
        } else if (submission.formType?.includes('material')) {
          pdfName = 'ML.pdf';
        } else {
          pdfName = `${submission.formType}-${submission.jobId}.pdf`;
        }
        a.download = pdfName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Clone the response before reading to avoid "body stream already read" error
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.text();
          errorMessage = errorData || errorMessage;
        } catch (readError) {
          console.warn("Could not read error response body:", readError);
        }
        console.error(
          `Failed to download PDF (${response.status}):`,
          errorMessage,
        );
        alert(`Failed to download PDF: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(
        `Error downloading PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleDeleteJob = async (job: Job) => {
    if (!user || user.role !== "admin") {
      alert("Only administrators can delete jobs");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        fetchData(); // Refresh the data
        setShowDeleteConfirm(false);
        setJobToDelete(null);
        alert("Job and all associated forms deleted successfully");
      } else {
        const errorData = await response.json();
        alert(`Failed to delete job: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Error deleting job. Please try again.");
    }
  };

  const handleReopenJob = async (job: Job) => {
    if (!user || (user.role !== "admin" && user.role !== "apollo")) {
      alert("Only administrators and apollo users can reopen jobs");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "in_progress" }),
      });

      if (response.ok) {
        fetchData(); // Refresh the data
        alert("Job reopened successfully");
      } else {
        const errorData = await response.json();
        alert(`Failed to reopen job: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error reopening job:", error);
      alert("Error reopening job. Please try again.");
    }
  };

  // Search functionality
  const filteredJobs = jobs.filter((job) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      job.title.toLowerCase().includes(search) ||
      job.description.toLowerCase().includes(search) ||
      (job.claimNo || job.ClaimNo || "").toLowerCase().includes(search) ||
      (job.insuredName || job.InsuredName || "").toLowerCase().includes(search) ||
      (job.underwriter || job.Underwriter || "").toLowerCase().includes(search) ||
      (job.riskAddress || job.RiskAddress || job.address || "").toLowerCase().includes(search)
    );
  });

  const stats = {
    totalJobs: filteredJobs.length,
    pendingJobs: filteredJobs.filter((j) => j.status === "pending").length,
    inProgressJobs: filteredJobs.filter((j) => j.status === "in_progress").length,
    completedJobs: filteredJobs.filter((j) => j.status === "completed").length,
    formsSubmitted: submissions.length,
  };

  const completionRate =
    stats.totalJobs > 0
      ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Background3DProvider>
      {/* 3D Background for apollo only */}
      {user?.role === "apollo" && (
        <Background3D enabled={true} className="fixed inset-0" />
      )}

      <div className="min-h-screen relative z-10" style={{ background: user?.role === "apollo" ? 'transparent' : undefined }}>
        {/* Header */}
        <header className={`${user?.role === "apollo" ? 'bg-3d-header' : 'bg-white'} shadow-sm border-b`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl md:text-xl sm:text-base font-semibold text-gray-900">
                    <span className="block sm:inline">My Dashboard</span>
                  </h1>
                  <p className="text-sm sm:text-xs text-gray-500">
                    <span className="block sm:inline">Welcome back, {user?.name}</span>
                    {lastCheckIn && (
                      <span className="block sm:inline sm:ml-2 text-green-600">
                        • Checked in {new Date(lastCheckIn).toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Search Bar */}
                <div className="hidden md:flex relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search claims, jobs, clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                {/* Desktop buttons */}
                <div className="hidden md:flex items-center space-x-2">
                  <Button
                    variant={isCheckedIn ? "default" : "outline"}
                    size="sm"
                    onClick={handleCheckIn}
                    disabled={isCheckedIn}
                    className="text-xs px-2 py-1 h-7"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{isCheckedIn ? "Checked In" : "Check In"}</span>
                    <span className="sm:hidden">{isCheckedIn ? "In" : "In"}</span>
                  </Button>
                  {isCheckedIn && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckOut}
                      className="text-xs px-2 py-1 h-7"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Check Out</span>
                      <span className="sm:hidden">Out</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProfileEdit(true)}
                    className="text-xs px-2 py-1 h-7"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Profile</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="text-red-600 border-red-600 hover:bg-red-50 text-xs px-2 py-1 h-7"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Logout</span>
                    <span className="sm:hidden">Exit</span>
                  </Button>
                </div>

                {/* Mobile menu */}
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="md:hidden">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <div className="flex flex-col space-y-4 mt-4">
                      {/* Mobile Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search claims, jobs, clients..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <Button
                        variant={isCheckedIn ? "default" : "outline"}
                        onClick={handleCheckIn}
                        disabled={isCheckedIn}
                        className="justify-start"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        {isCheckedIn ? "Checked In" : "Check In"}
                      </Button>
                      
                      {isCheckedIn && (
                        <Button
                          variant="outline"
                          onClick={handleCheckOut}
                          className="justify-start"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Check Out
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowProfileEdit(true);
                          setIsMenuOpen(false);
                        }}
                        className="justify-start"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                        className="justify-start text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Jobs
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalJobs}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.pendingJobs}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.completedJobs}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Forms Submitted
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.formsSubmitted}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Completion Progress */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      Overall Completion
                    </span>
                    <span className="text-sm text-gray-600">
                      {completionRate}%
                    </span>
                  </div>
                  <Progress value={completionRate} className="w-full" />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.pendingJobs}
                    </p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.inProgressJobs}
                    </p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.completedJobs}
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Jobs Assigned - Collapsible with Job Blocks */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle 
                  className="flex items-center cursor-pointer"
                  onClick={() => setJobsCollapsed(!jobsCollapsed)}
                >
                  <Briefcase className="h-5 w-5 mr-2" />
                  Active Jobs Assigned
                  <Badge variant="outline" className="ml-2">
                    {filteredJobs.filter(j => j.status !== "completed" && j.assignedTo === user?.id).length} jobs
                  </Badge>
                  {jobsCollapsed ? (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  )}
                </CardTitle>
              </div>
              
              {/* Compact Job Blocks - Always visible */}
              <div className="flex flex-wrap gap-2 mt-4">
                {filteredJobs
                  .filter(j => j.status !== "completed" && j.assignedTo === user?.id)
                  .slice(0, 10) // Show max 10 blocks
                  .map((job, index) => {
                    return (
                      <div
                        key={job.id}
                        className="relative group cursor-pointer"
                        onClick={() => {
                          setSelectedJobForDetails(job);
                          setShowJobDetails(true);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold hover:bg-blue-700 transition-colors">
                          {index + 1}
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          <div className="font-semibold">{user?.name || 'Staff'}</div>
                          <div>{(job as any).meoJobNumber || `MEO22-${String(index + 1).padStart(3, '0')}`}</div>
                          <div className="text-gray-300">{job.title.substring(0, 20)}...</div>
                        </div>
                      </div>
                    );
                  })
                }
                {filteredJobs.filter(j => j.status !== "completed" && j.assignedTo === user?.id).length > 10 && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-bold">
                    +{filteredJobs.filter(j => j.status !== "completed" && j.assignedTo === user?.id).length - 10}
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Detailed Jobs List - Collapsible */}
          {!jobsCollapsed && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Job Details</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant={jobViewTab === "active" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setJobViewTab("active")}
                      className="text-xs px-2 py-1 h-6"
                    >
                      Active Only ({filteredJobs.filter(j => j.status !== "completed").length})
                    </Button>
                    <Button
                      variant={jobViewTab === "completed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setJobViewTab("completed")}
                      className="text-xs px-2 py-1 h-6"
                    >
                      Completed ({filteredJobs.filter(j => j.status === "completed").length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {jobViewTab === "active" ? (
                  // Active Jobs (non-completed)
                  filteredJobs.filter(j => j.status !== "completed").length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No active jobs found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Route Map Toggle and Job Count */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-sm">
                            {filteredJobs.filter(j => j.status !== "completed" && j.assignedTo === user?.id).length} Active Jobs
                          </Badge>
                          <span className="text-sm text-gray-500 hidden">• Numbered by priority and due date</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMap(!showMap)}
                          className="flex items-center space-x-2"
                        >
                          <Map className="h-4 w-4" />
                          <span>{showMap ? "Hide" : "Show"} Route Map</span>
                        </Button>
                      </div>

                      {/* Route Map Display */}
                      {showMap && (
                        <div className="h-80 border rounded-lg overflow-hidden">
                          <MapView
                            jobs={filteredJobs?.filter(j => j.status !== "completed" && j.assignedTo === user?.id) || []}
                            staff={user ? [user] : []}
                            selectedStaff={user?.id}
                            selectedDate={new Date()}
                            onJobClick={(job) => {
                              setSelectedJobForDetails(job);
                              setShowJobDetails(true);
                            }}
                          />
                        </div>
                      )}

                      {/* Enhanced Job Cards */}
                      <div className="space-y-4">
                        {filteredJobs
                          .filter(j => j.status !== "completed" && j.assignedTo === user?.id)
                          .sort((a, b) => {
                            // Sort by priority (high->medium->low) then by due date
                            const priorityOrder = { high: 3, medium: 2, low: 1 };
                            const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
                                               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
                            if (priorityDiff !== 0) return priorityDiff;

                            // Then by due date (earliest first)
                            const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                            const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                            return aDate - bDate;
                          })
                          .map((job, index) => {
                            return (
                              <Card key={job.id} className="border-l-4 border-l-blue-600">
                                <CardContent className="p-6">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start space-x-4 flex-1">
                                      {/* Job Number Badge */}
                                      <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                                        {index + 1}
                                      </div>

                                      <div className="flex-1 space-y-3">
                                        {/* Job Header */}
                                        <div className="flex items-center space-x-3 flex-wrap">
                                          <h3 className="text-xl md:text-xl sm:text-sm font-semibold text-gray-900 sm:line-clamp-2">{job.title}</h3>
                                          <Badge variant={
                                            job.priority === "high" ? "destructive" :
                                            job.priority === "medium" ? "default" : "secondary"
                                          }>
                                            {job.priority.toUpperCase()}
                                          </Badge>
                                        </div>

                                        {/* Status Badge with spacing */}
                                        <div className="mt-2 mb-2">
                                          <Badge variant={
                                            job.status === "in_progress" ? "secondary" : "outline"
                                          } className="mr-2">
                                            {job.status.replace("_", " ").toUpperCase()}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {(job as any).meoJobNumber || `MEO22-${String(index + 1).padStart(3, '0')}`}
                                          </Badge>
                                        </div>

                                        {/* Job Details Grid - Hidden on mobile */}
                                        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="font-medium text-gray-500">Client:</span>
                                            <p className="text-gray-900">{job.insuredName || job.InsuredName || "N/A"}</p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-500">Claim No:</span>
                                            <p className="text-gray-900">{job.claimNo || job.ClaimNo || "N/A"}</p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-500">Due Date:</span>
                                            <p className="text-gray-900">
                                              {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : "No due date"}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-500">Underwriter:</span>
                                            <p className="text-gray-900">{job.underwriter || job.Underwriter || "N/A"}</p>
                                          </div>
                                          <div className="col-span-1 md:col-span-2">
                                            <span className="font-medium text-gray-500">Location:</span>
                                            <p className="text-gray-900 flex items-start">
                                              <MapPin className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                                              <span>
                                                {job.riskAddress || job.RiskAddress || job.address || "No address provided"}
                                              </span>
                                            </p>
                                          </div>
                                        </div>

                                        {/* Description - Hidden on mobile */}
                                        {job.description && (
                                          <div className="hidden md:block">
                                            <span className="font-medium text-gray-500">Description:</span>
                                            <p className="text-gray-700 mt-1">{job.description}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col space-y-2 ml-4">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedJobForDetails(job);
                                          setShowJobDetails(true);
                                        }}
                                        className="flex items-center space-x-1 text-xs px-1 py-1 h-6 sm:h-7 sm:px-2"
                                      >
                                        <Eye className="h-3 w-3 sm:h-3 sm:w-3" />
                                        <span className="hidden sm:inline">View Details</span>
                                        <span className="sm:hidden">View</span>
                                      </Button>

                                      {(job.riskAddress || job.RiskAddress || job.address) && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const address = job.riskAddress || job.RiskAddress || job.address;
                                            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
                                            window.open(googleMapsUrl, '_blank');
                                          }}
                                          className="flex items-center space-x-1 text-green-600 border-green-600 hover:bg-green-50 text-xs px-1 py-1 h-6 sm:h-7 sm:px-2"
                                        >
                                          <Navigation className="h-3 w-3 sm:h-3 sm:w-3" />
                                          <span className="hidden sm:inline">Navigate</span>
                                          <span className="sm:hidden">Nav</span>
                                        </Button>
                                      )}

                                      {job.status === "pending" && (
                                        <Button
                                          size="sm"
                                          onClick={() => updateJobStatus(job.id, "in_progress")}
                                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-1 py-1 h-6 sm:h-7 sm:px-2"
                                        >
                                          <span className="hidden sm:inline">Start Job</span>
                                          <span className="sm:hidden">Start</span>
                                        </Button>
                                      )}

                                      {job.status === "in_progress" && (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            // Check if there are required forms and if they're submitted
                                            const assignedFormIds = job.formIds || (job.formId ? [job.formId] : []);
                                            const availableForms = forms.filter((f) => assignedFormIds.includes(f.id));

                                            const submittedFormIds = submissions
                                              .filter((s) => s.jobId === job.id)
                                              .map((s) => s.formId);

                                            const missingForms = availableForms.filter(
                                              (f) => !submittedFormIds.includes(f.id)
                                            );

                                            if (missingForms.length > 0) {
                                              alert(`Please submit the following forms before marking the job as complete: ${missingForms.map((f) => f.name).join(", ")}`);
                                              return;
                                            }

                                            updateJobStatus(job.id, "completed");
                                          }}
                                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-1 py-1 h-6 sm:h-7 sm:px-2"
                                        >
                                          <span className="hidden sm:inline">Complete Job</span>
                                          <span className="sm:hidden">Complete</span>
                                        </Button>
                                      )}

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedJobForExtension(job);
                                          setShowJobExtension(true);
                                        }}
                                        className="text-orange-600 border-orange-600 hover:bg-orange-50 text-xs px-1 py-1 h-6 sm:h-7 sm:px-2"
                                      >
                                        <span className="hidden sm:inline">Request Extension</span>
                                        <span className="sm:hidden">Extend</span>
                                      </Button>

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedJobForForms(job);
                                          setShowAdditionalForms(true);
                                        }}
                                        className="text-purple-600 border-purple-600 hover:bg-purple-50 text-xs px-1 py-1 h-6 sm:h-7 sm:px-2"
                                      >
                                        <span className="hidden sm:inline">Fill Forms</span>
                                        <span className="sm:hidden">Forms</span>
                                      </Button>

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedJobForNotes(job);
                                          setShowJobNotes(true);
                                        }}
                                        className="text-gray-600 border-gray-600 hover:bg-gray-50 text-xs px-1 py-1 h-6 sm:h-7 sm:px-2"
                                      >
                                        <span className="hidden sm:inline">Add Notes</span>
                                        <span className="sm:hidden">Notes</span>
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Time Tracking Section */}
                                  <div className="mt-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        <span className="text-sm font-medium">Time Tracking:</span>
                                        {currentJobTimes[job.id] ? (
                                          <div className="flex items-center space-x-2 text-sm">
                                            <div className="flex items-center space-x-1">
                                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                              <span className="text-green-600 font-medium">Active</span>
                                            </div>
                                            <span className="text-gray-500">
                                              Started: {new Date(currentJobTimes[job.id].startTime).toLocaleTimeString()}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-sm text-gray-500">Not started</span>
                                        )}
                                      </div>

                                      <div className="flex space-x-2">
                                        {currentJobTimes[job.id] && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => stopJobTimer(job.id)}
                                            className="text-red-600 border-red-600 hover:bg-red-50 flex items-center space-x-1"
                                          >
                                            <Clock className="h-4 w-4" />
                                            <span>Stop Timer</span>
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })
                        }
                      </div>
                    </div>
                  )
                ) : (
                  // Completed Jobs Tab
                  filteredJobs.filter(j => j.status === "completed").length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No completed jobs found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredJobs.filter(j => j.status === "completed").map((job) => {
                        const isCurrentUser = job.assignedTo === user?.id;

                        if (!isCurrentUser && user?.role !== "supervisor") {
                          return null;
                        }

                        return (
                          <div key={job.id} className="p-6 rounded-lg border bg-green-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-semibold">
                                  {job.title}
                                </h3>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="default">
                                    completed
                                  </Badge>
                                  <Badge variant="outline">
                                    {job.claimNo || job.ClaimNo}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-600">
                                <div>
                                  Completed: {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Recently'}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="space-y-2">
                                <div>
                                  <strong>Client:</strong>{" "}
                                  {job.insuredName || job.InsuredName}
                                </div>
                                <div>
                                  <strong>Address:</strong> {job.address}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <strong>Underwriter:</strong>{" "}
                                  {job.underwriter || job.Underwriter}
                                </div>
                                <div>
                                  <strong>Description:</strong> {job.description}
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-2 pt-4 border-t">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewJobDetails(job)}
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddNote(job)}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Notes
                              </Button>
                              {(user?.role === "admin" || user?.role === "apollo") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReopenJob(job)}
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Reopen
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}

          {/* Completed Forms Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle
                  className="flex items-center cursor-pointer"
                  onClick={() => setShowCompletedForms(!showCompletedForms)}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  My Completed Forms
                  <Badge variant="outline" className="ml-2">
                    {submissions.length} forms
                  </Badge>
                  {showCompletedForms ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompletedForms(!showCompletedForms)}
                >
                  {showCompletedForms ? "Collapse" : "Expand"}
                </Button>
              </div>
              {showCompletedForms && submissions.length > 0 && (
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search forms by type, job, or date..."
                      value={formsSearchTerm}
                      onChange={(e) => setFormsSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            {showCompletedForms && (
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No forms submitted yet</p>
                    <p className="text-sm">Complete job forms to see them here</p>
                  </div>
                ) : (
                  (() => {
                    // Filter submissions based on search term
                    const filteredSubmissions = submissions.filter((submission) => {
                      const relatedJob = jobs.find(j => j.id === submission.jobId);
                      const searchLower = formsSearchTerm.toLowerCase();

                      return (
                        (submission.formType || "").toLowerCase().includes(searchLower) ||
                        (submission.formId || "").toLowerCase().includes(searchLower) ||
                        (relatedJob?.title || "").toLowerCase().includes(searchLower) ||
                        new Date(submission.submittedAt).toLocaleDateString().toLowerCase().includes(searchLower)
                      );
                    });

                    // Group submissions by date
                    const groupedSubmissions = filteredSubmissions.reduce((groups, submission) => {
                      const date = new Date(submission.submittedAt).toLocaleDateString();
                      if (!groups[date]) {
                        groups[date] = [];
                      }
                      groups[date].push(submission);
                      return groups;
                    }, {} as Record<string, typeof submissions>);

                    // Sort dates in descending order (newest first)
                    const sortedDates = Object.keys(groupedSubmissions).sort((a, b) =>
                      new Date(b).getTime() - new Date(a).getTime()
                    );

                    if (filteredSubmissions.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No forms match your search</p>
                          <p className="text-sm">Try adjusting your search terms</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {sortedDates.map((date) => (
                          <div key={date}>
                            <h4 className="font-semibold text-sm text-gray-700 mb-3 pb-2 border-b">
                              {new Date(date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {groupedSubmissions[date].length} forms
                              </Badge>
                            </h4>
                            <div className="space-y-3">
                              {groupedSubmissions[date].map((submission) => {
                                const relatedJob = jobs.find(j => j.id === submission.jobId);
                                return (
                                  <div
                                    key={submission.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                          <h5 className="font-medium text-sm">
                                            {submission.formId === "material-list-form" ? "Material List" :
                                             submission.formId === "noncompliance-form" ? "Non Compliance" :
                                             submission.formId === "liability-form" ? "Liability Form" :
                                             submission.formId === "clearance-certificate-form" ? "Clearance Certificate" :
                                             submission.formId === "sahl-certificate-form" ? "SAHL Certificate" :
                                             submission.formId === "absa-form" || submission.formId === "form-absa-certificate" ? "ABSA Certificate" :
                                             submission.formId === "discovery-form" || submission.formId === "form-discovery-geyser" ? "Discovery Geyser" :
                                             submission.formName || submission.formType || "Unknown Form"}
                                          </h5>
                                          <p className="text-xs text-gray-600">
                                            {relatedJob?.title || `Job ${submission.jobId}`}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {new Date(submission.submittedAt).toLocaleTimeString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <Badge
                                        variant="default"
                                        className="bg-green-100 text-green-800 text-xs"
                                      >
                                        Completed
                                      </Badge>
                                      {submission.formId === "material-list-form" && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedMaterialListSubmission(submission);
                                            setShowMaterialListViewer(true);
                                          }}
                                          className="text-green-600 border-green-600 hover:bg-green-50 text-xs h-7 px-2"
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          View
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDownloadFormPDF(submission)}
                                        className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs h-7 px-2"
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        PDF
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </CardContent>
            )}
          </Card>

          {/* Job Extension Modal */}
          <JobExtensionModal
            open={showJobExtension}
            onOpenChange={(open) => {
              setShowJobExtension(open);
              if (!open) setSelectedJobForExtension(null);
            }}
            job={selectedJobForExtension}
            onJobExtended={fetchData}
          />

          {/* Job Details Modal */}
          <JobDetailsModal
            open={showJobDetails}
            onOpenChange={(open) => {
              setShowJobDetails(open);
              if (!open) setSelectedJobForDetails(null);
            }}
            job={selectedJobForDetails}
            onJobUpdated={fetchData}
          />

          {/* Job Notes Modal */}
          <JobNotesModal
            open={showJobNotes}
            onOpenChange={(open) => {
              setShowJobNotes(open);
              if (!open) setSelectedJobForNotes(null);
            }}
            job={selectedJobForNotes}
            onNotesUpdated={fetchData}
          />

          {/* Staff Profile Edit Modal */}
          <StaffProfileEditModal
            open={showProfileEdit}
            onOpenChange={setShowProfileEdit}
            user={user}
            onProfileUpdated={fetchData}
          />

          {/* Additional Forms Modal */}
          {selectedJobForForms && (
            <AdditionalFormsModal
              isOpen={showAdditionalForms}
              onClose={() => {
                setShowAdditionalForms(false);
                setSelectedJobForForms(null);
              }}
              job={selectedJobForForms}
              assignedStaff={user}
            />
          )}

          {/* Material List Viewer Modal */}
          {selectedMaterialListSubmission && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">Material List Viewer</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowMaterialListViewer(false);
                      setSelectedMaterialListSubmission(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
                  {(() => {
                    const relatedJob = jobs.find(j => j.id === selectedMaterialListSubmission.jobId);
                    if (!relatedJob) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Related job not found.</p>
                        </div>
                      );
                    }

                    // Check if staff can edit quantities used - only if they have items with requested quantities
                    const canEdit = relatedJob.assignedTo === user?.id &&
                                   (relatedJob.status === "completed" || relatedJob.status === "in_progress");

                    return (
                      <MaterialListViewer
                        submission={selectedMaterialListSubmission}
                        job={relatedJob}
                        canEdit={canEdit}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Job Deletion Confirmation Dialog */}
          {showDeleteConfirm && jobToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-red-600 mb-4">
                  Delete Job Confirmation
                </h3>
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete job "{jobToDelete.title}"?
                  <br />
                  <strong className="text-red-600">
                    This will permanently delete the job and all associated forms.
                  </strong>
                </p>
                <div className="flex space-x-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setJobToDelete(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteJob(jobToDelete)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Job
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Background3DProvider>
  );
}
